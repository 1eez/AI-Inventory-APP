// pages/home/home.js
const app = getApp();

Page({
  /*** 激励视频广告实例   */
  videoAd: null,

  // 广告相关状态
  adLoadFailed: false,
  adErrorCode: null,

  /*** 页面的初始数据   */
  data: {
    loading: true,
    systemReady: false,
    boxes: [],
    searchKeyword: '',
    // 用户信息
    userNickname: '', // 用户昵称
    itemLimit: 30, // 物品存储限制
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
    quickScanMode: false, // 是否为快速拍照模式
    isAlbumImport: false // 是否为相册导入模式
  },

  /*** 生命周期函数--监听页面加载   */
  onLoad(options) {
    console.log('首页加载');
    this.initRewardedVideoAd();
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
      
      const { statistics, boxes, user_info } = userHomeData.data;
      
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
      
      // 获取用户昵称和物品限制
      const userNickname = user_info && user_info.nickname ? user_info.nickname : '';
      const itemLimit = user_info && user_info.item_limit ? user_info.item_limit : 30;
      
      this.setData({
        boxes: processedBoxes,
        totalItems: statistics.total_bags || 0,
        boxesWithItems: statistics.total_items || 0,
        userNickname: userNickname,
        itemLimit: itemLimit
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

    // 如果是快速拍照模式或相册导入模式，显示袋子选择浮层
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
              selectedBox: null,
              isAlbumImport: false
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
        selectedBox: null,
        isAlbumImport: false
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
      selectedBox: null,
      isAlbumImport: false
    });
  },

  /*** 从相册选择图片   */
  chooseImageFromAlbum(box, bag) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const imagePath = res.tempFilePaths[0];
        console.log('选择相册图片成功:', imagePath);
        
        // 识别选择的图片
        this.recognizeAlbumPhoto(imagePath, box, bag);
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        });
      }
    });
  },

  /*** 识别相册照片   */
  async recognizeAlbumPhoto(imagePath, box, bag) {
    try {
      wx.showLoading({ title: '上传中...' });
      
      // 获取全局配置
      const app = getApp();
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('用户未登录');
      }
      
      // 上传图片到后台
      const uploadResult = await this.uploadImageToServer(imagePath, baseUrl, openid);
      
      console.log('图片上传成功:', uploadResult);
      
      // 使用后台返回的真实识别结果
      const recognitionResult = uploadResult.data || uploadResult;
      
      wx.hideLoading();
      
      // 跳转到确认页面，传递完整的box和bag信息
      const params = {
        image: encodeURIComponent(imagePath),
        result: encodeURIComponent(JSON.stringify(recognitionResult)),
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
        url: `/packageCamera/pages/item-confirm/item-confirm?${queryString}`
      });
      
    } catch (error) {
      console.error('处理失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '处理失败，请重试',
        icon: 'error'
      });
    }
  },

  /*** 上传图片到服务器   */
  uploadImageToServer(imagePath, baseUrl, openid) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: baseUrl + 'v3/image/upload',
        filePath: imagePath,
        name: 'image',
        formData: {
          'openid': openid
        },
        header: {
          'content-type': 'multipart/form-data'
        },
        success: (res) => {
          console.log('上传响应:', res);
          
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data);
              resolve(data);
            } catch (parseError) {
              console.error('解析响应数据失败:', parseError);
              resolve({ message: '上传成功', data: res.data });
            }
          } else {
            reject(new Error(`上传失败，状态码: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('上传请求失败:', error);
          reject(new Error('网络请求失败'));
        }
      });
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

    // 如果是相册导入模式，直接选择相册图片
    if (this.data.isAlbumImport) {
      // 关闭浮层并重置状态
      this.setData({
        showBagSelector: false,
        quickScanMode: false,
        selectedBox: null,
        isAlbumImport: false
      });
      
      // 选择相册图片
      this.chooseImageFromAlbum(box, bag);
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

  /*** 初始化激励视频广告   */
  initRewardedVideoAd() {
    // 若在开发者工具中无法预览广告，请切换开发者工具中的基础库版本
    if (wx.createRewardedVideoAd) {
      this.videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-6d68dfcbc46e498c'
      });
      
      // 监听广告加载成功
      this.videoAd.onLoad(() => {
        console.log('激励视频广告加载成功');
      });
      
      // 监听广告加载失败
      this.videoAd.onError((err) => {
        console.error('激励视频广告加载失败', err);
        // 设置广告加载失败标记
        this.adLoadFailed = true;
        this.adErrorCode = err.errCode;
        
        let errorMessage = '广告加载失败，请稍后重试';
        if (err.errCode === 1004) {
          errorMessage = '暂无可用广告，请稍后再试';
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none'
        });
      });
      
      // 监听广告关闭
      this.videoAd.onClose((res) => {
        console.log('激励视频广告关闭', res);
        // 如果广告加载失败，不执行任何操作
        if (this.adLoadFailed) {
          return;
        }
        
        if (res && res.isEnded) {
          // 用户完整观看了广告，调用后端接口发放奖励
          this.callWatchAdApi();
        } else {
          // 用户中途退出，不发放奖励
          wx.showToast({
            title: '请完整观看广告才能获得奖励',
            icon: 'none'
          });
        }
      });
    } else {
      console.warn('当前环境不支持激励视频广告');
    }
  },

  /*** 观看广告增加物品限制   */
  onWatchAd() {
    if (!this.videoAd) {
      wx.showToast({
        title: '广告功能暂不可用',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '观看广告',
      content: '观看完整广告后可增加30个物品存储额度，是否继续？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '观看广告',
      success: (res) => {
        if (res.confirm) {
          this.showRewardedVideoAd();
        }
      }
    });
  },

  /*** 显示激励视频广告   */
  showRewardedVideoAd() {
    if (!this.videoAd) {
      wx.showToast({
        title: '广告功能暂不可用',
        icon: 'none'
      });
      return;
    }

    // 重置广告加载失败标记
    this.adLoadFailed = false;
    this.adErrorCode = null;

    // 显示广告
    this.videoAd.show().catch(() => {
      // 失败重试
      this.videoAd.load()
        .then(() => {
          // 检查是否在加载过程中出现错误
          if (this.adLoadFailed) {
            let errorMessage = '广告加载失败，请稍后重试';
            if (this.adErrorCode === 1004) {
              errorMessage = '暂无可用广告，请稍后再试';
            }
            wx.showToast({
              title: errorMessage,
              icon: 'none'
            });
            return;
          }
          return this.videoAd.show();
        })
        .catch(err => {
          console.error('激励视频广告显示失败', err);
          wx.showToast({
            title: '广告显示失败，请稍后重试',
            icon: 'none'
          });
        });
    });
  },

  /*** 调用观看广告接口   */
  async callWatchAdApi() {
    try {
      wx.showLoading({
        title: '正在发放奖励...',
        mask: true
      });

      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;

      if (!openid) {
        throw new Error('用户未登录');
      }

      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${baseUrl}v0/user/watch_ad`,
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          data: {
            openid: openid
          },
          success: (res) => {
            console.log('观看广告接口响应:', res);
            if (res.statusCode === 200 && res.data) {
              resolve(res.data);
            } else {
              reject(new Error(`接口请求失败: ${res.statusCode}`));
            }
          },
          fail: (error) => {
            console.error('观看广告接口请求失败:', error);
            reject(error);
          }
        });
      });

      wx.hideLoading();

      if (response.status === 'success') {
        // 更新本地数据
        const newItemLimit = response.data.user_info.item_limit;
        const reward = response.data.reward;
        
        this.setData({
          itemLimit: newItemLimit
        });

        // 显示奖励信息
        wx.showModal({
          title: '恭喜获得奖励！',
          content: reward.description || `恭喜您获得${reward.item_limit_increase}个物品存储额度！`,
          showCancel: false,
          confirmText: '太棒了'
        });

        // 刷新页面数据
        await this.loadBoxes();
      } else {
        throw new Error(response.message || '奖励发放失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('观看广告奖励发放失败:', error);
      wx.showToast({
        title: error.message || '奖励发放失败，请重试',
        icon: 'none'
      });
    }
  },

  /*** 批量导入   */
  onBatchImport() {
    // 检查是否有箱子
    if (this.data.boxes.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先创建一个储物箱，然后再进行相册导入',
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

    // 设置为相册导入模式并显示箱子选择浮层
    this.setData({
      quickScanMode: true, // 复用快速拍照的模式标识
      showBoxSelector: true,
      selectorBoxes: this.data.boxes,
      isAlbumImport: true // 标识为相册导入模式
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