from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    # 不需要认证的接口
    path('user/login/', UserViewSet.as_view({
        'post': 'login'
    }), name='user-login'),
    
    path('users/switch-test-account/', UserViewSet.as_view({
    'post': 'switch_test_account'
}), name='switch-test-account'),
    # 需要认证的接口
    path('users/info/', UserViewSet.as_view({
        'get': 'info',
    }), name='user-info'),
    
    path('users/update/', UserViewSet.as_view({
        'put': 'update_profile',
        'patch': 'update_profile'
    }), name='user-update'),
    
    path('users/avatar/upload/', UserViewSet.as_view({
        'post': 'avatar_upload'
    }), name='user-avatar-upload'),
    
    # 包含路由器生成的URL
    path('', include(router.urls)),
]