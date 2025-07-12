import os
import re
import json
import hashlib
import logging
import time
from typing import List, Dict, Optional, Union
from yt_dlp import YoutubeDL
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
import google.generativeai as genai
import requests
import os
from typing import List, Dict, Union, Optional
from datetime import timedelta
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json

import os
from typing import List, Dict, Tuple, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
from datetime import datetime, timedelta
import hashlib
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from googleapiclient.discovery import build

class YouTubeProcessor:
    def __init__(self):
        self.youtube = build('youtube', 'v3', developerKey=os.getenv("YOUTUBE_API_KEY"))
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = "deepseek-r1-distill-llama-70b"
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.supported_languages = ['en', 'hi']  # English and Hindi (English first)
        self.transcript_cache = {}
        self.last_request_time = None
        self.request_count = 0
        self.MAX_REQUESTS_PER_MINUTE = 50  # YouTube API quota limit

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
        """Extract YouTube video ID from URL.
        Supports:
        - https://www.youtube.com/watch?v=k4oWqYT6tjk
        - https://youtu.be/k4oWqYT6tjk
        - https://youtu.be/k4oWqYT6tjk?si=wdVFChAiQdIawmR1
        - and similar variations
        """
        # Handle youtu.be URLs
        if "youtu.be/" in video_url:
            return video_url.split("youtu.be/")[1].split("?")[0].split("/")[0]
        
        # Handle standard YouTube URLs
        if "v=" in video_url:
            return video_url.split("v=")[1].split("&")[0]
        
        # If no pattern matches, return the original string (assuming it's just the ID)
        return video_url

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

    def _rate_limit(self):
        """Handle API rate limiting"""
        now = datetime.now()
        if self.last_request_time and (now - self.last_request_time) < timedelta(seconds=60):
            self.request_count += 1
            if self.request_count >= self.MAX_REQUESTS_PER_MINUTE:
                wait_time = 60 - (now - self.last_request_time).seconds
                logger.warning(f"Rate limit reached. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
                self.request_count = 0
                self.last_request_time = datetime.now()
        else:
            self.last_request_time = now
            self.request_count = 1


    def get_transcript(self, video_id: str) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """
        Get transcript using YouTube Data API with enhanced error handling
        Returns:
            tuple: (transcript_data, language_code) or (None, None) if not available
        """
        # Check cache first
        cache_key = hashlib.md5(video_id.encode()).hexdigest()
        if cache_key in self.transcript_cache:
            return self.transcript_cache[cache_key]

        try:
            self._rate_limit()
            
            # Step 1: List available caption tracks
            captions = self.youtube.captions().list(
                part="snippet",
                videoId=video_id
            ).execute()

            if not captions.get('items'):
                logger.info(f"No captions available for video {video_id}")
                return None, None

            # Step 2: Find preferred language track
            preferred_languages = ['en', 'hi']  # English first, then Hindi
            caption_track = None
            
            for lang in preferred_languages:
                for item in captions['items']:
                    if item['snippet']['language'] == lang and item['snippet']['trackKind'] != 'asr':  # Prefer manual over auto-generated
                        caption_track = item
                        break
                if caption_track:
                    break

            if not caption_track:
                logger.info(f"No supported language captions for video {video_id}")
                return None, None

            # Step 3: Download the caption track
            self._rate_limit()
            transcript = self.youtube.captions().download(
                id=caption_track['id'],
                tfmt='srt'  # SubRip format for timestamps
            ).execute()

            # Step 4: Parse and format the transcript
            formatted_transcript = self._parse_transcript(transcript)
            
            # Cache the result for 1 hour
            self.transcript_cache[cache_key] = (formatted_transcript, caption_track['snippet']['language'])
            
            return formatted_transcript, caption_track['snippet']['language']

        except HttpError as e:
            if e.resp.status == 403:
                logger.error("YouTube API quota exceeded")
            elif e.resp.status == 404:
                logger.error(f"Video or captions not found: {video_id}")
            else:
                logger.error(f"YouTube API HTTP error: {str(e)}")
            return None, None
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return None, None

    def load_youtube_transcript(self, video_url: str) -> List[Document]:
        """Load and process YouTube transcript into chunks with timestamps"""
        video_id = self.extract_video_id(video_url)
        print(f"\nProcessing YouTube video: {video_url}")
        
        # Get video metadata
        video_info = self.get_youtube_video_info(video_url)
        if video_info.get('title'):
            print(f"Video Title: {video_info['title']}")
        
        # Get transcript with language preference
        transcript, transcript_lang = self.get_transcript(video_id)
        if not transcript:
            raise Exception(f"No transcript available in supported languages: {self.supported_languages}")
        
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
                    "video_id": video_id,
                    "language": transcript_lang  # Add language metadata
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

    def call_groq_llm(self, prompt: str, language: str = 'en') -> str:
        """Call Groq LLM API with the given prompt"""
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        system_message = {
            "en": "You are a helpful AI assistant. Answer questions using the provided context.",
            "hi": "आप एक सहायक AI सहायक हैं। प्रदान किए गए संदर्भ का उपयोग करके प्रश्नों का उत्तर दें।"
        }.get(language, "en")
        
        payload = {
            "model": self.groq_model,
            "messages": [
                {
                    "role": "system", 
                    "content": system_message
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

    def expand_query_with_llm(self, query: str, language: str = 'en') -> str:
        """Expand short queries for better semantic search"""
        prompt_templates = {
            'en': """You are an expert assistant. The user query below is too short for accurate search.
Please expand it into a more detailed version while preserving the original intent.

Original Query: {query}

Expanded Version:""",
            'hi': """आप एक विशेषज्ञ सहायक हैं। नीचे दिया गया उपयोगकर्ता प्रश्न सटीक खोज के लिए बहुत छोटा है।
कृपया इसे मूल इरादे को संरक्षित करते हुए अधिक विस्तृत संस्करण में विस्तारित करें।

मूल प्रश्न: {query}

विस्तारित संस्करण:"""
        }
        
        prompt = prompt_templates.get(language, 'en').format(query=query)
        return self.call_groq_llm(prompt, language)

    def answer_question(self, vectorstore: FAISS, question: str) -> Dict:
        """Answer question using vector store context. Always returns answer in English."""
        # Detect language of the question (but we'll always answer in English)
        question_lang = 'hi' if any('\u0900' <= char <= '\u097F' for char in question) else 'en'
        
        # Step 1: Expand the query (can be in original language)
        expanded_query = self.expand_query_with_llm(question, question_lang)
        
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

        # Prepare context for LLM (can be in any language)
        full_context = "\n\n".join([doc.page_content for doc in similar_docs])
        context_lang = similar_docs[0].metadata.get('language', 'en')

        # Generate answer - always in English regardless of context language
        prompt_template = """Analyze the question and provide:
1. Your thinking process (marked with <thinking> tags)
2. A detailed answer in English based strictly on the context
3. Key points from each relevant chunk
4. Include timestamps where this information appears in the video

Question: {question}

Context:
{context}

IMPORTANT: Your answer must be in English, even if the context is in another language.

Format your response as:
<thinking>Your analytical process here</thinking>
<answer>Your structured answer in English here</answer>"""
        
        prompt = prompt_template.format(
            question=question,
            context=full_context
        )
        
        # Force English response by setting language to 'en'
        llm_response = self.call_groq_llm(prompt, 'en')
        
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
                    "video_title": doc.metadata.get("video_title", "Unknown"),
                    "language": doc.metadata.get("language", "en")
                } for doc in similar_docs
            ],
            "context_hash": self.generate_text_hash(full_context),
            "language": "en"  # Always return English as the response language
    }

    def process_video(self, video_url: str, store_name: str) -> Dict:
        """Full processing pipeline for a YouTube video using official API"""
        video_id = self.extract_video_id(video_url)
        
        try:
            # Get video metadata
            video_info = self._get_video_info(video_id)
            
            # Get transcript
            transcript, language = self.get_transcript(video_id)
            if not transcript:
                raise Exception("No transcript available")
            
            # Process into chunks (using your existing method)
            chunks = self._create_chunks_from_transcript(
                transcript,
                video_url,
                video_info
            )
            
            return {
                "video_info": video_info,
                "chunks": chunks,
                "language": language,
                "store_name": store_name
            }
            
        except Exception as e:
            print(f"Failed to process video: {str(e)}")
            raise


    def _parse_transcript(self, transcript: str) -> List[Dict]:
        """Parse SRT formatted transcript into our standard format"""
        entries = []
        blocks = transcript.strip().split('\n\n')
        
        for block in blocks:
            lines = block.split('\n')
            if len(lines) >= 3:
                # Parse timestamp line (e.g., "00:00:01,000 --> 00:00:04,000")
                time_range = lines[1]
                start_time = self._srt_time_to_seconds(time_range.split('-->')[0].strip())
                
                # Combine text lines
                text = ' '.join(lines[2:])
                
                entries.append({
                    'text': text,
                    'start': start_time,
                    'duration': 0  # Will calculate below
                })
        
        # Calculate durations
        for i in range(len(entries)):
            if i < len(entries) - 1:
                entries[i]['duration'] = entries[i+1]['start'] - entries[i]['start']
            else:
                entries[i]['duration'] = 1  # Default duration for last entry
        
        return entries

    def _srt_time_to_seconds(self, time_str: str) -> float:
        """Convert SRT timestamp to seconds"""
        hh_mm_ss, mmm = time_str.split(',')
        hh, mm, ss = hh_mm_ss.split(':')
        return int(hh) * 3600 + int(mm) * 60 + int(ss) + int(mmm)/1000

    def get_video_info(self, video_id: str) -> Dict:
        """Get video metadata with enhanced error handling"""
        try:
            self._rate_limit()
            response = self.youtube.videos().list(
                part="snippet,contentDetails",
                id=video_id
            ).execute()
            
            if not response.get('items'):
                raise Exception("Video not found")
                
            item = response['items'][0]
            return {
                'title': item['snippet']['title'],
                'description': item['snippet']['description'],
                'thumbnail': item['snippet']['thumbnails']['high']['url'],
                'duration': self._parse_duration(item['contentDetails']['duration']),
                'channel': item['snippet']['channelTitle']
            }
            
        except HttpError as e:
            logger.error(f"Video info API error: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Video info error: {str(e)}")
            return {}

    def _parse_duration(self, duration: str) -> int:
        """Convert ISO 8601 duration to seconds"""
        time_delta = timedelta()
        if 'H' in duration:
            time_delta += timedelta(hours=int(duration.split('H')[0][2:]))
            duration = duration.split('H')[1]
        if 'M' in duration:
            time_delta += timedelta(minutes=int(duration.split('M')[0]))
            duration = duration.split('M')[1]
        if 'S' in duration:
            time_delta += timedelta(seconds=int(duration.split('S')[0]))
        return int(time_delta.total_seconds())