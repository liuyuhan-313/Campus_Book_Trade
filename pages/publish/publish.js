const app = getApp();
import { createBook } from '../../api/book';
const { checkFileType, checkFileSize } = require('../../utils/util');
const { request } = require('../../utils/request');
const { chooseImage: wxChooseImage } = require('../../utils/file');

Page({
    data: {
      form: {
        title: '',
        author: '',
        publisher: '',
        isbn: '',
        category: null,  // 改为数字类型
        categoryText: '', // 添加显示用的字段
        description: '',
        price: '',
        originalPrice: '',
        condition: '',
        conditionText: '',
        campus: '',
        campusText: ''
      },
      images: [],
      categories: [
        { id: 1, name: '教材教辅' },
        { id: 2, name: '文学小说' },
        { id: 3, name: '计算机与互联网' },
        { id: 4, name: '经管励志' },
        { id: 5, name: '考研资料' },
        { id: 6, name: '外语学习' },
        { id: 7, name: '科学技术' },
        { id: 8, name: '其他' }
      ],
      categoryIndex: -1,
      conditions: [
        { value: 'new', label: '全新' },
        { value: 'like_new', label: '九成新' },
        { value: 'good', label: '八成新' },
        { value: 'fair', label: '七成新' },
        { value: 'poor', label: '六成新及以下' }
      ],
      conditionIndex: -1,
      campuses: [
        { value: 'handan', label: '邯郸校区' },
        { value: 'fenglin', label: '枫林校区' },
        { value: 'jiangwan', label: '江湾校区' },
        { value: 'zhangjiang', label: '张江校区' }
      ],
      campusIndex: -1,
      maxImageCount: 9,
      submitting: false
    },
  
    async onLoad() {
      try {
        // 检查是否有全局数据
        console.log('全局分类数据:', {
          globalCategories: app.globalData.categories,
          globalType: app.globalData.categories.type,
          globalCampuses: app.globalData.campuses
        });

        if (app.globalData && app.globalData.categories && app.globalData.categories.type) {
          // 直接使用全局分类数据，因为现在格式已经统一
          this.setData({
            categories: app.globalData.categories.type,
            conditions: app.globalData.categories.condition,
            campuses: app.globalData.campuses,
            // 设置默认值
            conditionIndex: 0,
            campusIndex: 0,
            'form.condition': this.data.conditions[0].value,
            'form.conditionText': this.data.conditions[0].label,
            'form.campus': this.data.campuses[0].value,
            'form.campusText': this.data.campuses[0].label
          });

          console.log('页面数据设置完成:', {
            categories: this.data.categories,
            conditions: this.data.conditions,
            campuses: this.data.campuses,
            form: this.data.form
          });
        } else {
          console.warn('全局分类数据未找到，使用默认值');
          // 如果没有全局数据，至少设置默认的成色和校区
          this.setData({
            conditionIndex: 0,
            campusIndex: 0,
            'form.condition': this.data.conditions[0].value,
            'form.conditionText': this.data.conditions[0].label,
            'form.campus': this.data.campuses[0].value,
            'form.campusText': this.data.campuses[0].label
          });
        }
  
        console.log('分类数据已加载：', {
          categories: this.data.categories,
          conditions: this.data.conditions,
          campuses: this.data.campuses
        });
      } catch (error) {
        console.error('加载分类数据失败：', error);
        wx.showToast({
          title: '加载分类数据失败',
          icon: 'none'
        });
      }
    },
  
    // 输入框变化处理
    inputChange(e) {
      const { field } = e.currentTarget.dataset;
      const { value } = e.detail;
      this.setData({
        [`form.${field}`]: value
      });
    },
  
    // 分类选择变化
    categoryChange(e) {
      const index = e.detail.value;
      const selectedCategory = this.data.categories[index];
      this.setData({
        categoryIndex: index,
        'form.category': selectedCategory.id,
        'form.categoryText': selectedCategory.name
      });
    },
  
    // 成色选择变化
    conditionChange(e) {
      const index = parseInt(e.detail.value);
      if (index >= 0 && index < this.data.conditions.length) {
        const condition = this.data.conditions[index];
        this.setData({
          conditionIndex: index,
          'form.condition': condition.value,
          'form.conditionText': condition.label
        });
      }
    },
  
    // 校区选择变化
    campusChange(e) {
      const index = parseInt(e.detail.value);
      if (index >= 0 && index < this.data.campuses.length) {
        const campus = this.data.campuses[index];
        this.setData({
          campusIndex: index,
          'form.campus': campus.value,
          'form.campusText': campus.label
        });
        
        console.log('校区选择变化:', {
          index,
          selectedCampus: campus,
          formData: this.data.form
        });
      }
    },
  
    // 选择图片
    async chooseImage() {
      const { images, maxImageCount } = this.data;
      if (images.length >= maxImageCount) {
        wx.showToast({
          title: `最多上传${maxImageCount}张图片`,
          icon: 'none'
        });
        return;
      }

      try {
        const newImages = await wxChooseImage({
          count: maxImageCount - images.length,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });

        if (newImages && newImages.length > 0) {
          this.setData({
            images: [...images, ...newImages]
          });
        }
      } catch (error) {
        console.error('选择图片失败', error);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    },
  
    // 删除图片
    deleteImage(e) {
      const { index } = e.currentTarget.dataset;
      const { images } = this.data;
      images.splice(index, 1);
      this.setData({ images });
    },
  
    // 预览图片
    previewImage(e) {
      const { current } = e.currentTarget.dataset;
      const { images } = this.data;
      
      wx.previewImage({
        current,
        urls: images
      });
    },

    // 表单验证
    validateForm() {
      const { form, images } = this.data;
      
      if (images.length === 0) {
        wx.showToast({
          title: '请至少上传一张图片',
          icon: 'none'
        });
        return false;
      }

      if (!form.title) {
        wx.showToast({
          title: '请输入书名',
          icon: 'none'
        });
        return false;
      }

      if (!form.author) {
        wx.showToast({
          title: '请输入作者',
          icon: 'none'
        });
        return false;
      }

      if (!form.category) {
        wx.showToast({
          title: '请选择分类',
          icon: 'none'
        });
        return false;
      }

      if (!form.condition) {
        wx.showToast({
          title: '请选择成色',
          icon: 'none'
        });
        return false;
      }

      if (!form.campus) {
        wx.showToast({
          title: '请选择校区',
          icon: 'none'
        });
        return false;
      }

      if (!form.price) {
        wx.showToast({
          title: '请输入价格',
          icon: 'none'
        });
        return false;
      }

      if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
        wx.showToast({
          title: '请输入有效的价格',
          icon: 'none'
        });
        return false;
      }

      if (form.originalPrice && (isNaN(parseFloat(form.originalPrice)) || parseFloat(form.originalPrice) <= 0)) {
        wx.showToast({
          title: '请输入有效的原价',
          icon: 'none'
        });
        return false;
      }

      if (!form.description) {
        wx.showToast({
          title: '请输入详情描述',
          icon: 'none'
        });
        return false;
      }

      return true;
    },
  
    // 提交表单
    async submitForm() {
      if (this.data.submitting) {
        return;
      }
  
      if (!this.validateForm()) {
        return;
      }
  
      this.setData({ submitting: true });
  
      try {
        wx.showLoading({
          title: '正在发布...',
          mask: true
        });
  
        // 准备提交的数据
        const bookData = {
          title: this.data.form.title.trim(),
          author: this.data.form.author.trim(),
          publisher: this.data.form.publisher.trim() || '',
          isbn: this.data.form.isbn.trim() || '',
          category: this.data.form.category,
          description: this.data.form.description.trim(),
          price: parseFloat(this.data.form.price),
          original_price: this.data.form.originalPrice ? parseFloat(this.data.form.originalPrice) : null,
          condition: this.data.form.condition,
          campus: this.data.form.campus,
          images: this.data.images
        };
  
        // 添加详细调试日志
        console.log('准备发送的数据：', {
          bookData,
          formData: this.data.form,
          selectedCategory: {
            index: this.data.categoryIndex,
            category: this.data.categories[this.data.categoryIndex]
          }
        });
  
        // 调用API发布书籍
        const res = await createBook(bookData);
  
        wx.hideLoading();
        
        // 发布成功后的处理
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 1500,
          mask: true,
          complete: () => {
            // 延迟执行页面跳转，确保Toast显示完成
            setTimeout(() => {
              // 获取页面栈信息
              const pages = getCurrentPages();
              // 如果是从首页进入的发布页
              if (pages.length > 1 && pages[pages.length - 2].route.includes('index')) {
                // 返回上一页并刷新
                const prevPage = pages[pages.length - 2];
                if (prevPage && typeof prevPage.onPullDownRefresh === 'function') {
                  prevPage.onPullDownRefresh();
                }
                wx.navigateBack({
                  delta: 1
                });
              } else {
                // 如果不是从首页进入，则跳转到首页
                wx.switchTab({
                  url: '/pages/index/index'
                });
              }
            }, 1500);
          }
        });
      } catch (error) {
        console.error('发布失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: error.message || '发布失败，请重试',
          icon: 'none'
        });
      } finally {
        this.setData({ submitting: false });
      }
    }
});

