const app = getApp()
const { request } = require('../../utils/request')
const { API } = require('../../config/api')

Page({
  data: {
    activeTab: 'chat', // chat 或 system
    chatMessages: [],
    systemMessages: [],
    messages: [],
    loading: false
  },

  onLoad() {
    console.log('消息页面加载')
    this.loadMessages()
  },

  onShow() {
    console.log('消息页面显示')
    // 每次显示页面时刷新消息列表
    this.loadMessages()
    // 重置全局刷新标记
    if (app.globalData.messageNeedRefresh) {
      app.globalData.messageNeedRefresh = false
    }
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
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    if (this.data.activeTab === 'chat') {
      wx.showLoading({ title: '加载中' })
      // 调用获取聊天列表的API
      request({
        url: '/api/chats/',//URL和后端匹配
        method: 'GET'
      })
      .then(res => {
        console.log('获取到的聊天数据:', res)

        if (res && Array.isArray(res.results)) {  // 修改这里，直接获取 results
          const chatMessages = res.results.map(chat =>{
            // 获取对方用户信息（买家或卖家）
            const otherUser = chat.seller || {}
            return{
              id: chat.id,
              avatar: chat.other_user?.avatar || '/assets/images/default-avatar.png',
              name: chat.other_user?.nickname || '昵称',
              lastMessage: chat.last_message || '暂无消息',
              lastTime: this.formatTime(chat.updated_at),
              unread: chat.unread_count || 0,
              bookInfo: {
                id: chat.book.id,
                title: chat.book.title,
                coverImage: chat.book.cover_image || '/assets/images/default-book.png',
                price: chat.book.price,
                condition: chat.book.condition
              }

            }
          })
          console.log('处理后的消息列表:', chatMessages)
          this.setData({chatMessages})
        }else {
            console.log('API返回数据格式不正确:', res)
            this.setData({ chatMessages: [] })
          }
      })
      .catch(error => {
        console.error('加载消息列表失败:', error)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
        wx.hideLoading()
      })
    } else {
      // 系统消息的处理
      wx.showLoading({ title: '加载中' })
      request({
        url: '/api/system-messages/',
        method: 'GET'
      })
      .then(res => {
        console.log('获取到的系统消息数据:', res)
        
        // 处理DRF ViewSet返回的数据格式
        let messages = []
        if (res && res.results) {
          messages = res.results
        } else if (res && Array.isArray(res)) {
          messages = res
        } else if (res && res.data && Array.isArray(res.data)) {
          messages = res.data
        }
        
        this.setData({
          systemMessages: messages.map(msg => ({
            id: msg.id,
            title: msg.title,
            content: msg.content,
            time: this.formatTime(msg.created_at),
            read: msg.is_read
          }))
        })
        
        console.log('处理后的系统消息:', this.data.systemMessages)
      })
      .catch(error => {
        console.error('加载系统消息失败:', error)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
        wx.hideLoading()
      })
    }
  },

  // 格式化时间显示
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // 今天的消息显示时间
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    
    // 一周内的消息显示星期
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['日', '一', '二', '三', '四', '五', '六']
      return `星期${days[date.getDay()]}`
    }
    
    // 更早的消息显示完整日期
    return `${date.getMonth() + 1}-${date.getDate()}`
  },

  // 点击进入聊天（修改方法名匹配wxml中的绑定）
  navigateToChat(e) {
    const { id } = e.currentTarget.dataset
    console.log('点击进入聊天，会话ID:', id)
    
    wx.navigateTo({
      url: `/pages/chat/chat?sessionId=${id}`,
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        })
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadMessages()
    wx.stopPullDownRefresh()
  }
})