from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Wallet
from django.contrib.auth.models import User

def save_wallet(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        wallet_address = data.get('wallet_address')
        
        # Create or update wallet (simplified: assumes anonymous user)
        user, _ = User.objects.get_or_create(username=wallet_address)
        Wallet.objects.update_or_create(user=user, defaults={'address': wallet_address})
        
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)

def home(request):
    return render(request, 'core/index.html')