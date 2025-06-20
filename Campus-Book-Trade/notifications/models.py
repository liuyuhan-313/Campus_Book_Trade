from django.db import models
from django.utils import timezone
from django.conf import settings

class Announcement(models.Model):
    title = models.CharField('标题', max_length=100)
    content = models.TextField('内容')
    created_at = models.DateTimeField('创建时间', default=timezone.now)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    is_active = models.BooleanField('是否有效', default=True)

    class Meta:
        verbose_name = '公告'
        verbose_name_plural = '公告'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('system', '系统消息'),
        ('order', '订单通知'),
        ('review', '评价通知'),
        ('chat', '聊天消息'),
        ('announcement', '公告'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='用户'
    )
    title = models.CharField('标题', max_length=100)
    message = models.TextField('消息内容')
    notification_type = models.CharField(
        '通知类型',
        max_length=20,
        choices=NOTIFICATION_TYPES
    )
    is_read = models.BooleanField('是否已读', default=False)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    related_model = models.CharField('关联模型', max_length=50, null=True, blank=True)
    related_id = models.PositiveIntegerField('关联ID', null=True, blank=True)

    class Meta:
        verbose_name = '通知'
        verbose_name_plural = '通知'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"