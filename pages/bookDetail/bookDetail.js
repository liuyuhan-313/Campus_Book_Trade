const app = getApp()
const { API } = require('../../config/api')
import { getBookDetail } from '../../api/book'
import { getUserInfo } from '../../api/user'
import { startChat } from '../../api/chat'
import { createOrder } from '../../api/order'
import { toggleCollection } from '../../api/collection'

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
    book: null,
    isCollected: false,
    loading: true,
    seller: null,
    isSeller: false,
    showContact: false,
    baseUrl: 'http://127.0.0.1:8000',
    defaultAvatar: '/assets/icons/default-avatar.png'  // 添加默认头像路径
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    this.loadBookDetail(id)
  },

  testData() {
    console.log('当前页面数据：', {
      book: this.data.book,
      seller: this.data.seller,
      userInfo: app.globalData.userInfo
    });
  },

  // 获取完整头像URL
  getFullAvatarUrl(url) {
    if (!url) return this.data.defaultAvatar;
    if (url.startsWith('http')) return url;
    return `${this.data.baseUrl}${url}`;
  },

  // 获取完整的图片URL
  getFullImageUrl(url) {
    if (!url) {
      return '/assets/icons/default-book.png';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.data.baseUrl}${url}`;
  },

  async loadBookDetail(id) {
    try {
      this.setData({ loading: true })
      console.log('开始加载书籍详情，ID:', id)
      
      const bookData = await getBookDetail(id)
      console.log('获取到的书籍数据:', bookData)

      if (!bookData || typeof bookData !== 'object') {
        throw new Error('书籍数据格式不正确')
      }

      // 处理图片数组
      let images = [];
      if (bookData.cover_image) {
        images.push(this.getFullImageUrl(bookData.cover_image));
        console.log('添加封面图片:', bookData.cover_image);
      }
      if (bookData.image_urls && Array.isArray(bookData.image_urls)) {
        images = [...images, ...bookData.image_urls.map(url => this.getFullImageUrl(url))];
        console.log('添加其他图片:', bookData.image_urls);
      }
      images = images.filter(url => url && typeof url === 'string' && url.trim() !== '');

      // 处理价格显示
      const price = bookData.price ? parseFloat(bookData.price).toFixed(2) : '0.00'
      const originalPrice = bookData.original_price ? parseFloat(bookData.original_price).toFixed(2) : null
      
      // 获取卖家ID
      const sellerId = bookData.seller_id || (bookData.seller && bookData.seller.id);
      console.log('书籍的卖家ID:', sellerId);
      console.log('书籍的卖家信息:', bookData.seller);

      // 构建书籍数据对象
      console.log('原始publisher数据:', bookData.publisher);
      console.log('原始isbn数据:', bookData.isbn);
      const processedBookData = {
        id: bookData.id,
        title: bookData.title || '未知书名',
        author: bookData.author || '未知作者',
        publisher: bookData.publisher || '未知出版社',
        isbn: bookData.isbn || '',
        description: bookData.description || '',
        condition: bookData.condition || '未知',
        conditionLabel: CONDITION_MAP[bookData.condition] || bookData.condition,
        campus: bookData.campus || '',
        campusLabel: CAMPUS_MAP[bookData.campus] || bookData.campus,
        images: images,
        price: price,
        originalPrice: originalPrice,
        seller_id: sellerId
      }
      
      console.log('处理后的书籍数据:', processedBookData);
      
      this.setData({
        book: processedBookData,
        isCollected: bookData.is_collected || false,
        loading: false
      })

      // 加载卖家信息
      if (sellerId) {
        await this.loadSellerInfo(sellerId)
      } else {
        console.error('无法获取卖家ID');
        wx.showToast({
          title: '无法获取卖家信息',
          icon: 'none'
        });
      }

    } catch (error) {
      console.error('加载书籍详情失败', error)
      wx.showToast({
        title: error.message || '加载失败，请重试',
        icon: 'none',
        duration: 2000
      })
      this.setData({ loading: false })
    }
  },

  // 加载卖家信息
  async loadSellerInfo(sellerId) {
    try {
      if (!sellerId) {
        throw new Error('卖家ID不能为空')
      }

      console.log('开始加载卖家信息，ID:', sellerId)
      const response = await getUserInfo(sellerId)
      console.log('卖家信息原始响应:', response)
      
      if (response && response.data) {
        const userData = response.data
        console.log('获取到的用户数据:', userData);

        const sellerInfo = {
          id: userData.id,
          nickname: userData.nickname || '昵称',
          avatar: this.getFullAvatarUrl(userData.avatar_url || userData.avatar),
          creditScore: userData.credit_score || 5,
          total_sales: userData.total_sales || 0,
          good_ratings: userData.good_ratings || 0
        }

        console.log('处理后的卖家信息:', sellerInfo);

        // 更新seller数据
        this.setData({
          seller: sellerInfo,
          'book.seller': sellerInfo
        })
      } else {
        throw new Error('卖家信息数据不完整')
      }
    } catch (error) {
      console.error('加载卖家信息失败:', error)
      // 使用默认卖家信息
      const defaultSellerInfo = {
        id: sellerId,
        nickname: '未知用户',
        avatar: this.data.defaultAvatar,
        creditScore: 5,
        total_sales: 0,
        good_ratings: 0
      };
      
      this.setData({
        seller: defaultSellerInfo,
        'book.seller': defaultSellerInfo
      });
      
      wx.showToast({
        title: '加载卖家信息失败',
        icon: 'none'
      })
    }
  },

  previewImage(e) {
    const { current } = e.currentTarget.dataset
    const { images } = this.data.book
    
    wx.previewImage({
      current: images[current],
      urls: images
    })
  },

  changeImage(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      currentImageIndex: index
    })
  },

  contactSeller() {
    const currentUser = wx.getStorageSync('userInfo');
    if (!currentUser) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    const { book, seller } = this.data
    console.log('当前用户信息:', currentUser);
    console.log('卖家信息:', seller);
    console.log('书籍信息:', book);

    if (!seller || !book) {
      console.log('seller或book数据缺失');
      wx.showToast({
        title: '获取信息失败',
        icon: 'none'
      });
      return;
    }

    if (seller.id === currentUser.id) {
      wx.showToast({
        title: '不能和自己聊天',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '正在连接...' })
    startChat(book.id)
      .then(res => {
        console.log('创建聊天成功：', res);
        if (res && res.session_id) {
          wx.navigateTo({
            url: `/pages/chat/chat?bookId=${book.id}&sellerId=${seller.id}`,
            success: () => {
              console.log('成功跳转到聊天页面');
            },
            fail: (error) => {
              console.error('跳转失败：', error);
              wx.showToast({
                title: '跳转失败',
                icon: 'none'
              });
            }
          });
        } else {
          throw new Error('未获取到会话ID');
        }
      })
      .catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '连接失败',
          icon: 'none'
        })
      })
  },

// 收藏/取消收藏
async toggleCollect() {
  if (!app.globalData.userInfo) {
    wx.navigateTo({
      url: '/pages/login/login'
    })
    return
  }

  try {
    wx.showLoading({
      title: '处理中...',
      mask: true
    })

    console.log('发起收藏请求，书籍ID:', this.data.book.id)
    const res = await toggleCollection(this.data.book.id)
    console.log('收藏响应:', res)
    
    // 确保从正确的位置获取数据
    const responseData = res.data || res
    const isCollected = responseData.is_collected
    const message = responseData.msg || (isCollected ? '收藏成功' : '取消收藏成功')
    
    this.setData({
      isCollected: isCollected
    })
    
    wx.showToast({
      title: message,
      icon: 'success'
    })
  } catch (error) {
    console.error('收藏操作失败', error)
    wx.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    })
  } finally {
    wx.hideLoading()
  }
},


  share() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  buy() {
    if (!app.globalData.userInfo) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    const { book, seller } = this.data
    if (!book) {
      wx.showToast({
        title: '商品信息加载中，请稍后再试',
        icon: 'none'
      })
      return
    }

    const currentUserId = app.globalData.userInfo.id
    const isDebugMode = __wxConfig.envVersion === 'develop' || __wxConfig.envVersion === 'trial'
    
    if (book.seller_id === currentUserId && !isDebugMode) {
      wx.showToast({
        title: '不能购买自己发布的书籍',
        icon: 'none'
      })
      return
    }

    if (book.seller_id === currentUserId && isDebugMode) {
      console.log('调试模式：允许购买自己的书籍')
      wx.showModal({
        title: '调试模式',
        content: '当前处于开发环境，允许购买自己发布的书籍，是否继续？',
        success: (res) => {
          if (res.confirm) {
            this.navigateToCreateOrder(book.id)
          }
        }
      })
      return
    }

    this.navigateToCreateOrder(book.id)
  },

  navigateToCreateOrder(bookId) {
    console.log('准备购买，书籍信息:', this.data.book)
    wx.showLoading({
      title: '正在跳转...',
      mask: true
    })

    try {
      wx.navigateTo({
        url: `/pages/order/create?bookId=${bookId}`,
        success: () => {
          console.log('跳转订单创建页面成功')
          wx.hideLoading()
        },
        fail: (error) => {
          console.error('跳转失败:', error)
          wx.hideLoading()
          wx.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          })
        }
      })
    } catch (error) {
      console.error('跳转出错:', error)
      wx.hideLoading()
      wx.showToast({
        title: '系统错误，请重试',
        icon: 'none'
      })
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.book.title,
      path: `/pages/bookDetail/bookDetail?id=${this.data.book.id}`,
      imageUrl: this.data.book.images[0]
    }
  },

  onShareTimeline() {
    return {
      title: this.data.book.title,
      query: `id=${this.data.book.id}`,
      imageUrl: this.data.book.images[0]
    }
  },

  onAvatarError(e) {
    console.log('头像加载失败，使用默认头像');
    // 更新当前头像为默认头像
    this.setData({
      'book.seller.avatar': this.data.defaultAvatar,
      'seller.avatar': this.data.defaultAvatar
    });
  }
})