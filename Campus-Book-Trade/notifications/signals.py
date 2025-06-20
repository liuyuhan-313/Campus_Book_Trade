from django.db.models.signals import post_save
from django.dispatch import receiver
from order.models import Order
from .models import Notification

@receiver(post_save, sender=Order)
def create_order_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.seller,
            title='新订单通知',
            message=f'您出售的书籍《{instance.book.title}》有新订单',
            notification_type='order',
            related_model='order',
            related_id=instance.id
        )
    # 其他订单状态变化的通知...


    


