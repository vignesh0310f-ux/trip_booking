// Backend base URL (Django dev server). Change for production.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const TRIP_TYPES = [
  { value: "ONEWAY", label: "One Way" },
  { value: "ROUND", label: "Round Trip" },
  { value: "LOCAL", label: "Local" },
  { value: "AIRPORT", label: "Airport" },
];

// PLACEHOLDER pricing. Your Vehicle model no longer stores fares (migration 0002),
// so fares are estimated here. Replace with real rates, ideally computed on the backend.
export const RATE_PER_KM = { 4: 11, 5: 13, 6: 16, 7: 18, 12: 24 };
export const DEFAULT_RATE = 14;
export const MIN_KM_PER_DAY = 0;   // 0 = bill actual km; keep in sync with pricing.py
export const MIN_KM_LOCAL = 0;
export const DRIVER_ALLOWANCE = 300;
export const TAX_RATE = 0.05;

export const ADDONS = [
  { key: "luggage_carrier", label: "Luggage carrier", price: 300 },
  { key: "expressway", label: "Expressway route", price: 200 },
  { key: "new_car_promise", label: "New car promise", price: 250 },
  { key: "chauffeur_language", label: "Preferred chauffeur language", price: 0 },
];

export const PAYMENT_OPTIONS = [
  { value: "ZERO", label: "Book at Zero", note: "Pay nothing now, pay the driver after the trip", fraction: 0 },
  { value: "PART", label: "Part Pay", note: "Pay 20% now, rest after the trip", fraction: 0.2 },
  { value: "FULL", label: "Full Pay", note: "Pay the full fare now", fraction: 1 },
];
