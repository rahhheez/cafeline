from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

def auth_payload(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "username": user.username,
        "role": getattr(user, "role", "staff"),
        "is_admin": user.is_staff or user.is_superuser,
    }

def authenticate_login(request, admin_required=False):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not admin_required and not username.lower().endswith('@gmail.com'):
        return Response(
            {"error": "User login ID must be a Gmail address"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login_username = username.lower() if username.lower().endswith('@gmail.com') else username
    user = authenticate(request, username=login_username, password=password)
    if user is None:
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if admin_required and not (user.is_staff or user.is_superuser):
        return Response(
            {"error": "Admin access is required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(auth_payload(user))

@api_view(['POST'])
def signup(request):
    username = request.data.get('username', '').strip().lower()
    password = request.data.get('password', '')
    User = get_user_model()

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not username.lower().endswith('@gmail.com'):
        return Response(
            {"error": "User login ID must be a Gmail address"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"error": "This Gmail account is already registered. Please sign in."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    User.objects.create_user(username=username, email=username, password=password)
    return Response({"message": "Account created"}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def login(request):
    return authenticate_login(request)

@api_view(['POST'])
def admin_login(request):
    return authenticate_login(request, admin_required=True)
