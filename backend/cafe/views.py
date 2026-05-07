from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *

DEFAULT_MENU = [
    {
        "name": "Classic Cappuccino",
        "category": "Coffee",
        "description": "Double shot espresso with steamed milk and a thick foam cap.",
        "price": 149,
        "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80",
        "preparation_time": 7,
        "is_featured": True,
    },
    {
        "name": "Iced Caramel Latte",
        "category": "Cold Coffee",
        "description": "Chilled espresso, milk, caramel, and ice.",
        "price": 179,
        "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
        "preparation_time": 6,
        "is_featured": True,
    },
    {
        "name": "Masala Chai",
        "category": "Tea",
        "description": "Strong tea simmered with milk, ginger, and house spices.",
        "price": 89,
        "image_url": "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80",
        "preparation_time": 8,
    },
    {
        "name": "Cold Brew",
        "category": "Cold Coffee",
        "description": "Slow-steeped coffee served over ice.",
        "price": 169,
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
        "preparation_time": 4,
    },
    {
        "name": "Paneer Tikka Sandwich",
        "category": "Food",
        "description": "Grilled sandwich with paneer tikka filling and mint mayo.",
        "price": 199,
        "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80",
        "preparation_time": 12,
    },
    {
        "name": "Chocolate Croissant",
        "category": "Bakery",
        "description": "Flaky butter croissant filled with chocolate.",
        "price": 129,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80",
        "preparation_time": 5,
    },
]

def ensure_default_menu():
    if not MenuItem.objects.exists():
        MenuItem.objects.bulk_create(MenuItem(**item) for item in DEFAULT_MENU)

@api_view(['GET'])
def menu(request):
    ensure_default_menu()
    items = MenuItem.objects.all().order_by('category', 'name')
    return Response(MenuSerializer(items, many=True).data)

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_menu(request):
    ensure_default_menu()

    if request.method == 'GET':
        items = MenuItem.objects.all().order_by('category', 'name')
        return Response(MenuSerializer(items, many=True).data)

    serializer = MenuSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_menu_detail(request, item_id):
    try:
        item = MenuItem.objects.get(id=item_id)
    except MenuItem.DoesNotExist:
        return Response({"error": "Menu item not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(MenuSerializer(item).data)

    if request.method in ['PUT', 'PATCH']:
        serializer = MenuSerializer(item, data=request.data, partial=request.method == 'PATCH')
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order(request):
    if request.method == 'GET':
        orders = Order.objects.filter(user=request.user).order_by('-id')[:8]
        return Response(OrderSerializer(orders, many=True).data)

    serializer = OrderSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    user_orders = Order.objects.filter(user=request.user).order_by('-id')
    orders = user_orders.count()
    sales = sum(order.total_price for order in user_orders)
    recent = user_orders[:5]
    return Response({
        "orders": orders,
        "sales": sales,
        "recent_orders": OrderSerializer(recent, many=True).data,
    })
