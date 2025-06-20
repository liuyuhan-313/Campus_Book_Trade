const { request } = require('../utils/request')
const { API } = require('../config/api')

// 获取聊天会话列表
const getChatList = () => {
  return request({
    url: API.chatList,
    method: 'GET'
  })
}

// 开始新的聊天会话
const startChat = (bookId,targetUserId) => {
  console.log('发起聊天请求，参数：', { bookId, targetUserId }); // 添加调试信息
  return request({
    url:'/api/chats/start/',
    method: 'POST',
    data: {
      book_id: bookId,
      target_user_id: targetUserId  // 添加这个参数
    }
  }).then(res => {
    // 确保返回正确的数据格式
    if (res && res.session_id) {
      return res;
    } else {
      throw new Error('服务器返回数据格式错误');
    }
  });
}

// 获取会话消息历史
const getChatMessages = (sessionId) => {
  console.log('获取消息历史，会话ID:', sessionId);
  return request({
    url: `/api/chats/${sessionId}/messages/`,
    method: 'GET'
  }).then(res => {
    console.log('获取到的消息数据:', res);  // 添加调试日志
    return {
      data:res
    };
  });
}

// 发送消息
const sendMessage = (sessionId, content) => {
  console.log('发送消息请求:', {
    sessionId,
    content
  })
  return request({
    url:`/api/chats/${sessionId}/send_message/`,  // 修改这里的 URL,
    method: 'POST',
    data: {
      content: content
    }
  }).then(res => {
    console.log('发送消息响应:', res)
    return res
  }).catch(error => {
    console.error('发送消息错误:', error)
    throw error
  })
}

module.exports = {
  getChatList,
  startChat,
  getChatMessages,
  sendMessage
} 