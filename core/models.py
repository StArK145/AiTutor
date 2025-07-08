from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, firebase_uid, email, username, **extra_fields):
        if not firebase_uid:
            raise ValueError('Firebase UID must be set')
        if not email:
            raise ValueError('Email must be set')
        
        email = self.normalize_email(email)
        user = self.model(
            firebase_uid=firebase_uid,
            email=email,
            username=username,
            **extra_fields
        )
        user.save(using=self._db)
        return user

    def create_superuser(self, firebase_uid, email, username, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(firebase_uid, email, username, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    firebase_uid = models.CharField(max_length=128, unique=True, primary_key=True)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)
    date_joined = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'firebase_uid'
    REQUIRED_FIELDS = ['email', 'username']

    def __str__(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_staff

    def has_module_perms(self, app_label):
        return self.is_staff
    
    def get_upload_dir(self, filename):
        return f"user_uploads/{self.firebase_uid}/{filename}"
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"


class UserPDF(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pdfs')
    file_name = models.CharField(max_length=255)
    vector_store = models.CharField(max_length=255)
    upload_time = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s PDF: {self.file_name}"
    
class PDFConversation(models.Model):
    pdf = models.ForeignKey(UserPDF, on_delete=models.CASCADE, related_name='conversations')
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Conversation about {self.pdf.file_name}"


class UserYouTubeVideo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='youtube_videos')
    video_url = models.URLField()
    video_id = models.CharField(max_length=20)  # Store YouTube video ID separately
    video_title = models.CharField(max_length=255)
    thumbnail_url = models.URLField()
    vector_store = models.CharField(max_length=255)  # Store path to vector store
    upload_time = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s Video: {self.video_title}"

class YouTubeConversation(models.Model):
    video = models.ForeignKey(UserYouTubeVideo, on_delete=models.CASCADE, related_name='conversations')
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Conversation about {self.video.video_title}"