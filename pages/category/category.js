const app = getApp()

Page({
  data: {
    campuses: [],
    bookTypes: [],
    conditions: [],
    books: [],
    selectedFilters: {
      campus: '',
      bookType: '',
      condition: ''
    },
    categories: []
  },

  onLoad() {
    // 从全局配置获取分类数据
    this.setData({
      campuses: app.globalData.campuses,
      bookTypes: app.globalData.categories.type,
      conditions: app.globalData.categories.condition,
      categories: getApp().globalData.categories
    })
    
    this.loadBooks()
  },

  onTagTap(e) {
    const { type, value } = e.currentTarget.dataset
    const { selectedFilters } = this.data
    
    // 切换选中状态
    selectedFilters[type] = selectedFilters[type] === value ? '' : value
    
    this.setData({ selectedFilters })
    this.loadBooks()
  },

  loadBooks() {
    const { selectedFilters } = this.data
    
    // TODO: 根据筛选条件从服务器加载书籍列表
    this.setData({
      books: [
        {
          id: 1,
          title: '示例书籍',
          price: 29.9,
          cover: '/assets/icons/book-placeholder.png'
        }
      ]
    })
  }
}) 