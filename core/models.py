from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from .managers import FirebaseUserManager

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model where Firebase UID is the primary identifier.
    Password field is removed since authentication is handled by Firebase.
    """
    firebase_uid = models.CharField(
        max_length=128,
        primary_key=True,
        unique=True,
        verbose_name='Firebase UID'
    )
    email = models.EmailField(
    blank=True,
    null=True,
      
    verbose_name='email address'
    )
    display_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='display name'
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        verbose_name='date joined'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='active'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='staff status'
    )
    is_verified = models.BooleanField(
        default=True,
        verbose_name='verified'
    )

    # Custom manager
    objects = FirebaseUserManager()

    # Field to use for authentication
    USERNAME_FIELD = 'firebase_uid'
    REQUIRED_FIELDS = []  # No additional required fields

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        swappable = 'AUTH_USER_MODEL'

    def __str__(self):
        return f"{self.display_name or self.firebase_uid}"

    def get_full_name(self):
        return self.display_name or self.firebase_uid

    def get_short_name(self):
        return self.display_name or self.firebase_uid

    @property
    def username(self):
        """For compatibility with some Django auth utilities"""
        return self.firebase_uid

    @property
    def first_name(self):
        return self.display_name.split()[0] if self.display_name else ''
    
    @property
    def last_name(self):
        parts = self.display_name.split() if self.display_name else []
        return parts[-1] if len(parts) > 1 else ''


class Wallet(models.Model):
    """
    Wallet model linked to Firebase-authenticated users
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='wallet',
        primary_key=True
    )
    address = models.CharField(
        max_length=42,
        unique=True,
        blank=True,
        null=True,
        verbose_name='Ethereum address'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='created at'
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name='last updated'
    )

    class Meta:
        verbose_name = 'wallet'
        verbose_name_plural = 'wallets'

    def __str__(self):
        return f"{self.user.firebase_uid}: {self.address or 'No address'}"

    def save(self, *args, **kwargs):
        """Ensure address is lowercase for consistency"""
        if self.address:
            self.address = self.address.lower()
        super().save(*args, **kwargs)