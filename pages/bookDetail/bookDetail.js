const app = getApp()
const { API } = require('../../config/api')

Page({
  data: {
    book: null,
    isCollected: false
  },

  onLoad(options) {
    const { id } = options
    this.loadBookDetail(id)
  },

  // 加载书籍详情
  async loadBookDetail(id) {
    try {
      const res = await app.request({
        url: API.bookDetail,
        data: { id }
      })
      this.setData({
        book: res.data,
        isCollected: res.data.isCollected
      })
    } catch (error) {
      console.error('加载书籍详情失败', error)
      app.showToast('加载失败，请重试')
    }
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      current: url,
      urls: this.data.book.images
    })
  },

  // 联系卖家
  contactSeller() {
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${this.data.book.seller.id}&bookId=${this.data.book.id}`
    })
  },

  // 收藏/取消收藏
  async toggleCollect() {
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    try {
      const res = await app.request({
        url: API.toggleCollect,
        method: 'POST',
        data: {
          bookId: this.data.book.id
        }
      })
      this.setData({
        isCollected: res.data.isCollected
      })
      app.showToast(res.data.isCollected ? '收藏成功' : '已取消收藏', 'success')
    } catch (error) {
      console.error('收藏操作失败', error)
      app.showToast('操作失败，请重试')
    }
  },

  // 分享
  share() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 购买
  buy() {
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.showModal({
      title: '确认购买',
      content: `确定要以 ¥${this.data.book.price} 购买这本书吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const res = await app.request({
              url: API.createOrder,
              method: 'POST',
              data: {
                bookId: this.data.book.id
              }
            })
            wx.navigateTo({
              url: `/pages/orderDetail/orderDetail?id=${res.data.orderId}`
            })
          } catch (error) {
            console.error('创建订单失败', error)
            app.showToast('购买失败，请重试')
          }
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.book.title,
      path: `/pages/bookDetail/bookDetail?id=${this.data.book.id}`,
      imageUrl: this.data.book.images[0]
    }
  },

  onShareTimeline() {
    return {
      title: this.data.book.title,
      query: `id=${this.data.book.id}`,
      imageUrl: this.data.book.images[0]
    }
  }
}) 