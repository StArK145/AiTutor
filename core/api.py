from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from django.http import JsonResponse
from .pdf_processor import PDFProcessor
import os
from django.conf import settings


User = get_user_model()

class FirebaseLoginAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("\n=== Received Request ===")
        print("Headers:", request.headers)
        print("Data:", request.data)
        print("Method:", request.method)
        
        firebase_uid = request.headers.get('X-Firebase-UID')
        if not firebase_uid:
            print("!! Missing Firebase UID header")
            return Response(
                {'error': 'Missing Firebase UID in headers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = request.data.get('email')
        if not email:
            print("!! Missing email in request data")
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ... rest of your existing code ...
        username = request.data.get('username') or email.split('@')[0]
        

        user, created = User.objects.get_or_create(
            firebase_uid=firebase_uid,
            defaults={'email': email, 'username': username}
        )

        if created:
            return Response({
                'uid': user.firebase_uid,
                'email': user.email,
                'username': user.username,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'uid': user.firebase_uid,
            'email': user.email,
            'username': user.username,
            'message': 'User already exists'
        }, status=status.HTTP_200_OK)
    


class DashboardAPI(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"message": "Dashboard API"}, status=status.HTTP_200_OK)
    
    
# Add to core/api.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .utils import generate_chapter_names  # Make sure to import the function
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

class ChapterAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Get topic and grade from request data
            topic = request.data.get('topic')
            grade = request.data.get('grade')
            
            # Validate required fields
            if not topic:
                return Response(
                    {'error': 'Topic is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not grade:
                return Response(
                    {'error': 'Grade/level is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate chapters
            chapters = generate_chapter_names(topic, grade)
            
            # Return success response with chapters
            return Response({
                'status': True,
                'message': 'Chapters generated successfully',
                'data': {
                    'topic': topic,
                    'grade': grade,
                    'chapters': chapters
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Return error response
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to generate chapters'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['GET'])
def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})




from .utils import get_video_resources

class VideoResourcesAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Get topic, grade and chapter from request data
            topic = request.data.get('topic')
            grade = request.data.get('grade')
            chapter = request.data.get('chapter')
            
            # Validate required fields
            if not topic:
                return Response(
                    {'error': 'Topic is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not grade:
                return Response(
                    {'error': 'Grade/level is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not chapter:
                return Response(
                    {'error': 'Chapter name is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get video resources (limited to 4 by the utility function)
            videos = get_video_resources(topic, grade, chapter)
            
            # Return success response with videos
            return JsonResponse({
                'status': True,
                'message': 'Video resources fetched successfully',
                'data': {
                    'topic': topic,
                    'grade': grade,
                    'chapter': chapter,
                    'videos': videos
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Return error response
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to fetch video resources'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
            
from .utils import get_web_resources  # Make sure this is imported at the top

class WebResourcesAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Get topic, grade and chapter from request data
            topic = request.data.get('topic')
            grade = request.data.get('grade')
            chapter = request.data.get('chapter')
            
            # Validate required fields
            if not topic:
                return Response(
                    {'error': 'Topic is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not grade:
                return Response(
                    {'error': 'Grade/level is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not chapter:
                return Response(
                    {'error': 'Chapter name is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get web resources (limited to 4 by the utility function)
            websites = get_web_resources(topic, grade, chapter)
            
            # Return success response with web resources
            return JsonResponse({
                'status': True,
                'message': 'Web resources fetched successfully',
                'data': {
                    'topic': topic,
                    'grade': grade,
                    'chapter': chapter,
                    'websites': websites
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Return error response
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to fetch web resources'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


class PDFQAAPI(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [AllowAny]

    def post(self, request):
        # Handle PDF upload
        pdf_file = request.FILES.get('pdf')
        if not pdf_file:
            return Response(
                {'error': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save the uploaded file temporarily
        upload_dir = os.path.join(settings.BASE_DIR, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, pdf_file.name)
        
        with open(file_path, 'wb+') as destination:
            for chunk in pdf_file.chunks():
                destination.write(chunk)

        # Process the PDF
        try:
            processor = PDFProcessor()
            chunks = processor.process_pdf(file_path)
            store_name = f"book_{os.path.splitext(pdf_file.name)[0]}"
            processor.create_vector_store(chunks, store_name)
            
            return JsonResponse({
                'status': True,
                'message': 'PDF processed successfully',
                'vector_store': store_name
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to process PDF'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuestionAnswerAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        vector_store = request.data.get('vector_store')
        question = request.data.get('question')
        
        if not vector_store or not question:
            return Response(
                {'error': 'Both vector_store and question are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            processor = PDFProcessor()
            vs = processor.load_vector_store(vector_store)
            answer = processor.answer_question(vs, question)
            
            return JsonResponse({
                'status': True,
                'data': answer
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to answer question'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)