import { request } from '../utils/request';
import { API } from '../config/api';
import { BASE_URL } from '../utils/request';

// 获取书籍列表
export const getBookList = async (params = {}) => {
  return request(API.list, 'GET', params);
};

// 获取书籍详情
export const getBookDetail = (id) => {
  console.log('获取书籍详情，ID:', id);
  return request({
    url: `/api/books/detail/${id}/`,
    method: 'GET'
  }).then(res => {
    console.log('书籍详情API响应:', res);
    if (!res) {
      throw new Error('获取书籍详情失败：响应为空');
    }
    
    // 检查响应数据结构
    if (res.code === 0 && res.data) {
      return res.data;
    } else if (res.data) {
      return res.data;
    } else if (res.id) {
      return res;
    } else {
      throw new Error('获取书籍详情失败：数据格式不正确');
    }
  }).catch(error => {
    console.error('获取书籍详情失败:', error);
    throw error;
  });
};

// 发布书籍
export const createBook = async (bookData) => {
  try {
    // 验证必填字段
    const requiredFields = ['title', 'author', 'category', 'price', 'condition', 'campus', 'images'];
    const missingFields = requiredFields.filter(field => !bookData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
    }

    // 显示上传中提示
    wx.showLoading({
      title: '上传图片中...',
      mask: true
    });
    
    // 获取token
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.hideLoading();
      wx.navigateTo({
        url: '/pages/login/login'
      });
      throw new Error('请先登录');
    }
    
    // 处理图片上传
    const uploadPromises = bookData.images.map(async (imagePath) => {
      return new Promise((resolve, reject) => {
        console.log('开始上传图片:', imagePath);
        console.log('上传URL:', `${BASE_URL}${API.upload}`);
        
        wx.uploadFile({
          url: `${BASE_URL}${API.upload}`,
          filePath: imagePath,
          name: 'file',
          formData: {
            type: 'image'
          },
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            console.log('上传响应:', res);
            if (res.statusCode === 401) {
              // Token过期，跳转到登录页面
              wx.hideLoading();
              wx.showModal({
                title: '登录已过期',
                content: '请重新登录',
                showCancel: false,
                success: () => {
                  wx.navigateTo({
                    url: '/pages/login/login'
                  });
                }
              });
              reject(new Error('登录已过期，请重新登录'));
              return;
            }
            
            if (res.statusCode === 200) {
              try {
                const data = JSON.parse(res.data);
                console.log('解析后的响应数据:', data);
                
                let imageUrl = null;
                if (data.code === 0 && data.data && data.data.url) {
                  imageUrl = data.data.url;
                } else if (data.url) {
                  imageUrl = data.url;
                } else if (data.message === '上传成功' && data.data) {
                  imageUrl = typeof data.data === 'string' ? data.data : data.data.url;
                }

                // 确保URL是完整的
                if (imageUrl) {
                  if (!imageUrl.startsWith('http')) {
                    imageUrl = `${BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                  }
                  console.log('处理后的图片URL:', imageUrl);
                  resolve(imageUrl);
                } else {
                  console.error('无法获取图片URL:', data);
                  reject(new Error('无法获取图片URL'));
                }
              } catch (e) {
                console.error('解析上传响应失败:', e, '原始数据:', res.data);
                reject(new Error('解析上传响应失败'));
              }
            } else {
              console.error('上传失败，状态码:', res.statusCode, '响应:', res);
              reject(new Error(`上传失败，状态码: ${res.statusCode}`));
            }
          },
          fail: (err) => {
            console.error('上传请求失败:', err);
            reject(new Error(err.errMsg || '上传请求失败'));
          }
        });
      });
    });

    const imageUrls = await Promise.all(uploadPromises);
    wx.hideLoading();
    
    console.log('所有图片上传成功:', imageUrls);
    
    // 构建提交数据，确保数据格式符合后端要求
    const submitData = {
      title: bookData.title,
      author: bookData.author,
      publisher: bookData.publisher || '',
      isbn: bookData.isbn || '',
      category: parseInt(bookData.category),  // 确保category是数字类型
      description: bookData.description,
      price: parseFloat(bookData.price),
      original_price: bookData.original_price ? parseFloat(bookData.original_price) : null,
      condition: bookData.condition,
      campus: bookData.campus,
      cover_image: imageUrls[0] || null,  // 第一张图片作为封面
      image_urls: imageUrls.slice(1)  // 剩余的图片作为附加图片，不包括第一张
    };
    
    // 添加调试日志
    console.log('发送到后端的数据:', {
      ...submitData,
      imageUrls: imageUrls,
      coverImage: submitData.cover_image,
      additionalImages: submitData.image_urls
    });
    
    // 删除不需要的字段
    delete submitData.images;
    delete submitData.localImages;
    
    // 发送创建书籍请求
    const response = await request({
      url: API.publish,
      method: 'POST',
      data: submitData
    });

    if (response) {
      if (response.code === 0 || response.code === 200) {
        return response.data || response;
      } else if (response.message === '发布成功') {
        return response;
      } else if (response.error) {
        throw new Error(response.error);
      } else if (response.message) {
        throw new Error(response.message);
      }
      return response;
    }
    
    throw new Error('服务器响应为空');
  } catch (error) {
    wx.hideLoading();
    console.error('发布书籍失败:', error);
    throw error;
  }
};

// 获取分类列表
export const getCategories = async () => {
  return request(API.categories, 'GET');
};