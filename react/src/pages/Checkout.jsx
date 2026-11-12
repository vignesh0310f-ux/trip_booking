import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { createBooking } from "../api";
import { computeFare, payNow, inr } from "../fare";
import { ADDONS, PAYMENT_OPTIONS } from "../config";

export default function Checkout() {
  const { state } = useLocation();
  const nav = useNavigate();
  const [cust, setCust] = useState({ customer_name: "", customer_phone: "", customer_email: "" });
  const [addons, setAddons] = useState({});
  const [payment, setPayment] = useState("ZERO");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!state?.vehicle) return <Navigate to="/" replace />;
  const { search, vehicle, distance } = state;
  const fare = computeFare({ vehicle, distance, tripType: search.trip_type, addons });
  const setC = (k) => (e) => setCust((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!/^[0-9+\- ]{10,15}$/.test(cust.customer_phone)) return setError("Enter a valid phone number (10–15 digits).");
    setBusy(true);
    try {
      const booking = await createBooking({
        vehicle: vehicle.id,
        start_location: search.from_city,
        end_location: search.to_city,
        distance,
        trip_type: search.trip_type,
        ...cust,
        pickup_date: search.pickup_date,
        pickup_time: search.pickup_time,
        ...Object.fromEntries(ADDONS.map((a) => [a.key, !!addons[a.key]])),
        payment_option: payment,
      });
      nav("/confirmation", { state: { booking, vehicle, payNow: payNow(Number(booking.total_fare), payment) } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="checkout" onSubmit={submit}>
      <div>
        <div className="card">
          <h3>Your details</h3>
          <div className="grid">
            <label className="field"><span>Full name</span><input value={cust.customer_name} onChange={setC("customer_name")} required maxLength={100} /></label>
            <label className="field"><span>Phone</span><input type="tel" value={cust.customer_phone} onChange={setC("customer_phone")} required maxLength={15} /></label>
            <label className="field wide"><span>Email</span><input type="email" value={cust.customer_email} onChange={setC("customer_email")} required /></label>
          </div>
        </div>
        <div className="card">
          <h3>Add-ons</h3>
          {ADDONS.map((a) => (
            <label className="check" key={a.key}>
              <input type="checkbox" checked={!!addons[a.key]} onChange={(e) => setAddons((p) => ({ ...p, [a.key]: e.target.checked }))} />
              <span>{a.label}</span><em>{a.price ? `+ ${inr(a.price)}` : "Free"}</em>
            </label>
          ))}
        </div>
        <div className="card">
          <h3>Payment option</h3>
          {PAYMENT_OPTIONS.map((p) => (
            <label className={payment === p.value ? "radio active" : "radio"} key={p.value}>
              <input type="radio" name="pay" checked={payment === p.value} onChange={() => setPayment(p.value)} />
              <div><strong>{p.label}</strong><div className="muted">{p.note}</div></div>
            </label>
          ))}
        </div>
      </div>

      <aside className="card sticky">
        <h3>{vehicle.name}</h3>
        <div className="muted">{search.from_city} → {search.to_city}<br />{search.pickup_date} · {search.pickup_time}</div>
        <hr />
        <Row l={`Fare (${fare.billedKm} km × ${inr(fare.rate)})`} v={inr(fare.base)} />
        <Row l="Driver allowance" v={inr(fare.driver)} />
        {fare.addonTotal > 0 && <Row l="Add-ons" v={inr(fare.addonTotal)} />}
        <Row l="Taxes" v={inr(fare.tax)} />
        <hr />
        <Row l="Total" v={inr(fare.total)} bold />
        <Row l="Pay now" v={inr(payNow(fare.total, payment))} />
        {error && <p className="error">{error}</p>}
        <button className="btn block" disabled={busy}>{busy ? "Booking…" : "Confirm booking"}</button>
      </aside>
    </form>
  );
}

const Row = ({ l, v, bold }) => <div className={bold ? "row bold" : "row"}><span>{l}</span><span>{v}</span></div>;
