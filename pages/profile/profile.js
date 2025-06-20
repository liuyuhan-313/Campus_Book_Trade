const app = getApp()
const { getUserInfo, updateUserInfo, uploadAvatar } = require('../../api/user');
const request = require('../../utils/request').request;  // 修改这里，正确导入request
const { getFullUrl } = require('../../utils/request');

Page({
  data: {
    userInfo: null,
    tempNickname: '',
    showNicknameInput: false,
    campusList: ['邯郸校区', '江湾校区', '枫林校区', '张江校区'],
    campusIndex: 0,
    orderCounts: {
      pending_payment: 0,
      pending_delivery: 0,
      pending_receive: 0
    },
    collectionCount: 0,
    publishedCount: 0,
    isDev: true,  // 开启开发测试模式
    hasLoaded: false,  // 标记是否已经加载过数据

  },

  onLoad() {
    // 先从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 确保头像URL是完整的
      if (userInfo.avatarUrl) {
        userInfo.avatarUrl = getFullUrl(userInfo.avatarUrl);
      }
      this.setData({ userInfo });
    }
    
    // 从服务器获取最新信息
    this.fetchUserInfo();
    this.loadCounts();
    
    // 标记已加载
    this.setData({ hasLoaded: true });
  },

  onShow() {
    // 只有在页面已经加载过，且有刷新需求时才重新获取数据
    // 首次加载时不执行，避免重复调用
    if (this.data.hasLoaded) {
      // 可以根据需要决定是否要在每次显示时都刷新
      // 目前改为只在有特殊标记时才刷新
      const app = getApp();
      if (app.globalData.profileNeedRefresh) {
        this.fetchUserInfo();
        this.loadCounts();
        app.globalData.profileNeedRefresh = false;
      }
    }
  },

  // 获取用户信息
  async fetchUserInfo() {
    try {
      const res = await getUserInfo();
      console.log('[Profile] 获取用户信息响应:', res);
      
      if (res && res.data) {
        const userData = res.data;
        console.log('[Profile] 用户数据:', userData);
        
        // 确保头像URL是完整的
        const userInfo = {
          ...userData,
          avatarUrl: userData.avatar_url ? getFullUrl(userData.avatar_url) : '/assets/icons/default-avatar.png',
          nickName: userData.nickname || '昵称',
          credit_score: userData.credit_score || 5.0
        };
        
        console.log('[Profile] 处理后的用户信息:', userInfo);
        
        // 更新页面数据
        this.setData({ 
          userInfo,
          campusIndex: this.data.campusList.indexOf(userInfo.campus || '')
        });
        
        // 更新本地存储
        wx.setStorageSync('userInfo', userInfo);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  // 更新用户信息
  async handleUpdateInfo(e) {
    const { value } = e.detail;
    try {
      await updateUserInfo(value);
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
      this.fetchUserInfo(); // 刷新信息
    } catch (error) {
      console.error('更新用户信息失败:', error);
    }
  },

  // 上传头像
  async handleAvatarUpload() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      const tempFilePath = res.tempFilePaths[0];
      const result = await uploadAvatar(tempFilePath);
      
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
      
      this.fetchUserInfo(); // 刷新信息
    } catch (error) {
      console.error('上传头像失败:', error);
    }
  },

  // 加载各种计数
  loadCounts() {
    // 从服务器获取订单数量、收藏数量等
    this.setData({
      orderCounts: {
        pending_payment: 0,
        pending_delivery: 0,
        pending_receive: 0
      },
      collectionCount: 0,
      publishedCount: 0
    })
  },

  // 跳转到订单列表
  navigateToOrders(e) {
    // 检查登录状态
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }

    const status = e.currentTarget.dataset.status;
    const url = status ? 
      `/pages/orderList/orderList?status=${status}` :
      '/pages/orderList/orderList';
    
    console.log('准备跳转到订单列表:', { status, url });
    
    wx.navigateTo({ 
      url,
      success: () => {
        console.log('跳转成功');
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到收藏列表
  navigateToCollection() {
    wx.navigateTo({
      url: '/pages/collection/collection'
    })
  },

  // 跳转到已发布列表
  navigateToPublished() {
    wx.navigateTo({
      url: '/pages/published/published'
    })
  },

  // 显示信用分详情
  showCreditScore() {
    wx.showModal({
      title: '信用分说明',
      content: '信用分基于您的交易记录、评价等综合计算。保持良好的交易记录可以提升信用分。',
      showCancel: false
    })
  },

    // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '确认拨打客服电话：123-45678？',
      success(res) {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '123-45678',
            success: () => {
              console.log('拨打电话成功');
            },
            fail: (err) => {
              console.error('拨打电话失败:', err);
              wx.showToast({
                title: '拨打电话失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 显示昵称编辑输入框
  showEditNickname() {
    console.log('点击编辑昵称，当前用户信息:', this.data.userInfo);
    this.setData({
      tempNickname: this.data.userInfo.nickName || '',
      showNicknameInput: true
    });
    console.log('设置编辑状态:', { tempNickname: this.data.tempNickname, showNicknameInput: this.data.showNicknameInput });
  },

  // 处理昵称输入变化（实时更新）
  onNicknameChange(e) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  // 处理昵称输入
  async onNicknameInput(e) {
    const nickname = e.detail.value;
    if (nickname && nickname !== this.data.userInfo.nickName) {
      try {
        await this.updateUserProfile({ nickname });
        this.setData({
          'userInfo.nickName': nickname,
          showNicknameInput: false
        });
      } catch (error) {
        console.error('更新昵称失败:', error);
      }
    }
  },
  // 切换到测试账号
  async switchToTestAccount() {
    try {
      // 记录当前账号信息
      const currentUser = wx.getStorageSync('userInfo');
      console.log('切换前的主账号信息:', {
        id: currentUser.id,
        nickname: currentUser.nickname,
        openid: currentUser.openid
      });
      wx.showLoading({ title: '切换中...', mask: true });
    
      const res = await request({
        url: '/api/users/switch-test-account/',
        method: 'POST'
      });

      if (res && res.token) {
        // 记录测试账号信息
        console.log('获取到的测试账号信息:', {
          id: res.user.id,
          nickname: res.user.nickname,
          openid: res.user.openid
        });
        // 保存测试账号token
        wx.setStorageSync('mainToken', wx.getStorageSync('token')); // 保存主账号token
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('userInfo', res.user);
      
        wx.showToast({ title: '已切换到测试账号', icon: 'success' });
      
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/profile/profile'   });
        }, 1500);
      }
    } catch (error) {
      console.error('切换测试账号失败:', error);
      wx.showToast({ title: error.message || '切换失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 切换回主账号
  switchToMainAccount() {
    // 记录当前测试账号信息
    const currentUser = wx.getStorageSync('userInfo');
    console.log('切换前的测试账号信息:', {
      id: currentUser.id,
      nickname: currentUser.nickname,
      openid: currentUser.openid
    });
    const mainToken = wx.getStorageSync('mainToken');
    if (!mainToken) {
      wx.showToast({ title: '未找到主账号信息', icon: 'none' });
      return;
    }
  
    wx.setStorageSync('token', mainToken);
    wx.removeStorageSync('mainToken');
    // 获取主账号信息
    this.fetchUserInfo().then(() => {
      const mainUser = wx.getStorageSync('userInfo');
      console.log('切换回的主账号信息:', {
        id: mainUser.id,
        nickname: mainUser.nickname,
        openid: mainUser.openid
      });
    });
  
    wx.showToast({ title: '已切换回主账号', icon: 'success' });
  
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/profile/profile' });
    }, 1500);
  },


  // 处理手机号输入
  onPhoneInput(e) {
    this.setData({
      'userInfo.phone': e.detail.value
    });
  },

  // 处理学号输入
  onStudentIdInput(e) {
    this.setData({
      'userInfo.student_id': e.detail.value
    });
  },

  // 处理校区选择
  onCampusChange(e) {
    const index = e.detail.value;
    this.setData({
      campusIndex: index,
      'userInfo.campus': this.data.campusList[index]
    });
  },

  // 保存用户信息
  async saveUserInfo() {
    const { phone, student_id, campus } = this.data.userInfo;
    
    try {
      await this.updateUserProfile({
        profile: {
          phone,
          student_id,
          campus
        }
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存用户信息失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 更新用户资料的统一方法
  async updateUserProfile(data) {
    try {
      const result = await updateUserInfo(data);
      if (result.user) {
        this.setData({
          userInfo: {
            ...this.data.userInfo,
            ...result.user
          }
        });
      }
      return result;
    } catch (error) {
      wx.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
      throw error;
    }
  },

  // 处理选择头像事件
  async onChooseAvatar(e) {
    try {
      console.log('选择头像事件:', e.detail);

      // 使用chooseImage来选择头像
      const chooseResult = await new Promise((resolve, reject) => {
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject
        });
      });

      if (!chooseResult.tempFilePaths || chooseResult.tempFilePaths.length === 0) {
        throw new Error('未选择头像');
      }

      const tempFilePath = chooseResult.tempFilePaths[0];

      wx.showLoading({
        title: '更新头像中...',
        mask: true
      });

      // 上传到服务器
      const result = await uploadAvatar(tempFilePath);
      console.log('头像上传结果:', result);
      
      if (result && result.avatar_url) {
        const fullAvatarUrl = getFullUrl(result.avatar_url);
        
        // 更新本地存储
        const userInfo = wx.getStorageSync('userInfo') || {};
        userInfo.avatarUrl = fullAvatarUrl;
        wx.setStorageSync('userInfo', userInfo);
        
        // 更新全局数据
        const appInstance = getApp();
        if (appInstance && appInstance.globalData) {
          appInstance.globalData.userInfo = {
            ...appInstance.globalData.userInfo,
            avatarUrl: fullAvatarUrl
          };
        }
        
        // 更新页面显示
        this.setData({
          'userInfo.avatarUrl': fullAvatarUrl
        });
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });

        // 设置刷新标记，下次进入页面时会刷新
        getApp().globalData.profileNeedRefresh = true;
      } else {
        throw new Error('头像上传失败');
      }
    } catch (error) {
      console.error('头像更新失败:', error);
   
      // 恢复原来的头像
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.avatarUrl) {
        this.setData({
          'userInfo.avatarUrl': userInfo.avatarUrl
        });
      }
      
      wx.showToast({
        title: error.message || '头像更新失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 处理获取用户信息事件
  async getUserInfo(e) {
    if (e.detail.userInfo) {
      try {
        // 更新用户信息到服务器
        const result = await updateUserInfo({
          nickname: e.detail.userInfo.nickName,
          avatar_url: e.detail.userInfo.avatarUrl
        });

        // 更新本地显示
        this.setData({
          userInfo: {
            ...this.data.userInfo,
            nickName: e.detail.userInfo.nickName,
            avatarUrl: e.detail.userInfo.avatarUrl
          }
        });

        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('更新用户信息失败:', error);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    } else {
      wx.showToast({
        title: '您取消了授权',
        icon: 'none'
      });
    }
  },

  // 处理头像加载错误
  onAvatarError() {
    console.log('头像加载失败，使用默认头像');
    this.setData({
      'userInfo.avatarUrl': '/assets/icons/default-avatar.png'
    });
  },
}) 