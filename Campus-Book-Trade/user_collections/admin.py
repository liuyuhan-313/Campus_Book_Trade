from django.contrib import admin
from .models import Collection

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('user_display', 'book_display', 'book_price', 'book_status', 'created_at')
    list_filter = ('created_at', 'book__is_sold', 'book__campus', 'book__condition')
    search_fields = ('user__username', 'user__nickname', 'book__title', 'book__author')
    readonly_fields = ('created_at',)
    list_per_page = 20
    ordering = ('-created_at',)
    
    def user_display(self, obj):
        return obj.user.nickname or obj.user.username
    user_display.short_description = '用户'
    
    def book_display(self, obj):
        return obj.book.title
    book_display.short_description = '书籍名称'
    
    def book_price(self, obj):
        return f'¥{obj.book.price}'
    book_price.short_description = '价格'
    
    def book_status(self, obj):
        return '已售出' if obj.book.is_sold else '在售'
    book_status.short_description = '状态'
    
    # 自定义查询集优化
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('user', 'book')
