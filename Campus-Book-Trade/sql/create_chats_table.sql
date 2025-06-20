-- 创建聊天相关表的 MySQL 建表语句

-- 1. 创建聊天会话表
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

-- 2. 创建聊天消息表
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

-- 3. 创建系统消息表
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

-- 如果需要删除表重新创建，可以先执行下面的语句
-- DROP TABLE IF EXISTS `chats_systemmessage`;
-- DROP TABLE IF EXISTS `chats_chatmessage`;
-- DROP TABLE IF EXISTS `chats_chatsession`;

-- 建表完成后的注意事项：
-- 1. 聊天会话表有唯一约束，防止同一本书的同一对用户创建多个会话
-- 2. 消息表按创建时间排序，便于聊天记录展示
-- 3. 系统消息支持订单和系统两种类型
-- 4. 所有表都依赖用户表和书籍表 