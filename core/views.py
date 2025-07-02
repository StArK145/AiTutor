from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, authenticate
from .forms import SignUpForm, LoginForm
from .models import Wallet, User
import json

def home(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'core/home.html')

# core/views.py
def dashboard(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    try:
        wallet = Wallet.objects.get(user=request.user)
    except Wallet.DoesNotExist:
        wallet = None
        
    return render(request, 'core/dashboard.html', {'wallet': wallet})

# Wallet connection view
# core/views.py
@csrf_exempt
def save_wallet(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        wallet_address = data.get('wallet_address')
        
        if request.user.is_authenticated:
            if wallet_address:
                Wallet.objects.update_or_create(
                    user=request.user,
                    defaults={'address': wallet_address}
                )
            else:
                Wallet.objects.filter(user=request.user).delete()
            return JsonResponse({'status': 'success'})
        return JsonResponse({'status': 'error', 'message': 'User not authenticated'}, status=401)
    return JsonResponse({'status': 'error'}, status=400)

# Authentication views
def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('dashboard')  # Redirect to dashboard after signup
    else:
        form = SignUpForm()
    return render(request, 'core/signup.html', {'form': form})

def user_login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('dashboard')  # Redirect to dashboard after login
    else:
        form = LoginForm()
    return render(request, 'core/login.html', {'form': form})