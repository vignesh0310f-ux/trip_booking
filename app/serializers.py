from datetime import date

from django.conf import settings
from rest_framework import serializers

from .models import Explore, Booking, Vehicle
from .pricing import compute_total_fare, ADDON_PRICES
from .geo import road_distance_km, GeoError

MAX_DISTANCE_KM = 3000


def _not_past(value):
    if value < date.today():
        raise serializers.ValidationError("Pickup date cannot be in the past.")
    return value


class ExploreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Explore
        fields = "__all__"
        read_only_fields = ["created_at"]
        extra_kwargs = {"to_city": {"required": False, "allow_blank": True}}

    def validate_pickup_date(self, value):
        return _not_past(value)

    def validate(self, attrs):
        # Local trips stay within one city, so to_city defaults to from_city.
        if attrs.get("trip_type") == "LOCAL" and not attrs.get("to_city"):
            attrs["to_city"] = attrs["from_city"]
        if not attrs.get("to_city"):
            raise serializers.ValidationError({"to_city": "This field is required."})
        return attrs


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"
        # total_fare is always computed by the server; any client value is ignored.
        read_only_fields = ["total_fare", "created_at"]
        extra_kwargs = {"distance": {"required": False}}

    def validate_pickup_date(self, value):
        return _not_past(value)

    def validate_vehicle(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This vehicle is not available.")
        return value

    def validate_distance(self, value):
        if value <= 0 or value > MAX_DISTANCE_KM:
            raise serializers.ValidationError(f"Distance must be between 1 and {MAX_DISTANCE_KM} km.")
        return value

    def validate(self, attrs):
        start, end = attrs["start_location"].strip(), attrs["end_location"].strip()
        client_km = attrs.get("distance")
        if start.lower() == end.lower():
            # Local trip within one city: no route to look up, use the client's estimate.
            attrs["distance"] = client_km or 40
            return attrs
        try:
            # The server looks up the real road distance; the client's number is ignored.
            attrs["distance"] = road_distance_km(start, end)["distance_km"]
        except GeoError as exc:
            if exc.status == 404 or not client_km:
                raise serializers.ValidationError({"end_location": str(exc)})
            # Map service is down: fall back to the client's (range-checked) distance.
            if getattr(settings, "DISTANCE_FALLBACK_TO_CLIENT", True):
                attrs["distance"] = client_km
            else:
                raise serializers.ValidationError("Distance service is unavailable. Please try again.")
        return attrs

    def create(self, validated_data):
        addons = {k: validated_data.get(k, False) for k in ADDON_PRICES}
        validated_data["total_fare"] = compute_total_fare(
            validated_data["vehicle"], validated_data["distance"],
            validated_data.get("trip_type", "ONEWAY"), addons,
        )
        return super().create(validated_data)


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"
