from rest_framework import serializers
from .models import Collection
from books.serializers import BookSerializer

class CollectionSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    
    class Meta:
        model = Collection
        fields = ['id', 'book', 'created_at']
        read_only_fields = ['user'] 