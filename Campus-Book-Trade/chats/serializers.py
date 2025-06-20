from rest_framework import serializers
from .models import ChatSession, ChatMessage, SystemMessage
from books.models import Book
from books.serializers import BookSerializer
from users.serializers import UserSerializer

class SystemMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemMessage
        fields = ['id', 'title', 'content', 'type', 'is_read', 'created_at']

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'content', 'created_at', 'is_read', 'sender']

class ChatSessionSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    last_message = serializers.CharField(read_only=True)
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'book', 'seller', 'buyer', 'created_at', 
                 'updated_at', 'last_message', 'unread_count', 'other_user']

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_other_user(self, obj):
        user = self.context['request'].user
        other_user = obj.buyer if user == obj.seller else obj.seller
        return UserSerializer(other_user).data