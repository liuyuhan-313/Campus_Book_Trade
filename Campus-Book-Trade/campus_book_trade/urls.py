from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# 自定义admin站点信息
admin.site.site_header = settings.ADMIN_SITE_HEADER
admin.site.site_title = settings.ADMIN_SITE_TITLE
admin.site.index_title = settings.ADMIN_INDEX_TITLE

# 创建API根视图
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'message': 'Welcome to Campus Book Trade API',
        'version': '1.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    # API路由
    path('api/', include([
        # API根路径
        path('', api_root, name='api-root'),
        # 用户相关路由
        path('', include('users.urls')),
        # 图书相关路由
        path('', include('books.urls')),
        # 聊天相关路由（确保路由匹配前端的API配置）
        path('', include('chats.urls')),
        # 其他应用的路由...
        path('', include('order.urls')),
        path('', include('notifications.urls')),
        path('', include('user_collections.urls'))
    ])),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)



