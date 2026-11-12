import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Vehicles from "./pages/Vehicles";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";

export default function App() {
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">🚖 Maria Cabs</Link>
        <span className="tag">Outstation & local rides</span>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<div className="card"><h2>Page not found</h2><Link to="/">Go home</Link></div>} />
        </Routes>
      </main>
      <footer className="foot">© {new Date().getFullYear()} Maria Cabs</footer>
    </>
  );
}
