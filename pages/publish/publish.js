const app = getApp()
const { API } = require('../../config/api')
const { checkFileType, checkFileSize } = require('../../utils/util')
const { request, uploadFile } = require('../../utils/request')
const { chooseImage } = require('../../utils/file')

Page({
  data: {
    images: [],
    form: {
      title: '',
      author: '',
      publisher: '',
      isbn: '',
      price: '',
      originalPrice: '',
      description: ''
    },
    campuses: [],
    conditions: [],
    campusIndex: -1,
    conditionIndex: -1,
    submitting: false,
    maxImageCount: 9
  },

  onLoad() {
    this.setData({
      campuses: app.globalData.campuses,
      conditions: app.globalData.categories.condition
    })
  },

  // 选择图片
  async chooseImage() {
    const { images, maxImageCount } = this.data
    const remainCount = maxImageCount - images.length
    
    if (remainCount <= 0) {
      wx.showToast({
        title: '最多只能上传9张图片',
        icon: 'none'
      })
        return
      }

    try {
      const newImages = await chooseImage(remainCount)
      if (newImages.length > 0) {
      this.setData({
          images: [...images, ...newImages]
      })
      }
    } catch (error) {
      console.error('选择/上传图片失败:', error)
    }
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

  // 删除图片
  deleteImage(e) {
    const { index } = e.currentTarget.dataset
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // 输入框变化
  inputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`form.${field}`]: value
    })
  },

  // 选择校区
  campusChange(e) {
    this.setData({
      campusIndex: e.detail.value
    })
  },

  // 选择新旧程度
  conditionChange(e) {
    this.setData({
      conditionIndex: e.detail.value
    })
  },

  // 表单验证
  validateForm() {
    const { form, images, campusIndex, conditionIndex } = this.data
    
    if (images.length === 0) {
      app.showToast('请至少上传一张图片')
      return false
    }

    if (!form.title) {
      app.showToast('请输入书名')
      return false
    }

    if (!form.author) {
      app.showToast('请输入作者')
      return false
    }

    if (!form.publisher) {
      app.showToast('请输入出版社')
      return false
    }

    if (!form.price) {
      app.showToast('请输入售价')
      return false
    }

    if (campusIndex === -1) {
      app.showToast('请选择校区')
      return false
    }

    if (conditionIndex === -1) {
      app.showToast('请选择新旧程度')
      return false
    }

    if (!form.description) {
      app.showToast('请输入详情描述')
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
      // 上传图片
      const uploadedImages = []
      for (const image of this.data.images) {
        const res = await uploadFile(image)
        uploadedImages.push(res.data.url)
      }

      // 提交表单
      const { title, author, publisher, originalPrice, price, description, campus } = this.data
      
      const res = await request({
        url: '/api/books/publish',
        method: 'POST',
        data: {
          title,
          author,
          publisher,
          originalPrice: Number(originalPrice),
          price: Number(price),
          description,
          campus,
          images: uploadedImages
        }
      })

      app.showToast('发布成功', 'success')
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('发布失败:', error)
      app.showToast('发布失败，请重试')
    } finally {
      this.setData({ submitting: false })
    }
  }
}) 