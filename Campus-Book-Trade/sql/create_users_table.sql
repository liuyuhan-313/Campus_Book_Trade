-- 创建用户表的 MySQL 建表语句

CREATE TABLE IF NOT EXISTS `users` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `password` varchar(128) NOT NULL COMMENT '密码',
    `last_login` datetime(6) NULL COMMENT '最后登录时间',
    `is_superuser` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否超级用户',
    `username` varchar(150) NOT NULL UNIQUE COMMENT '用户名',
    `first_name` varchar(150) NOT NULL DEFAULT '' COMMENT '名',
    `last_name` varchar(150) NOT NULL DEFAULT '' COMMENT '姓',
    `email` varchar(254) NOT NULL DEFAULT '' COMMENT '邮箱',
    `is_staff` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否员工',
    `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
    `date_joined` datetime(6) NOT NULL COMMENT '加入时间',
    
    -- 自定义字段
    `openid` varchar(100) NOT NULL UNIQUE COMMENT '微信openid',
    `nickname` varchar(50) NOT NULL DEFAULT '' COMMENT '微信昵称',
    `avatar_url` varchar(500) NOT NULL DEFAULT '' COMMENT '头像URL',
    `phone` varchar(11) NOT NULL DEFAULT '' COMMENT '手机号',
    `student_id` varchar(20) NOT NULL DEFAULT '' COMMENT '学号',
    `campus` varchar(20) NOT NULL DEFAULT '' COMMENT '所在校区',
    `credit_score` int NOT NULL DEFAULT 100 COMMENT '信用分',
    `completed_orders_count` int NOT NULL DEFAULT 0 COMMENT '完成的订单数',
    `is_test_account` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为测试账号',
    `is_admin_user` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否是管理员用户',
    `role` varchar(20) NOT NULL DEFAULT 'user' COMMENT '用户角色',
    
    -- 创建索引
    KEY `idx_users_username` (`username`),
    KEY `idx_users_openid` (`openid`),
    KEY `idx_users_phone` (`phone`),
    KEY `idx_users_student_id` (`student_id`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_credit_score` (`credit_score`),
    KEY `idx_users_is_active` (`is_active`),
    
    -- 添加检查约束
    CONSTRAINT `chk_users_role` CHECK (`role` IN ('user', 'admin')),
    CONSTRAINT `chk_users_credit_score` CHECK (`credit_score` >= 0 AND `credit_score` <= 100),
    CONSTRAINT `chk_users_completed_orders_count` CHECK (`completed_orders_count` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 如果需要删除表重新创建，可以先执行下面的语句
-- DROP TABLE IF EXISTS `users`;

-- 建表完成后的注意事项：
-- 1. 这是系统的核心用户表，其他表都会引用此表
-- 2. openid字段用于微信小程序登录
-- 3. 信用分范围为0-100分
-- 4. 默认角色为普通用户 