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
    // 搜索关键词
    keyword: '',
    // 搜索结果
    searchResults: {
      boxes: { count: 0, results: [] },
      bags: { count: 0, results: [] },
      items: { count: 0, results: [] }
    },
    // 加载状态
    loading: true,
    // 骨架屏显示状态
    showSkeleton: true,
    // 是否显示筛选面板
    showFilter: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('搜索结果页面加载', options);
    
    // 解码URL编码的关键词
    const keyword = options.keyword ? decodeURIComponent(options.keyword) : '';
    
    this.setData({
      keyword
    });
    
    if (keyword) {
      this.performSearch();
    } else {
      // 如果没有关键词，隐藏骨架屏
      this.setData({
        loading: false,
        showSkeleton: false
      });
    }
  },

  /**
   * 执行搜索
   */
  async performSearch() {
    if (this.data.loading && !this.data.showSkeleton) return;
    
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
      
      // 调用搜索API
      const searchResults = await this.callSearchAPI(baseUrl, openid, keyword);
      
      // 处理搜索结果数据
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
        data: {
          openid: openid,
          keyword: keyword
        },
        success: (res) => {
          console.log('搜索API响应:', res);
          if (res.statusCode === 200 && res.data.code === 200) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.message || '搜索失败'));
          }
        },
        fail: (error) => {
          console.error('搜索API请求失败:', error);
          reject(error);
        }
      });
    });
  },
  
  /**
   * 处理搜索结果数据
   */
  processSearchResults(data) {
    const baseUrl = app.globalData.baseUrl;
    
    // 处理箱子数据 - 逐字段映射API返回的数据
    const boxes = {
      count: data.boxes?.count || 0,
      results: (data.boxes?.results || []).map(box => {
        console.log('原始箱子数据:', box); // 调试日志
        const processedBox = {
          // 原始字段
          box_id: box.box_id,
          user_id: box.user_id,
          sort_id: box.sort_id,
          name: box.name,
          description: box.description,
          color: box.color,
          location: box.location, // 直接使用原始location字段
          created_at: box.created_at,
          bag_count: box.bag_count,
          item_count: box.item_count,
          // 映射字段
          id: box.box_id, // 映射box_id到id字段供WXML使用
          icon: 'cuIcon-box',
          itemCount: box.item_count || 0,
          createTime: this.formatDate(box.created_at)
        };
        console.log('处理后箱子数据:', processedBox); // 调试日志
        return processedBox;
      })
    };
    
    // 处理袋子数据
    const bags = {
      count: data.bags?.count || 0,
      results: (data.bags?.results || []).map(bag => ({
        // 原始字段
        bag_id: bag.bag_id,
        user_id: bag.user_id,
        box_id: bag.box_id,
        name: bag.name,
        description: bag.description,
        color: bag.color,
        created_at: bag.created_at,
        item_count: bag.item_count,
        // 处理字段
        createTime: this.formatDate(bag.created_at)
      }))
    };
    
    // 处理物品数据
    const photosBaseUrl = `${baseUrl}Photos/`; // 图片基础URL
    const items = {
      count: data.items?.count || 0,
      results: (data.items?.results || []).map(item => ({
        // 原始字段
        item_id: item.item_id,
        user_id: item.user_id,
        bag_id: item.bag_id,
        name: item.name,
        description: item.description,
        image_filename: item.image_filename,
        created_at: item.created_at,
        // 处理字段
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
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 小于1天
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 小于7天
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    }
    
    // 超过7天显示具体日期
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },
  /**
   * 切换筛选面板显示状态
   */
  toggleFilter() {
    this.setData({
      showFilter: !this.data.showFilter
    });
  },

  /**
   * 点击物品
   */
  onItemTap(e) {
    const { item } = e.currentTarget.dataset;
    // 跳转到物品详情页
    wx.navigateTo({
      url: `/packageStorage/pages/item-detail/item-detail?itemId=${item.item_id}`
    });
  },

  /**
   * 点击收纳盒
   */
  onBoxTap(e) {
    const { box } = e.currentTarget.dataset;
    // 跳转到收纳盒详情页
    wx.navigateTo({
      url: `/packageStorage/pages/box-detail/box-detail?boxId=${box.box_id}`
    });
  },

  /**
   * 箱子菜单
   */
  onBoxMenu(e) {
    const id = e.currentTarget.dataset.id;
    // 这里可以添加菜单功能，暂时留空
    console.log('Box menu clicked:', id);
  },

  /**
   * 点击收纳袋
   */
  onBagTap(e) {
    const { bag } = e.currentTarget.dataset;
    // 跳转到收纳袋详情页
    wx.navigateTo({
      url: `/packageStorage/pages/bag-detail/bag-detail?bagId=${bag.bag_id}&boxId=${bag.box_id}`
    });
  },

  /**
   * 搜索框输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
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