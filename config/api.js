// API配置文件
const API = {
  // 用户相关接口
  login: '/api/user/login/',
  userInfo: '/api/users/info/',
  register: '/api/user/register',
  
  // 书籍相关接口
  bookList: '/api/books',
  bookDetail: '/api/books/detail',
  publishBook: '/api/books/publish',
  searchBooks: '/api/books/search',
  
  // 订单相关接口
  createOrder: '/api/orders/create',
  orderList: '/api/orders/list',
  
  // 消息相关接口
  messageList: '/api/messages',
  chatHistory: '/api/chat/history',
  
  // 收藏相关接口
  collectList: '/api/collect/list',
  toggleCollect: '/api/collect/toggle',
  
  // 其他接口
  upload: '/api/upload',
  feedback: '/api/feedback',

  // 公告相关接口
  noticeList: '/api/notice/list'
};

module.exports = {
  API
}; 