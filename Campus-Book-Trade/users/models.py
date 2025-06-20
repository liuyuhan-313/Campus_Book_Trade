from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    openid = models.CharField(max_length=100, unique=True, verbose_name='微信openid')
    nickname = models.CharField(max_length=50, blank=True, verbose_name='微信昵称')
    avatar_url = models.URLField(max_length=500, blank=True, verbose_name='头像URL')
    phone = models.CharField(max_length=11, blank=True, verbose_name='手机号')
    student_id = models.CharField(max_length=20, blank=True, verbose_name='学号')
    campus = models.CharField(max_length=20, blank=True, verbose_name='所在校区')
    credit_score = models.IntegerField(default=100, verbose_name='信用分')
    completed_orders_count = models.IntegerField(default=0, verbose_name='完成的订单数')
    
    # 添加测试账号字段
    is_test_account = models.BooleanField(default=False, verbose_name='是否为测试账号')
    # 添加角色相关字段
    is_admin_user = models.BooleanField(default=False, verbose_name='是否是管理员用户')
    role = models.CharField(
        max_length=20, 
        choices=[('user', '普通用户'), ('admin', '管理员')],
        default='user',
        verbose_name='用户角色'
    )
    
    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.nickname or self.username
    
    @property
    def is_admin(self):
        """
        判断用户是否是管理员
        """
        return self.is_staff or self.is_admin_user or self.role == 'admin'
    
    def switch_role(self, new_role):
        """
        切换用户角色
        """
        if new_role not in ['user', 'admin']:
            raise ValueError('无效的角色类型')
            
        self.role = new_role
        self.is_admin_user = (new_role == 'admin')
        self.is_staff = (new_role == 'admin')
        # 在测试环境中，同时设置超级用户权限
        if new_role == 'admin':
            self.is_superuser = True
        else:
            self.is_superuser = False
        self.save()






    def get_credit_level(self):
        """
        获取用户的信用等级
        使用数据库函数来获取信用等级
        """
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT get_credit_level(%s)", [self.credit_score])
            result = cursor.fetchone()
            return result[0] if result else '未知'
    
    def recalculate_credit_score(self):
        """
        重新计算用户的信用分
        调用数据库存储过程来重新计算
        """
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("CALL sp_recalculate_credit_score(%s)", [self.id])
            
        # 刷新当前对象的数据
        self.refresh_from_db(fields=['credit_score', 'completed_orders_count'])
        
        print(f"[INFO] 用户 {self.username} 的信用分已重新计算: {self.credit_score}")
        
    @classmethod
    def get_credit_statistics(cls):
        """
        获取平台信用分统计信息
        """
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    get_credit_level(credit_score) as level,
                    COUNT(*) as count,
                    MIN(credit_score) as min_score,
                    MAX(credit_score) as max_score,
                    AVG(credit_score) as avg_score
                FROM users 
                WHERE is_active = 1
                GROUP BY get_credit_level(credit_score)
                ORDER BY min_score DESC
            """)
            
            results = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            
            return [dict(zip(columns, row)) for row in results]