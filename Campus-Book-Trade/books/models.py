from django.db import models
from django.conf import settings
from django.urls import reverse
import json

class Category(models.Model):
    CATEGORY_CHOICES = [
        (1, '教材教辅'),
        (2, '文学小说'),
        (3, '计算机与互联网'),
        (4, '经管励志'),
        (5, '考研资料'),
        (6, '外语学习'),
        (7, '科学技术'),
        (8, '其他'),
    ]
    
    id = models.IntegerField(primary_key=True, choices=CATEGORY_CHOICES, verbose_name="分类ID")
    name = models.CharField(max_length=100, verbose_name="分类名称")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name="父分类")

    def save(self, *args, **kwargs):
        # 自动设置name为对应的分类名称
        self.name = dict(self.CATEGORY_CHOICES)[self.id]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "书籍分类"
        verbose_name_plural = verbose_name

class Book(models.Model):
    CONDITION_CHOICES = (
        ('new', '全新'),
        ('like_new', '几乎全新'),
        ('good', '有轻微使用痕迹'),
        ('fair', '有明显使用痕迹'),
        ('poor', '破损严重'),
    )
    CAMPUS_CHOICES = [
        ('handan', '邯郸校区'),
        ('fenglin', '枫林校区'),
        ('jiangwan', '江湾校区'),
        ('zhangjiang', '张江校区'),
    ]
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='books', verbose_name="卖家")
    title = models.CharField(max_length=200, verbose_name="书名")
    author = models.CharField(max_length=100, verbose_name="作者")
    publisher = models.CharField(max_length=100, verbose_name="出版社", blank=True, null=True)
    isbn = models.CharField(max_length=20, verbose_name="ISBN", blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, verbose_name="分类")
    description = models.TextField(verbose_name="详细描述")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="价格")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good', verbose_name="成色")
    campus = models.CharField(max_length=20, choices=CAMPUS_CHOICES, verbose_name="校区")
    cover_image = models.TextField(verbose_name="封面图片URL", blank=True, null=True)  # 修改为TextField
    image_urls = models.TextField(verbose_name="图片URL列表", blank=True, default='[]')  # 存储为JSON字符串
    is_sold = models.BooleanField(default=False, verbose_name="是否已售出")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    def __str__(self):
        return f"{self.title} - {self.seller.username}"

    def get_absolute_url(self):
        return reverse('books:book_detail', args=[self.id])

    def get_image_urls(self):
        try:
            return json.loads(self.image_urls)
        except:
            return []

    def set_image_urls(self, urls):
        self.image_urls = json.dumps(urls)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "书籍"
        verbose_name_plural = "书籍"

