const app = getApp()
const { request, BASE_URL } = require('../../utils/request')

Page({
  data: {
    books: [],
    showEditModal: false,
    editBook: null,
    statusList: [
      { value: 'on_sale', label: '在售' },
      { value: 'sold', label: '已售出' }
    ],
    statusIndex: 0,
    campusList: [
      { value: 'handan', label: '邯郸校区' },
      { value: 'fenglin', label: '枫林校区' },
      { value: 'jiangwan', label: '江湾校区' },
      { value: 'zhangjiang', label: '张江校区' }
    ],
    campusIndex: 0,
    conditionList: [
      { value: 'new', label: '全新' },
      { value: 'like_new', label: '九成新' },
      { value: 'good', label: '八成新' },
      { value: 'fair', label: '七成新' },
      { value: 'poor', label: '六成新及以下' }
    ],
    conditionIndex: 0
  },

  onLoad() {
    this.fetchPublishedBooks()
  },

  onShow() {
    this.fetchPublishedBooks()
  },

  // 获取已发布的图书列表
  async fetchPublishedBooks() {
    try {
      const res = await request({
        url: '/api/books/my-published/',
        method: 'GET'
      })
      
      if (res.books) {
        // 处理图片URL，确保是完整的URL，并检查退款状态
        const books = res.books.map(book => ({
          ...book,
          cover_image: book.cover_image ? (book.cover_image.startsWith('http') ? book.cover_image : `${BASE_URL}${book.cover_image}`) : '',
          images: book.image_urls ? book.image_urls.map(img => img.startsWith('http') ? img : `${BASE_URL}${img}`) : [],
          refund_status: book.refund_status || false, // 添加退款状态
          order_id: book.order_id || null // 添加订单ID
        }))
        
        this.setData({ books })
      }
    } catch (error) {
      console.error('获取已发布图书失败:', error)
      wx.showToast({
        title: '获取图书列表失败',
        icon: 'none'
      })
    }
  },

  // 编辑图书
  editBook(e) {
    const book = e.currentTarget.dataset.book
    // 设置当前状态的索引
    const statusIndex = this.data.statusList.findIndex(status => status.value === (book.is_sold ? 'sold' : 'on_sale'))
    // 设置当前校区的索引
    const campusIndex = this.data.campusList.findIndex(campus => campus.value === book.campus)
    // 设置当前成色的索引
    const conditionIndex = this.data.conditionList.findIndex(condition => condition.value === book.condition)
    
    this.setData({
      showEditModal: true,
      editBook: { ...book },
      statusIndex: statusIndex !== -1 ? statusIndex : 0,
      campusIndex: campusIndex !== -1 ? campusIndex : 0,
      conditionIndex: conditionIndex !== -1 ? conditionIndex : 0
    })
  },

  // 关闭编辑弹窗
  closeEditModal() {
    this.setData({
      showEditModal: false,
      editBook: null,
      statusIndex: 0,
      campusIndex: 0,
      conditionIndex: 0
    })
  },

  // 处理输入变化
  onTitleInput(e) {
    this.setData({
      'editBook.title': e.detail.value
    })
  },

  onAuthorInput(e) {
    this.setData({
      'editBook.author': e.detail.value
    })
  },

  onPriceInput(e) {
    this.setData({
      'editBook.price': e.detail.value
    })
  },

  onDescriptionInput(e) {
    this.setData({
      'editBook.description': e.detail.value
    })
  },

  // 处理状态变化
  onStatusChange(e) {
    this.setData({
      statusIndex: e.detail.value
    })
  },

  // 处理校区变化
  onCampusChange(e) {
    this.setData({
      campusIndex: e.detail.value
    })
  },

  // 处理成色变化
  onConditionChange(e) {
    this.setData({
      conditionIndex: e.detail.value
    })
  },

  // 更新图书信息
  async updateBook() {
    const { editBook, statusList, statusIndex, campusList, campusIndex, conditionList, conditionIndex } = this.data
    if (!editBook.title || !editBook.price || !editBook.author) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    try {
      await request({
        url: `/api/books/update/${editBook.id}/`,
        method: 'PUT',
        data: {
          title: editBook.title,
          author: editBook.author,
          price: Number(editBook.price),
          description: editBook.description || '',
          campus: campusList[campusIndex].value,
          is_sold: statusList[statusIndex].value === 'sold',
          condition: conditionList[conditionIndex].value
        }
      })

      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })

      this.closeEditModal()
      this.fetchPublishedBooks()
    } catch (error) {
      console.error('更新图书失败:', error)
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      })
    }
  },

  // 显示删除确认框
  showDeleteConfirm(e) {
    const bookId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这本图书吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteBook(bookId)
        }
      }
    })
  },

  // 删除图书
  async deleteBook(bookId) {
    try {
      await request({
        url: `/api/books/delete/${bookId}/`,
        method: 'DELETE'
      })

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })

      this.fetchPublishedBooks()
    } catch (error) {
      console.error('删除图书失败:', error)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  },

  // 同意退款
  async approveRefund(e) {
    const { id: bookId, orderId } = e.currentTarget.dataset
    
    try {
      const res = await wx.showModal({
        title: '确认退款',
        content: '确定同意买家的退款申请吗？',
        confirmText: '同意退款',
        cancelText: '取消'
      })

      if (!res.confirm) return

      wx.showLoading({
        title: '处理中...'
      })

      // 调用退款API
      const response = await request({
        url: `/api/orders/${orderId}/approve_refund/`,
        method: 'POST',
        data: {
          book_id: bookId
        }
      })

      if (response.code === 0 || response.success) {
        wx.hideLoading()
        wx.showToast({
          title: '退款处理成功',
          icon: 'success'
        })
        // 刷新列表
        this.fetchPublishedBooks()
      } else {
        throw new Error(response.msg || '退款处理失败')
      }
    } catch (error) {
      wx.hideLoading()
      console.error('退款处理失败:', error)
      wx.showToast({
        title: error.message || '退款处理失败',
        icon: 'none'
      })
    }
  },

  // 联系客服
  contactService(e) {
    const bookId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '联系客服',
      content: '如需处理退款纠纷，请联系客服处理。\n\n客服电话：400-123-4567\n客服微信：BookTrade_Service',
      confirmText: '复制微信号',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'BookTrade_Service',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 跳转到发布页面
  navigateToPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  },

  // 支持下拉刷新
  onPullDownRefresh() {
    this.fetchPublishedBooks().then(() => {
      wx.stopPullDownRefresh()
    })
  }
}) 