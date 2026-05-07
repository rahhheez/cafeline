from django.urls import path
from .views import *

urlpatterns = [
    path('menu/', menu),
    path('admin/menu/', admin_menu),
    path('admin/menu/<int:item_id>/', admin_menu_detail),
    path('order/', order),
    path('dashboard/', dashboard),
]
