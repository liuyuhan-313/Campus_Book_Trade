from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatViewSet,SystemMessageViewSet

router = DefaultRouter()
router.register(r'chats', ChatViewSet, basename='chat')
router.register(r'system-messages', SystemMessageViewSet, basename='system-messages')  

urlpatterns = [
    path('', include(router.urls)),
]