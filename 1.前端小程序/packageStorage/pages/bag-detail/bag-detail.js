// packageStorage/pages/bag-detail/bag-detail.js
const app = getApp();

Page({
  data: {
    // 加载状态
    loading: true,
    skeletonLoading: true,
    skeletonItems: [1, 2, 3, 4, 5],
    
    // 物品详情弹窗
    showItemDetail: false,
    selectedItem: null,
    
    // 袋子信息
    bagInfo: {
      id: null,
      name: '',
      description: '',
      color: '#1296db',
      icon: 'cuIcon-goods',
      tags: [],
      itemCount: 0,
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
    if (this.data.bagId) {
      this.loadBagInfo();
      this.loadItems().then(() => {
        // 如果物品详情弹窗正在显示，更新selectedItem数据
        if (this.data.showItemDetail && this.data.selectedItem) {
          const updatedItem = this.data.items.find(item => item.id === this.data.selectedItem.id);
          if (updatedItem) {
            this.setData({
              selectedItem: updatedItem
            });
          }
        }
      });
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
      // 袋子和箱子信息现在通过 getItemsFromAPI 方法从后台获取
      // 这里不再需要单独的API调用，数据会在 loadItems 中一并获取
      console.log('袋子信息将通过 loadItems 方法获取');
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
              // 处理袋子tags数据结构，将对象数组转换为字符串数组
              let bagTags = [];
              if (responseData.bag_info.tags && Array.isArray(responseData.bag_info.tags)) {
                bagTags = responseData.bag_info.tags.map(tag => {
                  // 如果tag是对象（包含tag_id和name），则提取name
                  if (typeof tag === 'object' && tag.name) {
                    return tag.name;
                  }
                  // 如果tag是字符串，直接返回
                  return tag;
                });
              }
              
              const bagInfo = {
                id: responseData.bag_info.bag_id,
                name: responseData.bag_info.name,
                description: responseData.bag_info.description || '',
                color: responseData.bag_info.color || '#1296db',
                icon: responseData.bag_info.icon || 'cuIcon-goods',
                tags: bagTags,
                itemCount: responseData.total_count || 0,
                createTime: this.formatDate(responseData.bag_info.created_at),
                lastUsed: responseData.bag_info.last_used ? this.formatDate(responseData.bag_info.last_used) : '',
                location: responseData.bag_info.location || ''
              };
              
              this.setData({ bagInfo });
            }
            
            // 更新箱子信息
            if (responseData.box_info) {
              // 处理箱子tags数据结构，将对象数组转换为字符串数组
              let boxTags = [];
              if (responseData.box_info.tags && Array.isArray(responseData.box_info.tags)) {
                boxTags = responseData.box_info.tags.map(tag => {
                  // 如果tag是对象（包含tag_id和name），则提取name
                  if (typeof tag === 'object' && tag.name) {
                    return tag.name;
                  }
                  // 如果tag是字符串，直接返回
                  return tag;
                });
              }
              
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
                tags: boxTags
              };
              
              this.setData({ boxInfo });
            }
            
            // 处理物品列表
            const items = responseData.items_list || [];
            const photosBaseUrl = `${baseUrl}Photos/`; // 图片基础URL
            const formattedItems = items.map(item => {
              // 处理tags数据结构，将对象数组转换为字符串数组
              let tags = [];
              if (item.tags && Array.isArray(item.tags)) {
                tags = item.tags.map(tag => {
                  // 如果tag是对象（包含tag_id和name），则提取name
                  if (typeof tag === 'object' && tag.name) {
                    return tag.name;
                  }
                  // 如果tag是字符串，直接返回
                  return tag;
                });
              }
              
              return {
                id: item.item_id,
                name: item.title || '未命名物品',
                description: item.description || '',
                image: item.image_filename ? `${photosBaseUrl}${item.image_filename}` : '/images/placeholder.png',
                category: item.category || '其他',
                tags: tags,
                condition: item.condition || '良好',
                purchaseDate: item.purchase_date || '',
                lastUsed: item.last_used || '',
                sortId: item.sort_id || 0,
                boxId: item.box_id,
                bagId: item.bag_id,
                createTime: this.formatDate(item.created_at)
              };
            });
            
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
  
  // 格式化日期（仅日期部分）
  formatDateOnly(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 更新统计信息
  updateStatistics() {
    const items = this.data.items;
    const totalItems = items.length;
    const categories = [...new Set(items.map(item => item.category))].length;
    
    this.setData({
      'statistics.totalItems': totalItems,
      'statistics.categories': categories,
      'statistics.lastUpdate': new Date().toLocaleDateString(),
      'bagInfo.itemCount': totalItems
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

  // 显示物品详情弹窗
  onShowItemDetail(e) {
    const item = e.currentTarget.dataset.item;
    console.log('显示物品详情:', item);
    
    this.setData({
      selectedItem: item,
      showItemDetail: true
    });
  },
  
  // 隐藏物品详情弹窗
  onHideItemDetail() {
    this.setData({
      showItemDetail: false,
      selectedItem: null
    });
  },
  
  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止弹窗内容区域的点击事件冒泡
  },
  
  // 预览图片
  onPreviewImage(e) {
    const imageUrl = e.currentTarget.dataset.url;
    if (imageUrl) {
      wx.previewImage({
        urls: [imageUrl],
        current: imageUrl
      });
    }
  },

  // 物品点击（保留原有方法以防其他地方调用）
  onItemTap(e) {
    const itemId = e.currentTarget.dataset.id;
    console.log('点击物品:', itemId);
    
    // 找到对应的物品数据
    const item = this.data.items.find(item => item.id === itemId);
    if (item) {
      this.setData({
        selectedItem: item,
        showItemDetail: true
      });
    }
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
    const { bagInfo, boxInfo, bagId, boxId } = this.data;
    
    // 构建编辑页面参数
    const params = {
      bagId: bagId,
      boxId: boxId,
      boxName: encodeURIComponent(boxInfo.name || ''),
      boxLocation: encodeURIComponent(boxInfo.location || ''),
      boxColor: encodeURIComponent(boxInfo.color || '#1296db')
    };
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    wx.navigateTo({
      url: `/packageStorage/pages/add-bag/add-bag?${queryString}`
    });
  },

  // 快速拍照
  onQuickScan() {
    // 跳转到相机页面，传递完整的box和bag信息
    const { boxInfo, bagInfo, boxId, bagId } = this.data;
    const params = {
      mode: 'photo',
      box_id: boxId,
      bag_id: bagId,
      box_name: encodeURIComponent(boxInfo.name || ''),
      box_color: encodeURIComponent(boxInfo.color || '#1296db'),
      box_location: encodeURIComponent(boxInfo.location || ''),
      bag_name: encodeURIComponent(bagInfo.name || ''),
      bag_color: encodeURIComponent(bagInfo.color || '#1296db')
    };
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    wx.navigateTo({
      url: `/packageCamera/pages/camera/camera?${queryString}`
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
  onEditItem(e) {
    // 从事件对象或参数中获取物品ID
    const itemId = e.currentTarget ? e.currentTarget.dataset.id : e;
    console.log('编辑物品:', itemId);
    
    const item = this.data.items.find(item => item.id == itemId);
    if (!item) {
      wx.showToast({
        title: '物品不存在',
        icon: 'none'
      });
      return;
    }
    
    const { bagInfo, boxInfo, bagId, boxId } = this.data;
    
    // 构建编辑页面参数
    const params = {
      item_id: itemId,
      boxId: boxId,
      bagId: bagId,
      boxName: encodeURIComponent(boxInfo.name || ''),
      boxLocation: encodeURIComponent(boxInfo.location || ''),
      boxColor: encodeURIComponent(boxInfo.color || '#1296db'),
      bagName: encodeURIComponent(bagInfo.name || ''),
      bagColor: encodeURIComponent(bagInfo.color || '#1296db')
    };
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    wx.navigateTo({
      url: `/packageCamera/pages/item-confirm/item-confirm?${queryString}`
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
  onDeleteItem(e) {
    // 从事件对象或参数中获取物品ID
    const itemId = e.currentTarget ? e.currentTarget.dataset.id : e;
    const item = this.data.items.find(item => item.id == itemId);
    
    if (!item) {
      wx.showToast({
        title: '物品不存在',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除物品"${item.name}"吗？`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          this.deleteItemFromAPI(itemId);
        }
      }
    });
  },

  // 调用后台API删除物品
  async deleteItemFromAPI(itemId) {
    const baseUrl = app.globalData.baseUrl;
    const openid = app.globalData.openid;
    
    if (!baseUrl || !openid) {
      wx.showToast({
        title: '缺少必要的配置信息',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '删除中...'
    });
    
    try {
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: `${baseUrl}v3/item/delete`,
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          data: {
            openid: openid,
            box_id: parseInt(this.data.boxId),
            bag_id: parseInt(this.data.bagId),
            item_id: parseInt(itemId)
          },
          success: (res) => {
            console.log('删除物品API响应:', res);
            if (res.statusCode === 200 && res.data.status === 'success') {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '删除失败'));
            }
          },
          fail: (error) => {
            console.error('删除物品API调用失败:', error);
            reject(error);
          }
        });
      });
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 从本地数据中移除已删除的物品
      const items = this.data.items.filter(item => item.id != itemId);
      this.setData({ items });
      
      // 隐藏物品详情弹窗（如果正在显示）
      if (this.data.showItemDetail && this.data.selectedItem && this.data.selectedItem.id == itemId) {
        this.setData({
          showItemDetail: false,
          selectedItem: null
        });
      }
      
      // 更新统计信息
      this.updateStatistics();
      
      // 显示成功提示
      wx.showToast({
        title: result.message || '删除成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('删除物品失败:', error);
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 显示错误提示
      wx.showToast({
        title: error.message || '删除失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 删除袋子
  onDeleteBag() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除袋子"${this.data.bagInfo.name}"吗？删除后袋子内的所有物品也将被删除。`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          this.deleteBagFromAPI();
        }
      }
    });
  },

  // 调用后台API删除袋子
  async deleteBagFromAPI() {
    const baseUrl = app.globalData.baseUrl;
    const openid = app.globalData.openid;
    
    if (!baseUrl || !openid) {
      wx.showToast({
        title: '缺少必要的配置信息',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '删除中...'
    });
    
    try {
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: `${baseUrl}v2/bag/delete`,
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          data: {
            openid: openid,
            box_id: parseInt(this.data.boxId),
            bag_id: parseInt(this.data.bagId)
          },
          success: (res) => {
            console.log('删除袋子API响应:', res);
            if (res.statusCode === 200 && res.data.status === 'success') {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '删除失败'));
            }
          },
          fail: (error) => {
            console.error('删除袋子API调用失败:', error);
            reject(error);
          }
        });
      });
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 显示成功提示
      wx.showToast({
        title: result.message || '删除成功',
        icon: 'success'
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      console.error('删除袋子失败:', error);
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 显示错误提示
      wx.showToast({
        title: error.message || '删除失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
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