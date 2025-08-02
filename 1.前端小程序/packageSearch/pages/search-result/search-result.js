// packageSearch/pages/search-result/search-result.js

const app = getApp();

/**
 * 搜索结果页面
 * 显示搜索到的物品、收纳盒、收纳袋等结果
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    keyword: '',
    searchResults: {
      boxes: { count: 0, results: [] },
      bags: { count: 0, results: [] },
      items: { count: 0, results: [] }
    },
    loading: false,
    showSkeleton: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const keyword = options.keyword ? decodeURIComponent(options.keyword) : '';
    
    this.setData({ keyword });
    
    if (keyword) {
      this.performSearch();
    }
  },

  /**
   * 执行搜索
   */
  async performSearch() {
    if (this.data.loading) return;
    
    try {
      this.setData({ 
        loading: true,
        showSkeleton: true
      });
      
      const { keyword } = this.data;
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('用户未登录');
      }
      
      const searchResults = await this.callSearchAPI(baseUrl, openid, keyword);
      const processedResults = this.processSearchResults(searchResults);
      
      this.setData({
        searchResults: processedResults,
        loading: false,
        showSkeleton: false
      });
      
    } catch (error) {
      console.error('搜索失败:', error);
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
      
      this.setData({
        loading: false,
        showSkeleton: false
      });
    }
  },
  
  /**
   * 调用搜索API
   */
  callSearchAPI(baseUrl, openid, keyword) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${baseUrl}v4/search`,
        method: 'GET',
        data: { openid, keyword },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 200) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.message || '搜索失败'));
          }
        },
        fail: reject
      });
    });
  },
  
  /**
   * 处理搜索结果数据
   */
  processSearchResults(data) {
    const baseUrl = app.globalData.baseUrl;
    const photosBaseUrl = `${baseUrl}Photos/`;
    
    // 处理箱子数据
    const boxes = {
      count: data.boxes?.count || 0,
      results: (data.boxes?.results || []).map(box => ({
        ...box,
        id: box.box_id,
        icon: 'cuIcon-box',
        itemCount: box.item_count || 0,
        createTime: this.formatDate(box.created_at)
      }))
    };
    
    // 处理袋子数据
    const bags = {
      count: data.bags?.count || 0,
      results: (data.bags?.results || []).map(bag => ({
        ...bag,
        createTime: this.formatDate(bag.created_at)
      }))
    };
    
    // 处理物品数据
    const items = {
      count: data.items?.count || 0,
      results: (data.items?.results || []).map(item => ({
        ...item,
        image: item.image_filename ? `${photosBaseUrl}${item.image_filename}` : '/assets/images/default-item.png',
        createTime: this.formatDate(item.created_at)
      }))
    };
    
    return { boxes, bags, items };
  },
  
  /**
   * 格式化日期
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  /**
   * 点击物品
   */
  onItemTap(e) {
    const { item } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageStorage/pages/item-detail/item-detail?itemId=${item.item_id}`
    });
  },

  /**
   * 点击收纳盒
   */
  onBoxTap(e) {
    const boxId = e.currentTarget.dataset.id;
    const box = this.data.searchResults.boxes.results.find(item => item.id === boxId);
    
    if (!box) {
      wx.showToast({
        title: '箱子信息错误',
        icon: 'error'
      });
      return;
    }
    
    // 将完整的箱子信息存储到全局数据中，供详情页使用
    app.globalData.currentBoxInfo = {
      // 原始后台数据字段
      box_id: box.box_id || box.id,
      user_id: box.user_id,
      sort_id: box.sort_id,
      name: box.name,
      description: box.description,
      color: box.color,
      location: box.location,
      created_at: box.created_at,
      item_count: box.item_count,
      // 处理后的显示字段
      id: box.id,
      icon: box.icon,
      itemCount: box.itemCount,
      createTime: box.createTime
    };
    
    console.log('传递给详情页的箱子信息:', app.globalData.currentBoxInfo);
    
    // 跳转到箱子详情页
    wx.navigateTo({
      url: `/packageStorage/pages/box-detail/box-detail?id=${boxId}&name=${encodeURIComponent(box.name)}`
    });
  },

  /**
   * 点击收纳袋
   */
  onBagTap(e) {
    const { bag } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageStorage/pages/bag-detail/bag-detail?bagId=${bag.bag_id}&boxId=${bag.box_id}`
    });
  },

  /**
   * 搜索框输入
   */
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  /**
   * 执行新搜索
   */
  onSearch() {
    const { keyword } = this.data;
    if (!keyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    this.performSearch();
  },

  /**
   * 清空搜索
   */
  onClearSearch() {
    this.setData({
      keyword: '',
      searchResults: {
        boxes: { count: 0, results: [] },
        bags: { count: 0, results: [] },
        items: { count: 0, results: [] }
      }
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    const { keyword } = this.data;
    return {
      title: `搜索"${keyword}" - 物品管理`,
      path: `/packageSearch/pages/search-result/search-result?keyword=${keyword}`
    };
  }
});