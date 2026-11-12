from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Vehicle
from .serializers import ExploreSerializer, BookingSerializer, VehicleSerializer
from .geo import road_distance_km, suggest_places, GeoError
from .throttles import DistanceThrottle, SuggestThrottle


# These endpoints are public. Disabling session auth means a logged-in /admin
# session in the same browser can't trigger CSRF 403 errors on React POSTs.
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def create_explore(request):
    serializer = ExploreSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def list_vehicles(request):
    vehicles = Vehicle.objects.filter(is_active=True)
    # request in context makes image URLs absolute (http://localhost:8000/media/...)
    return Response(VehicleSerializer(vehicles, many=True, context={'request': request}).data)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def create_booking(request):
    serializer = BookingSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([DistanceThrottle])
def distance(request):
    """GET /distance/?from=Chennai&to=Madurai  ->  {"distance_km": 462.3, ...}"""
    origin = request.query_params.get('from', '').strip()
    dest = request.query_params.get('to', '').strip()
    if not origin or not dest:
        return Response({'detail': "Both 'from' and 'to' are required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        return Response(road_distance_km(origin, dest))
    except GeoError as exc:
        return Response({'detail': str(exc)}, status=exc.status)



@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([SuggestThrottle])
def suggest(request):
    """GET /suggest/?q=madu  ->  [{"label": "Madurai, Tamil Nadu", "lat": .., "lon": ..}]"""
    try:
        return Response(suggest_places(request.query_params.get('q', '')))
    except GeoError:
        return Response([])   # autocomplete is optional; never block the form
