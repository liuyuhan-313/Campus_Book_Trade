import { request } from '../utils/request';
import { API } from '../config/api';

// 获取收藏列表
export const getCollectionList = async (params = {}) => {
  return request({
    url: API.collectionList,
    method: 'GET',
    data: params
  });
};

// 切换收藏状态
export const toggleCollection = async (bookId) => {
  return request({
    url: `${API.collectionToggle}${bookId}/`,
    method: 'POST'
  });
}; 