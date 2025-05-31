import { createOrder } from '../../api/order';

Page({
  data: {
    bookInfo: null,
    address: '',
    contactName: '',
    contactPhone: ''
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
      wx.showToast({
        title: '订单创建成功',
        icon: 'success'
      });

      // 跳转到订单详情页
      wx.navigateTo({
        url: `/pages/order/detail?orderNumber=${result.order_number}`
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '创建订单失败',
        icon: 'none'
      });
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