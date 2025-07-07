import os
import requests
import json
from typing import Optional, Dict, List

BASE_URL = "http://localhost:8000"
DEFAULT_PDF_PATH = "book.pdf"

def get_auth_header(token: str) -> Dict[str, str]:
    """Return authorization header with bearer token"""
    return {"Authorization": f"Bearer {token}"}

def upload_and_process_pdf(pdf_path: str, token: str) -> Optional[str]:
    """Upload and process a PDF file with authentication"""
    print(f"\nUploading PDF: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return None

    try:
        with open(pdf_path, 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/process-pdf/",
                files={'pdf': (os.path.basename(pdf_path), f)},
                headers=get_auth_header(token),
                timeout=30
            )
        
        if response.status_code == 200:
            data = response.json()
            print("PDF processed successfully!")
            print(f"PDF ID: {data.get('data', {}).get('id')}")
            return data.get('data', {}).get('id')
        
        print(f"Error processing PDF: {response.status_code}")
        print(response.json())
        return None
            
    except Exception as e:
        print(f"Error uploading PDF: {str(e)}")
        return None

def ask_question(pdf_id: str, question: str, token: str) -> Optional[Dict]:
    """Ask a question about the processed PDF"""
    print(f"\nAsking: {question}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/answer-question/",
            json={'pdf_id': pdf_id, 'question': question},
            headers=get_auth_header(token),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("Answer received:")
            print(json.dumps(data['data'], indent=2))
            return data['data']
        
        print(f"Error answering question: {response.status_code}")
        print(response.json())
        return None
            
    except Exception as e:
        print(f"Error asking question: {str(e)}")
        return None

def run_test(token: str):
    """Run test with authenticated token"""
    # Get valid PDF path
    pdf_path = r"C:\Users\Lenovo\Desktop\Code For Bharat\Current\AiTutor\book2.pdf".strip() or DEFAULT_PDF_PATH
    
    # Process PDF
    pdf_id = upload_and_process_pdf(pdf_path, token)
    if not pdf_id:
        return
    
    # Ask questions
    while True:
        question = input("\nEnter question (or 'quit' to exit): ").strip()
        if question.lower() == 'quit':
            break
        ask_question(pdf_id, question, token)

if __name__ == "__main__":
    print("=== PDF QA Test ===")
    token = "2IUpOTCYcLfJ1fLY8jItUCw11in1".strip()
    if not token:
        print("Error: Authentication token is required")
    else:
        run_test(token)