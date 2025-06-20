from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # 显示在列表页的字段
    list_display = ('username', 'nickname', 'email', 'phone', 'student_id', 'campus', 'credit_score', 'role', 'is_active', 'date_joined')
    
    # 可以搜索的字段
    search_fields = ('username', 'nickname', 'email', 'phone', 'student_id')
    
    # 右侧筛选器
    list_filter = ('campus', 'role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    
    # 每页显示的记录数
    list_per_page = 20
    
    # 可以点击编辑的字段
    list_display_links = ('username', 'nickname')
    
    # 可以在列表页直接编辑的字段
    list_editable = ('is_active', 'role')
    
    # 详情页的字段布局
    fieldsets = (
        ('基本信息', {
            'fields': ('username', 'password', 'email', 'first_name', 'last_name')
        }),
        ('微信信息', {
            'fields': ('openid', 'nickname', 'avatar_url'),
            'classes': ('collapse',)  # 可折叠
        }),
        ('个人信息', {
            'fields': ('phone', 'student_id', 'campus', 'credit_score', 'completed_orders_count')
        }),
        ('权限设置', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_admin_user'),
            'classes': ('collapse',)
        }),
        ('重要时间', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    # 添加用户时的字段
    add_fieldsets = (
        ('基本信息', {
            'fields': ('username', 'password1', 'password2', 'email')
        }),
        ('个人信息', {
            'fields': ('nickname', 'phone', 'campus', 'role')
        }),
    )
    
    # 只读字段
    readonly_fields = ('date_joined', 'last_login', 'completed_orders_count')
    
    # 排序
    ordering = ('-date_joined',)
    
    # 自定义动作
    actions = ['make_active', 'make_inactive', 'reset_credit_score']
    
    def make_active(self, request, queryset):
        """激活用户"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'成功激活 {updated} 个用户')
    make_active.short_description = '激活选中的用户'
    
    def make_inactive(self, request, queryset):
        """禁用用户"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'成功禁用 {updated} 个用户')
    make_inactive.short_description = '禁用选中的用户'
    
    def reset_credit_score(self, request, queryset):
        """重置信用分"""
        updated = queryset.update(credit_score=100)
        self.message_user(request, f'成功重置 {updated} 个用户的信用分')
    reset_credit_score.short_description = '重置选中用户的信用分'
