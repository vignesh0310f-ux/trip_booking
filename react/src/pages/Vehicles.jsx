import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { getVehicles, imageUrl } from "../api";
import { computeFare, inr } from "../fare";
import { TRIP_TYPES } from "../config";

export default function Vehicles() {
  const { state } = useLocation();
  const nav = useNavigate();
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState("");
  const [distance, setDistance] = useState(state?.distance ?? "");

  useEffect(() => {
    getVehicles().then(setVehicles).catch((e) => setError(e.message));
  }, []);

  if (!state?.search) return <Navigate to="/" replace />;
  const { search } = state;
  const tripLabel = TRIP_TYPES.find((t) => t.value === search.trip_type)?.label;

  return (
    <section>
      <div className="card summary">
        <div>
          <strong>{search.from_city}{search.trip_type !== "LOCAL" && ` → ${search.to_city}`}</strong>
          <div className="muted">{tripLabel} · {search.pickup_date} · {search.pickup_time}</div>
        </div>
        <label className="field small">
          <span>Distance (km, one way){state.source === "route" ? " – road distance" : state.source === "estimate" ? " – approximate" : ""}</span>
          <input type="number" min="1" value={distance} readOnly={state.source === "route" || state.source === "estimate"}
            onChange={(e) => setDistance(e.target.value)} placeholder="Enter km" />
        </label>
      </div>

      {state.notice && <p className="error">{state.notice}</p>}
      {error && <p className="error">{error}</p>}
      {!vehicles && !error && <p className="muted">Loading cabs…</p>}
      {vehicles?.length === 0 && <p className="muted">No cabs available right now.</p>}

      <div className="list">
        {vehicles?.map((v) => {
          const fare = Number(distance) > 0 ? computeFare({ vehicle: v, distance, tripType: search.trip_type }) : null;
          return (
            <article className="card vehicle" key={v.id}>
              <div className="thumb">{imageUrl(v.image) ? <img src={imageUrl(v.image)} alt={v.name} /> : <span>🚗</span>}</div>
              <div className="info">
                <h3>{v.name}</h3>
                <div className="chips">
                  <span>{v.seats} seats</span><span>{v.is_ac ? "AC" : "Non-AC"}</span><span>{v.fuel_type}</span>
                </div>
                {fare && <div className="muted">{fare.billedKm} km billed @ {inr(fare.rate)}/km + driver allowance</div>}
              </div>
              <div className="price">
                {fare ? <div className="amount">{inr(fare.total)}</div> : <div className="muted">Enter distance</div>}
                <button className="btn" disabled={!fare}
                  onClick={() => nav("/checkout", { state: { search, vehicle: v, distance: Number(distance) } })}>
                  Select
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
