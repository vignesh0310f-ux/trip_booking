from django.db import models

TRIP_CHOICES = [("ONEWAY", "One Way"), ("ROUND", "Round Trip"),
                ("LOCAL", "Local"), ("AIRPORT", "Airport")]

class Explore(models.Model):
    trip_type = models.CharField(max_length=20, choices=TRIP_CHOICES)
    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    pickup_date = models.DateField()
    pickup_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.from_city} -> {self.to_city} ({self.trip_type})"

class Booking(models.Model):
    vehicle = models.ForeignKey("Vehicle", on_delete=models.PROTECT)
    trip_type = models.CharField(max_length=20, choices=TRIP_CHOICES, default="ONEWAY")
    start_location = models.CharField(max_length=100)
    end_location = models.CharField(max_length=100)
    distance = models.FloatField()
    total_fare = models.DecimalField(max_digits=10, decimal_places=2)

    # Customer info
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=15)
    customer_email = models.EmailField()

    # Pickup details
    pickup_date = models.DateField()
    pickup_time = models.TimeField()

    # Optional add-ons
    luggage_carrier = models.BooleanField(default=False)
    expressway = models.BooleanField(default=False)
    new_car_promise = models.BooleanField(default=False)
    chauffeur_language = models.BooleanField(default=False)

    # Payment choice
    payment_option = models.CharField(
        max_length=20,
        choices=[("ZERO", "Book at Zero"), ("PART", "Part Pay"), ("FULL", "Full Pay")]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"#{self.pk} {self.customer_name}: {self.start_location} -> {self.end_location}"

class Vehicle(models.Model):
    FUEL_CHOICES = [("CNG", "CNG"), ("DIESEL", "Diesel")]

    name = models.CharField(max_length=100)                 # "Wagon R, Swift"
    seats = models.PositiveIntegerField(default=4)
    is_ac = models.BooleanField(default=True)
    fuel_type = models.CharField(max_length=10, choices=FUEL_CHOICES, default="CNG")
    image = models.ImageField(upload_to="vehicles/", blank=True, null=True)

    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.fuel_type})"
