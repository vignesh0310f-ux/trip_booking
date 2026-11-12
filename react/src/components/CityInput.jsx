import { useEffect, useState } from "react";
import { CITIES } from "../cities";
import { suggestPlaces } from "../api";

// Local city list shows instantly; OpenStreetMap (Photon) suggestions are merged in after a short pause.
export default function CityInput({ label, value, onChange, id, placeholder }) {
  const [remote, setRemote] = useState([]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) { setRemote([]); return; }
    let live = true;
    const t = setTimeout(() => {
      suggestPlaces(q).then((r) => live && setRemote(r.map((p) => p.label))).catch(() => live && setRemote([]));
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [value]);

  const options = [...new Set([...remote, ...Object.keys(CITIES)])];
  return (
    <label className="field">
      <span>{label}</span>
      <input list={`${id}-list`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required />
      <datalist id={`${id}-list`}>
        {options.map((c) => <option key={c} value={c} />)}
      </datalist>
    </label>
  );
}
