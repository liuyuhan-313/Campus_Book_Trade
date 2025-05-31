const { API } = require('../../config/api');
const { request } = require('../../utils/request');
const app = getApp()

Page({
  data: {
    loading: false
  },

  onLoad() {
    // 检查是否已经登录
    const token = wx.getStorageSync('token')
    if (token) {
      this.navigateBack()
    }
  },

  async onGetUserInfo(e) {
    try {
      this.setData({ loading: true });
      
      // 获取登录code
      const { code } = await wx.login();
      if (!code) {
        throw new Error('获取code失败');
      }

      // 调用登录接口
      const res = await request(API.login, 'POST', { code });
      
      if (res.data && res.data.token) {
        // 保存token
        wx.setStorageSync('token', res.data.token);
        
        // 保存用户信息
        if (res.data.user) {
          wx.setStorageSync('userInfo', res.data.user);
        }

        // 返回上一页或首页
        wx.navigateBack({
          delta: 1,
          fail: () => {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        });
      } else {
        throw new Error('登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  navigateToUserAgreement() {
    wx.navigateTo({
      url: '/pages/webview/webview?type=agreement'
    })
  },

  navigateToPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/webview/webview?type=privacy'
    })
  }
}) 