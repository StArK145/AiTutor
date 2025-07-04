import firebase_admin
from firebase_admin import auth, credentials
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
import os

# Initialize Firebase app once
if not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
    })
    firebase_admin.initialize_app(cred)

User = get_user_model()
class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header:
            return None

        id_token = auth_header.split(" ").pop()
        try:
            decoded_token = auth.verify_id_token(id_token)
            firebase_uid = decoded_token.get("uid")
            email = decoded_token.get("email")
        except Exception as e:
            print(f"Firebase token verification failed: {str(e)}")
            return None

        if not firebase_uid:
            return None

        try:
            user = User.objects.get(firebase_uid=firebase_uid)
            return (user, None)
        except User.DoesNotExist:
            try:
                # Create new user
                username = email.split("@")[0]
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                user = User.objects.create(
                    firebase_uid=firebase_uid,
                    email=email,
                    username=username
                )
                print(f"Created new user: {user}")
                return (user, None)
            except Exception as e:
                print(f"User creation failed: {str(e)}")
                return None