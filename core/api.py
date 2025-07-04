from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from .models import Wallet
from .serializers import UserSerializer, WalletSerializer
from .firebase_auth import FirebaseAuthentication
from rest_framework.permissions import AllowAny

class FirebaseLoginAPI(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [AllowAny]
    
    def post(self, request):
        user = request.user
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })

class DashboardAPI(generics.RetrieveAPIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        user = self.request.user
        wallet, created = Wallet.objects.get_or_create(user=user)
        return wallet

class WalletAPI(generics.UpdateAPIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        return Wallet.objects.get(user=self.request.user)

    def update(self, request, *args, **kwargs):
        wallet = self.get_object()
        address = request.data.get('address')
        
        if address:
            wallet.address = address
            wallet.save()
            return Response({'status': 'success'})
        else:
            wallet.delete()
            return Response({'status': 'wallet disconnected'}, status=status.HTTP_204_NO_CONTENT)