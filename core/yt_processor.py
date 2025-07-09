import os
import re
import json
import hashlib
import logging
from typing import List, Dict, Optional
from yt_dlp import YoutubeDL
from youtube_transcript_api import YouTubeTranscriptApi
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
import google.generativeai as genai
import requests

# Disable yt-dlp logger to suppress ffmpeg warnings
logging.getLogger('yt_dlp').setLevel(logging.ERROR)

class YouTubeProcessor:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = "deepseek-r1-distill-llama-70b"
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean text by removing empty or whitespace-only lines"""
        lines = text.splitlines()
        cleaned_lines = [line for line in lines if not re.match(r'^[_\W\s]{5,}$', line.strip())]
        return "\n".join(cleaned_lines).strip()

    @staticmethod
    def generate_text_hash(text: str) -> str:
        """Generate a short hash for text content"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()[:8]

    @staticmethod
    def extract_video_id(video_url: str) -> str:
        """Extract YouTube video ID from URL"""
        if "v=" in video_url:
            return video_url.split("v=")[1].split("&")[0]
        return video_url  # Assume it's just the ID if no URL structure

    @staticmethod
    def get_youtube_video_info(video_url: str) -> Dict:
        """Get YouTube video metadata using yt-dlp"""
        ydl_opts = {
            'quiet': True,
            'skip_download': True,
            'extract_flat': True,
        }
        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                return {
                    "title": info.get('title', ''),
                    "description": info.get('description', ''),
                    "thumbnail": info.get('thumbnail', ''),
                    "duration": info.get('duration', 0),
                    "view_count": info.get('view_count', 0),
                    "upload_date": info.get('upload_date', '')
                }
        except Exception as e:
            print(f"Warning: Couldn't get video info - {str(e)}")
            return {
                "title": "",
                "description": "",
                "thumbnail": ""
            }

    @staticmethod
    def format_timestamp_url(video_url: str, timestamp: float) -> str:
        """Format URL with timestamp parameter"""
        video_id = YouTubeProcessor.extract_video_id(video_url)
        return f"https://www.youtube.com/watch?v={video_id}&t={int(timestamp)}s"

    def load_youtube_transcript(self, video_url: str, languages: List[str] = ['en']) -> List[Document]:
        """Load and process YouTube transcript into chunks with timestamps"""
        video_id = self.extract_video_id(video_url)
        print(f"\nProcessing YouTube video: {video_url}")
        
        # Get video metadata
        video_info = self.get_youtube_video_info(video_url)
        if video_info.get('title'):
            print(f"Video Title: {video_info['title']}")
        
        # Try to get transcript in each language until successful
        transcript = None
        for lang in languages:
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                print(f"Found transcript in language: {lang}")
                break
            except:
                continue
        
        if not transcript:
            raise Exception("No transcript available for the video in the specified languages")
        
        # Process transcript into chunks with metadata
        full_text = " ".join([entry['text'] for entry in transcript])
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=200)
        text_chunks = text_splitter.split_text(self.clean_text(full_text))
        
        chunks = []
        for chunk_num, chunk_text in enumerate(text_chunks, start=1):
            # Map chunk to timestamp range
            start_pos = full_text.find(chunk_text)
            end_pos = start_pos + len(chunk_text)
            
            start_time = 0
            end_time = 0
            current_pos = 0
            matched_entries = []
            
            for entry in transcript:
                entry_end = current_pos + len(entry['text']) + 1  # +1 for space
                if current_pos <= end_pos and entry_end >= start_pos:
                    matched_entries.append(entry)
                current_pos = entry_end
            
            if matched_entries:
                start_time = matched_entries[0]['start']
                end_time = matched_entries[-1]['start'] + matched_entries[-1]['duration']
            
            chunks.append(Document(
                page_content=chunk_text,
                metadata={
                    "source": self.format_timestamp_url(video_url, start_time),
                    "thumbnail": video_info.get('thumbnail', ''),
                    "chunk_id": f"c{chunk_num}",
                    "timestamp": {
                        "start": start_time,
                        "end": end_time,
                        "length": end_time - start_time
                    },
                    "preview": chunk_text[:50] + ("..." if len(chunk_text) > 50 else ""),
                    "text_hash": self.generate_text_hash(chunk_text),
                    "video_hash": self.generate_text_hash(full_text),
                    "video_title": video_info.get('title', 'Unknown'),
                    "video_id": video_id
                }
            ))
        
        print(f"Created {len(chunks)} text chunks from YouTube video")
        return chunks

    def create_vector_store(self, chunks: List[Document], store_name: str) -> FAISS:
        """Create and save FAISS vector store from document chunks"""
        print("Creating embeddings and vector store...")
        vectorstore = FAISS.from_documents(chunks, self.embedding_model)
        print(f"Vector store created with {vectorstore.index.ntotal} embeddings")
        
        # Save to specified path
        store_path = os.path.join("vectorstores", store_name)
        vectorstore.save_local(store_path)
        print(f"Vector store saved at {store_path}")
        return vectorstore

    def load_vector_store(self, store_name: str) -> FAISS:
        """Load existing vector store from disk"""
        store_path = os.path.join("vectorstores", store_name)
        return FAISS.load_local(
            store_path,
            self.embedding_model,
            allow_dangerous_deserialization=True
        )

    def call_groq_llm(self, prompt: str) -> str:
        """Call Groq LLM API with the given prompt"""
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.groq_model,
            "messages": [
                {
                    "role": "system", 
                    "content": "You are a helpful AI assistant. Answer questions using the provided context."
                },
                {"role": "user", "content": prompt}
            ]
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions", 
            json=payload, 
            headers=headers
        )
        if response.status_code != 200:
            raise Exception(f"Groq LLM error: {response.status_code} - {response.text}")
        
        return response.json()["choices"][0]["message"]["content"]

    def expand_query_with_llm(self, query: str) -> str:
        """Expand short queries for better semantic search"""
        prompt = f"""You are an expert assistant. The user query below is too short for accurate search.
Please expand it into a more detailed version while preserving the original intent.

Original Query: {query}

Expanded Version:"""
        return self.call_groq_llm(prompt)

    def answer_question(self, vectorstore: FAISS, question: str) -> Dict:
        """Answer question using vector store context"""
        # Step 1: Expand the query
        expanded_query = self.expand_query_with_llm(question)
        
        # Step 2: Semantic search on expanded query
        similar_docs = vectorstore.max_marginal_relevance_search(
            query=expanded_query, 
            k=5, 
            fetch_k=25
        )

        if not similar_docs:
            return {
                "answer": "No relevant context found in the video.",
                "references": [],
                "thinking_process": ""
            }

        # Prepare context for LLM
        full_context = "\n\n".join([doc.page_content for doc in similar_docs])

        # Generate answer with thinking process
        prompt = f"""Analyze the question and provide:
1. Your thinking process (marked with <thinking> tags)
2. A detailed answer based strictly on the context
3. Key points from each relevant chunk
4. Include timestamps where this information appears in the video

Question: {question}

Context:
{full_context}

Format your response as:
<thinking>Your analytical process here</thinking>
<answer>Your structured answer here</answer>"""
        
        llm_response = self.call_groq_llm(prompt)
        
        # Extract thinking and answer parts
        thinking_process = ""
        answer = ""
        try:
            thinking_process = llm_response.split("<thinking>")[1].split("</thinking>")[0].strip()
            answer = llm_response.split("<answer>")[1].split("</answer>")[0].strip()
        except:
            thinking_process = "The model did not provide a separate thinking process."
            answer = llm_response

        return {
            "question": question,
            "expanded_query": expanded_query,
            "thinking_process": thinking_process,
            "answer": answer,
            "references": [
                {
                    "source": doc.metadata["source"],
                    "thumbnail": doc.metadata["thumbnail"],
                    "chunk_id": doc.metadata["chunk_id"],
                    "timestamp": doc.metadata["timestamp"],
                    "text": doc.page_content,
                    "preview": doc.metadata["preview"],
                    "video_title": doc.metadata.get("video_title", "Unknown")
                } for doc in similar_docs
            ],
            "context_hash": self.generate_text_hash(full_context)
        }

    def process_video(self, video_url: str, store_name: str) -> Dict:
        """Full processing pipeline for a YouTube video"""
        chunks = self.load_youtube_transcript(video_url)
        vectorstore = self.create_vector_store(chunks, store_name)
        video_info = self.get_youtube_video_info(video_url)
        
        return {
            "vectorstore": vectorstore,
            "video_info": video_info,
            "chunks": chunks,
            "store_name": store_name
        }


# Example usage
# if __name__ == "__main__":
#     processor = YouTubeProcessor()
    
#     # Example video processing
#     video_url = "https://www.youtube.com/watch?v=vJOGC8QJZJQ"
#     store_name = "example_youtube_video"
    
#     # Process the video
#     result = processor.process_video(video_url, store_name)
#     print(f"Processed video: {result['video_info']['title']}")
    
#     # Ask a question
#     question = "What is the main theme of this video?"
#     answer = processor.answer_question(result['vectorstore'], question)
#     print("\nAnswer:")
#     print(answer['answer'])
#     print("\nReferences:")
#     for ref in answer['references']:
#         print(f"- {ref['video_title']} @ {ref['timestamp']['start']}s: {ref['preview']}")