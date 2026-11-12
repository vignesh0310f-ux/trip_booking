import { useState } from "react";
import { createExplore } from "../api";
import heroImage from "../assets/hero.png";

function Hero() {
    const [tripType, setTripType] = useState();
    const [formData, setFormData] = useState({ from: "", to: "", pickupDate: "", pickupTime: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = { ...formData, tripType };
    const result = await createExplore(dataToSend);
    console.log(result);
  };

  return (
    <section className="booking">
      <div className="booking-text">
      <p>...Ride with Faith, Arrive <span> with Grace.</span></p>
      <div className="trip-types" style={{ backgroundImage: `url(${heroImage})` }}>
        {["ONE WAY", "ROUND TRIP", "LOCAL", "AIRPORT"].map((type) => (
          <button
            key={type}
            type="button"
            className={tripType === type ? "active" : ""}
            onClick={() => setTripType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        
        <div>
        <label htmlFor="from">Pick-up</label>
        <input name="from" value={formData.from} onChange={handleChange} placeholder="pick-up"/>
        </div>
        <div>
        <label htmlFor="to">Drop</label>
        <input name="to" value={formData.to} onChange={handleChange} placeholder="drop"/>
        </div>
        <div>
        <label htmlFor="pickupDate">Pick-up Date</label>
        <input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} />
        </div>
        <div>
        <label htmlFor="pickupTime">Pick-up Time</label>
        <input type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} />
        </div>
        <button type="submit">EXPLORE CABS</button>
      </form>
      </div>
    </section>
  );
}

export default Hero;
