from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.utils import timezone
from .models import Collection
from .serializers import CollectionSerializer
from books.models import Book
import logging

# 设置日志记录器
logger = logging.getLogger(__name__)

# Create your views here.

class CollectionListAPI(generics.ListAPIView):
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        logger.info(f"获取用户 {self.request.user.id} 的收藏列表")
        
        # 使用SQL查询用户的收藏列表
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM user_collections_collection WHERE user_id = %s", [self.request.user.id])
            collection_ids = [row[0] for row in cursor.fetchall()]
            
            logger.info(f"找到 {len(collection_ids)} 条收藏记录")
            
            if collection_ids:
                return Collection.objects.filter(id__in=collection_ids)
            else:
                return Collection.objects.none()

class CollectionToggleAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, book_id):
        logger.info(f"用户 {request.user.id} 请求切换书籍 {book_id} 的收藏状态")
        try:
            # 使用SQL验证书籍是否存在
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, title FROM books_book WHERE id = %s", [book_id])
                book_row = cursor.fetchone()
                
                if not book_row:
                    logger.error(f"书籍 {book_id} 不存在")
                    return Response({
                        'code': 404,
                        'msg': '书籍不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                book_id, book_title = book_row
                logger.info(f"找到书籍: {book_title}")
                
                # 检查是否已收藏
                cursor.execute("""
                    SELECT id FROM user_collections_collection 
                    WHERE user_id = %s AND book_id = %s
                """, [request.user.id, book_id])
                
                collection_row = cursor.fetchone()
                
                if collection_row:
                    # 如果已经收藏，则取消收藏
                    logger.info(f"用户已收藏该书，准备取消收藏")
                    cursor.execute("""
                        DELETE FROM user_collections_collection 
                        WHERE user_id = %s AND book_id = %s
                    """, [request.user.id, book_id])
                    
                    logger.info(f"成功取消收藏")
                    return Response({
                        'code': 0,
                        'msg': '取消收藏成功',
                        'data': {'is_collected': False}
                    })
                else:
                    # 如果未收藏，则添加收藏
                    logger.info(f"用户未收藏该书，准备添加收藏")
                    cursor.execute("""
                        INSERT INTO user_collections_collection 
                        (user_id, book_id, created_at)
                        VALUES (%s, %s, %s)
                    """, [request.user.id, book_id, timezone.now()])
                    
                    collection_id = cursor.lastrowid
                    logger.info(f"成功添加收藏，收藏ID: {collection_id}")
                    return Response({
                        'code': 0,
                        'msg': '收藏成功',
                        'data': {'is_collected': True}
                    })
                
        except Exception as e:
            logger.error(f"收藏操作失败: {str(e)}")
            return Response({
                'code': 500,
                'msg': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
