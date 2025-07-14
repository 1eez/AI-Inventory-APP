// pages/home/home.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    systemReady: false,
    boxes: [],
    searchKeyword: '',
    // 骨架屏配置
    skeletonLoading: true,
    skeletonItems: [1, 2, 3, 4, 5], // 显示5个骨架屏项目
    // 统计数据
    totalItems: 0, // 总物品数量
    boxesWithItems: 0 // 有物品的箱子数量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('首页加载');
    this.initPage();
  },

  /**
   * 初始化页面
   */
  async initPage() {
    try {
      // 等待系统就绪
      await this.waitForSystemReady();
      
      // 加载箱子数据
      await this.loadBoxes();
      
      // 关闭加载状态
      this.setData({
        loading: false,
        skeletonLoading: false,
        systemReady: true
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
        // 注册系统就绪回调
        app.onSystemReady(() => {
          resolve();
        });
      }
    });
  },

  /**
   * 加载箱子列表数据
   */
  async loadBoxes() {
    try {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // TODO: 替换为实际的API调用
      const mockBoxes = [
        {
          id: 1,
          name: '客厅储物箱',
          description: '客厅常用物品收纳',
          itemCount: 12,
          icon: 'cuIcon-goods',
          color: '#1296db',
          createTime: '2024-01-15'
        },
        {
          id: 2,
          name: '卧室衣柜',
          description: '换季衣物整理',
          itemCount: 8,
          icon: 'cuIcon-clothes',
          color: '#e54d42',
          createTime: '2024-01-10'
        },
        {
          id: 3,
          name: '厨房收纳',
          description: '厨房用品分类存放',
          itemCount: 15,
          icon: 'cuIcon-shop',
          color: '#39b54a',
          createTime: '2024-01-08'
        },
        {
          id: 4,
          name: '书房文具',
          description: '学习办公用品',
          itemCount: 6,
          icon: 'cuIcon-form',
          color: '#f37b1d',
          createTime: '2024-01-05'
        }
      ];
      
      // 计算统计数据
      const totalItems = mockBoxes.reduce((sum, box) => sum + box.itemCount, 0);
      const boxesWithItems = mockBoxes.filter(box => box.itemCount > 0).length;
      
      this.setData({
        boxes: mockBoxes,
        totalItems: totalItems,
        boxesWithItems: boxesWithItems
      });
    } catch (error) {
      console.error('加载箱子数据失败:', error);
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
      cancelText: '取消',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          this.initPage();
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
    
    // 跳转到搜索页面
    wx.navigateTo({
      url: `/packageSearch/pages/search/search?keyword=${encodeURIComponent(keyword)}`
    });
  },

  /**
   * 点击箱子项
   */
  onBoxTap(e) {
    const boxId = e.currentTarget.dataset.id;
    const box = this.data.boxes.find(item => item.id === boxId);
    
    if (!box) {
      wx.showToast({
        title: '箱子信息错误',
        icon: 'error'
      });
      return;
    }
    
    // 跳转到箱子详情页
    wx.navigateTo({
      url: `/packageStorage/pages/box-detail/box-detail?id=${boxId}&name=${encodeURIComponent(box.name)}`
    });
  },

  /**
   * 添加新箱子
   */
  onAddBox() {
    wx.navigateTo({
      url: '/packageStorage/pages/add-box/add-box'
    });
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    try {
      await this.loadBoxes();
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
    if (this.data.systemReady) {
      this.loadBoxes();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.onPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里实现分页加载
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的物品管理系统',
      path: '/pages/home/home',
      imageUrl: '/assets/images/share-cover.jpg'
    };
  }
});