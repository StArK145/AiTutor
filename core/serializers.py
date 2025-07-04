from rest_framework import serializers
from .models import Wallet, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('firebase_uid', 'email', 'display_name', 'is_active', 'date_joined')
        read_only_fields = fields  # All fields are read-only

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ('address', 'created_at', 'last_updated')