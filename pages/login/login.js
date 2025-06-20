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
    if (this.data.loading) return;

    try {
      // 检查用户是否同意授权
      if (!e.detail.userInfo) {
        wx.showToast({
          title: '需要您的授权才能登录',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      this.setData({ loading: true });
      
      // 获取登录code
      const loginResult = await wx.login();
      if (!loginResult.code) {
        throw new Error('获取code失败');
      }

      // 准备登录数据
      const loginData = {
        code: loginResult.code,
        nickname: e.detail.userInfo.nickName,
        avatar_url: e.detail.userInfo.avatarUrl,
        gender: e.detail.userInfo.gender,
      };

      console.log('登录数据:', loginData);

      // 调用登录接口
      const res = await request({
        url: API.login,
        method: 'POST',
        data: loginData
      });

      console.log('登录响应:', res);
      
      if (res && res.token) {
        // 保存token
        wx.setStorageSync('token', res.token);
        
        // 保存用户信息
        if (res.user) {
          wx.setStorageSync('userInfo', res.user);
          app.globalData.userInfo = res.user;
          app.globalData.token = res.token;
        }

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          // 返回上一页或首页
          const pages = getCurrentPages();
          if (pages.length > 1) {
            wx.navigateBack({
              delta: 1,
              fail: () => {
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            });
          } else {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }, 1500);
      } else {
        throw new Error(res.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
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