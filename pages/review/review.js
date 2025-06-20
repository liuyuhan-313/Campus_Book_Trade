const app = getApp()
const { request } = require('../../utils/request')
const { API } = require('../../config/api')

Page({
  data: {
    orderId: null,
    rating: 5,
    ratingComment: '',
    loading: false
  },

  onLoad: function(options) {
    if (options.orderId) {
      this.setData({
        orderId: options.orderId
      })
      console.log('[Review] 加载评价页面，订单ID:', options.orderId)
    } else {
      wx.showToast({
        title: '订单ID不存在',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      })
    }
  },

  onRatingChange: function(e) {
    const newRating = parseInt(e.detail.value)
    console.log('[Review] 评分变更:', newRating)
    this.setData({
      rating: newRating
    })
  },

  onContentInput: function(e) {
    this.setData({
      ratingComment: e.detail.value
    })
  },

  submitReview: async function() {
    const { orderId, rating, ratingComment } = this.data
    
    if (rating === 0) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      })
      return
    }

    console.log('[Review] 准备提交评价:', {
      orderId,
      rating,
      ratingComment
    })

    try {
      this.setData({ loading: true })
      wx.showLoading({
        title: '提交中...'
      })

      const requestData = {
        status: 'COMPLETED',
        rating: parseInt(rating),
        comment: ratingComment
      }
      console.log('[Review] 发送请求:', {
        url: API.orderUpdateStatus.replace('{id}', orderId),
        data: requestData
      })

      const res = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: requestData
      })
      
      console.log('[Review] 收到响应:', res)

      if (res.code === 0) {
        wx.hideLoading()
        wx.showToast({
          title: '评价成功',
          icon: 'success',
          success: () => {
            setTimeout(() => {
              // 返回订单详情页
              wx.navigateBack()
            }, 1500)
          }
        })
      } else {
        throw new Error(res.msg || '评价失败')
      }
    } catch (error) {
      console.error('[Review] 评价失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: error.message || '评价失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 