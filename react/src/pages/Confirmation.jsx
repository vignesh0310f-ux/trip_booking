import { useLocation, Link, Navigate } from "react-router-dom";
import { inr } from "../fare";

export default function Confirmation() {
  const { state } = useLocation();
  if (!state?.booking) return <Navigate to="/" replace />;
  const { booking: b, vehicle, payNow: due } = state;
  return (
    <div className="card center">
      <div className="ok">✓</div>
      <h2>Booking confirmed</h2>
      <p className="muted">Booking reference <strong>#{b.id}</strong></p>
      <div className="receipt">
        <div className="row"><span>Cab</span><span>{vehicle.name}</span></div>
        <div className="row"><span>Route</span><span>{b.start_location} → {b.end_location}</span></div>
        <div className="row"><span>Pickup</span><span>{b.pickup_date} {b.pickup_time.slice(0, 5)}</span></div>
        <div className="row"><span>Passenger</span><span>{b.customer_name}</span></div>
        <div className="row bold"><span>Total fare</span><span>{inr(b.total_fare)}</span></div>
        <div className="row"><span>Due now</span><span>{inr(due)}</span></div>
      </div>
      <Link className="btn" to="/">Book another ride</Link>
    </div>
  );
}
