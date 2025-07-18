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
    boxesWithItems: 0, // 有物品的箱子数量
    // 箱子选择浮层
    showBoxSelector: false, // 是否显示箱子选择浮层
    selectorBoxes: [], // 浮层中的箱子列表
    // 袋子选择浮层
    showBagSelector: false, // 是否显示袋子选择浮层
    selectorBags: [], // 浮层中的袋子列表
    selectedBox: null, // 选中的箱子信息
    quickScanMode: false // 是否为快速拍照模式
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
      // 直接调用后台接口获取最新数据
      const userHomeData = await this.fetchUserHomeData();
      
      if (!userHomeData || !userHomeData.data) {
        console.warn('未获取到用户首页数据，使用空数据');
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
        // 预定义的图标数组
        const icons = ['cuIcon-goods', 'cuIcon-clothes', 'cuIcon-shop', 'cuIcon-form', 'cuIcon-home'];
        
        return {
          ...box,
          id: box.box_id, // 映射后台字段
          icon: box.icon || icons[index % icons.length],
          itemCount: box.item_count || 0,
          bag_count: box.bag_count || 0, // 袋子数量
          item_count: box.item_count || 0, // 物品数量
          createTime: this.formatDate(box.created_at) // 格式化日期
        };
      });
      
      this.setData({
        boxes: processedBoxes,
        totalItems: statistics.total_bags || 0,
        boxesWithItems: statistics.total_items || 0
      });
      
      console.log('箱子数据加载完成:', {
        boxes: processedBoxes,
        totalItems: statistics.total_bags,
        boxesWithItems: statistics.total_items
      });
      
      // 更新全局数据缓存
      app.globalData.userHomeData = userHomeData;
      
    } catch (error) {
      console.error('加载箱子数据失败:', error);
      throw error;
    }
  },

  /*** 获取用户首页数据   */
  fetchUserHomeData() {
    return new Promise((resolve, reject) => {
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      if (!openid) {
        reject(new Error('用户未登录'));
        return;
      }
      
      const url = `${baseUrl}v0/home/info?openid=${openid}`;
      
      wx.request({
        url: url,
        method: 'GET',
        success: (res) => {
          console.log('首页数据接口响应:', res);
          
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error(`接口请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('首页数据接口请求失败:', error);
          reject(error);
        }
      });
    });
  },

  /*** 格式化日期   */
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
      return '';
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
    
    // 将完整的箱子信息存储到全局数据中，供详情页使用
    app.globalData.currentBoxInfo = {
      // 原始后台数据字段
      box_id: box.box_id || box.id,
      user_id: box.user_id,
      sort_id: box.sort_id,
      name: box.name,
      description: box.description,
      color: box.color,
      location: box.location,
      created_at: box.created_at,
      item_count: box.item_count,
      // 处理后的显示字段
      id: box.id,
      icon: box.icon,
      itemCount: box.itemCount,
      createTime: box.createTime
    };
    
    console.log('传递给详情页的箱子信息:', app.globalData.currentBoxInfo);
    
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

  /*** 添加新收纳袋   */
  onAddBag() {
    // 检查是否有箱子
    if (this.data.boxes.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先创建一个储物箱，然后再添加收纳袋',
        showCancel: true,
        cancelText: '取消',
        confirmText: '创建箱子',
        success: (res) => {
          if (res.confirm) {
            this.onAddBox();
          }
        }
      });
      return;
    }

    // 显示箱子选择浮层
    this.setData({
      showBoxSelector: true,
      selectorBoxes: this.data.boxes
    });
  },

  /*** 关闭箱子选择浮层   */
  onCloseBoxSelector() {
    this.setData({
      showBoxSelector: false
    });
  },

  /*** 选择箱子   */
  onSelectBox(e) {
    const boxId = e.currentTarget.dataset.id;
    const box = this.data.boxes.find(item => item.id === boxId);
    
    console.log('选择箱子，boxId:', boxId, 'box:', box);
    
    if (!box) {
      wx.showToast({
        title: '箱子信息错误',
        icon: 'error'
      });
      return;
    }

    // 如果是快速拍照模式，显示袋子选择浮层
    if (this.data.quickScanMode) {
      this.setData({
        showBoxSelector: false,
        selectedBox: box
      });
      
      // 获取该箱子下的袋子列表
      const actualBoxId = box.box_id || box.id;
      console.log('传递给loadBagsByBoxId的参数:', actualBoxId);
      this.loadBagsByBoxId(actualBoxId);
      return;
    }

    // 关闭浮层
    this.setData({
      showBoxSelector: false
    });

    // 跳转到添加收纳袋页面，传递箱子信息
    wx.navigateTo({
      url: `/packageStorage/pages/add-bag/add-bag?boxId=${box.box_id || box.id}&boxName=${encodeURIComponent(box.name)}&boxLocation=${encodeURIComponent(box.location || '')}&boxColor=${encodeURIComponent(box.color || '#1296db')}`
    });
  },

  /*** 快速拍照   */
  onQuickScan() {
    // 检查是否有箱子
    if (this.data.boxes.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先创建一个储物箱，然后再进行拍照',
        showCancel: true,
        cancelText: '取消',
        confirmText: '创建箱子',
        success: (res) => {
          if (res.confirm) {
            this.onAddBox();
          }
        }
      });
      return;
    }

    // 设置为快速拍照模式并显示箱子选择浮层
    this.setData({
      quickScanMode: true,
      showBoxSelector: true,
      selectorBoxes: this.data.boxes
    });
  },

  /*** 获取指定箱子下的袋子列表   */
  async loadBagsByBoxId(boxId) {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const app = getApp();
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('用户未登录');
      }
      
      console.log('获取袋子列表，参数:', { openid, box_id: boxId });
      
      const bagData = await this.requestBagList(baseUrl, {
        openid: openid,
        box_id: boxId
      });
      
      console.log('袋子列表API返回数据:', bagData);
      wx.hideLoading();
      
      // 修正数据结构访问：后端返回的是 {data: {bags: Array}}
      const bags = bagData && bagData.data && bagData.data.bags ? bagData.data.bags : [];
      
      if (bags.length > 0) {
        // 显示袋子选择浮层
        this.setData({
          showBagSelector: true,
          selectorBags: bags
        });
      } else {
        // 没有袋子，提示用户先创建袋子
        wx.showModal({
          title: '提示',
          content: '该箱子下还没有收纳袋，请先创建一个收纳袋',
          showCancel: true,
          cancelText: '取消',
          confirmText: '创建袋子',
          success: (res) => {
            if (res.confirm) {
              const box = this.data.selectedBox;
              wx.navigateTo({
                url: `/packageStorage/pages/add-bag/add-bag?boxId=${box.box_id || box.id}&boxName=${encodeURIComponent(box.name)}&boxLocation=${encodeURIComponent(box.location || '')}&boxColor=${encodeURIComponent(box.color || '#1296db')}`
              });
            }
            // 重置快速拍照模式
            this.setData({
              quickScanMode: false,
              selectedBox: null
            });
          }
        });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('获取袋子列表失败:', error);
      wx.showToast({
        title: '获取袋子列表失败',
        icon: 'error'
      });
      // 重置快速拍照模式
      this.setData({
        quickScanMode: false,
        selectedBox: null
      });
    }
  },

  /*** 发送获取袋子列表请求   */
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

  /*** 关闭袋子选择浮层   */
  onCloseBagSelector() {
    this.setData({
      showBagSelector: false,
      quickScanMode: false,
      selectedBox: null
    });
  },

  /*** 选择袋子   */
  onSelectBag(e) {
    const bagId = e.currentTarget.dataset.id;
    const bag = this.data.selectorBags.find(item => item.bag_id === bagId);
    const box = this.data.selectedBox;
    
    if (!bag || !box) {
      wx.showToast({
        title: '信息错误',
        icon: 'error'
      });
      return;
    }

    // 关闭浮层并重置状态
    this.setData({
      showBagSelector: false,
      quickScanMode: false,
      selectedBox: null
    });

    // 跳转到相机页面，传递完整的box和bag信息
    const params = {
      mode: 'photo',
      box_id: box.box_id || box.id,
      bag_id: bag.bag_id,
      box_name: encodeURIComponent(box.name || ''),
      box_color: encodeURIComponent(box.color || '#1296db'),
      box_location: encodeURIComponent(box.location || ''),
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

  /*** 批量导入   */
  onBatchImport() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
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
  async onShow() {
    console.log('首页显示');
    
    // 页面显示时刷新数据
    if (this.data.systemReady) {
      try {
        await this.loadBoxes();
      } catch (error) {
        console.error('页面显示时刷新数据失败:', error);
        // 静默处理错误，不影响用户体验
      }
    } else {
      // 如果系统还未就绪，等待系统就绪后再加载
      this.waitForSystemReady().then(() => {
        this.loadBoxes().catch(error => {
          console.error('系统就绪后加载数据失败:', error);
        });
      });
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