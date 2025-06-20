const app = getApp();
const { API } = require('../../config/api');
const { request } = require('../../utils/request');
const { updateBookStatus } = require('../../api/book');
const { getOrderList, getOrderDetail } = require('../../api/order');

Page({
  data: {
    currentStatus: '',
    orders: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    total: 0,
    showRating: false,
    rating: 0,
    ratingComment: '',
    currentOrderId: null,
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
    // 检查是否已登录
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
        }
      });
      return;
    }

    if (options.status) {
      this.setData({ currentStatus: options.status });
    }
    this.loadOrders();
  },

  // 加载订单列表
  async loadOrders() {
    if (this.data.loading || !this.data.hasMore) return;

    try {
      this.setData({ loading: true });
      
      const params = {
        page: this.data.page,
        page_size: this.data.pageSize
      };
      
      if (this.data.currentStatus) {
        params.status = this.data.currentStatus;
      }

      console.log('开始加载订单列表，参数：', params);

      const res = await request({
        url: API.orderListByStatus,
        method: 'GET',
        data: params
      });

      console.log('订单列表响应：', res);

      if (res.code === 0) {
        const newOrders = res.list || [];
        const total = res.total || 0;

        this.setData({
          orders: this.data.page === 1 ? newOrders : [...this.data.orders, ...newOrders],
          total,
          hasMore: this.data.orders.length < total,
          page: this.data.page + 1
        });
      } else {
        throw new Error(res.msg || '获取订单列表失败');
      }
    } catch (error) {
      console.error('加载订单列表失败：', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 切换订单状态
  changeStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      currentStatus: status,
      orders: [],
      page: 1,
      hasMore: true
    });
    this.loadOrders();
  },

  // 刷新订单列表
  refreshOrders() {
    this.setData({
      orders: [],
      page: 1,
      hasMore: true
    });
    this.loadOrders();
  },

  // 跳转到订单详情
  goToOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orderDetail/orderDetail?id=${orderId}`
    });
  },

  // 取消订单
  async cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      const res = await wx.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        confirmText: '确定取消'
      });

      if (!res.confirm) return;

      wx.showLoading({
        title: '处理中...'
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'CANCELLED'
        }
      });
      
      if (response.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '取消成功',
          icon: 'success'
        });
        this.refreshOrders();
      } else {
        throw new Error(response.msg || '取消订单失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 申请退款
  async applyRefund(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      const res = await wx.showModal({
        title: '申请退款',
        content: '确定要申请退款吗？',
        confirmText: '确定申请'
      });

      if (!res.confirm) return;

      wx.showLoading({
        title: '处理中...'
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'REFUNDING'
        }
      });
      
      if (response.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '申请成功',
          icon: 'success'
        });
        this.refreshOrders();
      } else {
        throw new Error(response.msg || '申请退款失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '申请失败',
        icon: 'none'
      });
    }
  },

  // 取消退款
  async cancelRefund(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      const res = await wx.showModal({
        title: '取消退款',
        content: '确定要取消退款申请吗？',
        confirmText: '确定取消'
      });

      if (!res.confirm) return;

      wx.showLoading({
        title: '处理中...'
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'PAID'
        }
      });
      
      if (response.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '取消成功',
          icon: 'success'
        });
        this.refreshOrders();
      } else {
        throw new Error(response.msg || '取消退款失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 确认收货
  async confirmReceipt(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      const res = await wx.showModal({
        title: '确认收货',
        content: '确认已收到商品？',
        confirmText: '确认收货'
      });

      if (!res.confirm) return;

      wx.showLoading({
        title: '处理中...'
      });

      const response = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'RECEIVED'
        }
      });
      
      if (response.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '确认成功',
          icon: 'success'
        });
        this.refreshOrders();
      } else {
        throw new Error(response.msg || '确认收货失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '确认失败',
        icon: 'none'
      });
    }
  },

  // 跳转到评价页面
  writeReview(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/review/review?orderId=${orderId}`
    });
  },

  // 联系客服
  contactService() {
    wx.showToast({
      title: '请联系微信客服：your-wechat-id',
      icon: 'none',
      duration: 3000
    });
  },

  // 删除订单
  async deleteOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      const res = await wx.showModal({
        title: '删除订单',
        content: '确定要删除这个订单吗？删除后不可恢复',
        confirmText: '确定删除'
      });

      if (!res.confirm) return;

      wx.showLoading({
        title: '处理中...'
      });

      const response = await request({
        url: API.orderDelete.replace('{id}', orderId),
        method: 'DELETE'
      });
      
      if (response.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        this.refreshOrders();
      } else {
        throw new Error(response.msg || '删除订单失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
    }
  },

  onReachBottom() {
    this.loadOrders();
  }
}); 