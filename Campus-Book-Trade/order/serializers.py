from rest_framework import serializers
from .models import Order
from books.serializers import BookSerializer

class OrderSerializer(serializers.ModelSerializer):
    book_detail = BookSerializer(source='book', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'book', 'book_detail',
            'amount', 'status', 'rating', 'rating_comment',
            'address', 'contact_name', 'contact_phone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('buyer', 'created_at', 'updated_at', 'book_detail')

    def validate(self, data):
        # 验证必需字段
        required_fields = ['book', 'amount', 'address', 'contact_name', 'contact_phone']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: f'{field}不能为空'})
        
        # 验证金额
        if data.get('amount') and float(data['amount']) <= 0:
            raise serializers.ValidationError({'amount': '订单金额必须大于0'})
        
        # 验证手机号格式
        if data.get('contact_phone') and not data['contact_phone'].isdigit():
            raise serializers.ValidationError({'contact_phone': '请输入正确的手机号'})
        
        return data