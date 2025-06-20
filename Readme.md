# 校园二手书交易平台

一个基于微信小程序和Django REST Framework的校园二手书交易平台，支持图书发布、浏览、收藏、订单管理和在线聊天功能。

## 项目架构

- **前端**: 微信小程序
- **后端**: Django REST Framework + MySQL
- **数据库**: MySQL 8.0+
- **认证**: JWT Token + 微信小程序授权

## 功能特性

- 图书发布与管理
- 分类浏览与搜索
- 实时聊天系统
- 订单管理
- 图书收藏
- 系统通知与公告
- 用户信用评分系统

## 开发环境要求

### 操作系统
- macOS
- Windows 10/11

### 编程语言与版本
- **Python**: 3.8+（推荐 3.12）
- **Node.js**: 14.0+（用于微信开发者工具）
- **JavaScript**: ES6+

### 数据库
- **MySQL**: 8.0+
- **字符集**: utf8mb4
- **存储引擎**: InnoDB

### 开发工具
- **微信开发者工具**: 最新稳定版
- **Python IDE**: VS Code
- **数据库管理工具**: MySQL Workbench

### 依赖管理
- **Python**: pip + virtualenv
- **微信小程序**: 微信开发者工具内置包管理


## 安装与配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd miniprogram-6\ 5
```

### 2. 后端环境配置

#### 2.1 创建虚拟环境

```bash
cd Campus-Book-Trade
python3 -m venv myenv
source myenv/bin/activate  # macOS/Linux
myenv\Scripts\activate  # Windows
```

#### 2.2 安装Python依赖

```bash
pip install -r requirements.txt
```

#### 2.3 配置数据库连接

编辑 `Campus-Book-Trade/campus_book_trade/settings.py`：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'campus_book_trade',      # 数据库名称
        'USER': 'your_username',          # 你的MySQL用户名
        'PASSWORD': 'your_password',      # 修改成你的MySQL密码！！！
        'HOST': 'localhost',              # 数据库主机
        'PORT': '3306',                   # 数据库端口
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}
```

#### 2.4 配置微信小程序

编辑 `Campus-Book-Trade/campus_book_trade/settings.py`：

```python
# 微信小程序配置（修改settings.py）
WX_APPID = 'wxb7ab54b2420832c0'
WX_SECRET = 'a6c45927b9b911562d89eec9b7642f38'。 
```

### 3. 前端环境配置

#### 3.1 配置API地址

编辑 `config/api.js`，确保API地址指向后端服务：

```javascript
// 开发环境配置
const BASE_URL = 'http://127.0.0.1:8000';  // Django后端地址
```

#### 3.2 微信开发者工具配置

1. 打开微信开发者工具
2. 导入项目，选择项目根目录
3. 配置AppID（wxb7ab54b2420832c0）
4. 在"详情"中勾选"不校验合法域名"


## 数据库初始化流程

### 1. 创建数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE campus_book_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 执行完整数据库脚本

```bash
cd Campus-Book-Trade
mysql -u root -p campus_book_trade < sql/create_complete_database.sql
```

该脚本包含：
- 所有业务表结构
- Django系统表
- 预定义书籍分类数据
- 触发器和存储过程
- 索引和约束

## 测试数据导入方法（也可以直接在微信开发者工具里面发布书籍）

### 1. 创建Django超级用户

```bash
cd Campus-Book-Trade
python manage.py createsuperuser
```

### 2. 导入测试用户数据

通过Django Admin或直接SQL插入：

```sql
-- 插入测试用户（微信小程序用户）
INSERT INTO users (password, username, openid, nickname, phone, student_id, campus, role, date_joined, is_active) VALUES
('pbkdf2_sha256$390000$test', 'test_user1', 'test_openid_001', '测试用户1', '13800000001', '20210001', 'handan', 'user', NOW(), 1),
('pbkdf2_sha256$390000$test', 'test_user2', 'test_openid_002', '测试用户2', '13800000002', '20210002', 'fenglin', 'user', NOW(), 1);
```

### 3. 导入测试图书数据

```sql
-- 插入测试图书
INSERT INTO books_book (seller_id, title, author, publisher, category_id, description, price, `condition`, campus, image_urls, created_at, updated_at) VALUES
(1, '高等数学', '同济大学', '高等教育出版社', 1, '九成新的高数教材', 35.00, 'like_new', 'handan', '[]', NOW(), NOW()),
(2, 'Python编程入门', '张三', '人民邮电出版社', 3, '适合编程初学者', 45.00, 'good', 'fenglin', '[]', NOW(), NOW());
```

## 项目运行步骤

### 1. 启动后端服务

```bash
cd Campus-Book-Trade
#source myenv/bin/activate  # 激活虚拟环境 macOS/Linux
myenv\Scripts\activate #激活虚拟环境 Windows
python manage.py runserver
```

后端服务将在 `http://127.0.0.1:8000` 启动。

### 2. 启动前端小程序

1. 打开微信开发者工具
2. 打开项目（选择项目根目录）
3. 点击"编译"按钮
4. 在模拟器中预览效果

## 使用方法

### 用户端功能

1. **用户注册登录**
   - 通过微信授权登录
   - 完善个人信息（学号、校区等）

2. **浏览图书**
   - 首页浏览推荐图书
   - 分类浏览图书
   - 搜索功能

3. **发布图书**
   - 填写图书信息
   - 上传图书照片
   - 设置价格和成色

4. **交易流程**
   - 收藏感兴趣的图书
   - 与卖家聊天沟通
   - 创建订单进行交易

5. **订单管理**
   - 查看订单状态
   - 确认收货
   - 申请退款

### 管理员功能

1. **访问Django Admin**
   - 地址：`http://127.0.0.1:8000/admin/`
   - 使用超级用户账号登录

2. **数据管理**
   - 用户管理
   - 图书审核
   - 订单监控
   - 系统公告发布

## API接口说明

主要API接口包括：

- **用户相关**: `/api/users/`
- **图书相关**: `/api/books/`
- **订单相关**: `/api/orders/`
- **聊天相关**: `/api/chats/`
- **收藏相关**: `/api/collections/`

详细API文档可访问：`http://127.0.0.1:8000/api/` 
## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 验证数据库配置信息（修改settings.py数据库密码并保存）
   - 确认PyMySQL已安装

2. **微信小程序无法调用API**
   - 检查微信开发者工具中是否勾选"不校验合法域名"
   - 确认后端服务正常运行
   - 检查API地址配置

3. **静态文件访问问题**
   - 确认MEDIA_ROOT和MEDIA_URL配置正确
   - 检查文件上传权限

##小组分工
- 刘羽涵：搭建前后端框架，负责用户、订单、信用评分功能实现及API接口调用，需求分析及ER图，期末系统演示。
- 郭佳蕊：搭建后端框架，负责用户、书籍等功能的实现及API接口调用，需求分析，期中汇报。
- 付思晨：搭建后端框架，负责书籍、消息等功能的实现及API接口调用，表结构设计，期末汇报。
- 李佳蔚：负责书籍收藏功能的实现及API接口调用，表结构设计，模块划分，期中汇报。