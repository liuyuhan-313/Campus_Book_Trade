from django.db import models
from django.contrib.auth import get_user_model
from books.models import Book

User = get_user_model()

class Order(models.Model):
    # 订单状态选项
    ORDER_STATUS = (
        ('UNPAID', '待付款'),
        ('PAID', '待收货'),
        ('RECEIVED', '待评价'),
        ('REFUNDING', '退款中'),
        ('REFUNDED', '已退款'),
        ('COMPLETED', '已完成'),
        ('CANCELLED', '已取消'),
    )

    order_number = models.CharField(max_length=64, unique=True, verbose_name='订单编号')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='买家')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, verbose_name='书籍')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='订单金额')
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='UNPAID', verbose_name='订单状态')
    
    # 收货信息
    address = models.CharField(null=True, blank=True, max_length=255, verbose_name='收货地址')
    contact_name = models.CharField(max_length=50, verbose_name='联系人',default='未知联系人')
    contact_phone = models.CharField(max_length=20, verbose_name='联系电话',default='11111111111')
    
    # 评价信息
    rating = models.IntegerField(null=True, blank=True, verbose_name='评分')
    rating_comment = models.TextField(null=True, blank=True, verbose_name='评价内容')
    
    # 时间信息
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        ordering = ['-created_at']
        verbose_name = '订单'
        verbose_name_plural = '订单'

    def __str__(self):
        return self.order_number