from django.db.models import Q  # 修改这行导入
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import connection
from django.utils import timezone
from .models import ChatSession, ChatMessage, SystemMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer,SystemMessageSerializer
from books.models import Book

class SystemMessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SystemMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # 使用SQL查询当前用户的系统消息
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM chats_systemmessage WHERE user_id = %s", [self.request.user.id])
            message_ids = [row[0] for row in cursor.fetchall()]
            if message_ids:
                return SystemMessage.objects.filter(id__in=message_ids)
            else:
                return SystemMessage.objects.none()

class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 使用SQL查询用户参与的所有会话
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id FROM chats_chatsession 
                WHERE buyer_id = %s OR seller_id = %s 
                ORDER BY updated_at DESC
            """, [self.request.user.id, self.request.user.id])
            
            session_ids = [row[0] for row in cursor.fetchall()]
            if session_ids:
                return ChatSession.objects.filter(id__in=session_ids).order_by('-updated_at')
            else:
                return ChatSession.objects.none()

    @action(detail=False, methods=['post'])
    def start(self, request):
        """开始新的聊天会话"""
        try:
            import random
            import string
        # 打印请求数据，用于调试
            print("收到开始聊天请求，数据：", request.data)
        
            book_id = request.data.get('book_id')
            if not book_id:
                return Response(
                    {'error': '未提供书籍ID'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 使用SQL获取书籍信息
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, title, seller_id FROM books_book WHERE id = %s", [book_id])
                book_row = cursor.fetchone()
                
                if not book_row:
                    return Response(
                        {'error': '找不到指定的书籍'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                book_id, book_title, seller_id = book_row
                
                # 获取卖家信息
                cursor.execute("SELECT id, username, nickname FROM users WHERE id = %s", [seller_id])
                seller_row = cursor.fetchone()
                
                if not seller_row:
                    return Response(
                        {'error': '找不到卖家信息'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                seller_id, seller_username, seller_nickname = seller_row
            
            # 添加调试日志
            print(f"当前用户ID: {request.user.id}, 卖家ID: {seller_id}")
        
            # 获取或创建会话
            with connection.cursor() as cursor:
                # 先查询会话是否存在
                cursor.execute("""
                    SELECT id FROM chats_chatsession 
                    WHERE book_id = %s AND seller_id = %s AND buyer_id = %s
                """, [book_id, seller_id, request.user.id])
                
                session_row = cursor.fetchone()
                
                if session_row:
                    # 会话已存在
                    session_id = session_row[0]
                    created = False
                else:
                    # 创建新会话
                    cursor.execute("""
                        INSERT INTO chats_chatsession 
                        (book_id, seller_id, buyer_id, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s)
                    """, [book_id, seller_id, request.user.id, timezone.now(), timezone.now()])
                    
                    session_id = cursor.lastrowid
                    created = True
        
            # 返回会话信息
            return Response({
                'session_id': session_id,
                'message': '聊天会话创建成功',
                'seller_name': seller_nickname or seller_username
            })
        except Exception as e:
            print("创建聊天会话出错：", str(e))  # 添加调试信息
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """获取会话的消息历史"""
        try:
            # 使用SQL获取会话信息
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT cs.id, cs.book_id, cs.seller_id, cs.buyer_id,
                           b.title, b.cover_image,
                           s.username as seller_username, s.nickname as seller_nickname, s.avatar_url as seller_avatar,
                           u.username as buyer_username, u.nickname as buyer_nickname, u.avatar_url as buyer_avatar
                    FROM chats_chatsession cs
                    JOIN books_book b ON cs.book_id = b.id
                    JOIN users s ON cs.seller_id = s.id
                    JOIN users u ON cs.buyer_id = u.id
                    WHERE cs.id = %s
                """, [pk])
                
                session_row = cursor.fetchone()
                if not session_row:
                    return Response(
                        {'error': '会话不存在'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                session_id, book_id, seller_id, buyer_id, book_title, book_cover, \
                seller_username, seller_nickname, seller_avatar, \
                buyer_username, buyer_nickname, buyer_avatar = session_row
                
                print("获取到的会话:", session_id)  # 添加调试日志
                
                # 获取消息列表
                cursor.execute("""
                    SELECT id, content, sender_id, created_at, is_read
                    FROM chats_chatmessage
                    WHERE session_id = %s
                    ORDER BY created_at ASC
                """, [session_id])
                
                messages = cursor.fetchall()
                print("获取到的消息:", len(messages))  # 添加调试日志
                
                # 标记消息为已读
                cursor.execute("""
                    UPDATE chats_chatmessage 
                    SET is_read = 1 
                    WHERE session_id = %s AND is_read = 0 AND sender_id != %s
                """, [session_id, request.user.id])
        
            #构造返回数据
            response_data = {
                'session': {
                    'id': session_id,
                    'book': {
                        'id': book_id,
                        'title': book_title,
                        'cover': book_cover
                    },
                    'seller': {
                        'id': seller_id,
                        'username': seller_username,
                        'nickname': seller_nickname,
                        'avatar': seller_avatar
                    },
                    'buyer': {
                        'id': buyer_id,
                        'username': buyer_username,
                        'nickname': buyer_nickname,
                        'avatar': buyer_avatar
                    }
                },
                'messages': [{
                    'id': msg[0],
                    'content': msg[1],
                    'sender_id': msg[2],
                    'created_at': msg[3],
                    'is_read': bool(msg[4])
                } for msg in messages]
            }
            
            print("返回的数据:", response_data)  # 添加调试日志
            return Response(response_data)
        except Exception as e:
            print("获取消息失败:", str(e))
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """发送消息"""
        try:
            # 获取消息内容
            content = request.data.get('content')
            
            if not content:
                return Response(
                    {'error': '消息内容不能为空'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 使用SQL创建新消息
            with connection.cursor() as cursor:
                # 验证会话是否存在
                cursor.execute("SELECT id FROM chats_chatsession WHERE id = %s", [pk])
                session_row = cursor.fetchone()
                
                if not session_row:
                    return Response(
                        {'error': '聊天会话不存在'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # 创建新消息
                cursor.execute("""
                    INSERT INTO chats_chatmessage 
                    (session_id, sender_id, content, is_read, created_at)
                    VALUES (%s, %s, %s, 0, %s)
                """, [pk, request.user.id, content, timezone.now()])
                
                message_id = cursor.lastrowid
                
                # 更新会话的最后一条消息
                cursor.execute("""
                    UPDATE chats_chatsession 
                    SET last_message = %s, updated_at = %s
                    WHERE id = %s
                """, [content, timezone.now(), pk])

            return Response({
                'id': message_id,
                'content': content,
                'sender_id': request.user.id,
                'created_at': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'is_read': False
            })

        except Exception as e:
            print("发送消息出错:", str(e))
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Create your views here.
