const { getBookList, searchBooks } = require('../../../services/book');

Page({
  data: {
    books: [],
    loading: false,
    page: 1,
    hasMore: true,
    searchValue: '',
    categories: [],
    selectedCategory: ''
  },

  onLoad() {
    this.loadBooks();
  },

  // 加载图书列表
  async loadBooks(refresh = false) {
    if (this.data.loading || (!refresh && !this.data.hasMore)) return;

    try {
      this.setData({ loading: true });
      
      const params = {
        page: refresh ? 1 : this.data.page,
        category: this.data.selectedCategory,
        search: this.data.searchValue
      };

      const response = await getBookList(params);
      
      const books = refresh ? response.results : [...this.data.books, ...response.results];
      
      this.setData({
        books,
        page: refresh ? 2 : this.data.page + 1,
        hasMore: response.next !== null,
        loading: false
      });
    } catch (error) {
      console.error('加载图书列表失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 搜索图书
  async onSearch() {
    if (!this.data.searchValue.trim()) {
      return;
    }

    try {
      this.setData({ loading: true });
      
      const response = await searchBooks({
        search: this.data.searchValue,
        category: this.data.selectedCategory
      });

      this.setData({
        books: response.results,
        page: 2,
        hasMore: response.next !== null,
        loading: false
      });
    } catch (error) {
      console.error('搜索图书失败:', error);
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 输入搜索关键词
  onSearchInput(e) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  // 选择分类
  onCategoryChange(e) {
    this.setData({
      selectedCategory: e.detail.value
    }, () => {
      this.loadBooks(true);
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadBooks(true);
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadBooks();
    }
  },

  // 跳转到图书详情
  navigateToDetail(e) {
    const { bookId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/book/detail/index?id=${bookId}`
    });
  }
}); 