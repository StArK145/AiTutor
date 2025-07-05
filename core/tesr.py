import requests
import json
from pprint import pprint
from core.utils import get_video_resources  # Import the utility function directly

# Configuration
BASE_URL = "http://localhost:8000"
VIDEO_API_URL = f"{BASE_URL}/api/videos/"

def test_get_video_resources_directly():
    """Test the get_video_resources function directly"""
    print("\n=== Testing get_video_resources function directly ===")
    
    test_cases = [
        ("Python Programming", "high school", "Functions and Modules"),
        ("Quantum Physics", "college", "Wave-Particle Duality"),
        ("World History", "middle school", "Ancient Civilizations"),
    ]
    
    for topic, grade, chapter in test_cases:
        print(f"\nTesting with topic='{topic}', grade='{grade}', chapter='{chapter}'")
        try:
            videos = get_video_resources(topic, grade, chapter)
            print(f"Found {len(videos)} videos:")
            for i, video in enumerate(videos, 1):
                print(f"{i}. {video['title']} ({video['duration']})")
                print(f"   Channel: {video['channel']}")
                print(f"   URL: {video['url']}")
        except Exception as e:
            print(f"Error: {str(e)}")

def test_video_api():
    """Test the VideoResourcesAPI endpoint"""
    print("\n=== Testing VideoResourcesAPI endpoint ===")
    
    test_cases = [
        {"topic": "Machine Learning", "grade": "undergraduate", "chapter": "Neural Networks"},
        {"topic": "Biology", "grade": "high school", "chapter": "Cell Structure"},
        {"topic": "Art History", "grade": "college", "chapter": "Renaissance Art"},
        # Edge cases
        {"topic": "", "grade": "high school", "chapter": "Algebra"},  # Missing topic
        {"topic": "Chemistry", "grade": "", "chapter": "Atomic Structure"},  # Missing grade
        {"topic": "Physics", "grade": "college", "chapter": ""},  # Missing chapter
    ]
    
    for data in test_cases:
        print(f"\nTesting with data: {json.dumps(data)}")
        try:
            response = requests.post(
                VIDEO_API_URL,
                json=data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status Code: {response.status_code}")
            print("Response:")
            pprint(response.json())
            
        except Exception as e:
            print(f"Request failed: {str(e)}")

if __name__ == "__main__":
    # Test the utility function directly
    test_get_video_resources_directly()
    
    # Test the API endpoint
    test_video_api()
    
    print("\nAll tests completed!")