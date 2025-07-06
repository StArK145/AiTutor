from django.contrib import admin
from django.urls import path, include
from core.api import FirebaseLoginAPI, DashboardAPI, ChapterAPI, VideoResourcesAPI, WebResourcesAPI, PDFQAAPI, QuestionAnswerAPI # Remove WalletAPI import
from django.views.generic import TemplateView
from core.api import get_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', FirebaseLoginAPI.as_view(), name='api_login'),
    path('api/dashboard/', DashboardAPI.as_view(), name='api_dashboard'),
    path('api/chapters/', ChapterAPI.as_view(), name='api_chapters'),
    path('api/videos/', VideoResourcesAPI.as_view(), name='api_videos'),
    path('api/websites/', WebResourcesAPI.as_view(), name='api_websites'),
    path('api/csrf/', get_csrf_token, name='api_csrf'),
    path('api/process-pdf/', PDFQAAPI.as_view(), name='api_process_pdf'),
    path('api/answer-question/', QuestionAnswerAPI.as_view(), name='api_answer_question'),
    path('', TemplateView.as_view(template_name='index.html')),
    path('<path:path>', TemplateView.as_view(template_name='index.html')),
]