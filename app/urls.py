from django.urls import path
from .views import create_booking, create_explore, list_vehicles, distance, suggest

urlpatterns = [
    path('explore/create/', create_explore, name='create-explore'),
    path('distance/', distance, name='distance'),
    path('suggest/', suggest, name='suggest'),
    path('vehicles/', list_vehicles, name='list-vehicles'),
    path('bookings/create/', create_booking, name='create-booking'),
]