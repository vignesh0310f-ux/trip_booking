"""Free geocoding + road distance using OpenStreetMap services (no API key).

- Nominatim (geocoding): max 1 request/second, requires an identifying User-Agent.
- OSRM public demo server (routing): fine for development/low traffic. For heavy
  production use, self-host OSRM or switch to OpenRouteService (free key).
Results are cached so repeated routes never hit the external services again.
"""
import hashlib
import json
import logging
import math
import threading
import time
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.cache import cache

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
TIMEOUT = 8
GEOCODE_TTL = 60 * 60 * 24 * 30   # 30 days
ROUTE_TTL = 60 * 60 * 24 * 7      # 7 days

logger = logging.getLogger(__name__)
PHOTON_URL = "https://photon.komoot.io/api/"
INDIA_BBOX = "68.1,6.7,97.4,35.7"   # minLon,minLat,maxLon,maxLat

# Offline fallback: approximate coordinates for common cities.
CITY_COORDS = {
    'chennai': (13.0827, 80.2707), 'bengaluru': (12.9716, 77.5946), 'bangalore': (12.9716, 77.5946),
    'coimbatore': (11.0168, 76.9558), 'madurai': (9.9252, 78.1198), 'trichy': (10.7905, 78.7047),
    'tiruchirappalli': (10.7905, 78.7047), 'salem': (11.6643, 78.146), 'tirunelveli': (8.7139, 77.7567),
    'vellore': (12.9165, 79.1325), 'pondicherry': (11.9416, 79.8083), 'puducherry': (11.9416, 79.8083),
    'tirupati': (13.6288, 79.4192), 'hyderabad': (17.385, 78.4867), 'kochi': (9.9312, 76.2673),
    'thiruvananthapuram': (8.5241, 76.9366), 'mysuru': (12.2958, 76.6394), 'mysore': (12.2958, 76.6394),
    'thanjavur': (10.787, 79.1378), 'erode': (11.341, 77.7172), 'tiruppur': (11.1085, 77.3411),
    'kanyakumari': (8.0883, 77.5385), 'rameswaram': (9.2876, 79.3129), 'ooty': (11.4102, 76.695),
    'kodaikanal': (10.2381, 77.4892), 'kanchipuram': (12.8342, 79.7036), 'mahabalipuram': (12.6208, 80.1932),
    'nellore': (14.4426, 79.9865), 'vijayawada': (16.5062, 80.648),
}

_lock = threading.Lock()
_last_call = 0.0


class GeoError(Exception):
    """Base error. .status is the HTTP status the API should return."""
    status = 503


class PlaceNotFound(GeoError):
    status = 404


def _key(prefix, *parts):
    raw = "|".join(p.strip().lower() for p in parts)
    return f"{prefix}:{hashlib.md5(raw.encode()).hexdigest()}"


def _get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": getattr(settings, "GEO_USER_AGENT", "MariaCabs/1.0")})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # network error, timeout, bad JSON
        logger.warning("Map request failed: %s -> %r", url.split('?')[0], exc)
        raise GeoError("Map service is unavailable right now.") from exc


def _photon(place):
    qs = urllib.parse.urlencode({"q": place, "limit": 1, "bbox": INDIA_BBOX})
    feats = _get_json(f"{PHOTON_URL}?{qs}").get("features", [])
    out = []
    for f in feats:
        lon, lat = f["geometry"]["coordinates"]
        out.append({"lat": lat, "lon": lon, "display_name": f.get("properties", {}).get("name", place)})
    return out


def geocode(place):
    """Return {'lat', 'lon', 'name'} for a place name (India only)."""
    place = (place or "").strip()
    if not place:
        raise PlaceNotFound("Place name is empty.")
    ckey = _key("geo", place)
    hit = cache.get(ckey)
    if hit:
        return hit

    global _last_call
    with _lock:  # respect Nominatim's 1 request/second policy
        wait = 1.05 - (time.monotonic() - _last_call)
        if wait > 0:
            time.sleep(wait)
        qs = urllib.parse.urlencode({"q": place, "format": "json", "limit": 1, "countrycodes": "in"})
        try:
            data = _get_json(f"{NOMINATIM_URL}?{qs}")
        except GeoError:
            data = _photon(place)   # second free geocoder if Nominatim is blocked/down
        _last_call = time.monotonic()

    if not data:
        raise PlaceNotFound(f"Could not find '{place}'. Check the spelling.")
    result = {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"]), "name": data[0].get("display_name", place)}
    cache.set(ckey, result, GEOCODE_TTL)
    return result


def estimate_km(origin, destination):
    """Offline estimate: straight line x 1.15. None if either city is unknown."""
    a, b = CITY_COORDS.get(origin.strip().lower()), CITY_COORDS.get(destination.strip().lower())
    if not a or not b:
        return None
    r = 6371
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dlat, dlon = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return float(max(1, round(2 * r * math.asin(math.sqrt(h)) * 1.15)))


def road_distance_km(origin, destination):
    try:
        return _live_road_distance(origin, destination)
    except PlaceNotFound:
        raise
    except GeoError:
        km = estimate_km(origin, destination)
        if km is None:
            raise
        logger.warning("Using offline estimate for %s -> %s", origin, destination)
        return {"distance_km": km, "from": origin, "to": destination, "approximate": True}


def _live_road_distance(origin, destination):
    """Driving distance in km between two place names, plus resolved names."""
    ckey = _key("route", origin, destination)
    hit = cache.get(ckey)
    if hit:
        return hit
    a, b = geocode(origin), geocode(destination)
    url = f"{OSRM_URL}/{a['lon']},{a['lat']};{b['lon']},{b['lat']}?overview=false"
    data = _get_json(url)
    if data.get("code") != "Ok" or not data.get("routes"):
        raise PlaceNotFound("No driving route found between these places.")
    result = {"distance_km": float(round(data["routes"][0]["distance"] / 1000)), "from": a["name"], "to": b["name"]}
    cache.set(ckey, result, ROUTE_TTL)
    return result


def suggest_places(query, limit=6):
    """Type-ahead suggestions for India via Photon (free, no key). Cached 1 day."""
    query = (query or "").strip()
    if len(query) < 2:
        return []
    ckey = _key("suggest", query)
    hit = cache.get(ckey)
    if hit is not None:
        return hit
    qs = urllib.parse.urlencode({"q": query, "limit": limit, "bbox": INDIA_BBOX, "lang": "en"})
    feats = _get_json(f"{PHOTON_URL}?{qs}").get("features", [])
    out, seen = [], set()
    for f in feats:
        pr = f.get("properties", {})
        name = pr.get("name")
        if not name:
            continue
        label = ", ".join(x for x in (name, pr.get("city") if pr.get("city") != name else None, pr.get("state")) if x)
        if label in seen:
            continue
        seen.add(label)
        lon, lat = f["geometry"]["coordinates"]
        out.append({"label": label, "lat": lat, "lon": lon})
    cache.set(ckey, out, 60 * 60 * 24)
    return out
