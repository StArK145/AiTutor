from django.contrib import admin
from django.urls import path, include
from core.api import FirebaseLoginAPI, DashboardAPI, ChapterAPI  # Remove WalletAPI import
from django.views.generic import TemplateView
from core.api import get_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', FirebaseLoginAPI.as_view(), name='api_login'),
    path('api/dashboard/', DashboardAPI.as_view(), name='api_dashboard'),
    path('api/chapters/', ChapterAPI.as_view(), name='api_chapters'),
    path('api/csrf/', get_csrf_token, name='api_csrf'),
    # Remove wallet path completely
    path('', TemplateView.as_view(template_name='index.html')),
    path('<path:path>', TemplateView.as_view(template_name='index.html')),
]