from django.db import models
from django.conf import settings
from books.models import Book

# Create your models here.

class Collection(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='collections', verbose_name="用户")
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='collections', verbose_name="书籍")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="收藏时间")

    class Meta:
        verbose_name = "收藏"
        verbose_name_plural = verbose_name
        # 确保一个用户不能重复收藏同一本书
        unique_together = ('user', 'book')

    def __str__(self):
        return f"{self.user.username} 收藏了 {self.book.title}"
