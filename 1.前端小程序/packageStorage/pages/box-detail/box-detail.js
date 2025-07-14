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
    skeletonItems: [1, 2, 3, 4]
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
      
      // 加载箱子信息和袋子列表
      await Promise.all([
        this.loadBoxInfo(),
        this.loadBags()
      ]);
      
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
      
      // TODO: 替换为实际的API调用
      const mockBoxInfo = {
        id: this.boxId,
        name: this.boxName || '客厅储物箱',
        description: '客厅常用物品收纳',
        icon: 'cuIcon-goods',
        color: '#1296db',
        createTime: '2024-01-15',
        updateTime: '2024-01-20',
        totalBags: 4,
        totalItems: 12,
        tags: ['客厅', '常用', '整理']
      };
      
      this.setData({
        boxInfo: mockBoxInfo
      });
      
      // 更新页面标题
      wx.setNavigationBarTitle({
        title: mockBoxInfo.name
      });
    } catch (error) {
      console.error('加载箱子信息失败:', error);
      throw error;
    }
  },

  /**
   * 加载袋子列表
   */
  async loadBags() {
    try {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // TODO: 替换为实际的API调用
      const mockBags = [
        {
          id: 1,
          name: '电子产品袋',
          description: '充电器、数据线等电子配件',
          itemCount: 5,
          icon: 'cuIcon-mobile',
          color: '#e54d42',
          createTime: '2024-01-15',
          lastUsed: '2024-01-20'
        },
        {
          id: 2,
          name: '文具袋',
          description: '笔、橡皮、便签等文具用品',
          itemCount: 3,
          icon: 'cuIcon-form',
          color: '#39b54a',
          createTime: '2024-01-12',
          lastUsed: '2024-01-18'
        },
        {
          id: 3,
          name: '杂物袋',
          description: '各种小物件临时存放',
          itemCount: 4,
          icon: 'cuIcon-goods',
          color: '#f37b1d',
          createTime: '2024-01-10',
          lastUsed: '2024-01-19'
        },
        {
          id: 4,
          name: '备用袋',
          description: '暂时空置，可放置新物品',
          itemCount: 0,
          icon: 'cuIcon-add',
          color: '#8799a3',
          createTime: '2024-01-08',
          lastUsed: null
        }
      ];
      
      this.setData({
        bags: mockBags
      });
    } catch (error) {
      console.error('加载袋子列表失败:', error);
      throw error;
    }
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
    const bag = this.data.bags.find(item => item.id === bagId);
    
    if (!bag) {
      wx.showToast({
        title: '袋子信息错误',
        icon: 'error'
      });
      return;
    }
    
    // 跳转到袋子详情页
    wx.navigateTo({
      url: `/packageStorage/pages/bag-detail/bag-detail?boxId=${this.boxId}&bagId=${bagId}&bagName=${encodeURIComponent(bag.name)}`
    });
  },

  /**
   * 添加新袋子
   */
  onAddBag() {
    wx.navigateTo({
      url: `/packageStorage/pages/add-bag/add-bag?boxId=${this.boxId}&boxName=${encodeURIComponent(this.data.boxInfo?.name || '')}`
    });
  },

  /**
   * 编辑箱子信息
   */
  onEditBox() {
    wx.navigateTo({
      url: `/packageStorage/pages/add-box/add-box?mode=edit&id=${this.boxId}`
    });
  },

  /**
   * 袋子菜单操作
   */
  onBagMenu(e) {
    const bagId = e.currentTarget.dataset.id;
    const bag = this.data.bags.find(item => item.id === bagId);
    
    if (!bag) return;
    
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
  onShow() {
    // 页面显示时刷新数据
    if (!this.data.loading && this.data.boxInfo) {
      this.loadBags();
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