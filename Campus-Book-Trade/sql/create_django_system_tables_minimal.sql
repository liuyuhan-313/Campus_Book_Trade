-- 最小化Django系统表
-- 只创建Django运行必需的核心表

USE campus_book_trade;

-- 1. Django内容类型表
CREATE TABLE IF NOT EXISTS `django_content_type` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `app_label` varchar(100) NOT NULL,
    `model` varchar(100) NOT NULL,
    UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`, `model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Django会话表
CREATE TABLE IF NOT EXISTS `django_session` (
    `session_key` varchar(40) PRIMARY KEY,
    `session_data` longtext NOT NULL,
    `expire_date` datetime(6) NOT NULL,
    KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Django权限表
CREATE TABLE IF NOT EXISTS `auth_permission` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `name` varchar(255) NOT NULL,
    `content_type_id` int NOT NULL,
    `codename` varchar(100) NOT NULL,
    UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`, `codename`),
    KEY `auth_permission_content_type_id_2f476e4b` (`content_type_id`),
    CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` 
        FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Django用户组表
CREATE TABLE IF NOT EXISTS `auth_group` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `name` varchar(150) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Django用户组权限表
CREATE TABLE IF NOT EXISTS `auth_group_permissions` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `group_id` int NOT NULL,
    `permission_id` int NOT NULL,
    UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`, `permission_id`),
    KEY `auth_group_permissions_group_id_b120cbf9` (`group_id`),
    KEY `auth_group_permissions_permission_id_84c5c92e` (`permission_id`),
    CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` 
        FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
    CONSTRAINT `auth_group_permissions_permission_id_84c5c92e_fk_auth_perm` 
        FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Django用户权限表
CREATE TABLE IF NOT EXISTS `users_user_groups` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint NOT NULL,
    `group_id` int NOT NULL,
    UNIQUE KEY `users_user_groups_user_id_group_id_b88eab82_uniq` (`user_id`, `group_id`),
    KEY `users_user_groups_user_id_5f6f5a90` (`user_id`),
    KEY `users_user_groups_group_id_9afc8d0e` (`group_id`),
    CONSTRAINT `users_user_groups_user_id_5f6f5a90_fk_users_id` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `users_user_groups_group_id_9afc8d0e_fk_auth_group_id` 
        FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Django用户权限表
CREATE TABLE IF NOT EXISTS `users_user_user_permissions` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint NOT NULL,
    `permission_id` int NOT NULL,
    UNIQUE KEY `users_user_user_permissions_user_id_permission_id_43338c45_uniq` (`user_id`, `permission_id`),
    KEY `users_user_user_permissions_user_id_20aca447` (`user_id`),
    KEY `users_user_user_permissions_permission_id_0b93982e` (`permission_id`),
    CONSTRAINT `users_user_user_permissions_user_id_20aca447_fk_users_id` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `users_user_user_permissions_permission_id_0b93982e_fk_auth_perm` 
        FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Django Admin日志表（可选，如果不用admin可以不创建）
CREATE TABLE IF NOT EXISTS `django_admin_log` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `action_time` datetime(6) NOT NULL,
    `object_id` longtext,
    `object_repr` varchar(200) NOT NULL,
    `action_flag` smallint unsigned NOT NULL,
    `change_message` longtext NOT NULL,
    `content_type_id` int,
    `user_id` bigint NOT NULL,
    KEY `django_admin_log_content_type_id_c4bce8eb` (`content_type_id`),
    KEY `django_admin_log_user_id_c564eba6` (`user_id`),
    CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` 
        FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
    CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_id` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. AuthToken表（如果使用DRF Token认证）
CREATE TABLE IF NOT EXISTS `authtoken_token` (
    `key` varchar(40) PRIMARY KEY,
    `created` datetime(6) NOT NULL,
    `user_id` bigint UNIQUE NOT NULL,
    CONSTRAINT `authtoken_token_user_id_35299eff_fk_users_id` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入基本的内容类型数据
INSERT IGNORE INTO `django_content_type` (`app_label`, `model`) VALUES
('auth', 'permission'),
('auth', 'group'),
('contenttypes', 'contenttype'),
('sessions', 'session'),
('admin', 'logentry'),
('authtoken', 'token'),
('users', 'user'),
('books', 'book'),
('books', 'category'),
('order', 'order'),
('chats', 'chatsession'),
('chats', 'chatmessage'),
('chats', 'systemmessage'),
('notifications', 'announcement'),
('notifications', 'notification'),
('user_collections', 'collection');

-- 插入基本权限数据
INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can add user', ct.id, 'add_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can change user', ct.id, 'change_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can delete user', ct.id, 'delete_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) 
SELECT 'Can view user', ct.id, 'view_user' FROM `django_content_type` ct WHERE ct.app_label = 'users' AND ct.model = 'user';

-- 注意事项：
-- 1. 这个脚本创建了Django运行的最小必需表
-- 2. 不包含完整的Django admin功能，如果需要可以手动添加
-- 3. 确保先创建users表，因为其他表有外键依赖 