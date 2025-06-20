from django.contrib import admin
from .models import Announcement, Notification

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at', 'is_active')
    list_filter = ('is_active', 'created_at', 'updated_at')
    search_fields = ('title', 'content')
    date_hierarchy = 'created_at'
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('公告信息', {
            'fields': ('title', 'content', 'is_active')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__username', 'user__nickname')
    readonly_fields = ('created_at',)
    list_per_page = 20
    ordering = ('-created_at',)
    
    fieldsets = (
        ('通知基本信息', {
            'fields': ('user', 'title', 'notification_type', 'is_read')
        }),
        ('通知内容', {
            'fields': ('message',)
        }),
        ('关联信息', {
            'fields': ('related_model', 'related_id'),
            'classes': ('collapse',)
        }),
        ('时间信息', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'成功标记 {updated} 条通知为已读')
    mark_as_read.short_description = '标记为已读'
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'成功标记 {updated} 条通知为未读')
    mark_as_unread.short_description = '标记为未读'
