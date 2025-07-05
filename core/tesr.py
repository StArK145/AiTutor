import requests
import json
from pprint import pprint
from utils import generate_chapter_names

# Configuration
BASE_URL = "http://localhost:8000"
CHAPTER_API_URL = f"{BASE_URL}/api/chapters/"

def test_generate_chapter_names_directly():
    """Test the generate_chapter_names function directly"""
    print("\n=== Testing generate_chapter_names function directly ===")
    
    test_cases = [
        ("Python Programming", "high school"),
        ("Quantum Physics", "college"),
        ("World History", "middle school"),
    ]
    
    for topic, grade in test_cases:
        print(f"\nTesting with topic='{topic}' and grade='{grade}'")
        try:
            chapters = generate_chapter_names(topic, grade)
            print(f"Generated {len(chapters)} chapters:")
            for i, chapter in enumerate(chapters, 1):
                print(f"{i}. {chapter}")
        except Exception as e:
            print(f"Error: {str(e)}")

def test_chapter_api():
    """Test the ChapterAPI endpoint"""
    print("\n=== Testing ChapterAPI endpoint ===")
    
    test_cases = [
        {"topic": "Machine Learning", "grade": "undergraduate"},
        {"topic": "Biology", "grade": "high school"},
        {"topic": "Art History", "grade": "college"},
        # Add edge cases
        {"topic": "", "grade": "high school"},  # Missing topic
        {"topic": "Chemistry", "grade": ""},    # Missing grade
    ]
    
    for data in test_cases:
        print(f"\nTesting with data: {json.dumps(data)}")
        try:
            response = requests.post(
                CHAPTER_API_URL,
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
    test_generate_chapter_names_directly()
    
    # Test the API endpoint
    test_chapter_api()
    
    print("\nAll tests completed!")