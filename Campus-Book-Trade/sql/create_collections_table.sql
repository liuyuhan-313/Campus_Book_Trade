-- 创建收藏表的 MySQL 建表语句

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

-- 如果需要删除表重新创建，可以先执行下面的语句
-- DROP TABLE IF EXISTS `user_collections_collection`;

-- 建表完成后的注意事项：
-- 1. 有唯一约束，确保用户不能重复收藏同一本书
-- 2. 依赖用户表和书籍表
-- 3. 当用户或书籍删除时，相关收藏记录也会自动删除 