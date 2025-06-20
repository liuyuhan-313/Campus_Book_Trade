from rest_framework import generics, permissions
from .models import Book, Category
from .serializers import BookSerializer, BookCreateSerializer, CategorySerializer
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import os
from datetime import datetime
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.utils import timezone
from django.db import connection

class BookListAPI(generics.ListAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # 禁用DRF的默认分页
    
    def options(self, request, *args, **kwargs):
        response = Response()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    
    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        response["Access-Control-Allow-Origin"] = "*"
        return response
    
    def get_queryset(self):
        print("[DEBUG] Received request headers:", self.request.headers)
        print("[DEBUG] Received query params:", self.request.query_params)
        
        # 获取查询参数
        keyword = self.request.query_params.get('keyword', None)
        campus = self.request.query_params.get('campus', None)
        category_id = self.request.query_params.get('category', None)
        condition = self.request.query_params.get('condition', None)
        price_range = self.request.query_params.get('priceRange', None)
        # 支持两种排序参数名称：sortBy 和 ordering
        sort_by = self.request.query_params.get('sortBy', None) or self.request.query_params.get('ordering', 'newest')
        
        # 处理ordering参数格式转换
        if sort_by == 'price':
            sort_by = 'price-asc'
        elif sort_by == '-price':
            sort_by = 'price-desc'
        elif sort_by == '-created_at':
            sort_by = 'newest'
        
        print("查询参数:", {
            "keyword": keyword,
            "campus": campus,
            "category_id": category_id,
            "condition": condition,
            "price_range": price_range,
            "sort_by": sort_by
        })
        
        # 使用SQL构建查询
        with connection.cursor() as cursor:
            base_sql = "SELECT * FROM books_book WHERE is_sold = 0"
            params = []
            
            # 关键词搜索（标题或作者）
            if keyword:
                base_sql += " AND (title LIKE %s OR author LIKE %s)"
                params.extend([f'%{keyword}%', f'%{keyword}%'])
            
            # 校区筛选
            if campus:
                base_sql += " AND campus = %s"
                params.append(campus)
            
            # 分类筛选
            if category_id:
                base_sql += " AND category_id = %s"
                params.append(category_id)
            
            # 成色筛选
            if condition:
                base_sql += " AND `condition` = %s"
                params.append(condition)
            
            # 价格区间筛选
            if price_range:
                try:
                    min_price, max_price = map(float, price_range.split('-'))
                    if max_price > 0:
                        base_sql += " AND price BETWEEN %s AND %s"
                        params.extend([min_price, max_price])
                    else:
                        base_sql += " AND price >= %s"
                        params.append(min_price)
                except (ValueError, AttributeError):
                    pass
            
            # 排序
            if sort_by == 'price-asc':
                base_sql += " ORDER BY price ASC"
            elif sort_by == 'price-desc':
                base_sql += " ORDER BY price DESC"
            else:  
                base_sql += " ORDER BY created_at DESC"
            
            print("[DEBUG] Final SQL:", base_sql)
            print("[DEBUG] SQL Params:", params)
            
            # 执行查询获取ID列表
            cursor.execute(base_sql, params)
            results = cursor.fetchall()
            book_ids = [row[0] for row in results]  # 假设第一列是id
            
            print("[DEBUG] SQL查询结果数:", len(book_ids))
            
            # 使用ORM获取Book对象，保持序列化器兼容性和SQL排序顺序
            if book_ids:
                ordering_case = []
                for i, book_id in enumerate(book_ids):
                    ordering_case.append(f"WHEN id={book_id} THEN {i}")
                
                if ordering_case:
                    ordering_sql = f"CASE {' '.join(ordering_case)} END"
                    queryset = Book.objects.filter(id__in=book_ids).extra(
                        select={'ordering': ordering_sql},
                        order_by=['ordering']
                    )
                else:
                    queryset = Book.objects.filter(id__in=book_ids)
            else:
                queryset = Book.objects.none()
            
            print("最终查询结果数:", queryset.count())
            return queryset

    def list(self, request, *args, **kwargs):
        try:
            print("[DEBUG] Processing list request")
            queryset = self.get_queryset()
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('pageSize', 10))
            
            start = (page - 1) * page_size
            end = start + page_size
            
            total = queryset.count()
            books = queryset[start:end]
            
            serializer = self.get_serializer(books, many=True)
            
            response_data = {
                'list': serializer.data,
                'total': total,
                'code': 0,
                'msg': 'success'
            }
            
            print("[DEBUG] Response data:", response_data)
            response = Response(response_data)
            response["Access-Control-Allow-Origin"] = "*"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            return response
            
        except Exception as e:
            print("[ERROR] 列表获取失败:", str(e))
            error_response = {
                'code': 500,
                'msg': '获取书籍列表失败',
                'error': str(e)
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BookDetailAPI(generics.RetrieveAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # 使用SQL查询所有书籍
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM books_book")
            book_ids = [row[0] for row in cursor.fetchall()]
            if book_ids:
                return Book.objects.filter(id__in=book_ids)
            else:
                return Book.objects.none()

class BookCreateAPI(generics.CreateAPIView):
    serializer_class = BookCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            print("[DEBUG] 收到的请求数据:", request.data)
            
            # 验证分类是否存在
            category_id = request.data.get('category')
            if category_id:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT id, name FROM books_category WHERE id = %s", [category_id])
                    category_row = cursor.fetchone()
                    if not category_row:
                        print(f"[ERROR] 分类不存在，ID: {category_id}")
                        return Response(
                            {
                                "code": 400,
                                "msg": f"分类ID {category_id} 不存在",
                                "error": "category_not_found"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    else:
                        print(f"[DEBUG] 找到分类: {category_row[1]}")
            
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print("[ERROR] 数据验证失败:", serializer.errors)
                return Response(
                    {
                        "code": 400,
                        "msg": "数据验证失败",
                        "error": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 创建书籍
            try:
                instance = serializer.save(seller=self.request.user)
                print("[DEBUG] 书籍创建成功:", {
                    "id": instance.id,
                    "title": instance.title,
                    "category": instance.category.name if instance.category else None,
                    "seller": instance.seller.username
                })
                return Response(
                    {
                        "code": 200,
                        "msg": "书籍创建成功",
                        "data": self.get_serializer(instance).data
                    },
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                print("[ERROR] 保存书籍时出错:", str(e))
                return Response(
                    {
                        "code": 500,
                        "msg": "保存书籍时出错",
                        "error": str(e)
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            print("[ERROR] 创建书籍时出错:", str(e))
            return Response(
                {
                    "code": 500,
                    "msg": "创建书籍时出错",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        instance = serializer.save(seller=self.request.user)
        print("[DEBUG] 书籍创建成功:", {
            "id": instance.id,
            "title": instance.title,
            "seller": instance.seller.username,
            "campus": instance.campus,
            "is_sold": instance.is_sold
        })

class CategoryListAPI(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None 
    
    def get_queryset(self):
        # 使用SQL查询分类
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM books_category ORDER BY id")
            category_ids = [row[0] for row in cursor.fetchall()]
            if category_ids:
                return Category.objects.filter(id__in=category_ids).order_by('id')
            else:
                return Category.objects.none()

from django.http import JsonResponse

def index(request):
    return JsonResponse({"message": "Welcome to the Books API"})

class BookUpdateAPI(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # 使用SQL查询用户的书籍
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM books_book WHERE seller_id = %s ORDER BY created_at DESC", [self.request.user.id])
            book_ids = [row[0] for row in cursor.fetchall()]
            if book_ids:
                return Book.objects.filter(id__in=book_ids).order_by('-created_at')
            else:
                return Book.objects.none()

    def perform_update(self, serializer):
        # 确保只有书籍的卖家才能更新
        if self.get_object().seller != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to update this book.")
        serializer.save()

    @action(detail=True, methods=['POST'])
    def update_status(self, request, pk=None):
        """
        更新书籍状态 - 使用原生SQL，增强错误处理
        """
        try:
            # 检查pk是否有效，并尝试转换为整数
            if not pk or pk == 'undefined' or pk == 'null' or pk == 'None':
                return Response({
                    'code': 400,
                    'msg': '书籍ID无效'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 尝试将pk转换为整数
            try:
                book_id = int(pk)
            except ValueError:
                return Response({
                    'code': 400,
                    'msg': '书籍ID格式无效，必须是数字'
                }, status=status.HTTP_400_BAD_REQUEST)

            new_status = request.data.get('status')
            
            if not new_status:
                return Response({
                    'code': 400,
                    'msg': '状态参数不能为空'
                }, status=status.HTTP_400_BAD_REQUEST)

            with connection.cursor() as cursor:
                # 使用SQL检查书籍是否存在和权限
                cursor.execute("""
                    SELECT id, seller_id, is_sold, title
                    FROM books_book 
                    WHERE id = %s
                """, [book_id])
                
                book_row = cursor.fetchone()
                if not book_row:
                    return Response({
                        'code': 404,
                        'msg': '书籍不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                db_book_id, seller_id, is_sold, title = book_row
                
                if new_status == 'sold_out':
                    pass
                elif seller_id != request.user.id:
                    # 其他状态变更只有卖家可以操作
                    return Response({
                        'code': 403,
                        'msg': '您没有权限更新此书籍状态'
                    }, status=status.HTTP_403_FORBIDDEN)

                # 更新书籍状态
                if new_status == 'sold_out':
                    new_is_sold = True
                elif new_status == 'on_sale':
                    new_is_sold = False
                else:
                    return Response({
                        'code': 400,
                        'msg': '无效的状态值'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # 使用SQL更新书籍状态
                cursor.execute("""
                    UPDATE books_book 
                    SET is_sold = %s, updated_at = %s
                    WHERE id = %s
                """, [new_is_sold, timezone.now(), book_id])

                # 获取更新后的书籍信息
                cursor.execute("""
                    SELECT b.*, u.username as seller_name
                    FROM books_book b
                    LEFT JOIN users u ON b.seller_id = u.id
                    WHERE b.id = %s
                """, [book_id])
                
                updated_book_row = cursor.fetchone()
                if updated_book_row:
                    columns = [col[0] for col in cursor.description]
                    book_data = dict(zip(columns, updated_book_row))
                    
                    # 转换datetime对象
                    if book_data.get('created_at'):
                        book_data['created_at'] = book_data['created_at'].isoformat()
                    if book_data.get('updated_at'):
                        book_data['updated_at'] = book_data['updated_at'].isoformat()

                    return Response({
                        'code': 0,
                        'msg': '更新成功',
                        'data': book_data
                    })

        except Exception as e:
            print(f"[ERROR] 更新书籍状态失败: {str(e)}")
            return Response({
                'code': 500,
                'msg': f'更新失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BookDeleteAPI(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # 使用SQL查询用户有权限删除的书籍
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM books_book WHERE seller_id = %s", [self.request.user.id])
            book_ids = [row[0] for row in cursor.fetchall()]
            if book_ids:
                return Book.objects.filter(id__in=book_ids)
            else:
                return Book.objects.none()

    def perform_destroy(self, instance):
        # 确保只有书籍的卖家才能删除
        if instance.seller != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete this book.")
        instance.delete()

class FileUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]  # 确保需要认证

    def options(self, request, *args, **kwargs):
        response = Response()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    def get(self, request):
        return Response({
            'message': '不支持GET方法，请使用POST方法上传文件'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def post(self, request):
        try:
            file = request.FILES.get('file')
            if not file:
                return Response({
                    'message': '没有文件被上传'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 检查文件类型
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']
            if file.content_type not in allowed_types:
                return Response({
                    'message': '不支持的文件类型'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 生成文件保存路径
            current_date = datetime.now().strftime('%Y%m%d')
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', current_date)
            
            # 确保目录存在
            os.makedirs(upload_dir, exist_ok=True)

            # 生成文件名
            filename = f"{datetime.now().strftime('%H%M%S')}_{file.name}"
            filepath = os.path.join(upload_dir, filename)

            # 保存文件
            with open(filepath, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

            # 生成文件URL
            file_url = f"{settings.MEDIA_URL}uploads/{current_date}/{filename}"

            response = Response({
                'message': '上传成功',
                'data': {
                    'url': file_url
                }
            })
            response["Access-Control-Allow-Origin"] = "*"
            return response

        except Exception as e:
            return Response({
                'message': '上传失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserPublishedBooksAPI(generics.ListAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        # 使用SQL查询用户发布的书籍
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM books_book WHERE seller_id = %s ORDER BY created_at DESC", [self.request.user.id])
            book_ids = [row[0] for row in cursor.fetchall()]
            if book_ids:
                return Book.objects.filter(id__in=book_ids).order_by('-created_at')
            else:
                return Book.objects.none()

    def list(self, request, *args, **kwargs):
        try:
            from order.models import Order
            
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            books_data = serializer.data
            
            # 为每本书添加退款状态信息
            for book_data in books_data:
                book_id = book_data['id']
                # 查找该书籍的退款中订单
                refunding_order = Order.objects.filter(
                    book_id=book_id,
                    status='REFUNDING'
                ).first()
                
                if refunding_order:
                    book_data['refund_status'] = True
                    book_data['order_id'] = refunding_order.id
                else:
                    book_data['refund_status'] = False
                    book_data['order_id'] = None
            
            response_data = {
                'code': 0,
                'msg': 'success',
                'books': books_data
            }
            return Response(response_data)
        except Exception as e:
            error_response = {
                'code': 500,
                'msg': '获取已发布图书列表失败',
                'error': str(e)
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
