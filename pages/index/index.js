const app = getApp()
const { API } = require('../../config/api')
const { getOrderList } = require('../../api/order')

Page({
  data: {
    books: [],
    notice: [],
    searchKeyword: '',
    selectedCampus: '',
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    campuses: [],
    showFilterPanel: false,
    filterOptions: {
      condition: '',
      priceRange: '',
      sortBy: 'newest'
    },
    orders: []
  },

  onLoad() {
    this.setData({
      campuses: app.globalData.campuses || []
    })
    this.loadNotice()
    this.loadBooks()
    this.testOrderAPI()
  },

  onPullDownRefresh() {
    this.setData({
      books: [],
      page: 1,
      hasMore: true
    })
    this.loadBooks().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadBooks()
    }
  },

  // 加载公告
  async loadNotice() {
    try {
      const res = await app.request({
        url: API.noticeList
      })
      this.setData({
        notice: res.data
      })
    } catch (error) {
      console.error('加载公告失败', error)
      wx.showToast({
        title: '加载公告失败',
        icon: 'none'
      })
    }
  },

  // 加载书籍列表
  async loadBooks() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })
    try {
      const res = await app.request({
        url: API.bookList,
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          keyword: this.data.searchKeyword,
          campus: this.data.selectedCampus,
          condition: this.data.filterOptions.condition,
          priceRange: this.data.filterOptions.priceRange,
          sortBy: this.data.filterOptions.sortBy
        }
      })

      const { list, total } = res.data
      this.setData({
        books: [...this.data.books, ...list],
        page: this.data.page + 1,
        hasMore: this.data.books.length + list.length < total
      })
    } catch (error) {
      console.error('加载书籍列表失败', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 确认搜索
  onSearch() {
    this.setData({
      books: [],
      page: 1,
      hasMore: true
    })
    this.loadBooks()
  },

  // 选择校区
  onCampusSelect(e) {
    const campus = e.currentTarget.dataset.campus
    this.setData({
      selectedCampus: this.data.selectedCampus === campus ? '' : campus,
      books: [],
      page: 1,
      hasMore: true
    })
    this.loadBooks()
  },

  // 跳转到详情页
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/bookDetail/bookDetail?id=${id}`
    })
  },

  // 跳转到发布页面
  navigateToPublish() {
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/publish/publish'
    })
  },

  // 显示筛选面板
  showFilter() {
    this.setData({
      showFilterPanel: true
    })
  },

  // 隐藏筛选面板
  hideFilter() {
    this.setData({
      showFilterPanel: false
    })
  },

  // 应用筛选条件
  applyFilter(e) {
    const { condition, priceRange, sortBy } = e.detail
    this.setData({
      filterOptions: {
        condition,
        priceRange,
        sortBy
      },
      showFilterPanel: false,
      books: [],
      page: 1,
      hasMore: true
    })
    this.loadBooks()
  },

  // 重置筛选条件
  resetFilter() {
    this.setData({
      filterOptions: {
        condition: '',
        priceRange: '',
        sortBy: 'newest'
      },
      showFilterPanel: false,
      books: [],
      page: 1,
      hasMore: true
    })
    this.loadBooks()
  },

  async testOrderAPI() {
    try {
      wx.showLoading({
        title: '加载中...'
      });

      const result = await getOrderList();
      console.log('订单列表:', result);

      this.setData({
        orders: result.data || []
      });

      wx.showToast({
        title: '加载成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('加载失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  }
}) 