from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import connection
import uuid
import json
from datetime import datetime

from .models import Order
from .serializers import OrderSerializer
from books.models import Book

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 获取当前用户的订单
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT o.*, b.title, b.price, b.seller_id, u.username as seller_name
                FROM order_order o
                LEFT JOIN books_book b ON o.book_id = b.id
                LEFT JOIN users u ON b.seller_id = u.id
                WHERE o.buyer_id = %s
                ORDER BY o.created_at DESC
            """, [self.request.user.id])
            
            columns = [col[0] for col in cursor.description]
            results = cursor.fetchall()
            
            # 将查询结果转换为Order对象列表，保持与Django ORM兼容
            orders = []
            for row in results:
                order_data = dict(zip(columns, row))
                try:
                    order = Order.objects.get(id=order_data['id'])
                    orders.append(order)
                except Order.DoesNotExist:
                    continue
            
            return orders

    def create(self, request):
        try:
            # 确保用户已认证
            if not request.user.is_authenticated:
                return Response(
                    {'code': 401, 'msg': '用户未登录或登录已过期'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # 生成订单号
            order_number = str(uuid.uuid4().hex)[:10]
            
            data = request.data.copy()
            data['order_number'] = order_number
            data['status'] = 'UNPAID'

            print("准备创建订单的数据:", data)

            # 检查书籍是否已售出
            book_id = data.get('book')
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, is_sold, title, price 
                    FROM books_book 
                    WHERE id = %s
                """, [book_id])
                
                book_row = cursor.fetchone()
                if not book_row:
                    return Response({
                        'code': 404,
                        'msg': '书籍不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                if book_row[1]:  # is_sold
                    return Response({
                        'code': 400,
                        'msg': '该书籍已售出'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # 数据验证
            amount = data.get('amount')
            address = data.get('address')
            contact_name = data.get('contact_name')
            contact_phone = data.get('contact_phone')

            if not all([book_id, amount, address, contact_name, contact_phone]):
                return Response({
                    'code': 400,
                    'msg': '必要字段不能为空'
                }, status=status.HTTP_400_BAD_REQUEST)

            if float(amount) <= 0:
                return Response({
                    'code': 400,
                    'msg': '订单金额必须大于0'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 使用原生SQL创建订单
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO order_order 
                    (order_number, buyer_id, book_id, amount, status, address, 
                     contact_name, contact_phone, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 'UNPAID', %s, %s, %s, %s, %s)
                """, [
                    order_number, request.user.id, book_id, amount,
                    address, contact_name, contact_phone,
                    timezone.now(), timezone.now()
                ])
                
                order_id = cursor.lastrowid
                
                # 获取创建的订单详情
                cursor.execute("""
                    SELECT o.*, b.title, b.price, u.username as seller_name
                    FROM order_order o
                    LEFT JOIN books_book b ON o.book_id = b.id
                    LEFT JOIN users u ON b.seller_id = u.id
                    WHERE o.id = %s
                """, [order_id])
                
                order_row = cursor.fetchone()
                if order_row:
                    columns = [col[0] for col in cursor.description]
                    order_data = dict(zip(columns, order_row))
                    
                    # 转换datetime对象为字符串
                    if order_data['created_at']:
                        order_data['created_at'] = order_data['created_at'].isoformat()
                    if order_data['updated_at']:
                        order_data['updated_at'] = order_data['updated_at'].isoformat()
                    
                    # 确保返回book字段，与前端期望的字段名一致
                    order_data['book'] = order_data['book_id']
            
            print("订单创建成功:", order_data)
            return Response({
                'code': 0,
                'msg': '创建成功',
                'data': order_data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print("订单创建失败:", str(e))
            return Response({
                'code': 500,
                'msg': '创建订单失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        try:
            with connection.cursor() as cursor:
                # 检查订单状态并更新
                cursor.execute("""
                    SELECT status FROM order_order 
                    WHERE id = %s AND buyer_id = %s
                """, [pk, request.user.id])
                
                order_row = cursor.fetchone()
                if not order_row:
                    return Response({'message': '订单不存在'}, status=status.HTTP_404_NOT_FOUND)
                
                if order_row[0] == 'UNPAID':
                    cursor.execute("""
                        UPDATE order_order 
                        SET status = 'CANCELLED', updated_at = %s 
                        WHERE id = %s
                    """, [timezone.now(), pk])
                    
                    return Response({'message': '订单已取消'})
                else:
                    return Response({'message': '当前状态无法取消订单'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': f'取消订单失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        try:
            with connection.cursor() as cursor:
                # 检查订单状态并更新
                cursor.execute("""
                    SELECT status FROM order_order 
                    WHERE id = %s AND buyer_id = %s
                """, [pk, request.user.id])
                
                order_row = cursor.fetchone()
                if not order_row:
                    return Response({'message': '订单不存在'}, status=status.HTTP_404_NOT_FOUND)
                
                if order_row[0] == 'PAID':
                    cursor.execute("""
                        UPDATE order_order 
                        SET status = 'RECEIVED', updated_at = %s 
                        WHERE id = %s
                    """, [timezone.now(), pk])
                    
                    return Response({'message': '确认收货成功'})
                else:
                    return Response({'message': '当前状态无法确认收货'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': f'确认收货失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        try:
            rating = request.data.get('rating')
            comment = request.data.get('comment')
            
            if not rating or not (1 <= int(rating) <= 5):
                return Response({'message': '请提供有效的评分(1-5)'}, status=status.HTTP_400_BAD_REQUEST)

            with connection.cursor() as cursor:
                # 检查订单状态并更新评价
                cursor.execute("""
                    SELECT status, book_id FROM order_order 
                    WHERE id = %s AND buyer_id = %s
                """, [pk, request.user.id])
                
                order_row = cursor.fetchone()
                if not order_row:
                    return Response({'message': '订单不存在'}, status=status.HTTP_404_NOT_FOUND)
                
                if order_row[0] == 'RECEIVED':
                    # 更新订单评价和状态
                    cursor.execute("""
                        UPDATE order_order 
                        SET rating = %s, rating_comment = %s, status = 'COMPLETED', updated_at = %s 
                        WHERE id = %s
                    """, [rating, comment, timezone.now(), pk])
                    
                    # 注意：MySQL触发器会自动计算和更新卖家的信用分
                    # 无需在Python代码中手动计算
                    
                    return Response({'message': '评价成功'})
                else:
                    return Response({'message': '当前状态无法评价'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': f'评价失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def list_by_status(self, request):
        try:
            # 获取查询参数
            status_param = request.query_params.get('status', '')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))

            print("[DEBUG] 获取订单列表参数:", {
                'status': status_param,
                'page': page,
                'page_size': page_size
            })

            # 使用原生SQL查询订单列表
            with connection.cursor() as cursor:
                # 构建查询条件
                where_clause = "WHERE o.buyer_id = %s"
                params = [request.user.id]
                
                if status_param:
                    where_clause += " AND o.status = %s"
                    params.append(status_param)

                # 查询总数
                count_sql = f"""
                    SELECT COUNT(*) 
                    FROM order_order o 
                    {where_clause}
                """
                cursor.execute(count_sql, params)
                total = cursor.fetchone()[0]

                # 分页查询订单详情
                offset = (page - 1) * page_size
                list_sql = f"""
                    SELECT o.*, b.title, b.description, b.price, b.cover_image,
                           u.username as seller_name, u.avatar_url as seller_avatar
                    FROM order_order o
                    LEFT JOIN books_book b ON o.book_id = b.id
                    LEFT JOIN users u ON b.seller_id = u.id
                    {where_clause}
                    ORDER BY o.created_at DESC
                    LIMIT %s OFFSET %s
                """
                params.extend([page_size, offset])
                cursor.execute(list_sql, params)
                
                columns = [col[0] for col in cursor.description]
                orders = []
                
                for row in cursor.fetchall():
                    order_data = dict(zip(columns, row))
                    
                    # 处理datetime字段
                    if order_data['created_at']:
                        order_data['created_at'] = order_data['created_at'].isoformat()
                    if order_data['updated_at']:
                        order_data['updated_at'] = order_data['updated_at'].isoformat()
                    
                    # 构建书籍详情
                    order_data['book_detail'] = {
                        'id': order_data['book_id'],
                        'title': order_data['title'],
                        'description': order_data['description'],
                        'price': str(order_data['price']) if order_data['price'] else '0.00',
                        'cover_image': order_data['cover_image'],
                        'image_url': order_data['cover_image'],  # 为了兼容性保留这个字段
                        'seller': {
                            'username': order_data['seller_name'],
                            'avatar': order_data['seller_avatar']
                        }
                    }
                    
                    orders.append(order_data)
            
            # 使用原生SQL查询结果替代serializer
            serializer_data = orders
            
            print("[DEBUG] 返回订单列表:", {
                'count': len(serializer_data),
                'total': total,
                'page': page
            })
            
            # 返回带有分页信息的响应
            return Response({
                'code': 0,
                'msg': 'success',
                'list': serializer_data,
                'total': total,
                'page': page,
                'page_size': page_size
            })
        except Exception as e:
            print("[ERROR] 获取订单列表失败:", str(e))
            return Response({
                'code': 500,
                'msg': '获取订单列表失败',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['POST'])
    def update_status(self, request, pk=None):
        """
        更新订单状态
        """
        try:
            new_status = request.data.get('status')
            
            if not new_status:
                return Response({
                    'code': 400,
                    'msg': '状态参数不能为空'
                }, status=status.HTTP_400_BAD_REQUEST)

            with connection.cursor() as cursor:
                # 获取当前订单信息
                cursor.execute("""
                    SELECT o.status, o.book_id, b.seller_id, b.title
                    FROM order_order o
                    LEFT JOIN books_book b ON o.book_id = b.id
                    WHERE o.id = %s AND o.buyer_id = %s
                """, [pk, request.user.id])
                
                order_row = cursor.fetchone()
                if not order_row:
                    return Response({
                        'code': 404,
                        'msg': '订单不存在'
                    }, status=status.HTTP_404_NOT_FOUND)

                current_status = order_row[0]
                book_id = order_row[1]
                seller_id = order_row[2]
                book_title = order_row[3]

                # 验证状态转换的合法性
                valid_status = {
                    'UNPAID': ['PAID', 'CANCELLED'],
                    'PAID': ['RECEIVED', 'REFUNDING'],
                    'RECEIVED': ['COMPLETED'],
                    'REFUNDING': ['REFUNDED', 'PAID'],
                    'REFUNDED': [],
                    'COMPLETED': [],
                    'CANCELLED': []
                }

                if new_status not in valid_status.get(current_status, []):
                    return Response({
                        'code': 400,
                        'msg': '非法的状态转换'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # 如果是完成状态，需要处理评分和评价
                if new_status == 'COMPLETED':
                    rating = request.data.get('rating')
                    comment = request.data.get('comment')
                    
                    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
                        return Response({
                            'code': 400,
                            'msg': '评分必须是1-5之间的整数'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    print(f"[INFO] 开始处理订单评价 - 订单ID: {pk}")
                    print(f"[INFO] 评分: {rating}, 评价: {comment}")
                    
                    # 更新订单评分、评价和状态
                    # 注意：MySQL触发器会自动计算和更新卖家的信用分
                    cursor.execute("""
                        UPDATE order_order 
                        SET rating = %s, rating_comment = %s, status = %s, updated_at = %s
                        WHERE id = %s
                    """, [rating, comment, new_status, timezone.now(), pk])
                    
                    print(f"[INFO] 订单状态已更新为COMPLETED，触发器将自动计算信用分")
                else:
                    # 普通状态更新
                    cursor.execute("""
                        UPDATE order_order 
                        SET status = %s, updated_at = %s
                        WHERE id = %s
                    """, [new_status, timezone.now(), pk])

                # 特殊处理：当订单状态更新为PAID时，自动将书籍标记为已售出
                if new_status == 'PAID':
                    cursor.execute("""
                        UPDATE books_book 
                        SET is_sold = TRUE, updated_at = %s
                        WHERE id = %s
                    """, [timezone.now(), book_id])
                    print(f"[DEBUG] 订单支付成功，自动更新书籍 {book_id} 为已售出状态")

                # 发送系统通知
                if new_status == 'PAID':
                    # 支付成功，给卖家发送通知
                    cursor.execute("""
                        SELECT o.order_number, b.title, b.seller_id
                        FROM order_order o
                        LEFT JOIN books_book b ON o.book_id = b.id
                        WHERE o.id = %s
                    """, [pk])
                    
                    order_info = cursor.fetchone()
                    if order_info:
                        order_number, book_title, seller_id = order_info
                        cursor.execute("""
                            INSERT INTO chats_systemmessage 
                            (user_id, title, content, type, created_at, is_read)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, [
                            seller_id,
                            '商品已售出',
                            f'您的商品《{book_title}》已售出，订单号：{order_number}',
                            'order',
                            timezone.now(),
                            False
                        ])

                # 获取更新后的订单详情
                cursor.execute("""
                    SELECT o.*, b.title, b.price, u.username as seller_name
                    FROM order_order o
                    LEFT JOIN books_book b ON o.book_id = b.id
                    LEFT JOIN users u ON b.seller_id = u.id
                    WHERE o.id = %s
                """, [pk])
                
                order_row = cursor.fetchone()
                if order_row:
                    columns = [col[0] for col in cursor.description]
                    order_data = dict(zip(columns, order_row))
                    
                    # 转换datetime对象
                    if order_data['created_at']:
                        order_data['created_at'] = order_data['created_at'].isoformat()
                    if order_data['updated_at']:
                        order_data['updated_at'] = order_data['updated_at'].isoformat()

            return Response({
                'code': 0,
                'msg': '更新成功',
                'data': order_data
            })

        except Order.DoesNotExist:
            return Response({
                'code': 404,
                'msg': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'msg': f'更新失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['POST'])
    def approve_refund(self, request, pk=None):
        """
        卖家同意退款 =
        """
        try:
            with connection.cursor() as cursor:
                # 检查订单状态和卖家权限
                cursor.execute("""
                    SELECT o.status, o.order_number, b.seller_id, b.title, o.buyer_id
                    FROM order_order o
                    LEFT JOIN books_book b ON o.book_id = b.id
                    WHERE o.id = %s
                """, [pk])
                
                order_row = cursor.fetchone()
                if not order_row:
                    return Response({
                        'code': 404,
                        'msg': '订单不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                status_val, order_number, seller_id, book_title, buyer_id = order_row
                
                # 检查订单状态
                if status_val != 'REFUNDING':
                    return Response({
                        'code': 400,
                        'msg': '订单状态不是退款中，无法处理退款'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # 检查当前用户是否为卖家
                if seller_id != request.user.id:
                    return Response({
                        'code': 403,
                        'msg': '只有卖家可以处理退款申请'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                # 更新订单状态为已退款
                cursor.execute("""
                    UPDATE order_order 
                    SET status = 'REFUNDED', updated_at = %s
                    WHERE id = %s
                """, [timezone.now(), pk])
                
                # 更新书籍状态为在售
                cursor.execute("""
                    UPDATE books_book 
                    SET is_sold = FALSE
                    WHERE id = (SELECT book_id FROM order_order WHERE id = %s)
                """, [pk])
                
                # 给买家发送退款完成通知
                cursor.execute("""
                    INSERT INTO chats_systemmessage 
                    (user_id, title, content, type, created_at, is_read)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, [
                    buyer_id,
                    '退款完成',
                    f'您购买的商品《{book_title}》退款已完成，订单号：{order_number}',
                    'order',
                    timezone.now(),
                    False
                ])
                
                # 获取更新后的订单详情
                cursor.execute("""
                    SELECT o.*, b.title, b.price, u.username as seller_name
                    FROM order_order o
                    LEFT JOIN books_book b ON o.book_id = b.id
                    LEFT JOIN users u ON b.seller_id = u.id
                    WHERE o.id = %s
                """, [pk])
                
                order_row = cursor.fetchone()
                if order_row:
                    columns = [col[0] for col in cursor.description]
                    order_data = dict(zip(columns, order_row))
                    
                    # 转换datetime对象
                    if order_data['created_at']:
                        order_data['created_at'] = order_data['created_at'].isoformat()
                    if order_data['updated_at']:
                        order_data['updated_at'] = order_data['updated_at'].isoformat()
                
                return Response({
                    'code': 0,
                    'msg': '退款处理成功',
                    'success': True,
                    'data': order_data
                })
                
        except Exception as e:
            print(f"[ERROR] 处理退款失败: {str(e)}")
            return Response({
                'code': 500,
                'msg': f'处理退款失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, *args, **kwargs):
        """
        获取订单详情 - 使用原生SQL
        """
        try:
            pk = kwargs.get('pk')
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT o.*, b.title, b.description, b.price, b.cover_image,
                           u.username as seller_name, u.avatar_url as seller_avatar
                    FROM order_order o
                    LEFT JOIN books_book b ON o.book_id = b.id
                    LEFT JOIN users u ON b.seller_id = u.id
                    WHERE o.id = %s AND o.buyer_id = %s
                """, [pk, request.user.id])
                
                order_row = cursor.fetchone()
                if not order_row:
                    return Response({
                        'code': 404,
                        'msg': '订单不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                columns = [col[0] for col in cursor.description]
                order_data = dict(zip(columns, order_row))
                
                # 处理datetime字段
                if order_data['created_at']:
                    order_data['created_at'] = order_data['created_at'].isoformat()
                if order_data['updated_at']:
                    order_data['updated_at'] = order_data['updated_at'].isoformat()
                
                # 构建书籍详情
                order_data['book_detail'] = {
                    'id': order_data['book_id'],
                    'title': order_data['title'],
                    'description': order_data['description'],
                    'price': str(order_data['price']) if order_data['price'] else '0.00',
                    'cover_image': order_data['cover_image'],
                    'image_url': order_data['cover_image'],  # 为了兼容性保留这个字段
                    'seller': {
                        'username': order_data['seller_name'],
                        'avatar': order_data['seller_avatar']
                    }
                }
                
                return Response({
                    'code': 0,
                    'msg': 'success',
                    'data': order_data
                })
        except Exception as e:
            print(f"获取订单详情失败: {str(e)}")
            return Response({
                'code': 500,
                'msg': f'获取订单详情失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)