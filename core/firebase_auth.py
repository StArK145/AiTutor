# core/firebase_auth.py
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # Make sure header name is consistent
        firebase_uid = request.headers.get('X-Firebase-UID')
        
        if not firebase_uid:
            return None
        
        try:
            user = User.objects.get(firebase_uid=firebase_uid)
            return (user, None)
        except User.DoesNotExist:
            # Create new user
            return self.create_user(firebase_uid, request), None

    def create_user(self, firebase_uid, request):
        # Get user data from request
        email = request.data.get('email', '')
        display_name = request.data.get('username', '')  # Frontend sends "username"
        
        # If no display name, use email prefix
        if not display_name:
            display_name = email.split('@')[0]
        
        # Create and return the user
        return User.objects.create_user(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name
        )