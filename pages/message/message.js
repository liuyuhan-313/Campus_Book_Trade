const app = getApp()

Page({
  data: {
    activeTab: 'chat', // chat 或 system
    chatMessages: [],
    systemMessages: [],
    messages: []
  },

  onLoad() {
    this.loadMessages()
  },

  // 切换消息类型标签
  switchTab(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      activeTab: type
    })
    this.loadMessages()
  },

  // 加载消息列表
  loadMessages() {
    if (this.data.activeTab === 'chat') {
      // TODO: 从服务器加载聊天消息列表
      this.setData({
        chatMessages: [
          {
            id: 1,
            avatar: '/assets/icons/default-avatar.png',
            name: '张三',
            lastMessage: '请问这本书还在吗？',
            lastTime: '10:30',
            unread: 2
          }
        ]
      })
    } else {
      // TODO: 从服务器加载系统消息列表
      this.setData({
        systemMessages: [
          {
            id: 1,
            title: '交易提醒',
            content: '您的订单已完成，请及时评价',
            time: '2024-01-20 10:30',
            read: false
          }
        ]
      })
    }
  },

  // 跳转到聊天详情页
  navigateToChat(e) {
    const chatId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/chat/chat?id=${chatId}`
    })
  }
}) 