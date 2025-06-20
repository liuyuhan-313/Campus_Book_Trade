from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import requests
import logging
import os
from django.contrib.auth import authenticate
from django.db import connection
from django.utils import timezone
import jwt

from .models import User
from .serializers import UserSerializer
from .permissions import IsOwnerOrReadOnly
from django.contrib.auth.hashers import make_password  # 添加这行导入

# 设置日志
logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    
    def get_queryset(self):
        # 使用原生SQL查询用户
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE is_active = 1")
            user_ids = [row[0] for row in cursor.fetchall()]
            if user_ids:
                return User.objects.filter(id__in=user_ids)
            else:
                return User.objects.none()
    
    def get_permissions(self):
        """
        根据不同的action设置不同的权限
        """
        if self.action in ['login', 'create']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def login(self, request):
        """
        微信小程序登录
        """
        # 打印接收到的数据，用于调试
        logger.info(f"收到登录请求数据: {request.data}")

        code = request.data.get('code')
        user_info = request.data.get('userInfo', {})

        if not code:
            return Response({
                'message': '缺少code参数'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 请求微信API获取openid
            wx_api_url = 'https://api.weixin.qq.com/sns/jscode2session'
            params = {
                'appid': settings.WX_APPID,
                'secret': settings.WX_SECRET,
                'js_code': code,
                'grant_type': 'authorization_code'
            }
            
            logger.info(f"请求微信API，参数: {{'appid': {params['appid']}, 'js_code': {code}}}")
            
            response = requests.get(wx_api_url, params=params)
            wx_data = response.json()
            
            logger.info(f"微信返回数据: {wx_data}")

            if 'errcode' in wx_data:
                logger.error(f"微信登录失败: {wx_data}")
                return Response({
                    'message': '微信登录失败',
                    'error': wx_data.get('errmsg', '未知错误')
                }, status=status.HTTP_400_BAD_REQUEST)

            openid = wx_data.get('openid')
            if not openid:
                logger.error("微信返回数据中没有openid")
                return Response({
                    'message': '获取openid失败'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 获取或创建用户
            with connection.cursor() as cursor:
                # 先查询用户是否存在
                cursor.execute("SELECT id, nickname, avatar_url FROM users WHERE openid = %s", [openid])
                user_row = cursor.fetchone()
                
                if user_row:
                    # 用户已存在
                    user = User.objects.get(id=user_row[0])
                    created = False
                    
                    # 如果有新的用户信息，则更新
                    if user_info:
                        new_nickname = user_info.get('nickName', user.nickname)
                        new_avatar_url = user_info.get('avatarUrl', user.avatar_url)
                        
                        cursor.execute("""
                            UPDATE users 
                            SET nickname = %s, avatar_url = %s 
                            WHERE id = %s
                        """, [new_nickname, new_avatar_url, user.id])
                        
                        # 更新本地对象
                        user.nickname = new_nickname
                        user.avatar_url = new_avatar_url
                else:
                    # 创建新用户
                    # 为微信用户生成一个随机密码
                    default_password = make_password(openid[:20] + 'wx_default')
                    
                    cursor.execute("""
                        INSERT INTO users (openid, username, nickname, avatar_url, password, is_active, date_joined)
                        VALUES (%s, %s, %s, %s, %s, 1, %s)
                    """, [
                        openid, 
                        openid[:20], 
                        user_info.get('nickName', ''),
                        user_info.get('avatarUrl', ''),
                        default_password,
                        timezone.now()
                    ])
                    
                    user_id = cursor.lastrowid
                    user = User.objects.get(id=user_id)
                    created = True

            # 生成token
            refresh = RefreshToken.for_user(user)
            
            response_data = {
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'nickname': user.nickname,
                    'avatar_url': user.avatar_url,
                    'openid': user.openid,
                }
            }
            
            logger.info(f"用户 {user.id} 登录成功")
            return Response(response_data)

        except requests.exceptions.RequestException as e:
            logger.error(f"请求微信API失败: {str(e)}")
            return Response({
                'message': '网络请求失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"登录过程出现异常: {str(e)}")
            return Response({
                'message': '服务器错误',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'])
    def info(self, request):
        """
        获取当前用户信息
        """
        try:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"获取用户信息失败: {str(e)}")
            return Response({
                'message': '获取用户信息失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['PUT', 'PATCH'])
    def update_profile(self, request):
        """更新用户信息"""
        try:
            user = request.user
            data = request.data
            
            # 构建更新字段和值
            update_fields = []
            update_values = []
            
            if 'nickname' in data:
                update_fields.append('nickname = %s')
                update_values.append(data['nickname'])
                user.nickname = data['nickname']
            if 'phone' in data:
                update_fields.append('phone = %s')
                update_values.append(data['phone'])
                user.phone = data['phone']
            if 'student_id' in data:
                update_fields.append('student_id = %s')
                update_values.append(data['student_id'])
                user.student_id = data['student_id']
            if 'campus' in data:
                update_fields.append('campus = %s')
                update_values.append(data['campus'])
                user.campus = data['campus']
            
            # 使用SQL更新
            if update_fields:
                with connection.cursor() as cursor:
                    sql = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
                    update_values.append(user.id)
                    cursor.execute(sql, update_values)
            
            serializer = self.get_serializer(user)
            return Response({
                'message': '更新成功',
                'user': serializer.data
            })
        except Exception as e:
            return Response({
                'message': '更新用户信息失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    @action(detail=False, methods=['POST'])
    def avatar_upload(self, request):
        """上传头像"""
        try:
            # 记录请求信息
            logger.info(f"收到头像上传请求，用户ID: {request.user.id if request.user else 'Anonymous'}")
            logger.info(f"请求头: {request.headers}")
            
            if 'avatar' not in request.FILES:
                return Response({
                    'message': '请选择要上传的头像'
                }, status=status.HTTP_400_BAD_REQUEST)

            avatar_file = request.FILES['avatar']
            
            # 验证文件类型
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']
            if avatar_file.content_type not in allowed_types:
                return Response({
                    'message': '不支持的文件类型'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 验证文件大小（例如限制为2MB）
            if avatar_file.size > 2 * 1024 * 1024:
                return Response({
                    'message': '文件大小不能超过2MB'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 生成文件名
            ext = os.path.splitext(avatar_file.name)[1]
            filename = f'avatar_{request.user.id}{ext}'
            
            # 确保头像存储目录存在
            avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
            os.makedirs(avatar_dir, exist_ok=True)
            
            # 完整的文件路径
            filepath = os.path.join(avatar_dir, filename)
            
            # 保存文件
            with open(filepath, 'wb+') as destination:
                for chunk in avatar_file.chunks():
                    destination.write(chunk)
            
            # 更新用户头像URL
            relative_path = os.path.join('avatars', filename)
            avatar_url = f"{settings.MEDIA_URL}{relative_path}"
            
            # 使用SQL更新用户头像
            with connection.cursor() as cursor:
                cursor.execute("UPDATE users SET avatar_url = %s WHERE id = %s", [avatar_url, request.user.id])
            
            # 更新本地对象
            request.user.avatar_url = avatar_url
            
            logger.info(f"头像上传成功，用户ID: {request.user.id}, 文件路径: {filepath}")

            return Response({
                'message': '头像上传成功',
                'avatar_url': avatar_url
            })
            
        except Exception as e:
            logger.error(f"头像上传失败，用户ID: {request.user.id if request.user else 'Anonymous'}, 错误: {str(e)}")
            return Response({
                'message': '上传头像失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        """
        注册新用户
        """
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': '注册成功',
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': serializer.data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"注册用户失败: {str(e)}")
            return Response({
                'message': '注册失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
    
    @action(detail=False, methods=['POST'])
    def switch_test_account(self, request):
        """切换到测试账号"""
        try:
            # 获取当前用户的ID，用于确保测试账号和主账号不同
            current_user_id = request.user.id
            
        
            # 使用SQL查找现有的测试账号
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, username, nickname, openid 
                    FROM users 
                    WHERE is_test_account = 1 AND username LIKE 'test_user_%'
                    LIMIT 1
                """)
                
                test_account_row = cursor.fetchone()
                
                if test_account_row and test_account_row[0] != current_user_id:
                    # 使用已存在的测试账号
                    test_account = User.objects.get(id=test_account_row[0])
                else:
                    # 创建新的测试账号
                    import random
                    import string
                    random_suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
                    
                    cursor.execute("""
                        INSERT INTO users 
                        (username, nickname, is_test_account, openid, password, is_active, date_joined)
                        VALUES (%s, %s, 1, %s, %s, 1, %s)
                    """, [
                        f'test_user_{random_suffix}',
                        f'测试账号_{random_suffix}',
                        f'test_openid_{random_suffix}',
                        make_password('testpassword'),
                        timezone.now()
                    ])
                    
                    test_account_id = cursor.lastrowid
                    test_account = User.objects.get(id=test_account_id)
        
            # 生成token
            refresh = RefreshToken.for_user(test_account)
        
            logger.info(f"切换测试账号 - 主账号ID: {current_user_id}, 测试账号ID: {test_account.id}")
        
            return Response({
                'token': str(refresh.access_token),
                'user': {
                    'id': test_account.id,
                    'nickname': test_account.nickname,
                    'avatar_url': test_account.avatar_url,
                    'is_test_account': True
                }
            })
        except Exception as e:
            return Response({
                'message': '切换测试账号失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[])
    def wx_login(self, request):
        """微信小程序登录"""
        code = request.data.get('code')
        
        if not code:
            return Response({
                'code': 400,
                'msg': '缺少code参数'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 这里应该调用微信API获取openid
        # 为了演示，我们假设code就是openid
        openid = f'wx_{code}'
        
        try:
            # 使用SQL查找或创建用户
            with connection.cursor() as cursor:
                # 先查询用户是否存在
                cursor.execute("SELECT id, username, nickname, avatar_url, credit_score, completed_orders_count FROM users WHERE openid = %s", [openid])
                user_row = cursor.fetchone()
                
                if user_row:
                    # 用户已存在
                    user = User.objects.get(id=user_row[0])
                    created = False
                else:
                    # 创建新用户
                    default_password = make_password(openid + 'wx_default')
                    
                    cursor.execute("""
                        INSERT INTO users (openid, username, nickname, password, is_active, date_joined)
                        VALUES (%s, %s, %s, %s, 1, %s)
                    """, [
                        openid,
                        openid,
                        f'用户{openid[-6:]}',
                        default_password,
                        timezone.now()
                    ])
                    
                    user_id = cursor.lastrowid
                    user = User.objects.get(id=user_id)
                    created = True
            
            # 生成JWT token
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'code': 0,
                'msg': '登录成功',
                'data': {
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user_info': {
                        'id': user.id,
                        'username': user.username,
                        'nickname': user.nickname,
                        'avatar_url': user.avatar_url,
                        'credit_score': user.credit_score,
                        'credit_level': user.get_credit_level(),
                        'completed_orders_count': user.completed_orders_count
                    }
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'msg': f'登录失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def profile(self, request):
        """获取用户信息"""
        user = request.user
        
        return Response({
            'code': 0,
            'msg': '获取成功',
            'data': {
                'id': user.id,
                'username': user.username,
                'nickname': user.nickname,
                'avatar_url': user.avatar_url,
                'email': user.email,
                'credit_score': user.credit_score,
                'credit_level': user.get_credit_level(),
                'completed_orders_count': user.completed_orders_count,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None
            }
        })

    @action(detail=False, methods=['post'])
    def update_profile(self, request):
        """更新用户信息"""
        user = request.user
        
        # 可更新的字段
        updatable_fields = ['nickname', 'email', 'avatar_url']
        updated_fields = []
        update_values = []
        
        for field in updatable_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
                updated_fields.append(f'{field} = %s')
                update_values.append(request.data[field])
        
        if updated_fields:
            with connection.cursor() as cursor:
                sql = f"UPDATE users SET {', '.join(updated_fields)} WHERE id = %s"
                update_values.append(user.id)
                cursor.execute(sql, update_values)
        
        return Response({
            'code': 0,
            'msg': '更新成功',
            'data': {
                'id': user.id,
                'username': user.username,
                'nickname': user.nickname,
                'avatar_url': user.avatar_url,
                'email': user.email
            }
        })

    @action(detail=False, methods=['get'])
    def credit_info(self, request):
        """获取用户信用分详细信息"""
        user = request.user
        
        try:
            with connection.cursor() as cursor:
                # 获取用户的订单统计
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_orders,
                        COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_orders,
                        AVG(CASE WHEN o.status = 'COMPLETED' AND o.rating IS NOT NULL THEN o.rating END) as avg_rating,
                        COUNT(CASE WHEN o.status = 'COMPLETED' AND o.rating IS NOT NULL THEN 1 END) as rated_orders
                    FROM order_order o
                    JOIN books_book b ON o.book_id = b.id
                    WHERE b.seller_id = %s
                """, [user.id])
                
                stats = cursor.fetchone()
                
                # 获取最近的信用分变化记录
                cursor.execute("""
                    SELECT 
                        old_credit_score,
                        new_credit_score,
                        rating,
                        avg_rating,
                        calculation_time
                    FROM credit_calculation_log
                    WHERE user_id = %s
                    ORDER BY calculation_time DESC
                    LIMIT 10
                """, [user.id])
                
                recent_changes = []
                for row in cursor.fetchall():
                    recent_changes.append({
                        'old_score': row[0],
                        'new_score': row[1],
                        'rating': row[2],
                        'avg_rating': float(row[3]) if row[3] else None,
                        'time': row[4].isoformat() if row[4] else None
                    })
                
                return Response({
                    'code': 0,
                    'msg': '获取成功',
                    'data': {
                        'current_score': user.credit_score,
                        'credit_level': user.get_credit_level(),
                        'completed_orders_count': user.completed_orders_count,
                        'statistics': {
                            'total_orders': stats[0] or 0,
                            'completed_orders': stats[1] or 0,
                            'avg_rating': float(stats[2]) if stats[2] else None,
                            'rated_orders': stats[3] or 0
                        },
                        'recent_changes': recent_changes,
                        'score_explanation': {
                            'calculation_rule': '信用分基于完成的订单评分自动计算',
                            'minimum_orders': 3,
                            'score_ranges': {
                                '优秀': '90-100分',
                                '良好': '80-89分',
                                '中等': '70-79分',
                                '及格': '60-69分',
                                '待改善': '0-59分'
                            }
                        }
                    }
                })
                
        except Exception as e:
            return Response({
                'code': 500,
                'msg': f'获取失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def recalculate_credit(self, request):
        """重新计算用户信用分（仅管理员可用）"""
        if not request.user.is_staff:
            return Response({
                'code': 403,
                'msg': '权限不足'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        if not user_id:
            user_id = request.user.id
        
        try:
            # 使用SQL查询用户
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, username, credit_score FROM users WHERE id = %s", [user_id])
                user_row = cursor.fetchone()
                
                if not user_row:
                    return Response({
                        'code': 404,
                        'msg': '用户不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                user = User.objects.get(id=user_row[0])
                old_score = user_row[2]
                
                # 调用重新计算方法
                user.recalculate_credit_score()
            
            return Response({
                'code': 0,
                'msg': '重新计算成功',
                'data': {
                    'user_id': user.id,
                    'username': user.username,
                    'old_score': old_score,
                    'new_score': user.credit_score,
                    'credit_level': user.get_credit_level()
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'msg': f'重新计算失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def credit_statistics(self, request):
        """获取平台信用分统计信息（仅管理员可用）"""
        if not request.user.is_staff:
            return Response({
                'code': 403,
                'msg': '权限不足'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            stats = User.get_credit_statistics()
            
            # 计算总体统计
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_users,
                        AVG(credit_score) as avg_score,
                        MIN(credit_score) as min_score,
                        MAX(credit_score) as max_score,
                        COUNT(CASE WHEN completed_orders_count >= 3 THEN 1 END) as active_sellers
                    FROM users 
                    WHERE is_active = 1
                """)
                
                overall = cursor.fetchone()
                
                return Response({
                    'code': 0,
                    'msg': '获取成功',
                    'data': {
                        'overall_statistics': {
                            'total_users': overall[0],
                            'average_score': round(float(overall[1]), 2) if overall[1] else 0,
                            'min_score': overall[2],
                            'max_score': overall[3],
                            'active_sellers': overall[4]
                        },
                        'level_distribution': stats
                    }
                })
                
        except Exception as e:
            return Response({
                'code': 500,
                'msg': f'获取统计失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
