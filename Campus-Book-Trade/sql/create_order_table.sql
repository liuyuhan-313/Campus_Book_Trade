-- 创建订单表的 MySQL 建表语句

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

-- 如果需要删除表重新创建，可以先执行下面的语句
-- DROP TABLE IF EXISTS `order_order`;

-- 建表完成后的注意事项：
-- 1. 确保 users 表和 books_book 表已经存在
-- 2. 如果已有数据，请先备份
-- 3. 建议在非生产环境先测试 