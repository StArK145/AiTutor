from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from .models import Wallet, User
from .serializers import UserSerializer, WalletSerializer

class SignUpAPI(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginAPI(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            login(request, user)  # Optional: Maintain session for admin access
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class DashboardAPI(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WalletSerializer

    def get_object(self):
        user = self.request.user
        wallet, created = Wallet.objects.get_or_create(user=user)
        return wallet

class WalletAPI(generics.UpdateAPIView):
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