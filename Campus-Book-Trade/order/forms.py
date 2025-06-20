'''
from django import forms
from .models import Order

class OrderCreateForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = ['quantity', 'shipping_address']  # 买家需要填写的字段
        widgets = {
            'shipping_address': forms.Textarea(attrs={'rows': 3}),
        }

class OrderStatusUpdateForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = ['status']  # 卖家更新状态时的字段
'''