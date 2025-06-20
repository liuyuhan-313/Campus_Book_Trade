from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection
from django.utils import timezone
from .models import Announcement, Notification
from .serializers import AnnouncementSerializer, NotificationSerializer
import logging

# 获取logger实例
logger = logging.getLogger(__name__)

class AnnouncementListView(generics.ListAPIView):
    """
    获取公告列表
    GET /api/announcements/
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # 使用SQL查询活跃的公告
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id FROM notifications_announcement 
                WHERE is_active = 1 
                ORDER BY created_at DESC
            """)
            announcement_ids = [row[0] for row in cursor.fetchall()]
            
            if announcement_ids:
                return Announcement.objects.filter(id__in=announcement_ids).order_by('-created_at')
            else:
                return Announcement.objects.none()

    def list(self, request, *args, **kwargs):
        logger.info("Fetching announcements list")
        response = super().list(request, *args, **kwargs)
        logger.info(f"Found {len(response.data)} announcements")
        return response

class AnnouncementCreateView(generics.CreateAPIView):
    """
    创建新公告
    POST /api/announcements/create/
    """
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAdminUser]

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating new announcement with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            logger.info("Data is valid, creating announcement")
            
            # 使用SQL创建公告
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO notifications_announcement 
                    (title, content, created_at, updated_at, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                """, [
                    serializer.validated_data['title'],
                    serializer.validated_data['content'],
                    timezone.now(),
                    timezone.now(),
                    serializer.validated_data.get('is_active', True)
                ])
                
                announcement_id = cursor.lastrowid
                
                # 获取创建的公告数据
                cursor.execute("""
                    SELECT id, title, content, created_at, updated_at, is_active
                    FROM notifications_announcement 
                    WHERE id = %s
                """, [announcement_id])
                
                announcement_row = cursor.fetchone()
                
                if announcement_row:
                    announcement_data = {
                        'id': announcement_row[0],
                        'title': announcement_row[1],
                        'content': announcement_row[2],
                        'created_at': announcement_row[3],
                        'updated_at': announcement_row[4],
                        'is_active': bool(announcement_row[5])
                    }
                    
                    logger.info(f"Announcement created successfully with id: {announcement_data['id']}")
                    return Response({
                        'status': 'success',
                        'message': '公告创建成功',
                        'data': announcement_data
                    }, status=status.HTTP_201_CREATED)
                else:
                    logger.error("Failed to retrieve created announcement")
                    return Response({
                        'status': 'error',
                        'message': '创建公告失败'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.error(f"Invalid data: {serializer.errors}")
            return Response({
                'status': 'error',
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

class NotificationListView(generics.ListAPIView):
    """
    获取用户的通知列表
    GET /api/notifications/
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 使用SQL查询用户的通知
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id FROM notifications_notification 
                WHERE user_id = %s 
                ORDER BY created_at DESC
            """, [self.request.user.id])
            
            notification_ids = [row[0] for row in cursor.fetchall()]
            
            if notification_ids:
                return Notification.objects.filter(id__in=notification_ids).order_by('-created_at')
            else:
                return Notification.objects.none()

class NotificationMarkReadView(APIView):
    """
    标记通知为已读
    POST /api/notifications/{id}/mark-read/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        try:
            # 使用SQL标记通知为已读
            with connection.cursor() as cursor:
                # 验证通知存在且属于当前用户
                cursor.execute("""
                    SELECT id FROM notifications_notification 
                    WHERE id = %s AND user_id = %s
                """, [notification_id, request.user.id])
                
                notification_row = cursor.fetchone()
                
                if not notification_row:
                    return Response({
                        'status': 'error',
                        'message': '通知不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # 更新通知为已读
                cursor.execute("""
                    UPDATE notifications_notification 
                    SET is_read = 1 
                    WHERE id = %s AND user_id = %s
                """, [notification_id, request.user.id])
                
                return Response({
                    'status': 'success',
                    'message': '通知已标记为已读'
                })
                
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return Response({
                'status': 'error',
                'message': '标记通知失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NotificationUnreadCountView(APIView):
    """
    获取未读通知数量
    GET /api/notifications/unread-count/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 使用SQL查询未读通知数量
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM notifications_notification 
                WHERE user_id = %s AND is_read = 0
            """, [request.user.id])
            
            unread_count = cursor.fetchone()[0]
            
            return Response({
                'unread_count': unread_count
            })