import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TRIP_TYPES } from "../config";
import { createExplore, getDistance } from "../api";
import CityInput from "../components/CityInput";

const today = () => new Date().toISOString().slice(0, 10);

export default function Home() {
  const nav = useNavigate();
  const [f, setF] = useState({ trip_type: "ONEWAY", from_city: "", to_city: "", pickup_date: "", pickup_time: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const local = f.trip_type === "LOCAL";

  async function submit(e) {
    e.preventDefault();
    setError("");
    const payload = { ...f, to_city: local ? f.from_city : f.to_city };
    setBusy(true);
    try {
      await createExplore(payload);
      let distance = local ? 40 : null, source = local ? "default" : "manual", notice = "";
      if (!local) {
        try {
          const d = await getDistance(payload.from_city, payload.to_city);
          distance = d.distance_km;
          source = d.approximate ? "estimate" : "route";
        } catch (err) {
          notice = `${err.message} Please enter the distance yourself.`;
        }
      }
      nav("/vehicles", { state: { search: payload, distance, source, notice } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hero">
      <h1>Book a cab, anywhere in South India</h1>
      <p>Transparent fares, verified drivers, pay the way you like.</p>
      <form className="card" onSubmit={submit}>
        <div className="tabs">
          {TRIP_TYPES.map((t) => (
            <button type="button" key={t.value} className={f.trip_type === t.value ? "tab active" : "tab"} onClick={() => set("trip_type")(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid">
          <CityInput id="from" label={local ? "City" : "From"} value={f.from_city} onChange={set("from_city")} placeholder="e.g. Chennai" />
          {!local && <CityInput id="to" label={f.trip_type === "AIRPORT" ? "Airport / To" : "To"} value={f.to_city} onChange={set("to_city")} placeholder="e.g. Madurai" />}
          <label className="field"><span>Pickup date</span>
            <input type="date" min={today()} value={f.pickup_date} onChange={(e) => set("pickup_date")(e.target.value)} required /></label>
          <label className="field"><span>Pickup time</span>
            <input type="time" value={f.pickup_time} onChange={(e) => set("pickup_time")(e.target.value)} required /></label>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Finding route…" : "Explore cabs"}</button>
      </form>
    </section>
  );
}
