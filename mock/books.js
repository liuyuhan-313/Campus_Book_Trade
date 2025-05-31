const bookList = [
  {
    id: 1,
    title: '高等数学（第七版）上册',
    author: '同济大学数学系',
    publisher: '高等教育出版社',
    originalPrice: 49.8,
    price: 20,
    condition: '9成新',
    description: '书本保存完好，无笔记',
    campus: '东校区',
    images: ['/assets/images/book-placeholder.png'],
    createTime: '2024-01-20 10:00:00',
    seller: {
      id: 1,
      nickname: '小明',
      avatar: '/assets/images/default-avatar.png'
    }
  },
  {
    id: 2,
    title: '大学物理学（第六版）',
    author: '程守洙',
    publisher: '高等教育出版社',
    originalPrice: 45.0,
    price: 18,
    condition: '8成新',
    description: '有少量笔记，不影响阅读',
    campus: '西校区',
    images: ['/assets/images/book-placeholder.png'],
    createTime: '2024-01-19 15:30:00',
    seller: {
      id: 2,
      nickname: '小红',
      avatar: '/assets/images/default-avatar.png'
    }
  },
  {
    id: 3,
    title: '计算机网络（第七版）',
    author: '谢希仁',
    publisher: '电子工业出版社',
    originalPrice: 59.0,
    price: 25,
    condition: '全新',
    description: '全新未拆封',
    campus: '东校区',
    images: ['/assets/images/book-placeholder.png'],
    createTime: '2024-01-18 09:15:00',
    seller: {
      id: 3,
      nickname: '小华',
      avatar: '/assets/images/default-avatar.png'
    }
  }
];

// 分页获取书籍列表
const getBookList = (page = 1, pageSize = 10, filters = {}) => {
  const { keyword, campus, condition, priceRange, sortBy } = filters;
  
  let filteredBooks = [...bookList];
  
  // 关键词搜索
  if (keyword) {
    filteredBooks = filteredBooks.filter(book => 
      book.title.toLowerCase().includes(keyword.toLowerCase()) ||
      book.author.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  // 校区筛选
  if (campus) {
    filteredBooks = filteredBooks.filter(book => book.campus === campus);
  }
  
  // 成色筛选
  if (condition) {
    filteredBooks = filteredBooks.filter(book => book.condition === condition);
  }
  
  // 价格区间筛选
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    filteredBooks = filteredBooks.filter(book => 
      book.price >= min && (!max || book.price <= max)
    );
  }
  
  // 排序
  if (sortBy === 'price-asc') {
    filteredBooks.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filteredBooks.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'newest') {
    filteredBooks.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  }
  
  // 分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    total: filteredBooks.length,
    list: filteredBooks.slice(start, end)
  };
};

// 发布书籍
const publishBook = (bookData) => {
  const newBook = {
    id: bookList.length + 1,
    ...bookData,
    createTime: new Date().toISOString().replace('T', ' ').split('.')[0],
    seller: {
      id: 1, // 模拟当前登录用户
      nickname: '小明',
      avatar: '/assets/images/default-avatar.png'
    }
  };
  
  bookList.unshift(newBook);
  return newBook;
};

module.exports = {
  bookList,
  getBookList,
  publishBook
}; 