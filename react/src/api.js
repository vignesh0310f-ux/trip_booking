import { API_BASE } from "./config";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server. Is the Django backend running?");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data && typeof data === "object"
      ? Object.entries(data).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join(" | ")
      : `Request failed (${res.status})`;
    throw new Error(detail);
  }
  return data;
}

const post = (path, body) =>
  request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const getDistance = (from, to) =>
  request(`/distance/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
export const suggestPlaces = (q) => request(`/suggest/?q=${encodeURIComponent(q)}`);
export const getVehicles = () => request("/vehicles/");
export const createExplore = (body) => post("/explore/create/", body);
export const createBooking = (body) => post("/bookings/create/", body);

// Image paths from the API are relative ("/media/..."), so prefix the backend URL.
export const imageUrl = (src) => (!src ? null : src.startsWith("http") ? src : `${API_BASE}${src}`);
