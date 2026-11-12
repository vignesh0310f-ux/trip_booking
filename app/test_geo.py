from unittest import mock
from django.test import TestCase
from app import geo

PH={"features":[{"geometry":{"coordinates":[78.1,9.9]},"properties":{"name":"Madurai","state":"Tamil Nadu"}}]}
class T(TestCase):
    def test_suggest(self):
        with mock.patch.object(geo,"_get_json",return_value=PH):
            r=self.client.get("/suggest/?q=madu"); self.assertEqual(r.json()[0]["label"],"Madurai, Tamil Nadu")
    def test_distance(self):
        def fake(url):
            if "nominatim" in url: return [{"lat":"13.08","lon":"80.27","display_name":"Chennai"}]
            return {"code":"Ok","routes":[{"distance":462300}]}
        with mock.patch.object(geo,"_get_json",side_effect=fake):
            r=self.client.get("/distance/?from=A&to=B"); self.assertEqual(r.json()["distance_km"],462.0)
    def test_fallback(self):
        with mock.patch.object(geo,"_get_json",side_effect=geo.GeoError("down")):
            r=self.client.get("/distance/?from=Chennai&to=Madurai"); self.assertTrue(r.json()["approximate"])
