const app = getApp()

Page({
  data: {
    userInfo: null,
    orderCounts: {
      pending_payment: 0,
      pending_delivery: 0,
      pending_receive: 0
    },
    collectionCount: 0,
    publishedCount: 0
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    } else {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
    
    this.loadCounts()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadCounts()
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.updateUserInfo({ avatarUrl })
  },

  // 获取用户信息
  getUserInfo(e) {
    if (e.detail.userInfo) {
      this.updateUserInfo(e.detail.userInfo)
    }
  },

  // 更新用户信息
  updateUserInfo(info) {
    const userInfo = { ...this.data.userInfo, ...info }
    this.setData({ userInfo })
    wx.setStorageSync('userInfo', userInfo)
    
    // TODO: 调用后端接口更新用户信息
  },

  // 加载各种计数
  loadCounts() {
    // TODO: 从服务器获取订单数量、收藏数量等
    this.setData({
      orderCounts: {
        pending_payment: 1,
        pending_delivery: 2,
        pending_receive: 0
      },
      collectionCount: 5,
      publishedCount: 3
    })
  },

  // 跳转到订单列表
  navigateToOrders(e) {
    const status = e.currentTarget.dataset.status
    wx.navigateTo({
      url: `/pages/orderList/orderList?status=${status}`
    })
  },

  // 跳转到收藏列表
  navigateToCollection() {
    wx.navigateTo({
      url: '/pages/collection/collection'
    })
  },

  // 跳转到已发布列表
  navigateToPublished() {
    wx.navigateTo({
      url: '/pages/published/published'
    })
  },

  // 显示信用分详情
  showCreditScore() {
    wx.showModal({
      title: '信用分说明',
      content: '信用分基于您的交易记录、评价等综合计算。保持良好的交易记录可以提升信用分。',
      showCancel: false
    })
  },

  // 联系客服
  contactService() {
    // 可以使用微信自带的客服功能
    wx.openCustomerServiceChat({
      extInfo: { url: '' },
      corpId: '', // 企业ID，需要替换
      success(res) {
        console.log('打开客服会话', res)
      }
    })
  }
}) 