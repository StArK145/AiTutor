import os
import requests
import json

BASE_URL = "http://localhost:8000"

def upload_and_process_pdf(pdf_path):
    """Upload and process a PDF file"""
    print(f"\nUploading and processing PDF: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return None

    try:
        with open(pdf_path, 'rb') as f:
            files = {'pdf': (os.path.basename(pdf_path), f)}
            response = requests.post(
                f"{BASE_URL}/api/process-pdf/",
                files=files
            )
        
        if response.status_code == 200:
            data = response.json()
            print("PDF processed successfully!")
            print(f"Vector store name: {data.get('vector_store')}")
            return data.get('vector_store')
        else:
            print(f"Error processing PDF: {response.status_code}")
            print(response.json())
            return None
            
    except Exception as e:
        print(f"Error uploading PDF: {str(e)}")
        return None

def ask_question(vector_store, question):
    """Ask a question about the processed PDF"""
    print(f"\nAsking question: {question}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/answer-question/",
            json={
                'vector_store': vector_store,
                'question': question
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("\nAnswer received:")
            print(json.dumps(data['data'], indent=2))
            return data['data']
        else:
            print(f"Error answering question: {response.status_code}")
            print(response.json())
            return None
            
    except Exception as e:
        print(f"Error asking question: {str(e)}")
        return None

def run_tests():
    print("\n=== PDF Processing and QA Test ===")
    print("This test will:")
    print("1. Upload and process a PDF file")
    print("2. Ask two questions about its content")
    print("3. Display the answers in JSON format\n")

    # Get PDF path from user
    pdf_path = input("Enter the full path to your PDF file: ").strip()
    if not pdf_path:
        print("No PDF path provided. Using default 'book.pdf' in current directory.")
        pdf_path = "book.pdf"

    # Step 1: Process the PDF
    vector_store = upload_and_process_pdf(pdf_path)
    if not vector_store:
        print("Failed to process PDF. Exiting test.")
        return

    # Step 2: Ask questions
    questions = [
        input("\nEnter your first question: ").strip() or "What is the main topic of this document?",
        input("Enter your second question: ").strip() or "Summarize the key points of this document"
    ]

    for question in questions:
        ask_question(vector_store, question)

    print("\nTest completed!")

if __name__ == "__main__":
    run_tests()