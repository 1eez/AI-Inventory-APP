// packageStorage/pages/bag-detail/bag-detail.js
const app = getApp();

Page({
  data: {
    // 加载状态
    loading: true,
    skeletonLoading: true,
    skeletonItems: [1, 2, 3, 4, 5],
    
    // 袋子信息
    bagInfo: {
      id: null,
      name: '',
      description: '',
      color: '#1296db',
      icon: 'cuIcon-goods',
      tags: [],
      itemCount: 0,
      totalValue: 0,
      createTime: '',
      lastUsed: '',
      location: ''
    },
    
    // 箱子信息
    boxInfo: {
      id: null,
      name: '',
      description: '',
      color: '#1296db',
      location: '',
      icon: 'cuIcon-home',
      createTime: '',
      totalBags: 0,
      totalItems: 0,
      tags: []
    },
    
    // 物品列表
    items: [],
    
    // 搜索
    searchKeyword: '',
    
    // 页面参数
    bagId: '',
    boxId: ''
  },

  onLoad(options) {
    console.log('袋子详情页加载', options);
    
    // 检查必要参数
    if (!options.bag_id) {
      wx.showToast({
        title: '缺少袋子ID参数',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({
      bagId: options.bag_id || options.id || '',
      boxId: options.box_id || options.boxId || ''
    });
    
    // 等待系统准备就绪
    this.waitForSystemReady();
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.bagId && !this.data.loading) {
      this.loadBagInfo();
      this.loadItems();
    }
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
  async initPage() {
    try {
      await this.loadBagInfo();
      await this.loadItems();
      
      this.setData({
        loading: false,
        skeletonLoading: false
      });
    } catch (error) {
      console.error('初始化袋子详情页失败:', error);
      this.handleError('加载失败，请重试');
    }
  },

  // 加载袋子信息
  async loadBagInfo() {
    try {
      // TODO: 替换为真实API调用
      const bagInfo = await this.mockGetBagInfo(this.data.bagId);
      const boxInfo = await this.mockGetBoxInfo(this.data.boxId);
      
      this.setData({
        bagInfo,
        boxInfo
      });
    } catch (error) {
      console.error('加载袋子信息失败:', error);
      throw error;
    }
  },

  // 加载物品列表
  async loadItems() {
    try {
      this.setData({ loading: true });
      
      // 从后台API获取数据
      const items = await this.getItemsFromAPI();
      
      // 更新页面数据
      this.setData({
        items: items,
        filteredItems: items,
        loading: false
      });
      
      // 更新统计信息
      this.updateStatistics();
      
    } catch (error) {
      console.error('加载袋子详情失败:', error);
      
      // 显示错误提示
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
      
      this.setData({ loading: false });
    }
  },

  // 从后台API获取袋子详情和物品列表
  async getItemsFromAPI() {
    const baseUrl = app.globalData.baseUrl;
    const openid = app.globalData.openid;
    
    if (!baseUrl || !openid) {
      throw new Error('缺少必要的配置信息');
    }
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${baseUrl}v3/item/get`,
        method: 'GET',
        data: {
          openid: openid,
          box_id: this.data.boxId,
          bag_id: this.data.bagId
        },
        success: (res) => {
          console.log('获取袋子详情API响应:', res);
          if (res.statusCode === 200 && res.data.status === 'success') {
            const responseData = res.data.data;
            
            // 更新袋子信息
            if (responseData.bag_info) {
              const bagInfo = {
                id: responseData.bag_info.bag_id,
                name: responseData.bag_info.name,
                description: responseData.bag_info.description || '',
                color: responseData.bag_info.color || '#1296db',
                icon: responseData.bag_info.icon || 'cuIcon-goods',
                tags: responseData.bag_info.tags || [],
                itemCount: responseData.total_count || 0,
                totalValue: responseData.bag_info.total_value || 0,
                createTime: this.formatDate(responseData.bag_info.created_at),
                lastUsed: responseData.bag_info.last_used ? this.formatDate(responseData.bag_info.last_used) : '',
                location: responseData.bag_info.location || ''
              };
              
              this.setData({ bagInfo });
            }
            
            // 更新箱子信息
            if (responseData.box_info) {
              const boxInfo = {
                id: responseData.box_info.box_id,
                name: responseData.box_info.name,
                description: responseData.box_info.description || '',
                color: responseData.box_info.color || '#1296db',
                location: responseData.box_info.location || '',
                icon: responseData.box_info.icon || 'cuIcon-home',
                createTime: this.formatDate(responseData.box_info.created_at),
                totalBags: 0, // TODO: 从后台获取袋子数量
                totalItems: responseData.box_info.item_count || 0,
                tags: responseData.box_info.tags || []
              };
              
              this.setData({ boxInfo });
            }
            
            // 处理物品列表
            const items = responseData.items_list || [];
            const formattedItems = items.map(item => ({
              id: item.id,
              name: item.name || '未命名物品',
              description: item.description || '',
              image: item.image || '/images/placeholder.png',
              category: item.category || '其他',
              tags: item.tags || [],
              value: item.value || 0,
              quantity: item.quantity || 1,
              condition: item.condition || '良好',
              purchaseDate: item.purchase_date || '',
              lastUsed: item.last_used || ''
            }));
            
            resolve(formattedItems);
          } else {
            reject(new Error(res.data.message || '获取袋子详情失败'));
          }
        },
        fail: (error) => {
          console.error('获取袋子详情API调用失败:', error);
          reject(error);
        }
      });
    });
  },
  
  // 格式化日期显示
  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('日期格式化失败:', error);
      return dateString;
    }
  },

  // 更新统计信息
  updateStatistics() {
    const items = this.data.items;
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
    const categories = [...new Set(items.map(item => item.category))].length;
    
    this.setData({
      'statistics.totalItems': totalItems,
      'statistics.totalValue': totalValue,
      'statistics.categories': categories,
      'statistics.lastUpdate': new Date().toLocaleDateString(),
      'bagInfo.itemCount': totalItems,
      'bagInfo.totalValue': totalValue
    });
  },

  // 模拟获取袋子信息
  mockGetBagInfo(bagId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: bagId,
          name: '电子设备袋',
          description: '存放各种电子设备和配件',
          color: '#667eea',
          icon: 'cuIcon-phone',
          tags: ['电子产品', '数码配件'],
          itemCount: 8,
          totalValue: 2580,
          createTime: '2024-01-15',
          lastUsed: '2天前',
          location: '书房-第二层'
        });
      }, 800);
    });
  },

  // 模拟获取箱子信息
  mockGetBoxInfo(boxId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: boxId,
          name: '书房收纳箱',
          color: '#764ba2',
          icon: 'cuIcon-home'
        });
      }, 500);
    });
  },

  // 模拟获取物品列表
  mockGetItems(bagId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'iPhone 充电器',
            description: '苹果原装20W快充充电器',
            image: '/images/placeholder.png',
            category: '电子配件',
            tags: ['充电器', '苹果'],
            value: 149,
            quantity: 1,
            condition: '良好',
            purchaseDate: '2023-12-01',
            lastUsed: '昨天'
          },
          {
            id: '2',
            name: 'AirPods Pro',
            description: '苹果无线降噪耳机',
            image: '/images/placeholder.png',
            category: '音频设备',
            tags: ['耳机', '苹果', '降噪'],
            value: 1999,
            quantity: 1,
            condition: '优秀',
            purchaseDate: '2023-10-15',
            lastUsed: '今天'
          },
          {
            id: '3',
            name: 'USB-C 数据线',
            description: '高速传输数据线 1米',
            image: '/images/placeholder.png',
            category: '电子配件',
            tags: ['数据线', 'USB-C'],
            value: 39,
            quantity: 2,
            condition: '良好',
            purchaseDate: '2023-11-20',
            lastUsed: '3天前'
          },
          {
            id: '4',
            name: '移动硬盘',
            description: '1TB 便携式移动硬盘',
            image: '/images/placeholder.png',
            category: '存储设备',
            tags: ['硬盘', '存储', '1TB'],
            value: 299,
            quantity: 1,
            condition: '良好',
            purchaseDate: '2023-09-10',
            lastUsed: '1周前'
          },
          {
            id: '5',
            name: '蓝牙鼠标',
            description: '罗技无线蓝牙鼠标',
            image: '/images/placeholder.png',
            category: '电脑配件',
            tags: ['鼠标', '蓝牙', '罗技'],
            value: 89,
            quantity: 1,
            condition: '良好',
            purchaseDate: '2023-08-05',
            lastUsed: '今天'
          }
        ]);
      }, 1000);
    });
  },

  // 错误处理
  handleError(message) {
    this.setData({
      loading: false,
      skeletonLoading: false
    });
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
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
    
    // TODO: 实现搜索逻辑
    console.log('搜索物品:', keyword);
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    });
  },

  // 物品点击
  onItemTap(e) {
    const itemId = e.currentTarget.dataset.id;
    console.log('点击物品:', itemId);
    
    // TODO: 跳转到物品详情页
    wx.showToast({
      title: '物品详情页开发中',
      icon: 'none'
    });
  },

  // 物品菜单
  onItemMenu(e) {
    const itemId = e.currentTarget.dataset.id;
    const item = this.data.items.find(item => item.id === itemId);
    
    if (!item) return;
    
    wx.showActionSheet({
      itemList: ['编辑物品', '移动到其他袋子', '删除物品'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.onEditItem(itemId);
            break;
          case 1:
            this.onMoveItem(itemId);
            break;
          case 2:
            this.onDeleteItem(itemId);
            break;
        }
      }
    });
  },

  // 编辑袋子
  onEditBag() {
    // TODO: 跳转到编辑袋子页面
    wx.showToast({
      title: '编辑袋子功能开发中',
      icon: 'none'
    });
  },

  // 添加物品
  onAddItem() {
    // TODO: 跳转到添加物品页面
    wx.showToast({
      title: '添加物品功能开发中',
      icon: 'none'
    });
  },

  // 快速拍照
  onQuickScan() {
    // TODO: 调用相机拍照识别
    wx.showToast({
      title: '拍照识别功能开发中',
      icon: 'none'
    });
  },

  // 批量操作
  onBatchOperation() {
    // TODO: 进入批量操作模式
    wx.showToast({
      title: '批量操作功能开发中',
      icon: 'none'
    });
  },

  // 编辑物品
  onEditItem(itemId) {
    console.log('编辑物品:', itemId);
    // TODO: 跳转到编辑物品页面
    wx.showToast({
      title: '编辑物品功能开发中',
      icon: 'none'
    });
  },

  // 移动物品
  onMoveItem(itemId) {
    console.log('移动物品:', itemId);
    // TODO: 显示移动物品选择器
    wx.showToast({
      title: '移动物品功能开发中',
      icon: 'none'
    });
  },

  // 删除物品
  onDeleteItem(itemId) {
    const item = this.data.items.find(item => item.id === itemId);
    if (!item) return;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除物品"${item.name}"吗？`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用删除API
          const items = this.data.items.filter(item => item.id !== itemId);
          this.setData({ items });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除袋子
  onDeleteBag() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除袋子"${this.data.bagInfo.name}"吗？删除后袋子内的所有物品也将被删除。`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用删除袋子API
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新袋子详情');
    
    Promise.all([
      this.loadBagInfo(),
      this.loadItems()
    ]).then(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
    }).catch((error) => {
      console.error('刷新失败:', error);
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: `我的${this.data.bagInfo.name}`,
      path: `/packageStorage/pages/bag-detail/bag-detail?id=${this.data.bagId}&boxId=${this.data.boxId}`,
      imageUrl: '/images/share-bag.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `我的${this.data.bagInfo.name} - 个人物品管理`,
      imageUrl: '/images/share-bag.png'
    };
  }
});