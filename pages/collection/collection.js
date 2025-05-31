const app = getApp()
const { API } = require('../../config/api')

Page({
  data: {
    books: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    sortBy: 'time', // time or price
    sortOrder: 'desc' // desc or asc
  },

  onLoad() {
    this.loadCollections()
  },

  onPullDownRefresh() {
    this.setData({
      books: [],
      page: 1,
      hasMore: true
    })
    this.loadCollections().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCollections()
    }
  },

  // 加载收藏列表
  async loadCollections() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })
    try {
      const res = await app.request({
        url: API.collectList,
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          sortBy: this.data.sortBy,
          sortOrder: this.data.sortOrder
        }
      })

      const { list, total } = res.data
      this.setData({
        books: [...this.data.books, ...list],
        page: this.data.page + 1,
        hasMore: this.data.books.length + list.length < total
      })
    } catch (error) {
      console.error('加载收藏列表失败', error)
      app.showToast('加载失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 切换排序方式
  changeSort(e) {
    const { sort } = e.currentTarget.dataset
    let { sortBy, sortOrder } = this.data

    if (sortBy === sort) {
      // 同一排序字段，切换排序顺序
      sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'
    } else {
      // 不同排序字段，默认降序
      sortBy = sort
      sortOrder = 'desc'
    }

    this.setData({
      sortBy,
      sortOrder,
      books: [],
      page: 1,
      hasMore: true
    })

    this.loadCollections()
  },

  // 取消收藏
  async toggleCollect(e) {
    const { id } = e.currentTarget.dataset
    try {
      await app.request({
        url: API.toggleCollect,
        method: 'POST',
        data: { bookId: id }
      })
      
      // 从列表中移除
      const books = this.data.books.filter(book => book.id !== id)
      this.setData({ books })
      
      app.showToast('已取消收藏', 'success')
    } catch (error) {
      console.error('取消收藏失败', error)
      app.showToast('操作失败，请重试')
    }
  },

  // 跳转到详情页
  navigateToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/bookDetail/bookDetail?id=${id}`
    })
  }
}) 