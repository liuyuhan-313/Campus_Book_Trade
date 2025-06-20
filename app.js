const { API } = require('./config/api')
const { request, uploadFile } = require('./utils/request')

// 环境配置
const ENV = {
  development: {
    // 开发者工具中使用
    local: 'http://127.0.0.1:8000/',
    // 真机调试使用（需要替换为您电脑的局域网IP）
    remote: 'http://192.168.1.100:8000/'  // 这里需要替换为您的电脑IP地址
  },
  production: {
    // 生产环境使用
    url: 'https://your-production-domain.com/'  // 这里需要替换为您的生产环境域名
  }
};

App({
  globalData: {
    userInfo: null,
    token: '',
    messageNeedRefresh: false,  // 添加这个变量用于控制消息列表刷新
    profileNeedRefresh: false,  // 添加这个变量用于控制个人资料页面刷新
    // 根据环境和设备类型选择合适的baseUrl
    baseUrl: (() => {
      // 获取小程序环境信息
      const accountInfo = wx.getAccountInfoSync();
      const env = accountInfo.miniProgram.envVersion;
      
      // 判断是否在开发者工具中运行
      const systemInfo = wx.getSystemInfoSync();
      const isDevTools = systemInfo.platform === 'devtools';
      
      // 根据环境返回对应的baseUrl
      if (env === 'develop' || env === 'trial') {
        return isDevTools ? ENV.development.local : ENV.development.remote;
      } else {
        return ENV.production.url;
      }
    })(),
    campuses: [
      { value: '', label: '全部校区' },
      { value: 'handan', label: '邯郸校区' },
      { value: 'fenglin', label: '枫林校区' },
      { value: 'jiangwan', label: '江湾校区' },
      { value: 'zhangjiang', label: '张江校区' }
    ],
    categories: {
            type: [
              { id: 1, name: '教材教辅' },
              { id: 2, name: '文学小说' },
              { id: 3, name: '计算机与互联网' },
              { id: 4, name: '经管励志' },
              { id: 5, name: '考研资料' },
              { id: 6, name: '外语学习' },
              { id: 7, name: '科学技术' },
              { id: 8, name: '其他' }
            ],
            subject: ['经济', '管理', '大数据', '思政', '英语'],
            condition: [
              { value: 'new', label: '全新' },
              { value: 'like_new', label: '九成新' },
              { value: 'good', label: '八成新' },
              { value: 'fair', label: '七成新' },
              { value: 'poor', label: '六成新及以下' }
            ]
          }
  },

  onLaunch() {
    // 获取本地存储的用户信息和token
    const userInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('token')
    
    if (userInfo && token) {
      this.globalData.userInfo = userInfo
      this.globalData.token = token
      // 验证token是否有效
      this.checkToken()
    }
  },

  // 检查token是否有效
  async checkToken() {
    try {
      const res = await request({
        url: API.userInfo,
        method: 'GET'
      });
      
      console.log('Token验证响应:', res);

      // 检查响应是否有效
      if (!res) {
        throw new Error('服务器无响应');
      }

      // 支持多种响应格式
      const userData = res.user || res.data || res;
      
      // 验证用户数据是否包含必要信息
      if (userData && userData.id) {
        console.log('Token验证成功，用户数据:', userData);
        
        // 更新用户信息
        this.globalData.userInfo = userData;
        wx.setStorageSync('userInfo', userData);
        
        // 如果响应中包含新token则更新
        if (res.token) {
          this.globalData.token = res.token;
          wx.setStorageSync('token', res.token);
        }
        
        return true;
      } else {
        throw new Error('用户数据无效');
      }
    } catch (error) {
      console.error('Token验证失败:', error);
      
      // 根据错误类型处理
      if (error.statusCode === 401 || error.message.includes('未登录') || error.message.includes('登录已过期')) {
        this.clearLoginState();
        
        // 如果不是在登录页，则跳转到登录页
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        if (currentPage && !currentPage.route.includes('login')) {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
      
      return false;
    }
  },

  // 统一请求方法
  request(options) {
    if (typeof options === 'string') {
      return request(options);
    }
    return request(options);
  },

  // 上传文件
  uploadFile(filePath, type = 'image') {
    return uploadFile(filePath, type);
  },

  // 显示消息提示框
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    });
  },

  // 显示加载提示
  showLoading(title = '加载中') {
    wx.showLoading({
      title,
      mask: true
    });
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading();
  },

  // 清除登录状态
  clearLoginState() {
    this.globalData.userInfo = null;
    this.globalData.token = '';
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
  }
}); 