/*
const app = getApp()
import { createBook, getCategories } from '../../api/book'
const { checkFileType, checkFileSize } = require('../../utils/util')
const { request } = require('../../utils/request')
const { chooseImage } = require('../../utils/file')

Page({
  data: {
    form: {
      title: '',
      author: '',
      publisher: '',
      isbn: '',
      category: '',
      description: '',
      price: '',
      originalPrice: '',
      condition: '',
      campus: '',
    },
    images: [],
    categories: [],
    categoryIndex: -1,
    conditions: [],
    conditionIndex: -1,
    campuses: [],
    campusIndex: -1,
    maxImageCount: 9,
    submitting: false
  },

  async onLoad() {
    // 从全局配置获取分类数据
    const globalData = app.globalData;
    
    this.setData({
      categories: globalData.categories.type,
      conditions: globalData.categories.condition,
      campuses: globalData.campuses,
      // 设置默认值
      'form.condition': globalData.categories.condition[0],
      'form.campus': globalData.campuses[0]
    });

    console.log('分类数据已加载：', {
      categories: this.data.categories,
      conditions: this.data.conditions,
      campuses: this.data.campuses
    });
  },

  // 输入框变化处理
  inputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`form.${field}`]: value
    })
  },

  // 分类选择变化
  categoryChange(e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'form.category': this.data.categories[index]
    });
  },

  // 成色选择变化
  conditionChange(e) {
    const index = e.detail.value;
    this.setData({
      conditionIndex: index,
      'form.condition': this.data.conditions[index]
    });
  },

  // 校区选择变化
  campusChange(e) {
    const index = e.detail.value;
    this.setData({
      campusIndex: index,
      'form.campus': this.data.campuses[index]
    });
  },

  // 选择图片
  async chooseImage() {
    const { images, maxImageCount } = this.data
    if (images.length >= maxImageCount) {
      wx.showToast({
        title: `最多上传${maxImageCount}张图片`,
        icon: 'none'
      })
      return
    }

    try {
      const newImages = await chooseImage(maxImageCount - images.length)
      if (newImages && newImages.length > 0) {
        this.setData({
          images: [...images, ...newImages]
        })
      }
    } catch (error) {
      console.error('选择图片失败', error)
    }
  },

  // 删除图片
  deleteImage(e) {
    const { index } = e.currentTarget.dataset
    const { images } = this.data
    images.splice(index, 1)
    this.setData({ images })
  },

  // 预览图片
  previewImage(e) {
    const { current } = e.currentTarget.dataset
    const { images } = this.data
    
    wx.previewImage({
      current,
      urls: images
    })
  },

  // 表单验证
  validateForm() {
    const { form, images } = this.data
    
    if (images.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      })
      return false
    }

    if (!form.title) {
      wx.showToast({
        title: '请输入书名',
        icon: 'none'
      })
      return false
    }

    if (!form.author) {
      wx.showToast({
        title: '请输入作者',
        icon: 'none'
      })
      return false
    }

    if (!form.category) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      })
      return false
    }

    if (!form.condition) {
      wx.showToast({
        title: '请选择成色',
        icon: 'none'
      })
      return false
    }

    if (!form.campus) {
      wx.showToast({
        title: '请选择校区',
        icon: 'none'
      })
      return false
    }

    if (!form.price) {
      wx.showToast({
        title: '请输入价格',
        icon: 'none'
      })
      return false
    }

    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      wx.showToast({
        title: '请输入有效的价格',
        icon: 'none'
      })
      return false
    }

    if (form.originalPrice && (isNaN(parseFloat(form.originalPrice)) || parseFloat(form.originalPrice) <= 0)) {
      wx.showToast({
        title: '请输入有效的原价',
        icon: 'none'
      })
      return false
    }

    if (!form.description) {
      wx.showToast({
        title: '请输入详情描述',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 提交表单
  async submitForm() {
    if (this.data.submitting) {
      return
    }

    if (!this.validateForm()) {
      return
    }

    this.setData({ submitting: true })

    try {
      wx.showLoading({
        title: '正在发布...',
        mask: true
      })

      // 准备提交的数据 - 只包含后端需要的字段
      const bookData = {
        title: this.data.form.title.trim(),
        author: this.data.form.author.trim(),
        publisher: this.data.form.publisher.trim() || '',
        isbn: this.data.form.isbn.trim() || '',
        category: this.data.form.category,
        description: this.data.form.description.trim(),
        price: parseFloat(this.data.form.price),
        original_price: this.data.form.originalPrice ? parseFloat(this.data.form.originalPrice) : null,
        condition: this.data.form.condition,
        campus: this.data.form.campus,
        images: this.data.images
      }

      // 添加详细调试日志
      console.log('发送的数据：', bookData)
      console.log('分类ID类型：', typeof bookData.category)
      console.log('价格类型：', typeof bookData.price)

      // 调用API发布书籍
      const res = await createBook(bookData)

      wx.hideLoading()
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })

      // 发布成功后返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('发布失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '发布失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
// 删除这一行
// console.log('发送的数据：', submitData)
*/
