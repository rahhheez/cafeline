from django.db import models
from django.conf import settings

class MenuItem(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=60, default='Coffee')
    description = models.TextField(blank=True)
    price = models.FloatField()
    image_url = models.URLField(blank=True)
    preparation_time = models.PositiveIntegerField(default=10)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_coming_soon = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Order(models.Model):
    PAYMENT_CHOICES = [
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('wallet', 'Wallet'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_price = models.FloatField(default=0)
    status = models.CharField(max_length=20, default='pending')
    customer_name = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address_line = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=80, blank=True)
    pincode = models.CharField(max_length=12, blank=True)
    delivery_notes = models.TextField(blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='upi')
    payment_status = models.CharField(max_length=20, default='pending')
    payment_provider = models.CharField(max_length=80, blank=True)
    payment_reference = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return f"Order #{self.id}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.item.name}"
