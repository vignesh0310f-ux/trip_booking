import { RATE_PER_KM, DEFAULT_RATE, MIN_KM_PER_DAY, MIN_KM_LOCAL, DRIVER_ALLOWANCE, TAX_RATE, ADDONS, PAYMENT_OPTIONS } from "./config";

export function computeFare({ vehicle, distance, tripType, addons = {} }) {
  const rate = RATE_PER_KM[vehicle.seats] ?? DEFAULT_RATE;
  const oneLeg = Number(distance) || 0;
  const km = tripType === "ROUND" ? oneLeg * 2 : oneLeg;
  const billedKm = Math.max(km, tripType === "LOCAL" ? MIN_KM_LOCAL : MIN_KM_PER_DAY);
  const base = billedKm * rate;
  const addonTotal = ADDONS.reduce((s, a) => s + (addons[a.key] ? a.price : 0), 0);
  const subtotal = base + DRIVER_ALLOWANCE + addonTotal;
  const tax = Math.round(subtotal * TAX_RATE);
  return { rate, billedKm, base, driver: DRIVER_ALLOWANCE, addonTotal, tax, total: subtotal + tax };
}

export const payNow = (total, option) =>
  Math.round(total * (PAYMENT_OPTIONS.find((p) => p.value === option)?.fraction ?? 0));

export const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
