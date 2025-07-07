from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from django.http import JsonResponse
from .pdf_processor import PDFProcessor
import os
from django.conf import settings
from .models import UserPDF, PDFConversation
import json
from .firebase_auth import FirebaseAuthentication
from rest_framework.permissions import IsAuthenticated
User = get_user_model()


class FirebaseLoginAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("\n=== Received Request ===")
        print("Headers:", request.headers)
        print("Data:", request.data)
        print("Method:", request.method)
        
        firebase_uid = request.headers.get('X-Firebase-UID')
        if not firebase_uid:
            print("!! Missing Firebase UID header")
            return Response(
                {'error': 'Missing Firebase UID in headers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = request.data.get('email')
        if not email:
            print("!! Missing email in request data")
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ... rest of your existing code ...
        username = request.data.get('username') or email.split('@')[0]
        

        user, created = User.objects.get_or_create(
            firebase_uid=firebase_uid,
            defaults={'email': email, 'username': username}
        )

        if created:
            return Response({
                'uid': user.firebase_uid,
                'email': user.email,
                'username': user.username,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'uid': user.firebase_uid,
            'email': user.email,
            'username': user.username,
            'message': 'User already exists'
        }, status=status.HTTP_200_OK)
    


class DashboardAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({"message": "Dashboard API"}, status=status.HTTP_200_OK)
    
    
# Add to core/api.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .utils import generate_chapter_names  # Make sure to import the function
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

class ChapterAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get topic and grade from request data
            topic = request.data.get('topic')
            grade = request.data.get('grade')
            
            # Validate required fields
            if not topic:
                return Response(
                    {'error': 'Topic is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not grade:
                return Response(
                    {'error': 'Grade/level is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate chapters
            chapters = generate_chapter_names(topic, grade)
            
            # Return success response with chapters
            return Response({
                'status': True,
                'message': 'Chapters generated successfully',
                'data': {
                    'topic': topic,
                    'grade': grade,
                    'chapters': chapters
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Return error response
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to generate chapters'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['GET'])
def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})




from .utils import get_video_resources

class VideoResourcesAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get topic, grade and chapter from request data
            topic = request.data.get('topic')
            grade = request.data.get('grade')
            chapter = request.data.get('chapter')
            
            # Validate required fields
            if not topic:
                return Response(
                    {'error': 'Topic is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not grade:
                return Response(
                    {'error': 'Grade/level is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not chapter:
                return Response(
                    {'error': 'Chapter name is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get video resources (limited to 4 by the utility function)
            videos = get_video_resources(topic, grade, chapter)
            
            # Return success response with videos
            return JsonResponse({
                'status': True,
                'message': 'Video resources fetched successfully',
                'data': {
                    'topic': topic,
                    'grade': grade,
                    'chapter': chapter,
                    'videos': videos
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Return error response
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to fetch video resources'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
            
from .utils import get_web_resources  # Make sure this is imported at the top

class WebResourcesAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get topic, grade and chapter from request data
            topic = request.data.get('topic')
            grade = request.data.get('grade')
            chapter = request.data.get('chapter')
            
            # Validate required fields
            if not topic:
                return Response(
                    {'error': 'Topic is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not grade:
                return Response(
                    {'error': 'Grade/level is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if not chapter:
                return Response(
                    {'error': 'Chapter name is required', 'status': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get web resources (limited to 4 by the utility function)
            websites = get_web_resources(topic, grade, chapter)
            
            # Return success response with web resources
            return JsonResponse({
                'status': True,
                'message': 'Web resources fetched successfully',
                'data': {
                    'topic': topic,
                    'grade': grade,
                    'chapter': chapter,
                    'websites': websites
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Return error response
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to fetch web resources'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


class PDFQAAPI(APIView):
    parser_classes = [MultiPartParser]
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]# Changed to require authentication

    def post(self, request):
        pdf_file = request.FILES.get('pdf')
        if not pdf_file:
            return Response(
                {'error': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Save file to user-specific directory
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'user_uploads', request.user.firebase_uid)
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, pdf_file.name)
            
            with open(file_path, 'wb+') as destination:
                for chunk in pdf_file.chunks():
                    destination.write(chunk)

            # Process the PDF
            processor = PDFProcessor()
            chunks = processor.process_pdf(file_path)
            store_name = f"book_{request.user.firebase_uid}_{os.path.splitext(pdf_file.name)[0]}"
            processor.create_vector_store(chunks, store_name)
            
            # Save to database
            user_pdf = UserPDF.objects.create(
                user=request.user,
                file_name=pdf_file.name,
                vector_store=store_name
            )
            
            return Response({
                'status': True,
                'message': 'PDF processed successfully',
                'data': {
                    'id': user_pdf.id,
                    'file_name': user_pdf.file_name,
                    'upload_time': user_pdf.upload_time
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to process PDF'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuestionAnswerAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pdf_id = request.data.get('pdf_id')
        question = request.data.get('question')
        
        if not pdf_id or not question:
            return Response(
                {'error': 'Both pdf_id and question are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get the user's PDF
            user_pdf = UserPDF.objects.get(id=pdf_id, user=request.user)
            
            processor = PDFProcessor()
            vs = processor.load_vector_store(user_pdf.vector_store)
            answer = processor.answer_question(vs, question)
            
            # Save conversation
            PDFConversation.objects.create(
                pdf=user_pdf,
                question=question,
                answer=json.dumps(answer)
            )
            
            return Response({
                'status': True,
                'data': answer
            }, status=status.HTTP_200_OK)
            
        except UserPDF.DoesNotExist:
            return Response({
                'status': False,
                'error': 'PDF not found',
                'message': 'You do not have access to this PDF'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to answer question'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserPDFListAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pdfs = UserPDF.objects.filter(user=request.user).order_by('-upload_time')
        data = [{
            'id': pdf.id,
            'file_name': pdf.file_name,
            'upload_time': pdf.upload_time,
            'conversation_count': pdf.conversations.count()
        } for pdf in pdfs]
        return Response({'status': True, 'data': data})

class PDFConversationHistoryAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pdf_id):
        try:
            user_pdf = UserPDF.objects.get(id=pdf_id, user=request.user)
            conversations = user_pdf.conversations.all().order_by('-created_at')[:50]  # Limit to 50 most recent
            data = [{
                'question': conv.question,
                'answer': json.loads(conv.answer),
                'created_at': conv.created_at
            } for conv in conversations]
            return Response({'status': True, 'data': data})
        except UserPDF.DoesNotExist:
            return Response({
                'status': False,
                'error': 'PDF not found'
            }, status=status.HTTP_404_NOT_FOUND)

class DeletePDFAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pdf_id):
        try:
            user_pdf = UserPDF.objects.get(id=pdf_id, user=request.user)
            
            # Delete vector store
            processor = PDFProcessor()
            vectorstore_path = os.path.join(
                settings.BASE_DIR, 
                "vectorstores", 
                user_pdf.vector_store
            )
            if os.path.exists(vectorstore_path):
                import shutil
                shutil.rmtree(vectorstore_path)
            
            # Delete the file
            file_path = os.path.join(
                settings.MEDIA_ROOT, 
                'user_uploads', 
                request.user.firebase_uid,
                user_pdf.file_name
            )
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Delete database record
            user_pdf.delete()
            
            return Response({
                'status': True,
                'message': 'PDF and all related data deleted successfully'
            })
            
        except UserPDF.DoesNotExist:
            return Response({
                'status': False,
                'error': 'PDF not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': False,
                'error': str(e),
                'message': 'Failed to delete PDF'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

