const app = getApp();
const { getOrderDetail } = require('../../api/order');
const { request } = require('../../utils/request');
const { API } = require('../../config/api');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: true,
    statusMap: {
      'UNPAID': '待付款',
      'PAID': '待收货',
      'RECEIVED': '待评价',
      'REFUNDING': '退款中',
      'REFUNDED': '已退款',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消'
    }
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({
        title: '订单ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ orderId: id });
    this.loadOrderDetail();
  },

  async loadOrderDetail() {
    try {
      this.setData({ loading: true });

      const res = await request({
        url: API.orderDetail.replace('{id}', this.data.orderId),
        method: 'GET'
      });

      if (res.code === 0) {
        this.setData({
          orderInfo: res.data
        });
      } else {
        throw new Error(res.msg || '获取订单详情失败');
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 支付订单
  async payOrder() {
    try {
      const { orderInfo } = this.data;
      if (!orderInfo) {
        wx.showToast({
          title: '订单信息不存在',
          icon: 'none'
        });
        return;
      }

      // 显示支付确认弹窗
      const res = await wx.showModal({
        title: '确认支付',
        content: `确定要支付 ¥${orderInfo.amount} 吗？`,
        confirmText: '确认支付'
      });

      if (!res.confirm) {
        return;
      }

      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      // 更新订单状态为已支付
      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', orderInfo.id),
        method: 'POST',
        data: {
          status: 'PAID'
        }
      });

      if (!response || response.code !== 0) {
        throw new Error(response?.msg || '支付失败');
      }

      // 更新书籍状态为已售出
      const bookResponse = await request({
        url: API.updateStatus.replace('{id}', orderInfo.book.id),
        method: 'POST',
        data: {
          status: 'sold_out'
        }
      });

      if (!bookResponse || bookResponse.code !== 0) {
        // 如果更新书籍状态失败，回滚订单状态
        await request({
          url: API.orderUpdateStatus.replace('{id}', orderInfo.id),
          method: 'POST',
          data: {
            status: 'UNPAID'
          }
        });
        throw new Error('更新书籍状态失败');
      }

      wx.hideLoading();
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      });

      // 重新加载订单详情
      this.loadOrderDetail();

    } catch (error) {
      console.error('支付订单失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      });
    }
  },

  // 取消订单
  async cancelOrder() {
    try {
      const res = await wx.showModal({
        title: '确认取消',
        content: '确定要取消这个订单吗？',
        confirmText: '确定取消'
      });

      if (!res.confirm) {
        return;
      }

      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', this.data.orderInfo.id),
        method: 'POST',
        data: {
          status: 'CANCELLED'
        }
      });

      if (!response || response.code !== 0) {
        throw new Error(response?.msg || '取消订单失败');
      }

      wx.hideLoading();
      wx.showToast({
        title: '取消成功',
        icon: 'success'
      });
      
      this.loadOrderDetail();
    } catch (error) {
      console.error('取消订单失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 申请退款
  async applyRefund() {
    try {
      const res = await wx.showModal({
        title: '申请退款',
        content: '确定要申请退款吗？',
        confirmText: '确定申请'
      });

      if (!res.confirm) {
        return;
      }

      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', this.data.orderInfo.id),
        method: 'POST',
        data: {
          status: 'REFUNDING'
        }
      });

      if (!response || response.code !== 0) {
        throw new Error(response?.msg || '申请退款失败');
      }

      wx.hideLoading();
      wx.showToast({
        title: '申请成功',
        icon: 'success'
      });
      
      this.loadOrderDetail();
    } catch (error) {
      console.error('申请退款失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '申请失败',
        icon: 'none'
      });
    }
  },

  // 取消退款
  async cancelRefund() {
    try {
      const res = await wx.showModal({
        title: '取消退款',
        content: '确定要取消退款申请吗？',
        confirmText: '确定取消'
      });

      if (!res.confirm) {
        return;
      }

      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', this.data.orderInfo.id),
        method: 'POST',
        data: {
          status: 'PAID'
        }
      });

      if (!response || response.code !== 0) {
        throw new Error(response?.msg || '取消退款失败');
      }

      wx.hideLoading();
      wx.showToast({
        title: '取消成功',
        icon: 'success'
      });
      
      this.loadOrderDetail();
    } catch (error) {
      console.error('取消退款失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 确认收货
  async confirmReceipt() {
    try {
      const res = await wx.showModal({
        title: '确认收货',
        content: '确认已收到商品？',
        confirmText: '确认收货'
      });

      if (!res.confirm) {
        return;
      }

      wx.showLoading({
        title: '处理中...',
        mask: true
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', this.data.orderInfo.id),
        method: 'POST',
        data: {
          status: 'RECEIVED'
        }
      });

      if (!response || response.code !== 0) {
        throw new Error(response?.msg || '确认收货失败');
      }

      wx.hideLoading();
      wx.showToast({
        title: '确认成功',
        icon: 'success'
      });
      
      this.loadOrderDetail();
    } catch (error) {
      console.error('确认收货失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '确认失败',
        icon: 'none'
      });
    }
  },

  // 联系卖家
  contactSeller() {
    const { orderInfo } = this.data;
    if (!orderInfo?.book?.seller_id) {
      wx.showToast({
        title: '卖家信息不存在',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/chat/chat?targetUserId=${orderInfo.book.seller_id}`,
      fail: (err) => {
        console.error('跳转到聊天页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 评价订单
  writeReview() {
    const { orderInfo } = this.data;
    if (!orderInfo) {
      wx.showToast({
        title: '订单信息不存在',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/review/review?orderId=${orderInfo.id}`,
      fail: (err) => {
        console.error('跳转到评价页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 复制订单号
  copyOrderNumber() {
    if (this.data.orderInfo?.order_number) {
      wx.setClipboardData({
        data: this.data.orderInfo.order_number,
        success: () => {
          wx.showToast({
            title: '复制成功',
            icon: 'success'
          });
        }
      });
    }
  },

  // 联系客服
  contactService() {
    wx.showToast({
      title: '请联系微信客服：your-wechat-id',
      icon: 'none',
      duration: 3000
    });
  }
}); 