const app = getApp()
const { API } = require('../../config/api')
const { getOrderList } = require('../../api/order')

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
    notice: [],
    searchKeyword: '',
    selectedCampus: '',
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    campuses: [
      { value: '', label: '全部校区' },
      { value: 'handan', label: '邯郸校区' },
      { value: 'fenglin', label: '枫林校区' },
      { value: 'jiangwan', label: '江湾校区' },
      { value: 'zhangjiang', label: '张江校区' }
    ],
    showFilterPanel: false,
    filterOptions: {
      condition: '',
      sortBy: 'newest'
    },
    conditions: [
      { value: 'new', label: '全新' },
      { value: 'like_new', label: '九成新' },
      { value: 'good', label: '八成新' },
      { value: 'fair', label: '七成新' },
      { value: 'poor', label: '六成新及以下' }
    ],
    orders: []
  },

  onLoad() {
    // 从全局数据获取校区信息
    if (app.globalData && app.globalData.campuses) {
      this.setData({
        campuses: app.globalData.campuses
      });
      console.log('已设置校区数据:', this.data.campuses);
    } else {
      console.warn('未找到全局校区数据，使用默认值');
    }
    
    // 加载公告和书籍列表
    this.loadNotice();
    this.loadBooks();
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
      console.log('开始加载公告');
      const res = await app.request({
        url: API.announcements,
        method: 'GET'
      });

      console.log('公告加载响应:', res);
      
      let notices = [];
      // 统一处理不同的返回格式
      if (res && res.results) {
        notices = res.results;
      } else if (Array.isArray(res)) {
        notices = res;
      } else if (res && res.data) {
        notices = Array.isArray(res.data) ? res.data : [res.data];
      }

      // 如果没有公告，添加一个默认公告
      if (!notices || notices.length === 0) {
        notices = [{
          id: 1,
          title: '欢迎使用校园二手书交易平台',
          content: '欢迎使用校园二手书交易平台，祝您购书愉快！',
          created_at: new Date().toISOString()
        }];
      }

      // 确保每个公告对象都有必要的字段
      notices = notices.map(notice => ({
        id: notice.id || Date.now(),
        content: notice.content || notice.title || '暂无内容',
        title: notice.title || '系统公告',
        createTime: notice.created_at || notice.createTime || new Date().toISOString()
      }));

      // 按时间倒序排序
      notices.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
      
      console.log('处理后的公告数据:', notices);
      
      this.setData({
        notice: notices
      });
      
      console.log('公告加载成功:', notices);
    } catch (error) {
      console.error('加载公告失败', error);
      // 设置默认公告
      const defaultNotice = [{
        id: 1,
        title: '欢迎使用校园二手书交易平台',
        content: '欢迎使用校园二手书交易平台，祝您购书愉快！',
        createTime: new Date().toISOString()
      }];
      
      this.setData({
        notice: defaultNotice
      });
      
      // 只有在已登录状态下才显示错误提示
      if (app.globalData.userInfo) {
        wx.showToast({
          title: '加载公告失败',
          icon: 'none'
        });
      }
    }
  },

  // 加载书籍列表
  async loadBooks() {
    if (this.data.loading || !this.data.hasMore) return;
  
    this.setData({ loading: true });
    try {
      const { filterOptions } = this.data;
      const params = {
        page: this.data.page,
        page_size: this.data.pageSize
      };

      // 只添加有值的参数
      if (this.data.searchKeyword) {
        params.keyword = this.data.searchKeyword;
      }
      if (this.data.selectedCampus) {
        params.campus = this.data.selectedCampus;
      }
      if (filterOptions.condition) {
        params.condition = filterOptions.condition;
      }
      
      // 处理排序参数
      if (filterOptions.sortBy) {
        switch (filterOptions.sortBy) {
          case 'price-asc':
            params.ordering = 'price';
            break;
          case 'price-desc':
            params.ordering = '-price';
            break;
          case 'newest':
            params.ordering = '-created_at';
            break;
        }
      }

      console.log('请求书籍列表，完整参数:', {
        params,
        currentState: {
          selectedCampus: this.data.selectedCampus,
          searchKeyword: this.data.searchKeyword,
          filterOptions: this.data.filterOptions
        }
      });
  
      const res = await app.request({
        url: API.list,
        method: 'GET',
        data: params
      });
  
      console.log('API原始响应:', res);
  
      if (!res) {
        throw new Error('API无响应');
      }
  
      const responseData = res.data || res;
      console.log('处理后的响应数据:', responseData);
      
      let bookList = [];
      let total = 0;

      if (responseData.list) {
        bookList = responseData.list;
        total = responseData.total || 0;
      } else if (responseData.results) {
        bookList = responseData.results;
        total = responseData.count || 0;
      } else if (Array.isArray(responseData)) {
        bookList = responseData;
        total = responseData.length;
      } else {
        console.warn('未知的响应数据结构:', responseData);
        throw new Error('API返回数据结构不符合预期');
      }

      // 处理每本书的校区和成色显示
      bookList = bookList.map(book => ({
        ...book,
        campusLabel: CAMPUS_MAP[book.campus] || book.campus,
        conditionLabel: CONDITION_MAP[book.condition] || book.condition
      }));

      this.setData({
        books: this.data.page === 1 ? bookList : [...this.data.books, ...bookList],
        hasMore: bookList.length === this.data.pageSize,
        page: this.data.page + 1,
        loading: false
      });
    } catch (error) {
      console.error('加载书籍失败:', error);
      // 只有在已登录状态下才显示错误提示
      if (app.globalData.userInfo) {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
      this.setData({ loading: false });
    }
  },

  // 获取分类名称
  getCategoryName(categoryId) {
    if (!categoryId) return '';
    const category = this.data.categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  },

  // 获取成色文本
  getConditionText(condition) {
    const conditionItem = this.data.conditions.find(c => c.value === condition);
    return conditionItem ? conditionItem.label : condition;
  },

  // 获取校区名称
  getCampusName(campus) {
    const campusItem = this.data.campuses.find(c => c.value === campus);
    return campusItem ? campusItem.label : campus;
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

  // 校区选择
  onCampusSelect(e) {
    const campus = e.currentTarget.dataset.campus;
    console.log('校区选择:', {
      selectedCampus: campus,
      campuses: this.data.campuses
    });
    
    this.setData({
      selectedCampus: campus,
      page: 1,
      books: [],
      hasMore: true
    });
    
    this.loadBooks();
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

  // 选择成色
  onConditionSelect(e) {
    const condition = e.currentTarget.dataset.condition
    this.setData({
      'filterOptions.condition': this.data.filterOptions.condition === condition ? '' : condition
    })
  },

  // 选择排序方式
  onSortSelect(e) {
    const sort = e.currentTarget.dataset.sort
    this.setData({
      'filterOptions.sortBy': sort
    })
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      filterOptions: {
        condition: '',
        sortBy: 'newest'
      }
    });
  },

  // 应用筛选
  applyFilter() {
    this.setData({
      showFilterPanel: false,
      books: [],
      page: 1,
      hasMore: true
    });

    this.loadBooks();
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

      // 只有在已登录状态下才显示成功提示
      if (app.globalData.userInfo) {
        wx.showToast({
          title: '加载成功',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('加载失败:', error);
      // 只有在已登录状态下才显示错误提示
      if (app.globalData.userInfo) {
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    } finally {
      wx.hideLoading();
    }
  }
})