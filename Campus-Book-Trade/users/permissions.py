from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    自定义权限，只允许对象的所有者编辑它
    """
    def has_object_permission(self, request, view, obj):
        # 读取权限允许任何请求
        if request.method in permissions.SAFE_METHODS:
            return True

        # 写入权限只允许对象的所有者
        return obj.id == request.user.id
    
class IsAuthenticatedOrLogin(permissions.BasePermission):
    """
    允许未认证用户访问登录接口，其他接口需要认证
    """
    def has_permission(self, request, view):
        # 登录接口允许所有人访问
        if view.action == 'login':
            return True
        # 其他接口需要认证
        return request.user and request.user.is_authenticated

class IsSelfOrAdmin(permissions.BasePermission):
    """
    只允许用户修改自己的信息，管理员可以修改所有用户信息
    """
    def has_object_permission(self, request, view, obj):
        # 管理员可以做任何操作
        if request.user.is_staff:
            return True
            
        # 普通用户只能修改自己的信息
        return obj.id == request.user.id

    def has_permission(self, request, view):
        # 未登录用户不能访问
        if not request.user.is_authenticated:
            return False
            
        # 登录用户可以访问
        return True

class IsVerifiedUser(permissions.BasePermission):
    """
    要求用户已完善信息
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # 检查用户是否已完善必要信息
        return bool(request.user.profile and 
                   request.user.profile.student_id and 
                   request.user.profile.phone)