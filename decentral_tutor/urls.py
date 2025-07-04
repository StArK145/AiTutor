from django.contrib import admin
from django.urls import path, include
from core.api import FirebaseLoginAPI, DashboardAPI, WalletAPI
from django.views.generic import TemplateView  # For serving React

urlpatterns = [
    # Admin site
    path('admin/', admin.site.urls),
    
    # API Endpoints
    path('admin/', admin.site.urls),
    path('api/login/', FirebaseLoginAPI.as_view(), name='api_login'),
    path('api/dashboard/', DashboardAPI.as_view(), name='api_dashboard'),
    path('api/wallet/', WalletAPI.as_view(), name='api_wallet'),

    
    # Catch-all route for React (must be last)
    path('', TemplateView.as_view(template_name='index.html')),
    path('<path:path>', TemplateView.as_view(template_name='index.html')),
]