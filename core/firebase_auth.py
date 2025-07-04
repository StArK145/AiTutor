from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # Frontend should send Firebase UID in X-Firebase-UID header
        firebase_uid = request.headers.get('X-Firebase-UID')
        
        if not firebase_uid:
            return None
        
        try:
            user = User.objects.get(firebase_uid=firebase_uid)
            return (user, None)
        except User.DoesNotExist:
            # Create new user if doesn't exist
            return self.create_user(firebase_uid, request), None

# In firebase_auth.py
    def create_user(self, firebase_uid, request):
        email = request.data.get('email', '')
        display_name = request.data.get('display_name', email.split('@')[0])
        
        return User.objects.create_user(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name
        )