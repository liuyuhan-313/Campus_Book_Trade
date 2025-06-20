-- 创建Django系统必需的表

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
CREATE TABLE IF NOT EXISTS `users_groups` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint NOT NULL,
    `group_id` int NOT NULL,
    KEY `users_groups_user_id_b88eab82_fk_users_id` (`user_id`),
    KEY `users_groups_group_id_9afc8d0e_fk_auth_group_id` (`group_id`),
    UNIQUE KEY `users_groups_user_id_group_id_e6715738_uniq` (`user_id`, `group_id`),
    CONSTRAINT `users_groups_user_id_b88eab82_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `users_groups_group_id_9afc8d0e_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Django用户权限关联表
CREATE TABLE IF NOT EXISTS `users_user_permissions` (
    `id` bigint AUTO_INCREMENT PRIMARY KEY,
    `user_id` bigint NOT NULL,
    `permission_id` int NOT NULL,
    KEY `users_user_permissions_user_id_20aca447_fk_users_id` (`user_id`),
    KEY `users_user_permissions_permission_id_0b93982e_fk_auth_perm` (`permission_id`),
    UNIQUE KEY `users_user_permissions_user_id_permission_id_43338c45_uniq` (`user_id`, `permission_id`),
    CONSTRAINT `users_user_permissions_user_id_20aca447_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `users_user_permissions_permission_id_0b93982e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
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

-- 插入Django基础内容类型数据
INSERT IGNORE INTO `django_content_type` (`app_label`, `model`) VALUES
('admin', 'logentry'),
('auth', 'permission'),
('auth', 'group'),
('contenttypes', 'contenttype'),
('sessions', 'session'),
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

-- 插入Django基础权限数据
INSERT IGNORE INTO `auth_permission` (`name`, `content_type_id`, `codename`) VALUES
('Can add log entry', (SELECT id FROM django_content_type WHERE app_label='admin' AND model='logentry'), 'add_logentry'),
('Can change log entry', (SELECT id FROM django_content_type WHERE app_label='admin' AND model='logentry'), 'change_logentry'),
('Can delete log entry', (SELECT id FROM django_content_type WHERE app_label='admin' AND model='logentry'), 'delete_logentry'),
('Can view log entry', (SELECT id FROM django_content_type WHERE app_label='admin' AND model='logentry'), 'view_logentry'),

('Can add permission', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='permission'), 'add_permission'),
('Can change permission', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='permission'), 'change_permission'),
('Can delete permission', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='permission'), 'delete_permission'),
('Can view permission', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='permission'), 'view_permission'),

('Can add group', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='group'), 'add_group'),
('Can change group', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='group'), 'change_group'),
('Can delete group', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='group'), 'delete_group'),
('Can view group', (SELECT id FROM django_content_type WHERE app_label='auth' AND model='group'), 'view_group'),

('Can add content type', (SELECT id FROM django_content_type WHERE app_label='contenttypes' AND model='contenttype'), 'add_contenttype'),
('Can change content type', (SELECT id FROM django_content_type WHERE app_label='contenttypes' AND model='contenttype'), 'change_contenttype'),
('Can delete content type', (SELECT id FROM django_content_type WHERE app_label='contenttypes' AND model='contenttype'), 'delete_contenttype'),
('Can view content type', (SELECT id FROM django_content_type WHERE app_label='contenttypes' AND model='contenttype'), 'view_contenttype'),

('Can add session', (SELECT id FROM django_content_type WHERE app_label='sessions' AND model='session'), 'add_session'),
('Can change session', (SELECT id FROM django_content_type WHERE app_label='sessions' AND model='session'), 'change_session'),
('Can delete session', (SELECT id FROM django_content_type WHERE app_label='sessions' AND model='session'), 'delete_session'),
('Can view session', (SELECT id FROM django_content_type WHERE app_label='sessions' AND model='session'), 'view_session'),

('Can add user', (SELECT id FROM django_content_type WHERE app_label='users' AND model='user'), 'add_user'),
('Can change user', (SELECT id FROM django_content_type WHERE app_label='users' AND model='user'), 'change_user'),
('Can delete user', (SELECT id FROM django_content_type WHERE app_label='users' AND model='user'), 'delete_user'),
('Can view user', (SELECT id FROM django_content_type WHERE app_label='users' AND model='user'), 'view_user');

-- 建表完成后的注意事项：
-- 1. 这些是Django框架必需的系统表
-- 2. 执行完成后Django管理后台应该能够正常访问
-- 3. 建议在Django项目中运行 python manage.py migrate --fake-initial 来同步迁移记录 