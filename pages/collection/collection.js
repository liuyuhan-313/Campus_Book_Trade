const app = getApp()
const { getCollectionList, toggleCollection } = require('../../api/collection')
const { getFullUrl } = require('../../utils/request')

// 校区映射
const CAMPUS_MAP = {
  'handan': '邯郸校区',
  'fenglin': '枫林校区',
  'jiangwan': '江湾校区',
  'zhangjiang': '张江校区'
}

// 成色映射
const CONDITION_MAP = {
  'new': '全新',
  'like_new': '九成新',
  'good': '八成新',
  'fair': '七成新',
  'poor': '六成新及以下'
}

Page({
  data: {
    books: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    sortBy: 'time', // time or price
    sortOrder: 'desc', // desc or asc
    removedSoldBooks: false // 标记是否有已售出的书籍被移除
  },

  onLoad() {
    this.loadCollections()
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.setData({
      books: [],
      page: 1,
      hasMore: true,
      removedSoldBooks: false
    })
    this.loadCollections()
  },

  onPullDownRefresh() {
    this.setData({
      books: [],
      page: 1,
      hasMore: true,
      removedSoldBooks: false
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

    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    
    this.setData({ loading: true })
    try {
      const res = await getCollectionList({
        page: this.data.page,
        page_size: this.data.pageSize,
        sort_by: this.data.sortBy,
        sort_order: this.data.sortOrder
      })

      console.log('收藏列表原始数据:', res)

      // 处理返回的数据
      const list = (res.results || []).map(item => {
        // 获取封面图片
        let coverImage = item.book.cover_image || item.book.cover_image_url
        if (coverImage && !coverImage.startsWith('http')) {
          coverImage = getFullUrl(coverImage)
        }

        // 获取其他图片
        let images = []
        if (item.book.image_urls && Array.isArray(item.book.image_urls)) {
          images = item.book.image_urls.map(url => {
            if (!url.startsWith('http')) {
              return getFullUrl(url)
            }
            return url
          })
        }

        // 如果没有封面图，使用第一张图片作为封面
        if (!coverImage && images.length > 0) {
          coverImage = images[0]
        }

        // 获取校区和成色的显示文本
        const campusLabel = CAMPUS_MAP[item.book.campus] || item.book.campus
        const conditionLabel = CONDITION_MAP[item.book.condition] || item.book.condition

        return {
          id: item.book.id,
          title: item.book.title,
          author: item.book.author,
          cover: coverImage,
          price: item.book.price,
          originalPrice: item.book.original_price,
          campus: campusLabel,
          condition: conditionLabel,
          is_sold: item.book.is_sold
        }
      })

      console.log('处理后的书籍列表:', list)

      // 过滤掉已售出的书籍
      const availableBooks = list.filter(book => !book.is_sold)
      const removedCount = list.length - availableBooks.length

      // 如果有书籍被过滤掉，设置标记并显示提示
      if (removedCount > 0 && !this.data.removedSoldBooks) {
        this.setData({ removedSoldBooks: true })
        wx.showToast({
          title: `${removedCount}本已售出书籍已从收藏中移除`,
          icon: 'none',
          duration: 2000
        })
      }

      this.setData({
        books: [...this.data.books, ...availableBooks],
        page: this.data.page + 1,
        hasMore: this.data.books.length + availableBooks.length < (res.count || 0)
      })
    } catch (error) {
      console.error('加载收藏列表失败', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
      wx.hideLoading()
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
      hasMore: true,
      removedSoldBooks: false
    })

    this.loadCollections()
  },

  // 取消收藏
  async toggleCollect(e) {
    const { id } = e.currentTarget.dataset
    
    try {
      wx.showLoading({
        title: '处理中...',
        mask: true
      })

      const res = await toggleCollection(id)
      
      if (!res.is_collected) {
        // 从列表中移除
        const books = this.data.books.filter(book => book.id !== id)
        this.setData({ books })
        
        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('取消收藏失败', error)
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
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