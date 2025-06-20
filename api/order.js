const { request } = require('../utils/request');
const { API } = require('../config/api');

// 创建订单
const createOrder = (data) => {
  return request({
    url: API.orderCreate,
    method: 'POST',
    data
  });
};

// 获取订单列表
const getOrderList = async (params = {}) => {
  console.log('获取订单列表, 参数:', params);
  
  try {
    const response = await request({
    url: API.orderListByStatus,
    method: 'GET',
    data: params
    });

    console.log('订单列表响应:', response);

    if (!response) {
      throw new Error('未收到服务器响应');
    }

    if (response.code !== 0) {
      throw new Error(response.msg || '获取订单列表失败');
    }

    // 处理响应数据
      return {
        data: response.list || [],
        total: response.total || 0,
      page: response.page || params.page || 1,
      pageSize: response.page_size || params.page_size || 10
      };
  } catch (error) {
    console.error('获取订单列表失败:', error);
    throw error;
    }
};

// 获取订单详情
const getOrderDetail = (orderId) => {
  return request({
    url: API.orderDetail.replace('{id}', orderId),
    method: 'GET'
  });
};

// 取消订单
const cancelOrder = (orderNumber) => {
  return request({
    url: `${API.orderCancel}${orderNumber}/`,
    method: 'POST'
  });
};

// 确认订单
const confirmOrder = (orderNumber) => {
  return request({
    url: `${API.orderConfirm}${orderNumber}/`,
    method: 'POST'
  });
};

module.exports = {
  createOrder,
  getOrderList,
  getOrderDetail,
  cancelOrder,
  confirmOrder
}; 