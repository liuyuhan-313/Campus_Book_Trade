from django.contrib import admin
from .models import ChatSession, ChatMessage, SystemMessage

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'book_title', 'seller', 'buyer', 'last_message_preview', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('book__title', 'seller__username', 'buyer__username', 'seller__nickname', 'buyer__nickname')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 20
    ordering = ('-updated_at',)
    
    def book_title(self, obj):
        return obj.book.title
    book_title.short_description = '书籍名称'
    
    def last_message_preview(self, obj):
        if obj.last_message:
            return obj.last_message[:50] + '...' if len(obj.last_message) > 50 else obj.last_message
        return '暂无消息'
    last_message_preview.short_description = '最后消息'

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_info', 'sender', 'content_preview', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at', 'sender')
    search_fields = ('content', 'sender__username', 'sender__nickname')
    readonly_fields = ('created_at',)
    list_per_page = 20
    ordering = ('-created_at',)
    
    def session_info(self, obj):
        return f'{obj.session.book.title} - {obj.session.seller.nickname or obj.session.seller.username}'
    session_info.short_description = '会话信息'
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = '消息内容'

@admin.register(SystemMessage)
class SystemMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('title', 'content', 'user__username', 'user__nickname')
    readonly_fields = ('created_at',)
    list_per_page = 20
    ordering = ('-created_at',)
    
    fieldsets = (
        ('消息基本信息', {
            'fields': ('user', 'title', 'type', 'is_read')
        }),
        ('消息内容', {
            'fields': ('content',)
        }),
        ('时间信息', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'成功标记 {updated} 条消息为已读')
    mark_as_read.short_description = '标记为已读'
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'成功标记 {updated} 条消息为未读')
    mark_as_unread.short_description = '标记为未读'
