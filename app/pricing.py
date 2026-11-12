"""Server-side fare calculation. Keep in sync with frontend/src/config.js (display only)."""
from decimal import Decimal, ROUND_HALF_UP

RATE_PER_KM = {4: 11, 5: 13, 6: 16, 7: 18, 12: 24}   # by seat count; PLACEHOLDER rates
DEFAULT_RATE = 14
MIN_KM_PER_DAY = 0    # 0 = bill the actual km (set e.g. 250 to enforce a daily minimum)
MIN_KM_LOCAL = 0
DRIVER_ALLOWANCE = 300
TAX_RATE = Decimal("0.05")
ADDON_PRICES = {
    "luggage_carrier": 300,
    "expressway": 200,
    "new_car_promise": 250,
    "chauffeur_language": 0,
}


def compute_total_fare(vehicle, distance, trip_type, addons):
    rate = RATE_PER_KM.get(vehicle.seats, DEFAULT_RATE)
    km = distance * 2 if trip_type == "ROUND" else distance
    billed_km = max(km, MIN_KM_LOCAL if trip_type == "LOCAL" else MIN_KM_PER_DAY)
    subtotal = Decimal(str(billed_km)) * rate + DRIVER_ALLOWANCE
    subtotal += sum(price for key, price in ADDON_PRICES.items() if addons.get(key))
    tax = (subtotal * TAX_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return (subtotal + tax).quantize(Decimal("0.01"))
