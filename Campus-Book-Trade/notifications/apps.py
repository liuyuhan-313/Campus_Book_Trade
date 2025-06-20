from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'  # 这是关键必须项
    # 可选添加 verbose_name
    verbose_name = '消息通知'