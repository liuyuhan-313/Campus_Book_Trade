import os
import pymysql

from pathlib import Path

pymysql.install_as_MySQLdb()  

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-@h*7c(s3@nz7fccz*ih%+2vq%c%32h!l0zoz$@oo3#nz65^oj&'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']  # 允许所有主机访问，仅用于开发环境


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    
    'order',
    'books',
    'users',
    'chats',
    'user_collections',
    'notifications',
]

AUTH_USER_MODEL = 'users.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 跨域中间件
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
# 允许所有域访问（正式环境应限制为小程序域名）
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True

# DRF 配置
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    # 添加默认渲染器
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    # 添加分页
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

ROOT_URLCONF = 'campus_book_trade.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'campus_book_trade.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'campus_book_trade',  #数据库名称
        'USER': 'root',     # 数据库用户名
        'PASSWORD': '12345678',  # 数据库密码
        'HOST': 'localhost',  # 数据库主机地址
        'PORT': '3306',  # 数据库端口
        'OPTIONS': {
            'charset': 'utf8mb4',  # 确保使用 UTF-8 编码
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",  # 启用严格模式
        },
    }
}

pymysql.install_as_MySQLdb()

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'zh-hans'  # 修改为中文简体
TIME_ZONE = 'Asia/Shanghai'  # 修改时区

USE_I18N = True

USE_TZ = False  # 禁用时区支持


STATIC_URL = 'static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# CORS settings
CORS_ORIGIN_ALLOW_ALL = True  # 允许所有域访问
CORS_ALLOW_CREDENTIALS = True  # 允许携带cookie
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


AUTH_USER_MODEL = 'users.User'

# 文件上传设置
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# 完全禁用migrations系统
MIGRATION_MODULES = {
    'admin': None,
    'auth': None,
    'contenttypes': None,
    'sessions': None,
    'messages': None,
    'staticfiles': None,
    'authtoken': None,
    'rest_framework': None,
    'corsheaders': None,
    'order': None,
    'books': None,
    'users': None,
    'chats': None,
    'user_collections': None,
    'notifications': None,
}


# 微信小程序配置
WX_APPID = 'your-wx-appid' # 请修改为你的微信小程序AppID
WX_SECRET = 'your-wx-secret'  # 请修改为你的微信小程序Secret


# JWT设置
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),  # 访问令牌有效期
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # 刷新令牌有效期
    'ROTATE_REFRESH_TOKENS': True,  # 刷新令牌时是否重新生成刷新令牌
    'BLACKLIST_AFTER_ROTATION': True,  # 刷新后将旧令牌加入黑名单
    'UPDATE_LAST_LOGIN': True,  # 更新最后登录时间
}

# 日志配置
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'notifications': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
            
    },
        
}

# Django Admin 自定义配置
ADMIN_SITE_HEADER = '校园二手书交易平台管理系统'
ADMIN_SITE_TITLE = '校园二手书交易平台'
ADMIN_INDEX_TITLE = '欢迎使用校园二手书交易平台管理系统'
