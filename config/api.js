// API配置文件
const API = {
  // 用户相关接口
  login: '/api/users/login/',                 // 登录
  userInfo: '/api/users/info/',               // 获取用户信息
  userUpdate: '/api/users/update/',           // 更新用户信息
  uploadAvatar: '/api/users/avatar/upload/',  // 上传头像
  
  // 书籍相关接口
  list: '/api/books/',                        // 获取图书列表
  detail: '/api/books/detail/',               // 获取图书详情
  publish: '/api/books/publish/',             // 发布图书
  update: '/api/books/update/',               // 更新图书
  delete: '/api/books/delete/',               // 删除图书
  categories: '/api/categories/',             // 获取分类列表
  search: '/api/books/search/',               // 搜索图书
  myPublished: '/api/books/my/published/',    // 我的发布
  updateStatus: '/api/books/{id}/update_status/', // 更新书籍状态
  
  // 订单相关接口
  orderCreate: '/api/orders/',                 // 创建订单
  orderList: '/api/orders/',                   // 订单列表
  orderListByStatus: '/api/orders/list_by_status/', // 按状态获取订单列表
  orderDetail: '/api/orders/{id}/',            // 订单详情
  orderUpdateStatus: '/api/orders/{id}/update_status/',  // 更新订单状态
  orderCancel: '/api/orders/cancel/',          // 取消订单
  orderConfirm: '/api/orders/confirm/',        // 确认订单
  orderDelete: '/api/orders/{id}/',            // 删除订单
  orderApproveRefund: '/api/orders/{id}/approve-refund/', // 同意退款
  orderRejectRefund: '/api/orders/{id}/reject-refund/',   // 拒绝退款
  
  // 聊天相关接口
  chatList: '/api/chats/',                    // 获取聊天会话列表
  chatStart: '/api/chats/start/',             // 开始新的聊天会话
  chatMessages: '/api/chats/{id}/messages/',  // 获取会话消息历史
  chatSend: '/api/chats/{id}/send/',         // 发送消息
  systemMessages: '/api/system-messages/',     // 系统消息
  
  // 收藏相关接口
  collectionList: '/api/collections/list/',    // 收藏列表
  collectionToggle: '/api/collections/toggle/', // 切换收藏状态

  // 公告通知相关接口
  announcements: '/api/announcements/',         // 公告列表
  announcementPublis:'/api/announcements/publish/',
  announcementDetelete:'api/announcements/delete/',
  noticeList: '/api/notifications/list/',     // 系统通知
  
  // 其他接口
  upload: '/api/upload/',                     // 文件上传
  feedback: '/api/feedback/',          // 反馈
};

module.exports = {
  API
}; 