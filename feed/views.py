from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Tweet
import json
from django.contrib.auth import login as auth_login
from django.contrib.auth.forms import AuthenticationForm


def index(request):
    if request.user.is_authenticated:
        return render(request, 'index.html')
    return redirect("/login")

def login(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)
            return redirect("/")
    else:
        form = AuthenticationForm()

    return render(request, "login.html", {"form": form})


def create_tweet(request):
    if request.method == "POST":
        data = json.loads(request.body)
        new_tweet = Tweet.objects.create(content=data['content'])
        return JsonResponse({'content': new_tweet.content, 'user': 'Vendég'})
