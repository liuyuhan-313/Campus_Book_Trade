const { getChatList, startChat, getChatMessages, sendMessage } = require('../../api/chat')
const app = getApp()

Page({
  data: {
    chatList: [],        // 聊天会话列表
    messages: [],        // 当前会话的消息记录
    currentSession: null,// 当前聊天会话信息
    message: '',         // 输入的消息
    isSeller: false      // 是否为卖家
  },

  onLoad(options) {
    const userInfo = getApp().globalData.userInfo
    this.setData({ userInfo })
    
    // 保存页面参数
    this.options = options

    console.log('页面加载参数:', options)

    // 如果从书籍详情页进入，会带有书籍ID
    if (options.bookId) {
      this.startNewChat(options.bookId, options.sellerId)
    } else if (options.sessionId) {
      // 从会话列表点击进入
      this.loadSession(options.sessionId)
    } else {
      // 从消息列表页进入，加载所有会话
      this.loadChatList()
    }
  },

  // 获取完整的图片URL
  getFullImageUrl(url) {
    console.log('处理图片URL:', url) // 添加调试信息
    if (!url) {
      console.log('图片URL为空，使用默认图片')
      return '/assets/icons/book-placeholder.png';
    }
    if (url.startsWith('http')) {
      console.log('图片URL已是完整路径:', url)
      return url;
    }
    const fullUrl = `http://127.0.0.1:8000${url}`;
    console.log('拼接后的完整URL:', fullUrl)
    return fullUrl;
  },

  // 开始新的聊天
  async startNewChat(bookId, sellerId) {
    try {
      wx.showLoading({ title: '加载中' })
      console.log('开始新聊天，书籍ID:', bookId, '卖家ID:', sellerId)
      
      const res = await startChat(bookId, sellerId)
      console.log('创建聊天响应:', res)
      
      if (res.session_id) {
        console.log('会话创建成功，会话ID:', res.session_id)
        this.setData({ 
          isSeller: false  // 从联系卖家进入，一定是买家
        })
        // 加载会话信息
        await this.loadSession(res.session_id)
      } else {
        throw new Error('未获取到会话ID')
      }
    } catch (error) {
      wx.showToast({
        title: '创建会话失败',
        icon: 'none',
        duration: 2000
      })
      console.error('创建会话失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  // 加载会话信息
  async loadSession(sessionId) {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await getChatMessages(sessionId)
      // 添加数据校验
      console.log('获取到的完整响应:', res) // 添加调试日志
      // 检查响应数据结构
      if (!res || !res.data) {
        throw new Error('返回数据为空')
      }
      const { session, messages } = res.data
      console.log('会话信息:', session) // 添加会话信息调试
      console.log('书籍信息:', session.book) // 添加书籍信息调试
      const userInfo = this.data.userInfo

      // 确保获取到了用户ID
      if (!userInfo || !userInfo.id) {
        console.error('未获取到用户信息')
        throw new Error('未获取到用户信息')
      }

      // 判断当前用户是买家还是卖家
      const isSeller = session.seller.id === userInfo.id
      const otherUser = isSeller ? session.buyer : session.seller
      console.log('身份判断:', {
        currentUserId: userInfo.id,
        sellerId: session.seller.id,
        isSeller: isSeller
      })
      
      // 处理消息列表，添加时间显示
      const processedMessages = this.processMessages(messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        is_read: msg.is_read,
        is_self: msg.sender_id === userInfo.id,
        type: msg.type || 'text'
      })))

      // 处理书籍信息
      console.log('原始书籍数据:', session.book) // 添加原始数据调试
      console.log('书籍封面字段:', session.book?.cover_image, session.book?.cover) // 添加封面字段调试
      
      const processedBook = session.book ? {
        ...session.book,
        cover: this.getFullImageUrl(session.book.cover_image || session.book.cover)
      } : null

      console.log('处理后的书籍信息:', processedBook) // 添加调试日志

      // 设置会话数据
      this.setData({
        currentSession: {
          id: sessionId,
          book: processedBook,
          is_seller: isSeller,
          other_user: {
            nickname: isSeller ? session.buyer.nickname : session.seller.nickname,
            avatar: otherUser.avatar_url || '/assets/images/default-avatar.png',
            role: isSeller ? '买家' : '卖家'
          }
        },
        messages: processedMessages
      }, () => {
        // 在数据设置完成后滚动到底部
        this.scrollToBottom()
      })
    } catch (error) {
      console.error('获取会话详细错误:', error)
      wx.showToast({
        title: '获取会话失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载聊天会话列表
  async loadChatList() {
    try {
      wx.showLoading({ title: '加载中' })
      const res = await getChatList()
      
      const chatData = res.data || []
      if (!Array.isArray(chatData)) {
        console.error('聊天列表数据格式错误:', res)
        throw new Error('数据格式错误')
      }
      
      this.setData({ 
        chatList: chatData.map(chat => ({
          ...chat,
          bookCover: chat.book?.cover || '/images/default-book.png',
          bookTitle: chat.book?.title || '未知书籍',
          lastMessage: chat.last_message || '暂无消息',
          lastTime: chat.updated_at || '',
          unreadCount: chat.unread_count || 0
        }))
      })
    } catch (error) {
      wx.showToast({
        title: '获取消息列表失败',
        icon: 'none',
        duration: 2000
      })
      console.error('获取消息列表失败:', error)
      this.setData({ chatList: [] })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载会话消息记录
  async handleSendMessage() {
    const { message, currentSession, userInfo } = this.data
    
    if (!message.trim()) {
      wx.showToast({
        title: '消息不能为空',
        icon: 'none'
      })
      return
    }
    
    if (!currentSession || !currentSession.id) {
      wx.showToast({
        title: '会话不存在',
        icon: 'none'
      })
      return
    }
  
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '用户未登录',
        icon: 'none'
      })
      return
    }
  
    try {
      wx.showLoading({ title: '发送中' })
      
      console.log('准备发送消息:', {
        sessionId: currentSession.id,
        content: message,
        userId: userInfo.id
      })

      const response = await sendMessage(currentSession.id, message)
      console.log('发送消息响应:', response)

      // 将新消息添加到消息列表中
      const newMessage = {
        id: response.id,
        content: response.content,
        sender_id: response.sender_id,
        created_at: response.created_at,
        is_read: response.is_read,
        is_self: true,
        type: 'text'
      }

      // 更新消息列表
      this.setData({
        messages: [...this.data.messages, newMessage],
        message: '' // 清空输入框
      }, () => {
        // 滚动到底部
        this.scrollToBottom()
      })

    } catch (error) {
      console.error('发送消息失败:', error)
      wx.showToast({
        title: '发送失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 点击聊天列表项
  handleChatItemClick(e) {
    const { sessionId } = e.currentTarget.dataset
    this.loadSession(sessionId)
  },

  // 输入消息
  handleInput(e) {
    this.setData({
      message: e.detail.value
    })
  },

  // 修改滚动到底部的函数
  scrollToBottom() {
    setTimeout(() => {  // 添加延时确保消息列表已更新
      const query = wx.createSelectorQuery()
      query.select('.message-list').boundingClientRect()
      query.selectViewport().scrollOffset()
      query.exec(function(res) {
        if (res[0] && res[1]) {
          wx.pageScrollTo({
            scrollTop: res[0].bottom,  // 滚动到消息列表底部
            duration: 300
          })
        }
      })
    }, 200)
  },
  // 跳转到书籍详情
  navigateToBook() {
    const { book } = this.data.currentSession || {}
    console.log('当前书籍信息:', book)  // 添加调试日志
    if (book && book.id) {
      wx.navigateTo({
        url: `/pages/bookDetail/bookDetail?id=${book.id}`,
        fail: (error) => {
          console.error('跳转失败:', error)
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          })
        }
      })
    }else {
      console.log('无法获取书籍信息:', this.data.currentSession)
      wx.showToast({
        title: '无法获取书籍信息',
        icon: 'none'
      })
    }
  },

  formatMessageTime(timestamp) {
    if (!timestamp) return ''
    
    const messageDate = new Date(timestamp)
    const now = new Date()
    const diff = now - messageDate
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    
    // 获取年月日时分
    const year = messageDate.getFullYear()
    const month = messageDate.getMonth() + 1
    const date = messageDate.getDate()
    const hours = messageDate.getHours().toString().padStart(2, '0')
    const minutes = messageDate.getMinutes().toString().padStart(2, '0')
    
    // 今天的消息
    if (days === 0) {
      return `${hours}:${minutes}`
    }
    // 昨天的消息
    else if (days === 1) {
      return `昨天 `
    }
    // 一周内的消息
    else if (days < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${weekdays[messageDate.getDay()]} ${hours}:${minutes}`
    }
    // 今年的消息
    else if (year === now.getFullYear()) {
      return `${month}月${date}日`
    }
    // 更久之前的消息
    else {
      return `${year}年${month}月${date}日`
    }
  },
  // 处理消息列表，添加时间显示逻辑
  processMessages(messages) {
    if (!Array.isArray(messages)) {
      console.error('消息数据格式错误:', messages)
      return []
    }

    return messages.map((msg, index) => {
      const showTime = index === 0 || this.shouldShowTime(messages[index - 1].created_at, msg.created_at)
      return {
        ...msg,
        showTime,
        timeStr: showTime ? this.formatMessageTime(msg.created_at) : ''
      }
    })
  },

  // 判断是否显示时间
  shouldShowTime(prevTime, currentTime) {
    if (!prevTime || !currentTime) return true
    
    const prev = new Date(prevTime)
    const current = new Date(currentTime)
    const diffMinutes = (current - prev) / (1000 * 60)
    
    return diffMinutes >= 5
  },

  // 处理图片加载错误
  handleImageError(e) {
    console.log('图片加载失败:', e)
    
    // 设置默认书籍封面
    const currentSession = this.data.currentSession
    if (currentSession && currentSession.book) {
      currentSession.book.cover = '/assets/icons/book-placeholder.png'
      this.setData({
        currentSession
      })
    }
  },

}) 