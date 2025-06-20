from rest_framework import serializers
from .models import Book, Category
from django.contrib.auth import get_user_model
from django.conf import settings

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'avatar_url']

class BookSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    cover_image = serializers.SerializerMethodField()
    image_urls = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'publisher', 'isbn', 'category', 
            'description', 'price', 'condition', 
            'cover_image', 'image_urls', 'is_sold', 
            'created_at', 'seller', 'campus'
        ]
    
    def get_cover_image(self, obj):
        if obj.cover_image:
            if not obj.cover_image.startswith('http'):
                if settings.DEBUG:
                    return f"http://127.0.0.1:8000{obj.cover_image}"
                return obj.cover_image
            return obj.cover_image
        return None

    def get_image_urls(self, obj):
        urls = obj.get_image_urls()
        if settings.DEBUG:
            return [f"http://127.0.0.1:8000{url}" if not url.startswith('http') else url for url in urls]
        return urls

class BookCreateSerializer(serializers.ModelSerializer):
    cover_image = serializers.CharField(required=False, allow_null=True)
    image_urls = serializers.ListField(child=serializers.CharField(), required=False)
    campus = serializers.ChoiceField(choices=Book.CAMPUS_CHOICES, required=True)
    
    class Meta:
        model = Book
        fields = [
            'title', 'author', 'publisher', 'isbn', 'category', 
            'description', 'price', 'condition', 
            'cover_image', 'image_urls', 'campus'
        ]

    def create(self, validated_data):
        # 从validated_data中提取图片相关数据
        cover_image = validated_data.pop('cover_image', None)
        image_urls = validated_data.pop('image_urls', [])
        
        # 创建书籍实例
        instance = super().create(validated_data)
        
        # 设置封面图片
        if cover_image:
            instance.cover_image = cover_image
        
        # 设置其他图片
        if image_urls:
            instance.set_image_urls(image_urls)
        
        # 保存实例
        instance.save()
        return instance