// packageStorage/pages/item-detail/item-detail.js

/**
 * 物品详情页面
 * 显示单个物品的详细信息，包括图片、描述、标签、位置等
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 加载状态
    loading: true,
    // 骨架屏显示状态
    showSkeleton: true,
    // 物品信息
    itemInfo: null,
    // 相关物品
    relatedItems: [],
    // 操作历史
    operationHistory: [],
    // 错误信息
    errorMessage: '',
    // 编辑模式
    editMode: false,
    // 图片预览索引
    previewIndex: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('物品详情页面加载', options);
    
    // 获取物品ID
    const itemId = options.itemId;
    if (!itemId) {
      this.setData({
        errorMessage: '物品ID不能为空',
        loading: false,
        showSkeleton: false
      });
      return;
    }
    
    // 保存物品ID
    this.itemId = itemId;
    
    // 初始化页面
    this.initPage();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    if (this.itemId) {
      this.loadItemInfo();
    }
  },

  /**
   * 初始化页面
   */
  async initPage() {
    try {
      // 等待系统准备就绪
      await this.waitForSystemReady();
      
      // 加载物品信息
      await this.loadItemInfo();
      
      // 加载相关数据
      await Promise.all([
        this.loadRelatedItems(),
        this.loadOperationHistory()
      ]);
      
    } catch (error) {
      console.error('页面初始化失败:', error);
      this.setData({
        errorMessage: '页面加载失败，请重试',
        loading: false,
        showSkeleton: false
      });
    }
  },

  /**
   * 等待系统准备就绪
   */
  waitForSystemReady() {
    return new Promise((resolve) => {
      if (getApp().globalData.systemReady) {
        resolve();
      } else {
        const checkReady = () => {
          if (getApp().globalData.systemReady) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      }
    });
  },

  /**
   * 加载物品信息
   */
  async loadItemInfo() {
    try {
      this.setData({ loading: true });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟物品数据
      const mockItemInfo = {
        id: this.itemId,
        name: '苹果MacBook Pro 16寸',
        description: '2023款 M3 Max芯片，36GB内存，1TB存储，深空灰色。主要用于开发工作，性能强劲，续航优秀。',
        images: [
          '/images/macbook-1.jpg',
          '/images/macbook-2.jpg',
          '/images/macbook-3.jpg'
        ],
        category: '电子设备',
        tags: ['笔记本电脑', '苹果', 'M3芯片', '开发工具'],
        value: 25999,
        purchaseDate: '2023-11-15',
        warranty: '2024-11-15',
        condition: '全新',
        location: {
          boxName: '电子设备收纳盒',
          bagName: '笔记本电脑袋',
          position: '主隔层'
        },
        specifications: {
          '品牌': 'Apple',
          '型号': 'MacBook Pro 16"',
          '处理器': 'M3 Max',
          '内存': '36GB',
          '存储': '1TB SSD',
          '颜色': '深空灰'
        },
        notes: '购买时包装完整，所有配件齐全。定期清洁保养，使用状况良好。',
        createTime: '2023-11-15 14:30:00',
        updateTime: '2024-01-10 09:15:00'
      };
      
      this.setData({
        itemInfo: mockItemInfo,
        loading: false,
        showSkeleton: false,
        errorMessage: ''
      });
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: mockItemInfo.name
      });
      
    } catch (error) {
      console.error('加载物品信息失败:', error);
      this.setData({
        errorMessage: '加载物品信息失败',
        loading: false,
        showSkeleton: false
      });
    }
  },

  /**
   * 加载相关物品
   */
  async loadRelatedItems() {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟相关物品数据
      const mockRelatedItems = [
        {
          id: 'item_002',
          name: 'Magic Mouse',
          image: '/images/mouse.jpg',
          category: '电子设备'
        },
        {
          id: 'item_003',
          name: 'Magic Keyboard',
          image: '/images/keyboard.jpg',
          category: '电子设备'
        },
        {
          id: 'item_004',
          name: 'USB-C充电器',
          image: '/images/charger.jpg',
          category: '电子设备'
        }
      ];
      
      this.setData({
        relatedItems: mockRelatedItems
      });
      
    } catch (error) {
      console.error('加载相关物品失败:', error);
    }
  },

  /**
   * 加载操作历史
   */
  async loadOperationHistory() {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 模拟操作历史数据
      const mockHistory = [
        {
          id: 'op_001',
          type: 'update',
          description: '更新了物品描述',
          time: '2024-01-10 09:15:00',
          operator: '用户'
        },
        {
          id: 'op_002',
          type: 'move',
          description: '移动到电子设备袋',
          time: '2023-12-20 16:30:00',
          operator: '用户'
        },
        {
          id: 'op_003',
          type: 'create',
          description: '创建物品记录',
          time: '2023-11-15 14:30:00',
          operator: '用户'
        }
      ];
      
      this.setData({
        operationHistory: mockHistory
      });
      
    } catch (error) {
      console.error('加载操作历史失败:', error);
    }
  },

  /**
   * 图片预览
   */
  onImageTap(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data.itemInfo;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  /**
   * 编辑物品
   */
  onEditItem() {
    // TODO: 跳转到编辑页面
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    });
  },

  /**
   * 删除物品
   */
  onDeleteItem() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个物品吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          this.deleteItem();
        }
      }
    });
  },

  /**
   * 执行删除操作
   */
  async deleteItem() {
    try {
      wx.showLoading({ title: '删除中...' });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  },

  /**
   * 移动物品
   */
  onMoveItem() {
    // TODO: 跳转到移动页面
    wx.showToast({
      title: '移动功能开发中',
      icon: 'none'
    });
  },

  /**
   * 复制物品
   */
  onCopyItem() {
    // TODO: 跳转到复制页面
    wx.showToast({
      title: '复制功能开发中',
      icon: 'none'
    });
  },

  /**
   * 查看位置
   */
  onViewLocation() {
    const { location } = this.data.itemInfo;
    
    wx.showModal({
      title: '物品位置',
      content: `收纳盒：${location.boxName}\n收纳袋：${location.bagName}\n位置：${location.position}`,
      showCancel: false
    });
  },

  /**
   * 查看相关物品
   */
  onRelatedItemTap(e) {
    const { itemId } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/packageStorage/pages/item-detail/item-detail?itemId=${itemId}`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadItemInfo().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面卸载
   */
  onUnload() {
    // 清理资源
    this.itemId = null;
  }
});