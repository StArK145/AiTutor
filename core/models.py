from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    is_verified = models.BooleanField(default=False)
    
    # Remove db_table = 'auth_user' - this was causing the issue
    class Meta:
        swappable = 'AUTH_USER_MODEL'

class Wallet(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE)
    address = models.CharField(max_length=42, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.address}"