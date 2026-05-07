from rest_framework import serializers
from .models import *

class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate_preparation_time(self, value):
        if value < 1:
            raise serializers.ValidationError("Preparation time must be at least 1 minute.")
        return value

class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_price = serializers.FloatField(source='item.price', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['item', 'item_name', 'item_price', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'items',
            'total_price',
            'status',
            'customer_name',
            'phone',
            'address_line',
            'city',
            'pincode',
            'delivery_notes',
            'payment_method',
            'payment_status',
            'payment_provider',
            'payment_reference',
        ]
        read_only_fields = ['id', 'total_price', 'status']

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Add at least one menu item.")

        for order_item in items:
            if order_item['quantity'] < 1:
                raise serializers.ValidationError("Item quantity must be at least 1.")
            if order_item['item'].is_coming_soon:
                raise serializers.ValidationError(f"{order_item['item'].name} is coming soon.")
            if not order_item['item'].is_available:
                raise serializers.ValidationError(f"{order_item['item'].name} is out of stock.")

        return items

    def validate(self, attrs):
        required_fields = ['customer_name', 'phone', 'address_line', 'city', 'pincode']
        missing = [field for field in required_fields if not attrs.get(field)]

        if missing:
            raise serializers.ValidationError({
                field: "This field is required for checkout." for field in missing
            })

        if attrs.get('payment_method') in ['upi', 'card', 'wallet'] and attrs.get('payment_status') != 'paid':
            raise serializers.ValidationError({
                'payment_status': "Payment must be marked paid before the order is created."
            })

        if attrs.get('payment_status') == 'paid' and not attrs.get('payment_reference'):
            raise serializers.ValidationError({
                'payment_reference': "Payment reference or UPI transaction ID is required."
            })

        return attrs

    def create(self, validated_data):
        items = validated_data.pop('items')
        user = self.context['request'].user

        order = Order.objects.create(user=user, **validated_data)
        total = 0

        for i in items:
            item = MenuItem.objects.get(id=i['item'].id)
            total += item.price * i['quantity']

            OrderItem.objects.create(
                order=order,
                item=item,
                quantity=i['quantity']
            )

        order.total_price = total
        order.save()
        return order

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'items': OrderItemSerializer(instance.orderitem_set.all(), many=True).data,
            'total_price': instance.total_price,
            'status': instance.status,
            'customer_name': instance.customer_name,
            'phone': instance.phone,
            'address_line': instance.address_line,
            'city': instance.city,
            'pincode': instance.pincode,
            'delivery_notes': instance.delivery_notes,
            'payment_method': instance.payment_method,
            'payment_status': instance.payment_status,
            'payment_provider': instance.payment_provider,
            'payment_reference': instance.payment_reference,
        }
