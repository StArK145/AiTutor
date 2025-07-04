import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/login/"

# Test Firebase UID and user data
TEST_UID = "simulated_firebase_uid_123"
TEST_EMAIL = "testuser@example.com"
TEST_USERNAME = "testuser"

def test_user_creation():
    """Simulate frontend sending user data to backend"""
    headers = {
        "X-Firebase-UID": TEST_UID,
        "Content-Type": "application/json",
    }
    
    data = {
        "email": TEST_EMAIL,
        "username": TEST_USERNAME
    }

    print(f"\nTesting user creation at {API_URL}")
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print(f"Data: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json=data
        )
        
        print("\nResponse:")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
        
        return response.status_code == 201  # 201 Created
        
    except Exception as e:
        print(f"\nError making request: {str(e)}")
        return False

def verify_user_in_db():
    """Check if user exists in database"""
    from core.models import User
    try:
        user = User.objects.get(firebase_uid=TEST_UID)
        print(f"\nUser found in database:")
        print(f"UID: {user.firebase_uid}")
        print(f"Email: {user.email}")
        print(f"Username: {user.username}")
        return True
    except User.DoesNotExist:
        print("\nUser not found in database")
        return False
    except Exception as e:
        print(f"\nError checking database: {str(e)}")
        return False

if __name__ == "__main__":
    # Run the test
    print("=== Testing User Creation ===")
    
    # Part 1: Simulate API call
    success = test_user_creation()
    
    # Part 2: Verify database (requires Django context)
    if success:
        print("\n=== Verifying Database ===")
        # Need to setup Django environment to access models
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'decentral_tutor.settings')
        django.setup()
        
        verify_user_in_db()
    
    print("\nTest complete!")