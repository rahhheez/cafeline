from django.contrib import admin
from .models import MenuItem, Order, OrderItem

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'preparation_time', 'is_available', 'is_featured')
    list_filter = ('category', 'is_available', 'is_featured')
    search_fields = ('name', 'description')

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'customer_name', 'phone', 'payment_method', 'payment_status', 'payment_reference', 'total_price', 'status')
    list_filter = ('status', 'payment_method', 'payment_status')
    search_fields = ('customer_name', 'phone', 'address_line', 'city', 'pincode', 'payment_reference', 'payment_provider')
    inlines = [OrderItemInline]
