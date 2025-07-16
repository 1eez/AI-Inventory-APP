// pages/home/home.js
const app = getApp();

Page({
  /*** 页面的初始数据   */
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

  /*** 生命周期函数--监听页面加载   */
  onLoad(options) {
    console.log('首页加载');
    this.initPage();
  },

  /*** 初始化页面   */
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

  /*** 等待系统就绪   */
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

  /*** 加载箱子列表数据   */
  async loadBoxes() {
    try {
      // 从全局数据中获取用户首页数据
      const userHomeData = app.globalData.userHomeData;
      
      if (!userHomeData || !userHomeData.data) {
        console.warn('未找到用户首页数据，使用空数据');
        this.setData({
          boxes: [],
          totalItems: 0,
          boxesWithItems: 0
        });
        return;
      }
      
      const { statistics, boxes } = userHomeData.data;
      
      // 处理箱子数据，为每个箱子添加默认的显示属性
      const processedBoxes = boxes.map((box, index) => {
        // 预定义的图标和颜色数组
        const icons = ['cuIcon-goods', 'cuIcon-clothes', 'cuIcon-shop', 'cuIcon-form', 'cuIcon-home'];
        const colors = ['#1296db', '#e54d42', '#39b54a', '#f37b1d', '#8dc63f'];
        
        return {
          ...box,
          icon: box.icon || icons[index % icons.length],
          color: box.color || colors[index % colors.length],
          itemCount: box.item_count || 0
        };
      });
      
      this.setData({
        boxes: processedBoxes,
        totalItems: statistics.total_items || 0,
        boxesWithItems: statistics.total_boxes || 0
      });
      
      console.log('箱子数据加载完成:', {
        boxes: processedBoxes,
        totalItems: statistics.total_items,
        boxesWithItems: statistics.total_boxes
      });
      
    } catch (error) {
      console.error('加载箱子数据失败:', error);
      throw error;
    }
  },

  /*** 处理加载错误   */
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

  /*** 搜索输入处理   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /*** 执行搜索   */
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

  /*** 点击箱子项   */
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

  /*** 添加新箱子   */
  onAddBox() {
    wx.navigateTo({
      url: '/packageStorage/pages/add-box/add-box'
    });
  },

  /*** 下拉刷新   */
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

  /*** 生命周期函数--监听页面显示   */
  onShow() {
    // 页面显示时刷新数据
    if (this.data.systemReady) {
      this.loadBoxes();
    }
  },

  /*** 用户点击右上角分享   */
  onShareAppMessage() {
    return {
      title: '相信我，你需要她帮你收纳整理',
      path: '/pages/splash/splash',
      imageUrl: '/assets/images/share-cover.jpg'
    };
  }
});