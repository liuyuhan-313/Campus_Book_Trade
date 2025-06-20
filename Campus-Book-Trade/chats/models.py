from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from books.models import Book

User = get_user_model()

class ChatSession(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chat_sessions')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_chats')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer_chats')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_message = models.CharField(max_length=200, null=True, blank=True)
    
    class Meta:
        unique_together = ['book', 'seller', 'buyer']

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

class SystemMessage(models.Model):
    MESSAGE_TYPES = (
        ('order', '订单通知'),
        ('system', '系统通知'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='system_messages')
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='system', verbose_name='消息类型')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='创建时间')

    class Meta:
        ordering = ['-created_at']
        verbose_name = '系统消息'
        verbose_name_plural = '系统消息'
