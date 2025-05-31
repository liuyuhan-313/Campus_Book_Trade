const users = [
  {
    id: 1,
    openid: 'test_openid_1',
    nickname: '小明',
    avatar: '/assets/images/default-avatar.png',
    campus: '东校区',
    phone: '13800138000',
    createTime: '2024-01-20 10:00:00'
  }
];

// 模拟登录
const login = (code) => {
  // 模拟通过 code 获取用户信息
  return {
    token: 'mock_token_' + Date.now(),
    userInfo: users[0]
  };
};

// 模拟获取用户信息
const getUserInfo = (userId) => {
  return users.find(user => user.id === userId) || null;
};

module.exports = {
  users,
  login,
  getUserInfo
}; 