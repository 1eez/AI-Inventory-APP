// packageStorage/pages/box-detail/box-detail.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    boxInfo: null,
    bags: [],
    searchKeyword: '',
    // 骨架屏配置
    skeletonLoading: true,
    skeletonItems: [1, 2, 3, 4],
    // 袋子选择浮层
    showBagSelector: false, // 是否显示袋子选择浮层
    selectorBags: [] // 浮层中的袋子列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('箱子详情页加载', options);
    
    const { id, name } = options;
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.boxId = id;
    this.boxName = decodeURIComponent(name || '');
    
    this.initPage();
  },

  /**
   * 初始化页面
   */
  async initPage() {
    try {
      // 等待系统就绪
      await this.waitForSystemReady();
      
      // 先加载箱子信息，再加载袋子列表（确保boxInfo对象完整初始化后再更新统计信息）
      await this.loadBoxInfo();
      await this.loadBags();
      
      // 关闭加载状态
      this.setData({
        loading: false,
        skeletonLoading: false
      });
    } catch (error) {
      console.error('页面初始化失败:', error);
      this.handleLoadError(error);
    }
  },

  /**
   * 等待系统就绪
   */
  waitForSystemReady() {
    return new Promise((resolve) => {
      if (app.globalData.systemReady) {
        resolve();
      } else {
        app.onSystemReady(() => {
          resolve();
        });
      }
    });
  },

  /**
   * 加载箱子信息
   */
  async loadBoxInfo() {
    try {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 优先从全局数据中获取箱子信息
      let boxData = app.globalData.currentBoxInfo;
      
      if (!boxData) {
        console.warn('未找到全局箱子数据，使用默认数据');
        // 如果没有全局数据，使用默认数据结构
        boxData = {
          box_id: parseInt(this.boxId),
          user_id: 1,
          sort_id: 1,
          name: this.boxName || '未知箱子',
          description: '暂无描述',
          color: '#1296db',
          location: '',
          created_at: new Date().toISOString(),
          item_count: 0,
          icon: 'cuIcon-goods'
        };
      }
      
      console.log('使用的箱子数据:', boxData);
      
      // 格式化数据以适配WXML显示
      const formattedBoxInfo = {
        id: boxData.box_id || boxData.id,
        name: boxData.name,
        description: boxData.description,
        color: boxData.color,
        location: boxData.location,
        icon: boxData.icon || 'cuIcon-goods',
        createTime: this.formatDate(boxData.created_at),
        totalBags: 0, // TODO: 从后台获取袋子数量
        totalItems: boxData.item_count || 0,
        tags: [] // TODO: 从后台获取标签信息
      };
      
      this.setData({
        boxInfo: formattedBoxInfo
      });
      
      // 更新页面标题
      wx.setNavigationBarTitle({
        title: formattedBoxInfo.name
      });
      
      // 清除全局数据，避免内存泄漏
      app.globalData.currentBoxInfo = null;
      
    } catch (error) {
      console.error('加载箱子信息失败:', error);
      throw error;
    }
  },

  /**
   * 从服务器加载箱子信息（用于页面刷新）
   */
  async loadBoxInfoFromServer() {
    try {
      // 获取全局数据
      const openid = app.globalData.openid;
      const baseUrl = app.globalData.baseUrl;
      
      if (!openid) {
        throw new Error('用户身份信息缺失');
      }
      
      if (!this.boxId) {
        throw new Error('箱子ID缺失');
      }
      
      // 调用后台接口获取箱子详情
      const result = await this.requestBoxDetail(baseUrl, {
        openid: openid,
        box_id: parseInt(this.boxId)
      });
      
      if (result.status === 'success' && result.data && result.data.box_info) {
        const boxData = result.data.box_info;
        
        // 格式化数据以适配WXML显示
        const formattedBoxInfo = {
          id: boxData.box_id || boxData.id,
          name: boxData.name,
          description: boxData.description,
          color: boxData.color,
          location: boxData.location,
          icon: boxData.icon || 'cuIcon-goods',
          createTime: this.formatDate(boxData.created_at),
          totalBags: this.data.boxInfo?.totalBags || 0, // 保持当前袋子数量
          totalItems: boxData.item_count || 0,
          tags: [] // TODO: 从后台获取标签信息
        };
        
        this.setData({
          boxInfo: formattedBoxInfo
        });
        
        // 更新页面标题
        wx.setNavigationBarTitle({
          title: formattedBoxInfo.name
        });
        
        console.log('从服务器刷新箱子信息成功:', formattedBoxInfo);
      } else {
        throw new Error(result.message || '获取箱子信息失败');
      }
      
    } catch (error) {
      console.error('从服务器加载箱子信息失败:', error);
      throw error;
    }
  },

  /**
   * 获取箱子详情
   */
  async requestBoxDetail(baseUrl, data) {
    return new Promise((resolve, reject) => {
      // 构建GET请求的URL参数
      const params = `openid=${encodeURIComponent(data.openid)}&box_id=${data.box_id}`;
      
      wx.request({
        url: baseUrl + 'v1/box/get?' + params,
        method: 'GET',
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          console.log('获取箱子详情接口响应:', res);
          
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`服务器错误 (${res.statusCode})`));
          }
        },
        fail: (error) => {
          console.error('获取箱子详情接口调用失败:', error);
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
  },

  /**
   * 格式化日期显示
   */
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

  /**
   * 加载袋子列表
   */
  async loadBags() {
    try {
      // 获取全局数据
      const openid = app.globalData.openid;
      const baseUrl = app.globalData.baseUrl;
      
      if (!openid) {
        throw new Error('用户身份信息缺失');
      }
      
      if (!this.boxId) {
        throw new Error('箱子ID缺失');
      }
      
      // 调用后台接口获取袋子列表
      const result = await this.requestBagList(baseUrl, {
        openid: openid,
        box_id: parseInt(this.boxId)
      });
      
      if (result.status === 'success') {
        // 格式化袋子数据以适配前端显示
        const formattedBags = result.data.bags.map(bag => ({
          bag_id: bag.bag_id, // 保持与后端数据结构一致
          id: bag.bag_id, // 兼容旧代码
          name: bag.name,
          description: bag.description || '暂无描述',
          itemCount: bag.item_count || 0,
          icon: bag.icon || 'cuIcon-goods',
          color: bag.color || '#1296db',
          createTime: this.formatDate(bag.created_at),
          lastUsed: bag.last_used ? this.formatDate(bag.last_used) : null
        }));
        
        // 从API返回数据中获取统计信息
        const totalBags = result.data.total_count || 0; // 使用API返回的total_count
        const totalItems = formattedBags.reduce((sum, bag) => sum + (bag.itemCount || 0), 0);
        
        // 更新袋子列表和统计信息
        this.setData({
          bags: formattedBags,
          'boxInfo.totalBags': totalBags,
          'boxInfo.totalItems': totalItems
        });
        
        console.log('统计信息更新完成:');
        console.log('- 袋子总数:', totalBags);
        console.log('- 物品总数:', totalItems);
        console.log('- 当前boxInfo:', this.data.boxInfo);
        
        console.log('袋子列表加载成功:', formattedBags);
        console.log('API返回的统计信息 - total_count:', result.data.total_count);
        console.log('统计信息更新 - 袋子数:', totalBags, '物品数:', totalItems);
      } else {
        throw new Error(result.message || '获取袋子列表失败');
      }
    } catch (error) {
      console.error('加载袋子列表失败:', error);
      throw error;
    }
  },

  /**
   * 发送获取袋子列表请求
   */
  requestBagList(baseUrl, params) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + 'v2/bag/get',
        method: 'GET',
        data: params,
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          console.log('获取袋子列表接口响应:', res);
          
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('获取袋子列表请求失败:', error);
          reject(new Error('网络请求失败'));
        }
      });
    });
  },

  /**
   * 处理加载错误
   */
  handleLoadError(error) {
    this.setData({
      loading: false,
      skeletonLoading: false
    });
    
    wx.showModal({
      title: '加载失败',
      content: '数据加载失败，请检查网络连接后重试',
      showCancel: true,
      cancelText: '返回',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          this.initPage();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  /**
   * 搜索输入处理
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 执行搜索
   */
  onSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到搜索页面，限定在当前箱子内搜索
    wx.navigateTo({
      url: `/packageSearch/pages/search/search?keyword=${encodeURIComponent(keyword)}&boxId=${this.boxId}`
    });
  },

  /**
   * 点击袋子项
   */
  onBagTap(e) {
    const bagId = e.currentTarget.dataset.id;
    console.log('点击袋子，bagId:', bagId);
    
    // 使用bag_id字段查找袋子数据
    const bag = this.data.bags.find(item => item.bag_id == bagId || item.id == bagId);
    console.log('找到的袋子数据:', bag);
    
    if (!bag) {
      console.error('未找到袋子数据，bagId:', bagId, '袋子列表:', this.data.bags);
      wx.showToast({
        title: '袋子信息错误',
        icon: 'error'
      });
      return;
    }
    
    // 跳转到袋子详情页
    wx.navigateTo({
      url: `/packageStorage/pages/bag-detail/bag-detail?box_id=${this.boxId}&bag_id=${bagId}&bagName=${encodeURIComponent(bag.name)}`
    });
  },

  /**
   * 添加新袋子
   */
  onAddBag() {
    wx.navigateTo({
      url: `/packageStorage/pages/add-bag/add-bag?boxId=${this.boxId}&boxName=${encodeURIComponent(this.data.boxInfo?.name || '')}&boxLocation=${encodeURIComponent(this.data.boxInfo?.location || '')}&boxColor=${encodeURIComponent(this.data.boxInfo?.color || '#1296db')}`
    });
  },

  /**
   * 编辑箱子信息
   */
  onEditBox() {
    const boxInfo = this.data.boxInfo;
    if (!boxInfo) {
      wx.showToast({
        title: '箱子信息错误',
        icon: 'error'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/packageStorage/pages/add-box/add-box?boxId=${boxInfo.id}`
    });
  },

  /**
   * 删除箱子
   */
  onDeleteBox() {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除箱子"${this.data.boxInfo?.name || ''}"吗？箱子内的所有袋子和物品也将被删除。`,
      confirmText: '删除',
      confirmColor: '#e54d42',
      success: (res) => {
        if (res.confirm) {
          this.deleteBoxFromServer();
        }
      }
    });
  },

  /**
   * 调用后台接口删除箱子
   */
  async deleteBoxFromServer() {
    try {
      wx.showLoading({ title: '删除中...' });
      
      // 获取全局数据
      const openid = app.globalData.openid;
      const baseUrl = app.globalData.baseUrl;
      
      if (!openid) {
        throw new Error('用户身份信息缺失');
      }
      
      if (!this.data.boxInfo?.id) {
        throw new Error('箱子ID缺失');
      }
      
      // 调用删除接口
      const result = await this.requestDeleteBox(baseUrl, {
        openid: openid,
        box_id: parseInt(this.data.boxInfo.id)
      });
      
      wx.hideLoading();
      
      if (result.status === 'success') {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 延迟返回上一页，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.message || '删除失败');
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('删除箱子失败:', error);
      
      wx.showModal({
        title: '删除失败',
        content: error.message || '网络错误，请稍后重试',
        showCancel: false,
        confirmText: '确定'
      });
    }
  },

  /**
   * 发送删除箱子请求
   */
  requestDeleteBox(baseUrl, data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + 'v1/box/delete',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: data,
        success: (res) => {
          console.log('删除箱子接口响应:', res);
          
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('删除箱子请求失败:', error);
          reject(new Error('网络请求失败'));
        }
      });
    });
  },

  /**
   * 快速拍照
   */
  onQuickScan() {
    // 检查是否有袋子
    if (this.data.bags.length === 0) {
      wx.showModal({
        title: '提示',
        content: '该箱子下还没有收纳袋，请先创建一个收纳袋',
        showCancel: true,
        cancelText: '取消',
        confirmText: '创建袋子',
        success: (res) => {
          if (res.confirm) {
            this.onAddBag();
          }
        }
      });
      return;
    }

    // 显示袋子选择浮层
    this.setData({
      showBagSelector: true,
      selectorBags: this.data.bags
    });
  },

  /**
   * 关闭袋子选择浮层
   */
  onCloseBagSelector() {
    this.setData({
      showBagSelector: false
    });
  },

  /**
   * 选择袋子
   */
  onSelectBag(e) {
    const bagId = e.currentTarget.dataset.id;
    const bag = this.data.selectorBags.find(item => item.bag_id === bagId);
    const boxInfo = this.data.boxInfo;
    
    if (!bag || !boxInfo) {
      wx.showToast({
        title: '信息错误',
        icon: 'error'
      });
      return;
    }

    // 关闭浮层
    this.setData({
      showBagSelector: false
    });

    // 跳转到相机页面，传递完整的box和bag信息
    const params = {
      mode: 'photo',
      box_id: boxInfo.id,
      bag_id: bag.bag_id,
      box_name: encodeURIComponent(boxInfo.name || ''),
      box_color: encodeURIComponent(boxInfo.color || '#1296db'),
      box_location: encodeURIComponent(boxInfo.location || ''),
      bag_name: encodeURIComponent(bag.name || ''),
      bag_color: encodeURIComponent(bag.color || '#1296db')
    };
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    wx.navigateTo({
      url: `/packageCamera/pages/camera/camera?${queryString}`
    });
  },

  /**
   * 袋子菜单操作
   */
  onBagMenu(e) {
    const bagId = e.currentTarget.dataset.id;
    console.log('袋子菜单，bagId:', bagId);
    
    // 使用bag_id字段查找袋子数据
    const bag = this.data.bags.find(item => item.bag_id == bagId || item.id == bagId);
    
    if (!bag) {
      console.error('菜单操作未找到袋子数据，bagId:', bagId);
      return;
    }
    
    wx.showActionSheet({
      itemList: ['编辑袋子', '删除袋子'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 编辑袋子
          wx.navigateTo({
            url: `/packageStorage/pages/add-bag/add-bag?mode=edit&boxId=${this.boxId}&bagId=${bagId}`
          });
        } else if (res.tapIndex === 1) {
          // 删除袋子
          this.deleteBag(bagId, bag.name);
        }
      }
    });
  },

  /**
   * 删除袋子
   */
  deleteBag(bagId, bagName) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除袋子"${bagName}"吗？袋子内的所有物品也将被删除。`,
      confirmText: '删除',
      confirmColor: '#e54d42',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用删除API
          wx.showLoading({ title: '删除中...' });
          
          setTimeout(() => {
            wx.hideLoading();
            
            // 从列表中移除
            const bags = this.data.bags.filter(bag => bag.id !== bagId);
            this.setData({ bags });
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }, 1000);
        }
      }
    });
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    try {
      await Promise.all([
        this.loadBoxInfo(),
        this.loadBags()
      ]);
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    // 页面显示时刷新数据
    if (!this.data.loading && this.data.boxInfo) {
      try {
        // 重新加载箱子信息和袋子列表，确保编辑后的数据能及时更新
        await this.loadBoxInfoFromServer();
        await this.loadBags();
      } catch (error) {
        console.error('页面显示时刷新数据失败:', error);
        // 如果刷新失败，至少刷新袋子列表
        this.loadBags();
      }
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `我的${this.data.boxInfo?.name || '储物箱'}`,
      path: `/packageStorage/pages/box-detail/box-detail?id=${this.boxId}&name=${encodeURIComponent(this.data.boxInfo?.name || '')}`,
      imageUrl: '/assets/images/share-box.jpg'
    };
  }
});