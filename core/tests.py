import os
import requests
import json

BASE_URL = "http://localhost:8000"

def get_auth_headers(token):
    """Generate headers with Firebase token"""
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

def upload_and_process_pdf(pdf_path, token):
    """Upload and process a PDF file"""
    print(f"\nUploading and processing PDF: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return None

    try:
        with open(pdf_path, 'rb') as f:
            files = {'pdf': (os.path.basename(pdf_path), f)}
            headers = get_auth_headers(token)
            response = requests.post(
                f"{BASE_URL}/api/process-pdf",  # Note: no trailing slash
                files=files,
                headers=headers
            )
        
        if response.status_code == 200:
            data = response.json()
            print("PDF processed successfully!")
            print(f"PDF ID: {data.get('data', {}).get('id')}")
            print(f"File name: {data.get('data', {}).get('file_name')}")
            return data.get('data', {}).get('id')
        else:
            print(f"Error processing PDF: {response.status_code}")
            print(response.json())
            return None
            
    except Exception as e:
        print(f"Error uploading PDF: {str(e)}")
        return None

def run_tests():
    print("\n=== PDF Processing Test ===")
    
    # Use a valid Firebase ID token (not UID)
    firebase_token = "2IUpOTCYcLfJ1fLY8jItUCw11in1"
    
    # PDF path - make sure this exists
    pdf_path = r"C:\Users\Lenovo\Desktop\Code For Bharat\Current\AiTutor\book2.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"PDF file not found at {pdf_path}")
        return

    # Step 1: Process the PDF
    pdf_id = upload_and_process_pdf(pdf_path, firebase_token)
    if not pdf_id:
        print("Failed to process PDF. Exiting test.")
        return

    print("\nTest completed!")

if __name__ == "__main__":
    run_tests()