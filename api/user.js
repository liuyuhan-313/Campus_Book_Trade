const { request, uploadFile, getFullUrl } = require('../utils/request');
const { API } = require('../config/api');

// 获取用户信息
const getUserInfo = async (userId) => {
  console.log('getUserInfo被调用，userId:', userId);
  try {
    // 根据是否有userId决定使用哪个API端点
    const url = userId ? `/api/users/${userId}/` : '/api/users/info/';
    console.log('请求URL:', url);
    
    const response = await request({
      url: url,
      method: 'GET'
    });
    
    console.log('getUserInfo API原始响应:', response);
    
    // 检查响应数据
    if (!response) {
      throw new Error('API响应为空');
    }

    // 获取用户数据
    const userData = response.data || response;
    console.log('处理后的用户数据:', userData);

    if (!userData || !userData.id) {
      throw new Error('用户数据不完整');
    }

    // 确保返回的数据格式统一
    return {
      data: {
        id: userData.id,
        username: userData.username,
        nickname: userData.nickname,
        avatar_url: userData.avatar_url,
        phone: userData.phone,
        credit_score: userData.credit_score || 5,
        total_sales: userData.total_sales || 0,
        good_ratings: userData.good_ratings || 0
      }
    };
  } catch (error) {
    console.error('getUserInfo API调用失败:', error);
    throw error;
  }
};

// 更新用户信息
const updateUserInfo = (data) => {
  // 如果传入的是profile对象，直接使用其中的字段
  const updateData = data.profile || data;
  
  return request({
    url: API.userUpdate,
    method: 'PUT',
    data: updateData
  }).then(res => {
    // 确保头像URL是完整的
    if (res.user && res.user.avatar_url) {
      res.user.avatar_url = getFullUrl(res.user.avatar_url);
    }
    return res;
  });
};

// 上传头像
const uploadAvatar = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error('请选择要上传的头像');
    }

    console.log('开始上传头像:', filePath);
    
    // 上传文件
    const result = await uploadFile(filePath, 'avatar', API.uploadAvatar);
    console.log('上传头像结果:', result);

    if (!result || !result.avatar_url) {
      throw new Error('上传响应格式错误');
    }

    // 获取头像URL（已经是完整URL）
    const avatarUrl = result.avatar_url;
    
    // 更新用户信息到服务器
    await updateUserInfo({
      avatar_url: avatarUrl
    });

    return {
      avatar_url: avatarUrl,
      message: '头像更新成功'
    };
  } catch (error) {
    console.error('上传头像失败:', error);
    throw error;
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  uploadAvatar
}; 