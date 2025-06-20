from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['phone', 'student_id', 'campus', 'credit_score']
        read_only_fields = ['credit_score']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    is_admin = serializers.BooleanField(read_only=True)  # 添加is_admin字段
    role = serializers.ChoiceField(  # 添加role字段
        choices=['user', 'admin'],
        required=False,
        read_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'nickname', 'avatar_url', 
            'phone', 'student_id', 'campus', 'credit_score', 
            'profile', 'is_admin', 'role', 'is_admin_user'  # 添加新字段
        ]
        read_only_fields = [
            'id', 'username', 'credit_score', 'openid',
            'is_admin', 'role', 'is_admin_user'  # 设置为只读
        ]
        
    def to_representation(self, instance):
        """
        自定义数据表示方法
        """
        data = super().to_representation(instance)
        # 添加用户角色信息
        data['is_admin'] = instance.is_admin
        data['role'] = 'admin' if instance.is_admin else 'user'
        return data
        
        
    def create(self, validated_data):
        # 处理用户创建
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        
        # 确保新创建的用户默认为普通用户(新加的)
        validated_data['role'] = 'user'
        validated_data['is_admin_user'] = False
        validated_data['is_staff'] = False
        user = User(**validated_data)
        if password:
            user.password = make_password(password)
        user.save()
        
        if profile_data:
            User.objects.create(user=user, **profile_data)
        
        return user
    
    def update(self, instance, validated_data):
        # 处理用户更新
        profile_data = validated_data.pop('profile', None)
        
        password = validated_data.pop('password', None)
        if password:
            instance.password = make_password(password)
            
        # 移除角色相关字段，防止直接修改（新加的）
        validated_data.pop('role', None)
        validated_data.pop('is_admin_user', None)
        validated_data.pop('is_staff', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if profile_data:
            profile = instance.profile
            if profile:
                for attr, value in profile_data.items():
                    setattr(profile, attr, value)
                profile.save()
            else:
                User.objects.create(user=instance, **profile_data)
        
        return instance
    
class UserRoleSerializer(serializers.Serializer):
    """
    用于角色切换的序列化器
    """
    role = serializers.ChoiceField(
        choices=['user', 'admin'],
        required=True
    )
    
    def validate_role(self, value):
        """
        验证角色值
        """
        if value not in ['user', 'admin']:
            raise serializers.ValidationError('无效的角色类型')
        return value
    
    def update(self, instance, validated_data):
        """
        更新用户角色
        """
        new_role = validated_data.get('role')
        instance.switch_role(new_role)
        return instance
