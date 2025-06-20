// 支持的图片类型
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif'];

// 支持的文件大小限制（单位：MB）
const MAX_FILE_SIZE = 10;

// 检查文件类型
const checkFileType = (filePath) => {
  const extension = filePath.split('.').pop().toLowerCase();
  return ALLOWED_IMAGE_TYPES.includes(extension);
};

// 检查文件大小
const checkFileSize = (size) => {
  const sizeInMB = size / (1024 * 1024);
  return sizeInMB <= MAX_FILE_SIZE;
};

// 选择图片
const chooseImage = async (count = 9) => {
  try {
    // 确保count是数字类型
    const numCount = parseInt(count, 10);
    
    const res = await wx.chooseMedia({
      count: numCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed']
    });

    // 检查每个文件
    const validFiles = res.tempFiles.filter(file => {
      // 检查文件类型
      if (!checkFileType(file.tempFilePath)) {
        wx.showToast({
          title: '只支持jpg、jpeg、png、gif格式的图片',
          icon: 'none'
        });
        return false;
      }

      // 检查文件大小
      if (!checkFileSize(file.size)) {
        wx.showToast({
          title: `图片大小不能超过${MAX_FILE_SIZE}MB`,
          icon: 'none'
        });
        return false;
      }

      return true;
    });

    return validFiles.map(file => file.tempFilePath);
  } catch (error) {
    console.error('选择图片失败:', error);
    wx.showToast({
      title: '选择图片失败',
      icon: 'none'
    });
    return [];
  }
};

module.exports = {
  checkFileType,
  checkFileSize,
  chooseImage,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE
}; 