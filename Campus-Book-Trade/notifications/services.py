from django.db import connection
from django.utils import timezone
from .models import Notification

class NotificationService:
    @staticmethod
    def create_notification(user, title, message, notification_type='system', related_model=None, related_id=None):
        # 使用SQL创建通知
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO notifications_notification 
                (user_id, title, message, notification_type, is_read, created_at, related_model, related_id)
                VALUES (%s, %s, %s, %s, 0, %s, %s, %s)
            """, [user.id, title, message, notification_type, timezone.now(), related_model, related_id])
            
            notification_id = cursor.lastrowid
            
            # 返回创建的通知对象（保持兼容性）
            return Notification.objects.get(id=notification_id)
    
    @staticmethod
    def get_unread_count(user):
        # 使用SQL查询未读通知数量
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM notifications_notification 
                WHERE user_id = %s AND is_read = 0
            """, [user.id])
            
            return cursor.fetchone()[0]