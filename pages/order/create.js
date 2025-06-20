import { createOrder } from '../../api/order';
import { getBookDetail } from '../../api/book';
import { request } from '../../utils/request';
import { API } from '../../config/api';

Page({
  data: {
    bookInfo: null,
    address: '',
    contactName: '',
    contactPhone: '',
    loading: false
  },

  onLoad(options) {
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
          cover: bookData.cover_image || bookData.images?.[0] || '/assets/images/default-book.png'
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
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onAddressInput(e) {
    this.setData({
      address: e.detail.value
    });
  },

  onContactNameInput(e) {
    this.setData({
      contactName: e.detail.value
    });
  },

  onContactPhoneInput(e) {
    this.setData({
      contactPhone: e.detail.value
    });
  },

  // 提交订单
  async handleSubmit() {
    try {
      if (!this.validateForm()) {
        return;
      }

      const orderData = {
        book: this.data.bookInfo.id,
        amount: this.data.bookInfo.price,
        address: this.data.address,
        contact_name: this.data.contactName,
        contact_phone: this.data.contactPhone
      };

      wx.showLoading({
        title: '创建订单中...'
      });

      const result = await createOrder(orderData);
      
      wx.hideLoading();

      if (!result || result.code !== 0) {
        throw new Error(result?.msg || '创建订单失败');
      }

      // 直接处理支付
      try {
        wx.showLoading({
          title: '处理支付中...'
        });

        // 更新订单状态为已支付
        const payRes = await request({
          url: API.orderUpdateStatus.replace('{id}', result.data.id),
          method: 'POST',
          data: {
            status: 'PAID'
          }
        });

        if (payRes.code === 0) {
          // 更新书籍状态为已售出
          await request({
            url: API.updateStatus.replace('{id}', result.data.book),
            method: 'POST',
            data: {
              status: 'sold_out'
            }
          });

          wx.hideLoading();
          wx.showToast({
            title: '支付成功',
            icon: 'success',
            duration: 2000
          });

          // 延迟跳转到订单列表页
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/orderList/orderList?status=PAID'
            });
          }, 2000);
        } else {
          throw new Error(payRes.msg || '支付失败');
        }
      } catch (payError) {
        console.error('支付失败:', payError);
        wx.hideLoading();
        wx.showToast({
          title: payError.message || '支付失败',
          icon: 'none'
        });
      }
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
  },

  // 表单验证
  validateForm() {
    if (!this.data.address) {
      wx.showToast({
        title: '请填写收货地址',
        icon: 'none'
      });
      return false;
    }
    if (!this.data.contactName) {
      wx.showToast({
        title: '请填写联系人',
        icon: 'none'
      });
      return false;
    }
    if (!this.data.contactPhone) {
      wx.showToast({
        title: '请填写联系电话',
        icon: 'none'
      });
      return false;
    }
    return true;
  }
}); 