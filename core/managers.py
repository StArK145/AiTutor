from django.contrib.auth.base_user import BaseUserManager

class FirebaseUserManager(BaseUserManager):
    def create_user(self, firebase_uid, **extra_fields):
        if not firebase_uid:
            raise ValueError('The Firebase UID must be set')
        user = self.model(firebase_uid=firebase_uid, **extra_fields)
        user.save(using=self._db)
        return user

    def create_superuser(self, firebase_uid, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(firebase_uid, **extra_fields)