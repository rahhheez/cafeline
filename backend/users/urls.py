from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import admin_login, login, signup

urlpatterns = [
    path('signup/', signup),
    path('login/', login),
    path('admin-login/', admin_login),
    path('refresh/', TokenRefreshView.as_view()),
]
