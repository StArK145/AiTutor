from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from django.http import JsonResponse

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