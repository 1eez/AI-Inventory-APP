// packageCamera/pages/camera/camera.js

/**
 * 相机扫描页面
 * 用于扫描物品二维码或拍照识别物品
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 相机上下文
    cameraContext: null,
    // 扫描模式：scan(扫码) | photo(拍照)
    mode: 'scan',
    // 是否显示扫描框
    showScanFrame: true,
    // 闪光灯状态
    flashEnabled: false,
    // 相机设备位置：front(前置) | back(后置)
    devicePosition: 'back',
    // 扫描结果
    scanResult: null,
    // 拍照结果
    photoResult: null,
    // 处理状态
    processing: false,
    // 识别结果
    recognitionResult: null,
    // 操作提示
    tips: {
      scan: '将二维码放入框内进行扫描',
      photo: '对准物品拍照进行识别'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('相机页面加载', options);
    
    // 获取扫描模式
    const mode = options.mode || 'scan';
    this.setData({ mode });
    
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
   * 扫码成功
   */
  onScanCode(e) {
    if (this.data.processing) return;
    
    const result = e.detail.result;
    console.log('扫码结果:', result);
    
    this.setData({
      scanResult: result,
      processing: true
    });
    
    // 处理扫码结果
    this.processScanResult(result);
  },

  /**
   * 处理扫码结果
   */
  async processScanResult(result) {
    try {
      wx.showLoading({ title: '处理中...' });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 检查是否是物品二维码
      if (result.startsWith('ITEM_')) {
        // 物品二维码
        const itemId = result.replace('ITEM_', '');
        wx.hideLoading();
        
        wx.showModal({
          title: '扫码成功',
          content: '检测到物品二维码，是否查看物品详情？',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: `/packageStorage/pages/item-detail/item-detail?itemId=${itemId}`
              });
            } else {
              this.resetScan();
            }
          }
        });
      } else if (result.startsWith('BOX_')) {
        // 收纳盒二维码
        const boxId = result.replace('BOX_', '');
        wx.hideLoading();
        
        wx.showModal({
          title: '扫码成功',
          content: '检测到收纳盒二维码，是否查看收纳盒详情？',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: `/packageStorage/pages/box-detail/box-detail?boxId=${boxId}`
              });
            } else {
              this.resetScan();
            }
          }
        });
      } else {
        // 其他二维码
        wx.hideLoading();
        wx.showModal({
          title: '扫码结果',
          content: `扫描内容：${result}`,
          showCancel: false,
          success: () => {
            this.resetScan();
          }
        });
      }
      
    } catch (error) {
      console.error('处理扫码结果失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '处理失败，请重试',
        icon: 'error'
      });
      this.resetScan();
    }
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
      
      // 跳转到确认页面
      wx.navigateTo({
        url: `/packageCamera/pages/item-confirm/item-confirm?image=${encodeURIComponent(imagePath)}&result=${encodeURIComponent(JSON.stringify(mockResult))}`
      });
      
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
   * 切换模式
   */
  switchMode(e) {
    const { mode } = e.currentTarget.dataset;
    this.setData({ 
      mode,
      scanResult: null,
      photoResult: null,
      recognitionResult: null,
      processing: false
    });
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
   * 重置扫描
   */
  resetScan() {
    this.setData({
      scanResult: null,
      processing: false
    });
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