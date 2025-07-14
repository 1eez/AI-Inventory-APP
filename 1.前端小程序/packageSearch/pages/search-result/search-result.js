// packageSearch/pages/search-result/search-result.js

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
      items: [],
      boxes: [],
      bags: [],
      total: 0
    },
    // 当前选中的标签
    activeTab: 'all',
    // 标签列表
    tabs: [
      { key: 'all', name: '全部', count: 0 },
      { key: 'items', name: '物品', count: 0 },
      { key: 'boxes', name: '收纳盒', count: 0 },
      { key: 'bags', name: '收纳袋', count: 0 }
    ],
    // 加载状态
    loading: false,
    // 是否已加载完成
    finished: false,
    // 当前页码
    currentPage: 1,
    // 每页数量
    pageSize: 20,
    // 排序方式
    sortType: 'relevance', // relevance: 相关度, time: 时间, name: 名称
    // 筛选条件
    filters: {
      category: '', // 分类
      location: '', // 位置
      dateRange: '' // 时间范围
    },
    // 是否显示筛选面板
    showFilter: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('搜索结果页面加载', options);
    
    const keyword = options.keyword || '';
    const category = options.category || '';
    
    this.setData({
      keyword,
      'filters.category': category
    });
    
    if (keyword) {
      this.performSearch();
    }
  },

  /**
   * 执行搜索
   */
  async performSearch(loadMore = false) {
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true });
      
      const { keyword, filters, sortType, currentPage, pageSize } = this.data;
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟搜索结果
      const mockResults = this.generateMockResults(keyword, currentPage, pageSize);
      
      if (loadMore) {
        // 加载更多
        const { searchResults } = this.data;
        this.setData({
          searchResults: {
            items: [...searchResults.items, ...mockResults.items],
            boxes: [...searchResults.boxes, ...mockResults.boxes],
            bags: [...searchResults.bags, ...mockResults.bags],
            total: mockResults.total
          },
          currentPage: currentPage + 1,
          finished: mockResults.items.length < pageSize
        });
      } else {
        // 新搜索
        this.setData({
          searchResults: mockResults,
          currentPage: 1,
          finished: mockResults.items.length < pageSize
        });
      }
      
      // 更新标签计数
      this.updateTabCounts();
      
    } catch (error) {
      console.error('搜索失败:', error);
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 生成模拟搜索结果
   */
  generateMockResults(keyword, page, pageSize) {
    const items = [];
    const boxes = [];
    const bags = [];
    
    // 模拟物品数据
    for (let i = 0; i < Math.min(pageSize, 15); i++) {
      items.push({
        id: `item_${page}_${i}`,
        name: `${keyword}相关物品${i + 1}`,
        description: `这是一个与${keyword}相关的物品描述`,
        image: '/images/placeholder.png',
        category: '电子设备',
        location: '书房 > 电子设备盒 > 数据线袋',
        tags: ['重要', '常用'],
        addTime: '2024-01-15',
        boxId: 'box_1',
        bagId: 'bag_1'
      });
    }
    
    // 模拟收纳盒数据
    for (let i = 0; i < Math.min(5, 8); i++) {
      boxes.push({
        id: `box_${page}_${i}`,
        name: `${keyword}收纳盒${i + 1}`,
        description: `专门存放${keyword}相关物品的收纳盒`,
        color: '#4facfe',
        location: '书房书桌下方',
        itemCount: 12 + i,
        bagCount: 3 + i,
        capacity: 'large'
      });
    }
    
    // 模拟收纳袋数据
    for (let i = 0; i < Math.min(3, 6); i++) {
      bags.push({
        id: `bag_${page}_${i}`,
        name: `${keyword}收纳袋${i + 1}`,
        description: `存放${keyword}相关小物件的收纳袋`,
        color: '#43e97b',
        type: 'electronics',
        itemCount: 8 + i,
        boxId: 'box_1',
        boxName: '电子设备收纳盒'
      });
    }
    
    return {
      items,
      boxes,
      bags,
      total: items.length + boxes.length + bags.length
    };
  },

  /**
   * 更新标签计数
   */
  updateTabCounts() {
    const { searchResults } = this.data;
    const tabs = [
      { key: 'all', name: '全部', count: searchResults.total },
      { key: 'items', name: '物品', count: searchResults.items.length },
      { key: 'boxes', name: '收纳盒', count: searchResults.boxes.length },
      { key: 'bags', name: '收纳袋', count: searchResults.bags.length }
    ];
    
    this.setData({ tabs });
  },

  /**
   * 切换标签
   */
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
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
    
    this.setData({
      currentPage: 1,
      finished: false
    });
    
    this.performSearch();
  },

  /**
   * 清空搜索
   */
  onClearSearch() {
    this.setData({
      keyword: '',
      searchResults: {
        items: [],
        boxes: [],
        bags: [],
        total: 0
      },
      activeTab: 'all'
    });
    this.updateTabCounts();
  },

  /**
   * 切换排序方式
   */
  onSortChange(e) {
    const { sort } = e.currentTarget.dataset;
    this.setData({ 
      sortType: sort,
      currentPage: 1,
      finished: false
    });
    this.performSearch();
  },

  /**
   * 显示筛选面板
   */
  onShowFilter() {
    this.setData({ showFilter: true });
  },

  /**
   * 隐藏筛选面板
   */
  onHideFilter() {
    this.setData({ showFilter: false });
  },

  /**
   * 应用筛选
   */
  onApplyFilter(e) {
    const { filters } = e.detail;
    this.setData({
      filters,
      showFilter: false,
      currentPage: 1,
      finished: false
    });
    this.performSearch();
  },

  /**
   * 点击物品
   */
  onItemTap(e) {
    const { item } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageStorage/pages/item-detail/item-detail?itemId=${item.id}`
    });
  },

  /**
   * 点击收纳盒
   */
  onBoxTap(e) {
    const { box } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageStorage/pages/box-detail/box-detail?boxId=${box.id}`
    });
  },

  /**
   * 点击收纳袋
   */
  onBagTap(e) {
    const { bag } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/packageStorage/pages/bag-detail/bag-detail?bagId=${bag.id}`
    });
  },

  /**
   * 查看物品位置
   */
  onViewLocation(e) {
    const { item } = e.currentTarget.dataset;
    wx.showModal({
      title: '物品位置',
      content: item.location,
      showCancel: false
    });
  },

  /**
   * 页面上拉触底事件
   */
  onReachBottom() {
    if (!this.data.finished && !this.data.loading) {
      this.performSearch(true);
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      currentPage: 1,
      finished: false
    });
    
    this.performSearch().finally(() => {
      wx.stopPullDownRefresh();
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