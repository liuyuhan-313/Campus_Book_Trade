from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    # 显示在列表页的字段
    list_display = ('order_number', 'buyer', 'book_title', 'book_seller', 'amount', 'status', 'created_at')
    
    # 可以搜索的字段
    search_fields = ('order_number', 'buyer__username', 'buyer__nickname', 'book__title', 'contact_name', 'contact_phone')
    
    # 右侧筛选器
    list_filter = ('status', 'created_at', 'updated_at', 'book__campus')
    
    # 每页显示的记录数
    list_per_page = 20
    
    # 可以点击编辑的字段
    list_display_links = ('order_number',)
    
    # 可以在列表页直接编辑的字段
    list_editable = ('status',)
    
    # 详情页的字段布局
    fieldsets = (
        ('订单基本信息', {
            'fields': ('order_number', 'status', 'amount')
        }),
        ('买卖双方', {
            'fields': ('buyer', 'book'),
        }),
        ('收货信息', {
            'fields': ('contact_name', 'contact_phone', 'address'),
            'classes': ('collapse',)
        }),
        ('评价信息', {
            'fields': ('rating', 'rating_comment'),
            'classes': ('collapse',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # 只读字段
    readonly_fields = ('created_at', 'updated_at', 'order_number')
    
    # 排序
    ordering = ('-created_at',)
    
    # 自定义动作
    actions = ['mark_as_paid', 'mark_as_completed', 'mark_as_cancelled']
    
    def book_title(self, obj):
        """显示书籍标题"""
        return obj.book.title
    book_title.short_description = '书籍名称'
    
    def book_seller(self, obj):
        """显示卖家"""
        return obj.book.seller.nickname or obj.book.seller.username
    book_seller.short_description = '卖家'
    
    def mark_as_paid(self, request, queryset):
        """标记为已付款"""
        updated = queryset.filter(status='UNPAID').update(status='PAID')
        self.message_user(request, f'成功标记 {updated} 个订单为已付款')
    mark_as_paid.short_description = '标记为已付款'
    
    def mark_as_completed(self, request, queryset):
        """标记为已完成"""
        updated = queryset.exclude(status__in=['COMPLETED', 'CANCELLED', 'REFUNDED']).update(status='COMPLETED')
        self.message_user(request, f'成功标记 {updated} 个订单为已完成')
    mark_as_completed.short_description = '标记为已完成'
    
    def mark_as_cancelled(self, request, queryset):
        """标记为已取消"""
        updated = queryset.exclude(status__in=['COMPLETED', 'CANCELLED']).update(status='CANCELLED')
        self.message_user(request, f'成功标记 {updated} 个订单为已取消')
    mark_as_cancelled.short_description = '标记为已取消'
    
    # 自定义查询集优化
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        # 预加载相关对象，减少数据库查询
        return queryset.select_related('buyer', 'book', 'book__seller')
    
    # 根据用户权限过滤显示的订单
    def has_change_permission(self, request, obj=None):
        # 管理员可以修改所有订单
        if request.user.is_superuser:
            return True
        # 普通用户只能查看自己相关的订单
        if obj and hasattr(request.user, 'role'):
            return obj.buyer == request.user or obj.book.seller == request.user
        return super().has_change_permission(request, obj)
