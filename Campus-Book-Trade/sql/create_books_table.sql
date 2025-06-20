-- 创建书籍相关表的 MySQL 建表语句
-- 1. 创建书籍分类表
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

-- 2. 创建书籍表
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

-- 如果需要删除表重新创建，可以先执行下面的语句
-- DROP TABLE IF EXISTS `books_book`;
-- DROP TABLE IF EXISTS `books_category`;

-- 建表完成后的注意事项：
-- 1. 分类表包含预定义的8个分类
-- 2. 书籍表依赖用户表，确保用户表已创建
-- 3. image_urls字段存储JSON格式的图片URL数组
-- 4. 成色和校区字段有预定义的枚举值
-- 5. 新增publisher（出版社）和isbn（ISBN号）字段，方便书籍管理
-- 6. 为常用查询字段添加了索引以提高性能
-- 7. 添加了seller_id和isbn的复合唯一索引，防止同一卖家重复发布相同ISBN的书籍 