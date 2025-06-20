from django.urls import path
from . import views

urlpatterns = [
    # 公告相关
    path('announcements/', views.AnnouncementListView.as_view(), name='announcement-list'),
    path('announcements/create/', views.AnnouncementCreateView.as_view(), name='announcement-create'),
    
    # 个人通知相关
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/mark-read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/unread-count/', views.NotificationUnreadCountView.as_view(), name='notification-unread-count'),
] 