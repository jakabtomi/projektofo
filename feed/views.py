from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.db.models import F
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import Tweet, Comment
import json
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm


@ensure_csrf_cookie
def index(request):
    if request.user.is_authenticated:
        return render(request, 'index.html')
    return redirect("/login")

def login(request):
    if request.user.is_authenticated:
        return redirect("/")
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()
            auth_login(request, user)
            return redirect("/")
    else:
        form = AuthenticationForm()

    return render(request, "login.html", {"form": form})


def register(request):
    if request.user.is_authenticated:
        return redirect("/")

    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user)
            return redirect("/")
    else:
        form = UserCreationForm()

    return render(request, "register.html", {"form": form})


@login_required
@require_http_methods(["POST"])
def logout(request):
    auth_logout(request)
    return redirect("/login/")


@login_required
@require_http_methods(["GET"])
def list_tweets(request):
    tweets = (
        Tweet.objects.all()
        .order_by("-created_at")
        .values("id", "content", "created_at", "share_count", "creator__username")
    )
    return JsonResponse(
        [
            {
                "id": t["id"],
                "content": t["content"],
                "created_at": t["created_at"].isoformat(),
                "username": t["creator__username"] or "Ismeretlen",
                "share_count": t["share_count"],
                "comment_count": Comment.objects.filter(tweet_id=t["id"]).count(),
            }
            for t in tweets
        ],
        safe=False,
    )


@login_required
@require_http_methods(["POST"])
def create_tweet(request):
    data = json.loads(request.body or "{}")
    content = (data.get("content") or "").strip()
    if not content:
        return JsonResponse({"error": "content is required"}, status=400)
    if len(content) > 280:
        return JsonResponse({"error": "content too long"}, status=400)

    new_tweet = Tweet.objects.create(content=content, creator=request.user)
    return JsonResponse(
        {
            "id": new_tweet.id,
            "content": new_tweet.content,
            "created_at": new_tweet.created_at.isoformat(),
            "username": new_tweet.creator.get_username() if new_tweet.creator else "Ismeretlen",
            "share_count": new_tweet.share_count,
            "comment_count": 0,
        }
    )


@login_required
@require_http_methods(["POST"])
def share_tweet(request, tweet_id: int):
    updated = Tweet.objects.filter(id=tweet_id).update(share_count=F("share_count") + 1)
    if updated == 0:
        return JsonResponse({"error": "tweet not found"}, status=404)
    share_count = Tweet.objects.values_list("share_count", flat=True).get(id=tweet_id)
    return JsonResponse({"tweet_id": tweet_id, "share_count": share_count})


@login_required
@require_http_methods(["GET", "POST"])
def comments(request, tweet_id: int):
    if not Tweet.objects.filter(id=tweet_id).exists():
        return JsonResponse({"error": "tweet not found"}, status=404)

    if request.method == "GET":
        items = (
            Comment.objects.filter(tweet_id=tweet_id)
            .order_by("created_at")
            .values("id", "content", "created_at", "creator__username")
        )
        return JsonResponse(
            [
                {
                    "id": c["id"],
                    "content": c["content"],
                    "created_at": c["created_at"].isoformat(),
                    "username": c["creator__username"] or "Ismeretlen",
                }
                for c in items
            ],
            safe=False,
        )

    data = json.loads(request.body or "{}")
    content = (data.get("content") or "").strip()
    if not content:
        return JsonResponse({"error": "content is required"}, status=400)
    if len(content) > 280:
        return JsonResponse({"error": "content too long"}, status=400)

    comment = Comment.objects.create(tweet_id=tweet_id, content=content, creator=request.user)
    return JsonResponse(
        {
            "id": comment.id,
            "tweet_id": tweet_id,
            "content": comment.content,
            "created_at": comment.created_at.isoformat(),
            "username": comment.creator.get_username() if comment.creator else "Ismeretlen",
        }
    )
