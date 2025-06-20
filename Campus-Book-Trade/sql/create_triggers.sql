-- 创建信用评分计算触发器
-- 当订单状态更新为COMPLETED并且有评分时，自动更新用户信用分
-- 规则：前两单显示100分，第三单开始使用加权平均算法（新评分30%，当前分数70%）

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

-- 使用说明：
-- 1. 触发器会在订单状态更新为COMPLETED时自动计算信用分
-- 2. 信用分计算规则：
--    - 初始分数：100分
--    - 前两单：显示100分
--    - 第三单开始：使用加权平均算法（新评分权重30%，当前分数权重70%）
--    - 评分换算：5分制转100分制（乘以20）
-- 3. 提供了日志表用于跟踪信用分变化
-- 4. 新增了调试日志表 trigger_debug_log 用于排查触发器问题 