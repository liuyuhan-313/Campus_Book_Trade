-- 创建通知相关表的 MySQL 建表语句

-- 1. 创建公告表
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

-- 2. 创建通知表
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

-- 如果需要删除表重新创建，可以先执行下面的语句
-- DROP TABLE IF EXISTS `notifications_notification`;
-- DROP TABLE IF EXISTS `notifications_announcement`;

-- 建表完成后的注意事项：
-- 1. 公告表用于系统级公告，所有用户可见
-- 2. 通知表用于个人通知，支持多种类型
-- 3. related_model和related_id用于关联其他业务对象
-- 4. 通知类型包括：系统、订单、评价、聊天、公告 