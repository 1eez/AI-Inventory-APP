// packageSearch/pages/search/search.js
const app = getApp();

Page({
  data: {
    // 搜索状态
    searchKeyword: '',
    searching: false,
    hasSearched: false,
    
    // 搜索结果
    searchResults: {
      boxes: [],
      bags: [],
      items: []
    },
    
    // 搜索历史
    searchHistory: [],
    
    // 热门搜索
    hotSearches: [
      '充电器', '耳机', '数据线', '化妆品', 
      '药品', '文具', '钥匙', '零食'
    ],
    
    // 搜索建议
    searchSuggestions: [],
    showSuggestions: false,
    
    // 筛选条件
    filterType: 'all', // all, box, bag, item
    sortType: 'relevance', // relevance, time, value
    
    // 骨架屏
    skeletonLoading: false,
    skeletonItems: [1, 2, 3, 4, 5]
  },

  onLoad(options) {
    console.log('搜索页加载', options);
    
    // 如果有传入的搜索关键词，直接搜索
    if (options.keyword) {
      this.setData({
        searchKeyword: options.keyword
      });
      this.performSearch();
    }
    
    // 等待系统准备就绪
    this.waitForSystemReady();
  },

  onShow() {
    // 加载搜索历史
    this.loadSearchHistory();
  },

  // 等待系统准备就绪
  waitForSystemReady() {
    if (app.globalData.systemReady) {
      this.initPage();
    } else {
      app.registerSystemReadyCallback(() => {
        this.initPage();
      });
    }
  },

  // 初始化页面
  initPage() {
    console.log('搜索页初始化完成');
  },

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || [];
      this.setData({
        searchHistory: history.slice(0, 10) // 最多显示10条
      });
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    if (!keyword || keyword.trim() === '') return;
    
    try {
      let history = wx.getStorageSync('searchHistory') || [];
      
      // 移除重复项
      history = history.filter(item => item !== keyword);
      
      // 添加到开头
      history.unshift(keyword);
      
      // 限制数量
      history = history.slice(0, 20);
      
      wx.setStorageSync('searchHistory', history);
      
      this.setData({
        searchHistory: history.slice(0, 10)
      });
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  },

  // 清空搜索历史
  clearSearchHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('searchHistory');
            this.setData({
              searchHistory: []
            });
            wx.showToast({
              title: '已清空',
              icon: 'success'
            });
          } catch (error) {
            console.error('清空搜索历史失败:', error);
          }
        }
      }
    });
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    // 获取搜索建议
    if (keyword.trim()) {
      this.getSearchSuggestions(keyword);
    } else {
      this.setData({
        showSuggestions: false,
        searchSuggestions: []
      });
    }
  },

  // 获取搜索建议
  async getSearchSuggestions(keyword) {
    try {
      // TODO: 替换为真实API调用
      const suggestions = await this.mockGetSearchSuggestions(keyword);
      
      this.setData({
        searchSuggestions: suggestions,
        showSuggestions: suggestions.length > 0
      });
    } catch (error) {
      console.error('获取搜索建议失败:', error);
    }
  },

  // 模拟获取搜索建议
  mockGetSearchSuggestions(keyword) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allSuggestions = [
          '充电器', '充电线', '充电宝',
          '耳机', '耳机盒', '耳机线',
          '数据线', '数据线收纳',
          '化妆品', '化妆刷', '化妆镜',
          '药品', '药盒',
          '文具', '文具盒',
          '钥匙', '钥匙扣',
          '零食', '零食盒'
        ];
        
        const filtered = allSuggestions.filter(item => 
          item.includes(keyword)
        ).slice(0, 5);
        
        resolve(filtered);
      }, 200);
    });
  },

  // 执行搜索
  onSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.performSearch();
  },

  // 执行搜索逻辑
  async performSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) return;
    
    this.setData({
      searching: true,
      skeletonLoading: true,
      showSuggestions: false
    });
    
    try {
      // 保存搜索历史
      this.saveSearchHistory(keyword);
      
      // TODO: 替换为真实API调用
      const results = await this.mockSearch(keyword);
      
      this.setData({
        searchResults: results,
        hasSearched: true,
        searching: false,
        skeletonLoading: false
      });
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({
        searching: false,
        skeletonLoading: false
      });
      
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    }
  },

  // 模拟搜索
  mockSearch(keyword) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          boxes: [
            {
              id: '1',
              name: '电子设备箱',
              description: '存放各种电子设备',
              color: '#667eea',
              icon: 'cuIcon-phone',
              totalBags: 3,
              totalItems: 15,
              location: '书房'
            }
          ],
          bags: [
            {
              id: '1',
              name: '充电器袋',
              description: '各种充电器和数据线',
              color: '#764ba2',
              icon: 'cuIcon-lightning',
              itemCount: 5,
              boxName: '电子设备箱',
              location: '书房-第一层'
            },
            {
              id: '2',
              name: '耳机袋',
              description: '耳机和音频设备',
              color: '#f093fb',
              icon: 'cuIcon-music',
              itemCount: 3,
              boxName: '电子设备箱',
              location: '书房-第二层'
            }
          ],
          items: [
            {
              id: '1',
              name: 'iPhone 充电器',
              description: '苹果原装20W快充充电器',
              image: '/images/placeholder.png',
              category: '电子配件',
              value: 149,
              bagName: '充电器袋',
              boxName: '电子设备箱',
              location: '书房-第一层'
            },
            {
              id: '2',
              name: 'AirPods Pro',
              description: '苹果无线降噪耳机',
              image: '/images/placeholder.png',
              category: '音频设备',
              value: 1999,
              bagName: '耳机袋',
              boxName: '电子设备箱',
              location: '书房-第二层'
            },
            {
              id: '3',
              name: 'USB-C 数据线',
              description: '高速传输数据线',
              image: '/images/placeholder.png',
              category: '电子配件',
              value: 39,
              bagName: '充电器袋',
              boxName: '电子设备箱',
              location: '书房-第一层'
            }
          ]
        });
      }, 1500);
    });
  },

  // 点击搜索建议
  onSuggestionTap(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    this.setData({
      searchKeyword: suggestion
    });
    this.performSearch();
  },

  // 点击搜索历史
  onHistoryTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword
    });
    this.performSearch();
  },

  // 点击热门搜索
  onHotSearchTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword
    });
    this.performSearch();
  },

  // 筛选类型切换
  onFilterTypeChange(e) {
    const filterType = e.currentTarget.dataset.type;
    this.setData({
      filterType
    });
  },

  // 排序类型切换
  onSortTypeChange() {
    const sortTypes = [
      { key: 'relevance', name: '相关度' },
      { key: 'time', name: '时间' },
      { key: 'value', name: '价值' }
    ];
    
    const currentIndex = sortTypes.findIndex(item => item.key === this.data.sortType);
    const itemList = sortTypes.map(item => item.name);
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const sortType = sortTypes[res.tapIndex].key;
        this.setData({
          sortType
        });
        
        // TODO: 重新排序搜索结果
        console.log('切换排序方式:', sortType);
      }
    });
  },

  // 点击箱子
  onBoxTap(e) {
    const boxId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/packageStorage/pages/box-detail/box-detail?id=${boxId}`
    });
  },

  // 点击袋子
  onBagTap(e) {
    const bagId = e.currentTarget.dataset.id;
    const boxId = e.currentTarget.dataset.boxId || '';
    wx.navigateTo({
      url: `/packageStorage/pages/bag-detail/bag-detail?id=${bagId}&boxId=${boxId}`
    });
  },

  // 点击物品
  onItemTap(e) {
    const itemId = e.currentTarget.dataset.id;
    console.log('点击物品:', itemId);
    
    // TODO: 跳转到物品详情页
    wx.showToast({
      title: '物品详情页开发中',
      icon: 'none'
    });
  },

  // 清空搜索
  onClearSearch() {
    this.setData({
      searchKeyword: '',
      hasSearched: false,
      searchResults: {
        boxes: [],
        bags: [],
        items: []
      },
      showSuggestions: false
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '个人物品管理 - 智能搜索',
      path: '/packageSearch/pages/search/search',
      imageUrl: '/images/share-search.png'
    };
  }
});