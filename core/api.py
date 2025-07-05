from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated

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
    
    
import json
from utils import generate_chapter_names  # Importing from Ch.py

def get_chapters_json(topic: str, grade: str) -> str:
    """
    Takes topic and grade as input, returns JSON list of 10 chapters
    
    Args:
        topic: Study topic (e.g., "Machine Learning")
        grade: Education level (e.g., "college")
        
    Returns:
        JSON string with list of chapter names
    """
    try:
        chapters = generate_chapter_names(topic, grade)
        return json.dumps({"chapters": chapters}, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})

