from rest_framework.throttling import AnonRateThrottle


class DistanceThrottle(AnonRateThrottle):
    """Tighter limit for the endpoint that calls external map services."""
    scope = "distance"


class SuggestThrottle(AnonRateThrottle):
    scope = "suggest"
