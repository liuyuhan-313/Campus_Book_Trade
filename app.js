const { API } = require('./config/api')
const { request, uploadFile } = require('./utils/request')

App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:8000',
    campuses: ['邯郸校区', '枫林校区', '江湾校区', '张江校区'],
    categories: {
      type: ['专业书籍', '公共课教材', '考研资料', '课外读物'],
      subject: ['经济', '管理', '大数据', '思政', '英语'],
      condition: ['全新', '九成新', '八成新', '七成新', '六成新及以下']
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
      const res = await request(API.userInfo)
      console.log('Token验证成功:', res)
    } catch (error) {
      console.error('Token验证失败:', error)
      // token无效，清除登录状态
      this.clearLoginState()
    }
  },

  // 统一请求方法
  request(options) {
    return request(options)
  },

  // 上传文件
  uploadFile(filePath, type = 'image') {
    return uploadFile(filePath, type)
  },

  // 显示消息提示框
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    })
  },

  // 显示加载提示
  showLoading(title = '加载中') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  },

  // 清除登录状态
  clearLoginState() {
    this.globalData.userInfo = null
    this.globalData.token = ''
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
  }
}) 