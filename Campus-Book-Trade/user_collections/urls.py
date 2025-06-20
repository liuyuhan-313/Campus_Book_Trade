from django.urls import path
from . import views

urlpatterns = [
    path('collections/list/', views.CollectionListAPI.as_view(), name='collection-list'),  # 收藏列表
    path('collections/toggle/<int:book_id>/', views.CollectionToggleAPI.as_view(), name='collection-toggle'),  # 推荐风格
    path('toggle/<int:book_id>/', views.CollectionToggleAPI.as_view(), name='collection-toggle-compat'),  # 兼容老路径
]