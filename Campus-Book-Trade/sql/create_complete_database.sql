 -- ===================================================================
-- 校园二手书交易平台 MySQL 完整数据库建表脚本
-- 包含所有业务表、Django系统表、触发器和存储过程
-- ===================================================================

-- 设置字符集和存储引擎
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ===================================================================
-- 第一部分：创建所有业务表
-- ===================================================================

-- 1. 创建用户表 (基础表，无外键依赖)
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

-- 2. 创建书籍分类表
CREATE TABLE IF NOT EXISTS `books_category` (
    `id` int PRIMARY KEY COMMENT '分类ID',
    `name` varchar(100) NOT NULL COMMENT '分类名称',
    `parent_id` int NULL COMMENT '父分类ID',
    
    -- 创建索引
    KEY `idx_category_parent_id` (`parent_id`),
    
    -- 创建外键约束
    CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `books_category` (`id`) ON DELETE CASCADE,
    
    -- 添加检查约束
    CONSTRAINT `chk_category_id` CHECK (`id` IN (1, 2, 3, 4, 5, 6, 7, 8))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='书籍分类表';

-- 插入预定义的分类数据
INSERT INTO `books_category` (`id`, `name`, `parent_id`) VALUES
(1, '教材教辅', NULL),
(2, '文学小说', NULL),
(3, '计算机与互联网', NULL),
(4, '经管励志', NULL),
(5, '考研资料', NULL),
(6, '外语学习', NULL),
(7, '科学技术', NULL),
(8, '其他', NULL)
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`),
    `parent_id` = VALUES(`parent_id`);

-- 3. 创建书籍表
CREATE TABLE IF NOT EXISTS `books_book` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `seller_id` bigint NOT NULL COMMENT '卖家ID',
    `title` varchar(200) NOT NULL COMMENT '书名',
    `author` varchar(100) NOT NULL COMMENT '作者',
    `publisher` varchar(100) NULL COMMENT '出版社',
    `isbn` varchar(20) NULL COMMENT 'ISBN号',
    `category_id` int NULL COMMENT '分类ID',
    `description` text NOT NULL COMMENT '详细描述',
    `price` decimal(10,2) NOT NULL COMMENT '价格',
    `condition` varchar(20) NOT NULL DEFAULT 'good' COMMENT '成色',
    `campus` varchar(20) NOT NULL COMMENT '校区',
    `cover_image` text NULL COMMENT '封面图片URL',
    `image_urls` text NOT NULL COMMENT '图片URL列表(JSON)',
    `is_sold` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已售出',
    `created_at` datetime(6) NOT NULL COMMENT '创建时间',
    `updated_at` datetime(6) NOT NULL COMMENT '更新时间',
    
    -- 创建索引
    KEY `idx_book_seller_id` (`seller_id`),
    KEY `idx_book_category_id` (`category_id`),
    KEY `idx_book_condition` (`condition`),
    KEY `idx_book_campus` (`campus`),
    KEY `idx_book_is_sold` (`is_sold`),
    KEY `idx_book_price` (`price`),
    KEY `idx_book_created_at` (`created_at`),
    KEY `idx_book_title` (`title`),
    KEY `idx_book_author` (`author`),
    KEY `idx_book_publisher` (`publisher`),
    KEY `idx_book_isbn` (`isbn`),
    
    -- 创建外键约束
    CONSTRAINT `fk_book_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_book_category` FOREIGN KEY (`category_id`) REFERENCES `books_category` (`id`) ON DELETE SET NULL,
    
    -- 添加检查约束
    CONSTRAINT `chk_book_condition` CHECK (`condition` IN ('new', 'like_new', 'good', 'fair', 'poor')),
    CONSTRAINT `chk_book_campus` CHECK (`campus` IN ('handan', 'fenglin', 'jiangwan', 'zhangjiang')),
    CONSTRAINT `chk_book_price` CHECK (`price` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='书籍表';

-- 4. 创建聊天会话表
CREATE TABLE IF NOT EXISTS `chats_chatsession` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `book_id` bigint NOT NULL COMMENT '书籍ID',
    `seller_id` bigint NOT NULL COMMENT '卖家ID',
    `buyer_id` bigint NOT NULL COMMENT '买家ID',
    `created_at` datetime(6) NOT NULL COMMENT '创建时间',
    `updated_at` datetime(6) NOT NULL COMMENT '更新时间',
    `last_message` varchar(200) NULL COMMENT '最后一条消息',
    
    -- 创建索引
    KEY `idx_chatsession_book_id` (`book_id`),
    KEY `idx_chatsession_seller_id` (`seller_id`),
    KEY `idx_chatsession_buyer_id` (`buyer_id`),
    KEY `idx_chatsession_created_at` (`created_at`),
    KEY `idx_chatsession_updated_at` (`updated_at`),
    
    -- 创建唯一约束
    UNIQUE KEY `uk_chatsession_book_seller_buyer` (`book_id`, `seller_id`, `buyer_id`),
    
    -- 创建外键约束
    CONSTRAINT `fk_chatsession_book` FOREIGN KEY (`book_id`) REFERENCES `books_book` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chatsession_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chatsession_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- 5. 创建聊天消息表
CREATE TABLE IF NOT EXISTS `chats_chatmessage` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `session_id` bigint NOT NULL COMMENT '会话ID',
    `sender_id` bigint NOT NULL COMMENT '发送者ID',
    `content` text NOT NULL COMMENT '消息内容',
    `created_at` datetime(6) NOT NULL COMMENT '创建时间',
    `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
    
    -- 创建索引
    KEY `idx_chatmessage_session_id` (`session_id`),
    KEY `idx_chatmessage_sender_id` (`sender_id`),
    KEY `idx_chatmessage_created_at` (`created_at`),
    KEY `idx_chatmessage_is_read` (`is_read`),
    
    -- 创建外键约束
    CONSTRAINT `fk_chatmessage_session` FOREIGN KEY (`session_id`) REFERENCES `chats_chatsession` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chatmessage_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- 6. 创建系统消息表
CREATE TABLE IF NOT EXISTS `chats_systemmessage` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `title` varchar(200) NOT NULL COMMENT '标题',
    `content` text NOT NULL COMMENT '内容',
    `type` varchar(20) NOT NULL DEFAULT 'system' COMMENT '消息类型',
    `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
    `created_at` datetime(6) NOT NULL COMMENT '创建时间',
    
    -- 创建索引
    KEY `idx_systemmessage_user_id` (`user_id`),
    KEY `idx_systemmessage_type` (`type`),
    KEY `idx_systemmessage_is_read` (`is_read`),
    KEY `idx_systemmessage_created_at` (`created_at`),
    
    -- 创建外键约束
    CONSTRAINT `fk_systemmessage_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    
    -- 添加检查约束
    CONSTRAINT `chk_systemmessage_type` CHECK (`type` IN ('order', 'system'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统消息表';

-- 7. 创建收藏表
CREATE TABLE IF NOT EXISTS `user_collections_collection` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `book_id` bigint NOT NULL COMMENT '书籍ID',
    `created_at` datetime(6) NOT NULL COMMENT '收藏时间',
    
    -- 创建索引
    KEY `idx_collection_user_id` (`user_id`),
    KEY `idx_collection_book_id` (`book_id`),
    KEY `idx_collection_created_at` (`created_at`),
    
    -- 创建唯一约束（防止重复收藏）
    UNIQUE KEY `uk_collection_user_book` (`user_id`, `book_id`),
    
    -- 创建外键约束
    CONSTRAINT `fk_collection_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_collection_book` FOREIGN KEY (`book_id`) REFERENCES `books_book` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- 8. 创建订单表
CREATE TABLE IF NOT EXISTS `order_order` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `order_number` varchar(64) NOT NULL UNIQUE COMMENT '订单编号',
    `buyer_id` bigint NOT NULL COMMENT '买家ID',
    `book_id` bigint NOT NULL COMMENT '书籍ID',
    `amount` decimal(10,2) NOT NULL COMMENT '订单金额',
    `status` varchar(20) NOT NULL DEFAULT 'UNPAID' COMMENT '订单状态',
    `address` varchar(255) NULL COMMENT '收货地址',
    `contact_name` varchar(50) NOT NULL DEFAULT '未知联系人' COMMENT '联系人',
    `contact_phone` varchar(20) NOT NULL DEFAULT '11111111111' COMMENT '联系电话',
    `rating` int NULL COMMENT '评分(1-5)',
    `rating_comment` text NULL COMMENT '评价内容',
    `created_at` datetime(6) NOT NULL COMMENT '创建时间',
    `updated_at` datetime(6) NOT NULL COMMENT '更新时间',
    
    -- 创建索引
    KEY `idx_order_buyer_id` (`buyer_id`),
    KEY `idx_order_book_id` (`book_id`),
    KEY `idx_order_status` (`status`),
    KEY `idx_order_created_at` (`created_at`),
    KEY `idx_order_order_number` (`order_number`),
    
    -- 创建外键约束
    CONSTRAINT `fk_order_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_book` FOREIGN KEY (`book_id`) REFERENCES `books_book` (`id`) ON DELETE CASCADE,
    
    -- 添加检查约束
    CONSTRAINT `chk_order_status` CHECK (`status` IN ('UNPAID', 'PAID', 'RECEIVED', 'REFUNDING', 'REFUNDED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT `chk_order_rating` CHECK (`rating` IS NULL OR (`rating` >= 1 AND `rating` <= 5)),
    CONSTRAINT `chk_order_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 9. 创建公告表
CREATE TABLE IF NOT EXISTS `notifications_announcement` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `title` varchar(100) NOT NULL COMMENT '标题',
    `content` text NOT NULL COMMENT '内容',
    `created_at` datetime(6) NOT NULL COMMENT '创建时间',
    `updated_at` datetime(6) NOT NULL COMMENT '更新时间',
    `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否有效',
    
    -- 创建索引
    KEY `idx_announcement_created_at` (`created_at`),
    KEY `idx_announcement_is_active` (`is_active`),
    KEY `idx_announcement_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- 10. 创建通知表
CREATE TABLE IF NOT EXISTS `notifications_notification` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `title` varchar(100) NOT NULL COMMENT '标题',
    `message` text NOT NULL COMMENT '消息内容',
    `notification_type` varchar(20) NOT NULL COMMENT '通知类型',
    `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已读',
    `created_at` datetime(6) NOT NULL COMMENT '创建时间',
    `related_model` varchar(50) NULL COMMENT '关联模型',
    `related_id` int UNSIGNED NULL COMMENT '关联ID',
    
    -- 创建索引
    KEY `idx_notification_user_id` (`user_id`),
    KEY `idx_notification_type` (`notification_type`),
    KEY `idx_notification_is_read` (`is_read`),
    KEY `idx_notification_created_at` (`created_at`),
    KEY `idx_notification_related` (`related_model`, `related_id`),
    
    -- 创建外键约束
    CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    
    -- 添加检查约束
    CONSTRAINT `chk_notification_type` CHECK (`notification_type` IN ('system', 'order', 'review', 'chat', 'announcement'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ===================================================================
-- 第二部分：创建Django系统表
-- ===================================================================

-- 1. Django会话表
CREATE TABLE IF NOT EXISTS `django_session` (
    `session_key` varchar(40) NOT NULL PRIMARY KEY,
    `session_data` longtext NOT NULL,
    `expire_date` datetime(6) NOT NULL,
    KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Django迁移记录表
CREATE TABLE IF NOT EXISTS `django_migrations` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `app` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Django内容类型表
CREATE TABLE IF NOT EXISTS `django_content_type` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `app_label` varchar(100) NOT NULL,
    `model` varchar(100) NOT NULL,
    UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Django权限表
CREATE TABLE IF NOT EXISTS `auth_permission` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `name` varchar(255) NOT NULL,
    `content_type_id` int NOT NULL,
    `codename` varchar(100) NOT NULL,
    KEY `auth_permission_content_type_id_2f476e4b_fk_django_co` (`content_type_id`),
    UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`, `codename`),
    CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Django用户组表
CREATE TABLE IF NOT EXISTS `auth_group` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `name` varchar(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Django用户组权限关联表
CREATE TABLE IF NOT EXISTS `auth_group_permissions` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `group_id` int NOT NULL,
    `permission_id` int NOT NULL,
    KEY `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` (`group_id`),
    KEY `auth_group_permissions_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
    UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`, `permission_id`),
    CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
    CONSTRAINT `auth_group_permissions_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Django用户组关联表
CREATE TABLE IF NOT EXISTS `users_user_groups` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint NOT NULL,
    `group_id` int NOT NULL,
    KEY `users_user_groups_user_id_5f6f5a90` (`user_id`),
    KEY `users_user_groups_group_id_9afc8d0e` (`group_id`),
    UNIQUE KEY `users_user_groups_user_id_group_id_b88eab82_uniq` (`user_id`, `group_id`),
    CONSTRAINT `users_user_groups_user_id_5f6f5a90_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `users_user_groups_group_id_9afc8d0e_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Django用户权限关联表
CREATE TABLE IF NOT EXISTS `users_user_user_permissions` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint NOT NULL,
    `permission_id` int NOT NULL,
    KEY `users_user_user_permissions_user_id_20aca447` (`user_id`),
    KEY `users_user_user_permissions_permission_id_0b93982e` (`permission_id`),
    UNIQUE KEY `users_user_user_permissions_user_id_permission_id_43338c45_uniq` (`user_id`, `permission_id`),
    CONSTRAINT `users_user_user_permissions_user_id_20aca447_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `users_user_user_permissions_permission_id_0b93982e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Django管理后台操作日志表
CREATE TABLE IF NOT EXISTS `django_admin_log` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `action_time` datetime(6) NOT NULL,
    `object_id` longtext,
    `object_repr` varchar(200) NOT NULL,
    `action_flag` smallint unsigned NOT NULL,
    `change_message` longtext NOT NULL,
    `content_type_id` int,
    `user_id` bigint NOT NULL,
    KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
    KEY `django_admin_log_user_id_c564eba6_fk_users_id` (`user_id`),
    CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
    CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CHECK (`action_flag` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AuthToken表（如果使用DRF Token认证）
CREATE TABLE IF NOT EXISTS `authtoken_token` (
    `key` varchar(40) PRIMARY KEY,
    `created` datetime(6) NOT NULL,
    `user_id` bigint UNIQUE NOT NULL,
    CONSTRAINT `authtoken_token_user_id_35299eff_fk_users_id` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- 第三部分：插入Django基础数据
-- ===================================================================

-- 插入Django基础内容类型数据
INSERT IGNORE INTO `django_content_type` (`app_label`, `model`) VALUES
('admin', 'logentry'),
('auth', 'permission'),
('auth', 'group'),
('contenttypes', 'contenttype'),
('sessions', 'session'),
('authtoken', 'token'),
('users', 'user'),
('books', 'category'),
('books', 'book'),
('order', 'order'),
('user_collections', 'collection'),
('chats', 'chatsession'),
('chats', 'chatmessage'),
('chats', 'systemmessage'),
('notifications', 'announcement'),
('notifications', 'notification');

-- 插入基本权限数据
INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can add user', ct.id, 'add_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can change user', ct.id, 'change_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can delete user', ct.id, 'delete_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can view user', ct.id, 'view_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

-- ===================================================================
-- 第四部分：创建触发器相关表
-- ===================================================================

-- 创建信用分计算日志表
CREATE TABLE IF NOT EXISTS `credit_calculation_log` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `order_id` bigint NOT NULL COMMENT '订单ID',
    `old_credit_score` int NOT NULL COMMENT '旧信用分',
    `new_credit_score` int NOT NULL COMMENT '新信用分',
    `rating` int NOT NULL COMMENT '本次评分',
    `completed_orders` int NOT NULL COMMENT '完成订单数',
    `avg_rating` decimal(3,2) NOT NULL COMMENT '平均评分',
    `calculation_time` datetime(6) NOT NULL COMMENT '计算时间',
    `debug_info` text NULL COMMENT '调试信息',
    
    -- 创建索引
    KEY `idx_log_user_id` (`user_id`),
    KEY `idx_log_order_id` (`order_id`),
    KEY `idx_log_time` (`calculation_time`),
    
    -- 创建外键约束
    CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_log_order` FOREIGN KEY (`order_id`) REFERENCES `order_order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='信用分计算日志表';

-- 创建触发器调试日志表
CREATE TABLE IF NOT EXISTS `trigger_debug_log` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `trigger_name` varchar(100) NOT NULL COMMENT '触发器名称',
    `order_id` bigint NULL COMMENT '订单ID',
    `old_status` varchar(20) NULL COMMENT '旧状态',
    `new_status` varchar(20) NULL COMMENT '新状态',
    `old_rating` int NULL COMMENT '旧评分',
    `new_rating` int NULL COMMENT '新评分',
    `debug_message` text NULL COMMENT '调试消息',
    `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='触发器调试日志表';

-- ===================================================================
-- 第五部分：创建存储过程和函数
-- ===================================================================

-- 删除已存在的存储过程和函数（如果存在）
DROP PROCEDURE IF EXISTS `sp_recalculate_credit_score`;
DROP FUNCTION IF EXISTS `get_credit_level`;

-- 创建存储过程：重新计算用户信用分
DELIMITER $$

CREATE PROCEDURE `sp_recalculate_credit_score`(IN user_id BIGINT)
BEGIN
    DECLARE total_orders INT DEFAULT 0;
    DECLARE avg_rating DECIMAL(3,2) DEFAULT 0;
    DECLARE new_credit_score INT DEFAULT 100;
    
    -- 计算该用户所有已完成且有评分的订单
    SELECT COUNT(*), IFNULL(AVG(o.rating), 0)
    INTO total_orders, avg_rating
    FROM order_order o
    JOIN books_book b ON o.book_id = b.id
    WHERE b.seller_id = user_id 
    AND o.status = 'COMPLETED' 
    AND o.rating IS NOT NULL;
    
    -- 计算新的信用分
    IF total_orders >= 3 THEN
        -- 第三单开始基于平均评分计算真实信用分
        -- 5分制转100分制（乘以20）
        SET new_credit_score = ROUND(avg_rating * 20);
        -- 确保分数在0-100之间
        SET new_credit_score = GREATEST(0, LEAST(100, new_credit_score));
    ELSE
        -- 前两单显示100分（初始信用分）
        SET new_credit_score = 100;
    END IF;
    
    -- 更新用户信用分和完成订单数
    UPDATE users 
    SET credit_score = new_credit_score,
        completed_orders_count = total_orders
    WHERE id = user_id;
    
END$$

DELIMITER ;

-- 创建函数：获取用户的信用等级
DELIMITER $$

CREATE FUNCTION `get_credit_level`(credit_score INT) 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE level_name VARCHAR(20);
    
    CASE
        WHEN credit_score >= 90 THEN SET level_name = '优秀';
        WHEN credit_score >= 80 THEN SET level_name = '良好';
        WHEN credit_score >= 70 THEN SET level_name = '中等';
        WHEN credit_score >= 60 THEN SET level_name = '及格';
        ELSE SET level_name = '待改善';
    END CASE;
    
    RETURN level_name;
END$$

DELIMITER ;

-- ===================================================================
-- 第六部分：创建触发器
-- ===================================================================

DELIMITER $$

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS `tr_update_credit_score`;
DROP TRIGGER IF EXISTS `tr_revert_credit_score`;

-- 创建触发器：当订单更新时计算信用分
CREATE TRIGGER `tr_update_credit_score` 
AFTER UPDATE ON `order_order`
FOR EACH ROW
BEGIN
    DECLARE seller_user_id BIGINT;
    DECLARE current_credit_score INT;
    DECLARE current_orders_count INT;
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_completed_orders INT;
    DECLARE new_credit_score INT;
    DECLARE debug_msg TEXT;
    
    -- 记录所有订单更新到调试日志
    INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
    VALUES ('tr_update_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, 
            CONCAT('触发器被调用 - 订单ID: ', NEW.id, ', 状态变化: ', OLD.status, ' -> ', NEW.status));
    
    -- 检查触发条件：订单状态变为COMPLETED且有评分
    IF NEW.status = 'COMPLETED' AND NEW.rating IS NOT NULL THEN
        -- 记录满足条件
        INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
        VALUES ('tr_update_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, '满足触发条件：状态为COMPLETED且有评分');
        
        -- 获取卖家用户ID
        SELECT seller_id INTO seller_user_id 
        FROM books_book 
        WHERE id = NEW.book_id;
        
        -- 检查是否找到卖家
        IF seller_user_id IS NULL THEN
            INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
            VALUES ('tr_update_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, 
                    CONCAT('错误：未找到书籍ID ', NEW.book_id, ' 对应的卖家'));
        ELSE
            -- 获取卖家当前的信用分和完成订单数
            SELECT credit_score, completed_orders_count 
            INTO current_credit_score, current_orders_count
            FROM users 
            WHERE id = seller_user_id;
            
            -- 检查是否找到用户
            IF current_credit_score IS NULL THEN
                INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
                VALUES ('tr_update_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, 
                        CONCAT('错误：未找到用户ID ', seller_user_id));
            ELSE
                -- 计算该卖家所有已完成且有评分的订单的平均评分（包括当前订单）
                SELECT AVG(o.rating), COUNT(*) 
                INTO avg_rating, total_completed_orders
                FROM order_order o
                JOIN books_book b ON o.book_id = b.id
                WHERE b.seller_id = seller_user_id 
                AND o.status = 'COMPLETED' 
                AND o.rating IS NOT NULL;
                
                -- 设置新的完成订单数
                SET current_orders_count = total_completed_orders;
                
                -- 计算新的信用分
                IF total_completed_orders >= 3 THEN
                    SET new_credit_score = ROUND(current_credit_score * 0.7 + (NEW.rating * 20) * 0.3);
                    SET new_credit_score = GREATEST(0, LEAST(100, new_credit_score));
                ELSE
                    -- 前两单显示100分（初始信用分）
                    SET new_credit_score = 100;
                END IF;
                
                -- 更新用户的信用分和完成订单数
                UPDATE users 
                SET credit_score = new_credit_score,
                    completed_orders_count = total_completed_orders
                WHERE id = seller_user_id;
                
                -- 构建调试信息
                SET debug_msg = CONCAT(
                    '信用分更新成功 - 用户ID: ', seller_user_id,
                    ', 旧信用分: ', current_credit_score,
                    ', 新信用分: ', new_credit_score,
                    ', 评分: ', NEW.rating,
                    ', 完成订单数: ', total_completed_orders,
                    ', 平均评分: ', IFNULL(avg_rating, 0)
                );
                
                -- 插入调试日志
                INSERT INTO credit_calculation_log (
                    user_id, order_id, old_credit_score, new_credit_score, 
                    rating, completed_orders, avg_rating, calculation_time, debug_info
                ) VALUES (
                    seller_user_id, NEW.id, current_credit_score, new_credit_score,
                    NEW.rating, current_orders_count, IFNULL(avg_rating, 0), NOW(), debug_msg
                );
                
                -- 记录成功信息
                INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
                VALUES ('tr_update_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, debug_msg);
            END IF;
        END IF;
    ELSE
        -- 记录不满足条件的原因
        SET debug_msg = CONCAT('不满足触发条件 - 状态: ', NEW.status, ', 评分: ', IFNULL(NEW.rating, 'NULL'));
        INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
        VALUES ('tr_update_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, debug_msg);
    END IF;
    
END$$

-- 创建触发器：当订单状态从COMPLETED回退时恢复信用分
CREATE TRIGGER `tr_revert_credit_score`
AFTER UPDATE ON `order_order`
FOR EACH ROW
BEGIN
    DECLARE seller_user_id BIGINT;
    DECLARE current_orders_count INT;
    
    -- 记录所有订单更新到调试日志
    INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
    VALUES ('tr_revert_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, 
            CONCAT('回退触发器被调用 - 订单ID: ', NEW.id, ', 状态变化: ', OLD.status, ' -> ', NEW.status));
    
    -- 当订单状态从COMPLETED变为其他状态时
    IF OLD.status = 'COMPLETED' AND OLD.rating IS NOT NULL AND NEW.status != 'COMPLETED' THEN
        
        -- 获取卖家用户ID
        SELECT seller_id INTO seller_user_id 
        FROM books_book 
        WHERE id = NEW.book_id;
        
        IF seller_user_id IS NOT NULL THEN
            -- 获取当前完成订单数
            SELECT completed_orders_count 
            INTO current_orders_count
            FROM users 
            WHERE id = seller_user_id;
            
            -- 减少完成订单数（但不能小于0）
            SET current_orders_count = GREATEST(0, current_orders_count - 1);
            
            -- 重新计算信用分（基于剩余的已完成订单）
            CALL sp_recalculate_credit_score(seller_user_id);
            
            -- 记录成功信息
            INSERT INTO trigger_debug_log (trigger_name, order_id, old_status, new_status, old_rating, new_rating, debug_message)
            VALUES ('tr_revert_credit_score', NEW.id, OLD.status, NEW.status, OLD.rating, NEW.rating, 
                    CONCAT('信用分回退成功 - 用户ID: ', seller_user_id, ', 新完成订单数: ', current_orders_count));
        END IF;
        
    END IF;
    
END$$

DELIMITER ;

-- ===================================================================
-- 恢复外键检查
-- ===================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ===================================================================
-- 建表完成提示
-- ===================================================================
SELECT '校园二手书交易平台完整数据库创建完成！' as message;
SELECT '包含所有业务表、Django系统表、触发器和存储过程' as details;

-- ===================================================================
-- 使用说明：
-- 1. 请确保MySQL版本支持JSON数据类型和CHECK约束（MySQL 5.7+推荐）
-- 2. 建议在测试环境先执行此脚本
-- 3. 包含完整的Django系统表，支持Django管理后台
-- 4. 包含信用分计算触发器，自动更新用户信用分
-- 5. 包含调试日志表，便于排查问题
-- 6. 所有表都使用InnoDB存储引擎，支持事务和外键
-- 7. 字符集使用utf8mb4，支持完整的Unicode字符
-- ===================================================================