from django.core.management.base import BaseCommand
from books.models import Category

class Command(BaseCommand):
    help = '初始化图书分类数据'

    def handle(self, *args, **kwargs):
        self.stdout.write('开始初始化图书分类...')
        
        for category_id, category_name in Category.CATEGORY_CHOICES:
            category, created = Category.objects.get_or_create(
                id=category_id,
                defaults={'name': category_name}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'创建分类: {category_name}'))
            else:
                self.stdout.write(f'分类已存在: {category_name}')
        
        self.stdout.write(self.style.SUCCESS('图书分类初始化完成！')) 