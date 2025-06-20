const app = getApp();
const { API } = require('../../config/api');
const { request } = require('../../utils/request');
const { updateBookStatus } = require('../../api/book');
const { getOrderDetail } = require('../../api/order');

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
      const statusMapping = {
        'pending_payment': 'UNPAID',
        'pending_receipt': 'PAID',
        'pending_review': 'RECEIVED',
        'refund': 'REFUNDING'
      };
      const backendStatus = statusMapping[options.status] || options.status;
      this.setData({ currentStatus: backendStatus });
    }
    this.loadOrders();
  },

  // 切换订单状态
  changeStatus(e) {
    const frontendStatus = e.currentTarget.dataset.status;
    // 将前端状态码转换为后端状态码
    const statusMapping = {
      'pending_payment': 'UNPAID',
      'pending_receipt': 'PAID',
      'pending_review': 'RECEIVED',
      'refund': 'REFUNDING'
    };
    const backendStatus = statusMapping[frontendStatus] || frontendStatus;
    
    this.setData({
      currentStatus: backendStatus,
      orders: [],
      page: 1,
      hasMore: true
    });
    this.loadOrders();
  },

  // 加载订单列表
  async loadOrders() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ loading: true });
    try {
      const res = await request({
        url: API.orderListByStatus,
        method: 'GET',
        data: {
          status: this.data.currentStatus,
          page: this.data.page,
          page_size: this.data.pageSize
        }
      });

      console.log('订单列表响应:', res);

      if (!res || typeof res !== 'object') {
        throw new Error('服务器响应格式错误');
      }

      if (res.code !== 0) {
        throw new Error(res.msg || '获取订单列表失败');
      }

      // 处理返回的数据
      const orders = res.list || [];
      const newOrders = orders.map(order => ({
        ...order,
        statusText: this.data.statusMap[order.status] || order.status,
        created_at: this.formatDate(order.created_at)
      }));

      this.setData({
        orders: [...this.data.orders, ...newOrders],
        total: res.total,
        hasMore: this.data.orders.length + newOrders.length < res.total,
        page: this.data.page + 1,
        loading: false
      });
    } catch (error) {
      console.error('加载订单失败:', error);
      wx.showToast({
        title: error.message || '加载失败，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    }
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 支付订单
  async payOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      wx.showLoading({
        title: '处理中...'
      });

      // 获取订单信息
      const orderRes = await request({
        url: API.orderDetail.replace('{id}', orderId),
        method: 'GET'
      });

      console.log('订单详情:', orderRes); // 添加日志

      if (!orderRes || orderRes.code !== 0) {
        throw new Error(orderRes?.msg || '获取订单信息失败');
      }

      // 更新订单状态为已支付
      const res = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'PAID'
        }
      });

      if (res.code === 0) {
        // 更新书籍状态为已售出（售罄）
        // 注意这里：orderRes.data 中的 book 字段
        const bookId = orderRes.data.book;  // 修改这里，直接使用 book 字段
        if (!bookId) {
          throw new Error('订单中没有书籍信息');
        }

        await request({
          url: API.updateStatus.replace('{id}', bookId),
          method: 'POST',
          data: {
            status: 'sold_out'
          }
        });

        wx.hideLoading();
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        
        // 刷新订单列表
        this.refreshOrders();
      } else {
        throw new Error(res.msg || '支付失败');
      }
    } catch (error) {
      console.error('支付订单失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'none'
      });
    }
  },

  // 确认收货
  async confirmReceipt(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      wx.showLoading({
        title: '处理中...'
      });

      // 获取订单信息
      const orderRes = await request({
        url: API.orderDetail.replace('{id}', orderId),
        method: 'GET'
      });

      console.log('订单详情:', orderRes); // 添加日志

      if (!orderRes || orderRes.code !== 0) {
        throw new Error(orderRes?.msg || '获取订单信息失败');
      }

      // 更新订单状态为已收货
      const res = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'RECEIVED'
        }
      });
      
      if (res.code === 0) {
        // 更新书籍状态为已完成交易（从首页移除）
        const bookId = orderRes.data.book;  // 修改这里，直接使用 book 字段
        if (!bookId) {
          throw new Error('订单中没有书籍信息');
        }

        await request({
          url: API.updateStatus.replace('{id}', bookId),
          method: 'POST',
          data: {
            status: 'completed'  // 修改为完成状态，将从首页移除
          }
        });

        wx.hideLoading();
        wx.showToast({
          title: '确认收货成功',
          icon: 'success'
        });
        
        this.refreshOrders();
      } else {
        throw new Error(res.msg || '确认收货失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '确认收货失败',
        icon: 'none'
      });
    }
  },

  // 申请退款
  async applyRefund(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      wx.showLoading({
        title: '处理中...'
      });

      const res = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'REFUNDING'
        }
      });
      
      if (res.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '申请退款成功',
          icon: 'success'
        });
        this.refreshOrders();
      } else {
        throw new Error(res.msg || '申请退款失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '申请退款失败',
        icon: 'none'
      });
    }
  },

  // 取消退款
  async cancelRefund(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      wx.showLoading({
        title: '处理中...'
      });

      const res = await request({
        url: API.orderUpdateStatus.replace('{id}', orderId),
        method: 'POST',
        data: {
          status: 'PAID'
        }
      });
      
      if (res.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '取消退款成功',
          icon: 'success'
        });
        this.refreshOrders();
      } else {
        throw new Error(res.msg || '取消退款失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '取消退款失败',
        icon: 'none'
      });
    }
  },

  // 显示评分弹窗
  showRatingModal(e) {
    const orderId = e.currentTarget.dataset.id;
    this.setData({
      showRating: true,
      currentOrderId: orderId,
      rating: 0,
      ratingComment: ''
    });
  },

  // 关闭评分弹窗
  closeRatingModal() {
    this.setData({
      showRating: false,
      currentOrderId: null,
      rating: 0,
      ratingComment: ''
    });
  },

  // 设置评分
  setRating(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },

  // 评价内容输入
  onCommentInput(e) {
    this.setData({
      ratingComment: e.detail.value
    });
  },

  // 提交评价
  async submitRating() {
    const { currentOrderId, rating, ratingComment } = this.data;
    
    if (rating === 0) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '提交中...'
      });

      const res = await request({
        url: API.orderUpdateStatus.replace('{id}', currentOrderId),
        method: 'POST',
        data: {
          status: 'COMPLETED',
          rating,
          comment: ratingComment
        }
      });
      
      if (res.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        });
        
        this.closeRatingModal();
        this.refreshOrders();
      } else {
        throw new Error(res.msg || '评价失败');
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '评价失败',
        icon: 'none'
      });
    }
  },

  // 联系客服
  contactService() {
    // 实现联系客服的逻辑，可以是跳转到客服页面或打开客服会话
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

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshOrders();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadOrders();
  }
}); 