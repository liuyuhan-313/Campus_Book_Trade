const app = getApp()
const { API } = require('../../config/api')

Page({
  data: {
    campuses: [
      { value: '', label: '全部校区' },
      { value: 'handan', label: '邯郸校区' },
      { value: 'fenglin', label: '枫林校区' },
      { value: 'jiangwan', label: '江湾校区' },
      { value: 'zhangjiang', label: '张江校区' }
    ],
    bookTypes: [],
    conditions: [
      { value: 'new', label: '全新' },
      { value: 'like_new', label: '九成新' },
      { value: 'good', label: '八成新' },
      { value: 'fair', label: '七成新' },
      { value: 'poor', label: '六成新及以下' }
    ],
    books: [],
    selectedFilters: {
      campus: '',
      bookType: '',
      condition: ''
    }
  },

  async onLoad() {
    await this.loadCategories()
    this.loadBooks()
  },

  async loadCategories() {
    try {
      const res = await app.request({
        url: '/api/categories/',
        method: 'GET'
      })
      
      if (res && Array.isArray(res)) {
        this.setData({
          bookTypes: res.map(category => ({
            id: category.id,
            name: category.name
          }))
        })
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      })
    }
  },

  onTagTap(e) {
    const { type, value } = e.currentTarget.dataset
    const { selectedFilters } = this.data
    
    // 切换选中状态
    selectedFilters[type] = selectedFilters[type] === value ? '' : value
    
    this.setData({ selectedFilters })
    this.loadBooks()
  },

  async loadBooks() {
    const { selectedFilters } = this.data
    
    try {
      const params = {}
      
      if (selectedFilters.campus) {
        params.campus = selectedFilters.campus
      }
      if (selectedFilters.bookType) {
        params.category = selectedFilters.bookType
      }
      if (selectedFilters.condition) {
        params.condition = selectedFilters.condition
      }
      
      const res = await app.request({
        url: '/api/books/',
        method: 'GET',
        data: params
      })
      
      let books = []
      if (res.list) {
        books = res.list
      } else if (res.results) {
        books = res.results
      } else if (Array.isArray(res)) {
        books = res
      }
      
      // 确保图片URL是完整的
      books = books.map(book => {
        if (book.cover_image && !book.cover_image.startsWith('http')) {
          book.cover_image = app.globalData.baseUrl + book.cover_image
        }
        return book
      })
      
      this.setData({ books })
    } catch (error) {
      console.error('加载书籍失败:', error)
      wx.showToast({
        title: '加载书籍失败',
        icon: 'none'
      })
    }
  },

  // 跳转到书籍详情页
  goToBookDetail(e) {
    const bookId = e.currentTarget.dataset.bookId
    if (bookId) {
      wx.navigateTo({
        url: `/pages/bookDetail/bookDetail?id=${bookId}`
      })
    }
  }
}) 