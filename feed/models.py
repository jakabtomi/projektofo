from django.db import models
from django.conf import settings

class Tweet(models.Model):
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tweets",
    )
    content = models.TextField(max_length=280)
    created_at = models.DateTimeField(auto_now_add=True)
    share_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.content[:20]


class Comment(models.Model):
    tweet = models.ForeignKey(Tweet, on_delete=models.CASCADE, related_name="comments")
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comments",
    )
    content = models.TextField(max_length=280)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.content[:20]
