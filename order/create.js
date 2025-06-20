import { createOrder } from '../../api/order';
import { getBookDetail } from '../../api/book';

const app = getApp();

Page({
  data: {
    bookInfo: null,
    address: '',
    contactName: '',
    contactPhone: '',
    loading: false
  },

  onLoad(options) {
    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    console.log('页面加载时的用户信息:', {
      userInfo,
      hasId: !!userInfo?.id,
      userId: userInfo?.id,
      hasToken: !!token
    });

    if (!userInfo || !userInfo.id || !token) {
      console.log('用户信息不完整，需要重新登录');
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);
      return;
    }

    const { bookId } = options;
    if (bookId) {
      this.loadBookInfo(bookId);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载书籍信息
  async loadBookInfo(bookId) {
    try {
      this.setData({ loading: true });
      const response = await getBookDetail(bookId);
      console.log('书籍详情:', response);
      
      const bookData = response.data || response;
      this.setData({
        bookInfo: {
          id: bookData.id,
          title: bookData.title,
          price: bookData.price,
          cover: bookData.images?.[0] || '/assets/images/default-book.png'
        },
        loading: false
      });
    } catch (error) {
      console.error('加载书籍信息失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 输入地址
  onAddressInput(e) {
    this.setData({
      address: e.detail.value
    });
  },

  // 输入联系人
  onContactNameInput(e) {
    this.setData({
      contactName: e.detail.value
    });
  },

  // 输入联系电话
  onContactPhoneInput(e) {
    this.setData({
      contactPhone: e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    const { address, contactName, contactPhone } = this.data;
    
    if (!address.trim()) {
      wx.showToast({
        title: '请填写收货地址',
        icon: 'none'
      });
      return false;
    }
    
    if (!contactName.trim()) {
      wx.showToast({
        title: '请填写联系人',
        icon: 'none'
      });
      return false;
    }
    
    if (!contactPhone.trim()) {
      wx.showToast({
        title: '请填写联系电话',
        icon: 'none'
      });
      return false;
    }
    
    // 简单的手机号验证
    if (!/^1\d{10}$/.test(contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 提交订单
  async handleSubmit() {
    try {
      if (!this.validateForm()) {
        return;
      }

      // 再次验证用户信息
      const userInfo = wx.getStorageSync('userInfo');
      const token = wx.getStorageSync('token');
      
      console.log('提交订单时的用户信息:', {
        userInfo,
        hasId: !!userInfo?.id,
        userId: userInfo?.id,
        hasToken: !!token
      });

      if (!userInfo || !userInfo.id || !token) {
        throw new Error('请先登录');
      }

      const { bookInfo, address, contactName, contactPhone } = this.data;
      
      if (!bookInfo) {
        wx.showToast({
          title: '商品信息错误',
          icon: 'none'
        });
        return;
      }

      this.setData({ loading: true });
      
      // 准备订单数据
      const orderData = {
        book: bookInfo.id,
        address: address.trim(),
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        amount: parseFloat(bookInfo.price),
        status: 'UNPAID'
      };

      console.log('提交订单数据:', orderData);

      const result = await createOrder(orderData);
      
      console.log('创建订单结果:', result);

      if (!result || result.code === undefined) {
        throw new Error('服务器响应格式错误');
      }

      if (result.code !== 0) {
        throw new Error(result.msg || '创建订单失败');
      }

      wx.showToast({
        title: '订单创建成功',
        icon: 'success'
      });

      // 跳转到订单列表页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/orderList/orderList?status=pending_payment'
        });
      }, 1500);

    } catch (error) {
      console.error('创建订单失败:', error);
      
      // 如果是登录相关的错误，跳转到登录页
      if (error.message === '请先登录' || error.statusCode === 401) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        wx.navigateTo({
          url: '/pages/login/login'
        });
      } else {
        wx.showToast({
          title: error.message || '创建订单失败，请重试',
          icon: 'none'
        });
      }
    } finally {
      this.setData({ loading: false });
    }
  }
}); 