from django.urls import path
from . import views

urlpatterns = [
    path('emotions/', views.emotions_api, name='emotions_api'),
    path('emotions/region/<str:region_name>/', views.region_detail_api, name='region_detail_api'),
    path('emotions/compare/', views.weather_compare_api, name='weather_compare_api'),
    path('emotions/history/', views.history_api, name='history_api'),
]
