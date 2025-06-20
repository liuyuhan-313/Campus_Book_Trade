const BASE_URL = 'http://127.0.0.1:8000'  // 确保这是正确的后端地址

// 不需要登录的接口列表
const noAuthApis = [
  '/api/users/login/',
  '/api/users/register/'
];

// 将相对路径转换为完整URL
const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // 处理路径中的反斜杠
  path = path.replace(/\\/g, '/');
  // 确保路径以 / 开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return `${BASE_URL}${path}`;
};

// 处理401错误（token过期）
const handle401Error = () => {
  wx.hideLoading();
  wx.showModal({
    title: '登录已过期',
    content: '请重新登录',
    showCancel: false,
    success: () => {
      // 清除本地存储的token
      wx.removeStorageSync('token');
      // 跳转到登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  });
};

// 请求函数
const request = (options = {}) => {
  // 统一处理请求参数
  const { url, method = 'GET', data = {}, silent = false } = typeof options === 'string' ? { url: options } : options;

  console.log('请求URL:', `${BASE_URL}${url}`);
  console.log('请求方法:', method);
  console.log('请求数据:', data);

  return new Promise((resolve, reject) => {
    // 获取token
    const token = wx.getStorageSync('token');
    
    // 判断是否需要登录
    if (!token && !noAuthApis.includes(url)) {
      // 如果没有token且不是免登录接口，跳转到登录页
      if (!silent) {
        wx.navigateTo({
          url: '/pages/login/login',
          success: () => {
            reject(new Error('请先登录'));
          },
          fail: (err) => {
            console.error('跳转登录页失败:', err);
            reject(new Error('请先登录'));
          }
        });
      } else {
        // 静默模式：不显示错误提示，直接reject
        reject(new Error('请先登录'));
      }
      return;
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        console.log('请求成功响应:', res);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          console.error('请求失败:', {
            statusCode: res.statusCode,
            data: res.data,
            url: url,
            method: method
          });
          
          // 处理特定状态码
          switch (res.statusCode) {
            case 400:
              const errorMsg = typeof res.data === 'object' ? 
                (res.data.message || res.data.detail || JSON.stringify(res.data)) : 
                res.data || '请求参数错误';
              console.error('请求参数错误详情:', res.data);
              reject(new Error(errorMsg));
              break;
            case 401:
              // 未授权，清除登录状态并跳转到登录页
              if (!noAuthApis.includes(url)) {
                wx.removeStorageSync('token');
                wx.removeStorageSync('userInfo');
                wx.navigateTo({
                  url: '/pages/login/login'
                });
              }
              reject(new Error('未登录或登录已过期'));
              break;
            case 500:
              const serverError = typeof res.data === 'object' ?
                (res.data.message || res.data.detail || JSON.stringify(res.data)) :
                res.data || '服务器错误，请稍后重试';
              console.error('服务器错误详情:', res.data);
              reject(new Error(serverError));
              break;
            default:
              const defaultError = typeof res.data === 'object' ?
                (res.data.message || res.data.detail || JSON.stringify(res.data)) :
                res.data || '请求失败';
              console.error('未知错误详情:', res.data);
              reject(new Error(defaultError));
          }
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', {
          error: err,
          url: url,
          method: method,
          data: data
        });
        const errorMsg = err.errMsg || '网络错误，请检查网络连接';
        reject(new Error(errorMsg));
      }
    });
  });
};

// 文件上传函数
const uploadFile = (filePath, type = 'image', url = '/api/upload/') => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      reject(new Error('请选择要上传的文件'));
      return;
    }

    const token = wx.getStorageSync('token');
    
    if (!token) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      reject(new Error('请先登录'));
      return;
    }

    console.log('开始上传文件:', {
      url: `${BASE_URL}${url}`,
      filePath,
      type
    });

    // 使用FileSystemManager读取文件
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: filePath,
      success: (res) => {
        // 检查文件大小（限制为2MB）
        if (res.data.length > 2 * 1024 * 1024) {
          reject(new Error('文件大小不能超过2MB'));
          return;
        }

        wx.uploadFile({
          url: `${BASE_URL}${url}`,
          filePath,
          name: 'avatar',
          formData: {
            type: type
          },
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            console.log('上传响应:', res);
            
            let responseData;
            try {
              responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
              console.log('解析后的响应数据:', responseData);
            } catch (e) {
              console.error('解析响应数据失败:', e);
              responseData = res.data;
            }

            if (res.statusCode >= 200 && res.statusCode < 300) {
              let avatarUrl = responseData.avatar_url || responseData.url || (typeof responseData === 'string' ? responseData : null);
              
              if (avatarUrl) {
                avatarUrl = getFullUrl(avatarUrl);
              }

              const result = {
                avatar_url: avatarUrl,
                message: '上传成功'
              };
              
              if (!result.avatar_url) {
                console.error('响应中没有找到头像URL:', responseData);
                reject(new Error('上传成功但未获取到头像URL'));
                return;
              }
              
              console.log('处理后的结果:', result);
              resolve(result);
            } else {
              const errorMsg = typeof responseData === 'object' ? 
                (responseData.message || responseData.error || '上传失败') : 
                responseData || '上传失败';
              console.error('上传失败:', errorMsg);
              reject(new Error(errorMsg));
            }
          },
          fail: (err) => {
            console.error('上传请求失败:', err);
            const errorMsg = err.errMsg || '网络错误，请重试';
            reject(new Error(errorMsg));
          }
        });
      },
      fail: (err) => {
        console.error('读取文件失败:', err);
        reject(new Error('文件读取失败'));
      }
    });
  });
};

module.exports = {
  request,
  uploadFile,
  BASE_URL,
  getFullUrl
};