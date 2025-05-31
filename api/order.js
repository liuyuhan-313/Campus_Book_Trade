const { request } = require('../utils/request');

// 创建订单
const createOrder = (data) => {
  return request('/api/orders/create/', 'POST', data);
};

// 获取订单列表
const getOrderList = () => {
  return request('/api/orders/list/');
};

// 获取订单详情
const getOrderDetail = (orderNumber) => {
  return request(`/api/orders/detail/${orderNumber}/`);
};

// 取消订单
const cancelOrder = (orderNumber) => {
  return request(`/api/orders/${orderNumber}/cancel/`, 'POST');
};

module.exports = {
  createOrder,
  getOrderList,
  getOrderDetail,
  cancelOrder
}; 