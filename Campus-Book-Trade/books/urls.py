from django.urls import path
from .views import (
    BookListAPI, BookDetailAPI, BookCreateAPI, CategoryListAPI, 
    BookUpdateAPI, BookDeleteAPI, UserPublishedBooksAPI
)
from . import views

urlpatterns = [
    path('books/', BookListAPI.as_view(), name='book-list'),               # 对应 API.list
    path('books/detail/<int:pk>/', BookDetailAPI.as_view(), name='book-detail'),  # 对应 API.detail
    path('books/publish/', BookCreateAPI.as_view(), name='book-create'),    # 对应 API.publish
    path('books/update/<int:pk>/', BookUpdateAPI.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}), name='book-update'),  # 对应 API.update
    path('books/<str:pk>/update_status/', BookUpdateAPI.as_view({'post': 'update_status'}), name='book-update-status'),  # 修改为str:pk以接受undefined
    path('books/delete/<int:pk>/', BookDeleteAPI.as_view(), name='book-delete'),  # 对应 API.delete
    path('books/my-published/', UserPublishedBooksAPI.as_view(), name='user-published-books'),  # 获取用户发布的图书
    path('categories/', CategoryListAPI.as_view(), name='category-list'),   # 对应 API.categories
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),  
    path('', views.index, name='index'),  # 确保有默认的视图函数处理根URL
]