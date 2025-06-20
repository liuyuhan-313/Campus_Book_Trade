from django.contrib import admin
from .models import Book, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent')
    search_fields = ('name',)

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'seller', 'price', 'condition', 'is_sold', 'created_at')
    list_filter = ('condition', 'is_sold', 'category')
    search_fields = ('title', 'author', 'seller__username')
    readonly_fields = ('created_at', 'updated_at')

# Register your models here.
