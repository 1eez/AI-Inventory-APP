// packageCamera/pages/camera/camera.js

/**
 * 相机拍照页面
 * 用于拍照识别物品
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 相机上下文
    cameraContext: null,
    // 闪光灯状态
    flashEnabled: false,
    // 相机设备位置：front(前置) | back(后置)
    devicePosition: 'back',
    // 拍照结果
    photoResult: null,
    // 处理状态
    processing: false,
    // 识别结果
    recognitionResult: null,
    // 页面参数
    boxId: '',
    bagId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('相机页面加载', options);
    
    // 获取页面参数
    const boxId = options.box_id || '';
    const bagId = options.bag_id || '';
    
    this.setData({ 
      boxId,
      bagId
    });
    
    // 初始化相机
    this.initCamera();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 重新启动相机
    if (this.data.cameraContext) {
      this.data.cameraContext.startRecord();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 停止相机
    if (this.data.cameraContext) {
      this.data.cameraContext.stopRecord();
    }
  },

  /**
   * 初始化相机
   */
  initCamera() {
    const cameraContext = wx.createCameraContext();
    this.setData({ cameraContext });
  },

  /**
   * 相机初始化完成
   */
  onCameraReady() {
    console.log('相机初始化完成');
  },

  /**
   * 相机出错
   */
  onCameraError(e) {
    console.error('相机错误:', e.detail);
    wx.showModal({
      title: '相机错误',
      content: '无法启动相机，请检查权限设置',
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  },



  /**
   * 拍照
   */
  takePhoto() {
    if (this.data.processing) return;
    
    const { cameraContext } = this.data;
    if (!cameraContext) return;
    
    this.setData({ processing: true });
    
    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        console.log('拍照成功:', res.tempImagePath);
        this.setData({
          photoResult: res.tempImagePath
        });
        
        // 识别照片中的物品
        this.recognizePhoto(res.tempImagePath);
      },
      fail: (error) => {
        console.error('拍照失败:', error);
        wx.showToast({
          title: '拍照失败',
          icon: 'error'
        });
        this.setData({ processing: false });
      }
    });
  },

  /**
   * 识别照片
   */
  async recognizePhoto(imagePath) {
    try {
      wx.showLoading({ title: '识别中...' });
      
      // 模拟AI识别API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟识别结果
      const mockResult = {
        items: [
          {
            name: '苹果数据线',
            confidence: 0.95,
            category: '电子配件',
            description: '白色Lightning数据线'
          },
          {
            name: '充电器',
            confidence: 0.87,
            category: '电子配件',
            description: '苹果原装充电器'
          }
        ],
        suggestions: [
          '建议存放在电子设备收纳盒中',
          '可以添加"常用"标签便于查找'
        ]
      };
      
      this.setData({
        recognitionResult: mockResult,
        processing: false
      });
      
      wx.hideLoading();
      
      // 跳转到确认页面，传递box_id和bag_id参数
      const { boxId, bagId } = this.data;
      let url = `/packageCamera/pages/item-confirm/item-confirm?image=${encodeURIComponent(imagePath)}&result=${encodeURIComponent(JSON.stringify(mockResult))}`;
      
      if (boxId) {
        url += `&box_id=${boxId}`;
      }
      if (bagId) {
        url += `&bag_id=${bagId}`;
      }
      
      wx.navigateTo({ url });
      
    } catch (error) {
      console.error('识别失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '识别失败，请重试',
        icon: 'error'
      });
      this.setData({ processing: false });
    }
  },



  /**
   * 切换闪光灯
   */
  toggleFlash() {
    const flashEnabled = !this.data.flashEnabled;
    this.setData({ flashEnabled });
  },

  /**
   * 切换摄像头
   */
  switchCamera() {
    const devicePosition = this.data.devicePosition === 'back' ? 'front' : 'back';
    this.setData({ devicePosition });
  },



  /**
   * 重新拍照
   */
  retakePhoto() {
    this.setData({
      photoResult: null,
      recognitionResult: null,
      processing: false
    });
  },

  /**
   * 从相册选择
   */
  chooseFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const imagePath = res.tempFilePaths[0];
        this.setData({
          photoResult: imagePath
        });
        
        // 识别选择的图片
        this.recognizePhoto(imagePath);
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
      }
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '智能扫描 - 物品管理',
      path: '/packageCamera/pages/camera/camera'
    };
  }
});