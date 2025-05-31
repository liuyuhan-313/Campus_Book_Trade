// 请求函数
const { API } = require('../config/api');

const BASE_URL = 'http://127.0.0.1:8000';  // 开发环境使用

const request = (url, method = 'POST', data = {}) => {
  console.log('请求URL:', `${BASE_URL}${url}`);
  console.log('请求方法:', method);
  console.log('请求数据:', data);

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
      },
      success: (res) => {
        console.log('请求成功响应:', res);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          console.error('请求失败:', {
            statusCode: res.statusCode,
            data: res.data
          });
          
          // 处理特定状态码
          switch (res.statusCode) {
            case 400:
              wx.showToast({
                title: res.data.message || '请求参数错误',
                icon: 'none',
                duration: 2000
              });
              break;
            case 401:
              // 未授权，跳转到登录页
              wx.navigateTo({
                url: '/pages/login/login'
              });
              break;
            case 500:
              wx.showToast({
                title: '服务器错误，请稍后重试',
                icon: 'none',
                duration: 2000
              });
              console.error('服务器错误详情:', res.data);
              break;
            default:
              wx.showToast({
                title: res.data.message || '请求失败',
                icon: 'none',
                duration: 2000
              });
          }
          reject(res);
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        wx.showToast({
          title: '网络错误，请检查网络连接',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

// 文件上传函数
const uploadFile = (filePath, type = 'image') => {
  const app = getApp();
  
  return new Promise((resolve, reject) => {
    if (!app) {
      reject(new Error('App instance is not ready'));
      return;
    }

    // 模拟文件上传
    if (true) {
      setTimeout(() => {
        resolve({
          code: 0,
          message: 'success',
          data: {
            url: filePath
          }
        });
      }, 1000);
      return;
    }

    wx.uploadFile({
      url: `${app.globalData.baseUrl}/api/upload`,
      filePath,
      name: 'file',
      formData: {
        type
      },
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data);
          } else {
            reject(data);
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            });
          }
        } else {
          reject(res.data);
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('上传失败:', err);
        reject(err);
        if (err.errMsg.includes('fail connect')) {
          wx.showToast({
            title: '无法连接到服务器，请检查网络',
            icon: 'none',
            duration: 3000
          });
        } else {
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none'
          });
        }
      }
    });
  });
};

module.exports = {
  request,
  uploadFile,
  BASE_URL
};