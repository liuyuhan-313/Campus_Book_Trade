// 时间格式化
const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  date = date instanceof Date ? date : new Date(date)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return format
    .replace('YYYY', year)
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('HH', padZero(hour))
    .replace('mm', padZero(minute))
    .replace('ss', padZero(second))
}

// 数字补零
const padZero = (n) => {
  return n < 10 ? '0' + n : n
}

// 防抖函数
const debounce = (fn, delay = 500) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
const throttle = (fn, delay = 500) => {
  let timer = null
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last > delay) {
      fn.apply(this, args)
      last = now
    } else {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        fn.apply(this, args)
        last = now
      }, delay)
    }
  }
}

// 价格格式化
const formatPrice = (price) => {
  return Number(price).toFixed(2)
}

// 获取文件扩展名
const getFileExt = (filePath) => {
  return filePath.substring(filePath.lastIndexOf('.') + 1)
}

// 检查文件类型是否合法
const checkFileType = (filePath, types = ['jpg', 'jpeg', 'png', 'gif']) => {
  const ext = getFileExt(filePath).toLowerCase()
  return types.includes(ext)
}

// 检查文件大小是否合法（默认最大10MB）
const checkFileSize = (size, maxSize = 10 * 1024 * 1024) => {
  return size <= maxSize
}

// 生成随机字符串
const randomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

module.exports = {
  formatTime,
  debounce,
  throttle,
  formatPrice,
  getFileExt,
  checkFileType,
  checkFileSize,
  randomString
} 