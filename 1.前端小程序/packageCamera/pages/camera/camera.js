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
    const boxName = decodeURIComponent(options.box_name || '');
    const boxColor = decodeURIComponent(options.box_color || '#1296db');
    const boxLocation = decodeURIComponent(options.box_location || '');
    const bagName = decodeURIComponent(options.bag_name || '');
    const bagColor = decodeURIComponent(options.bag_color || '#1296db');

    
    this.setData({ 
      boxId,
      bagId,
      boxName,
      boxColor,
      boxLocation,
      bagName,
      bagColor
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
      
      this.setData({
        recognitionResult,
        processing: false
      });
      
      wx.hideLoading();
      
      // 跳转到确认页面，传递完整的box和bag信息
      const { boxId, bagId, boxName, boxColor, boxLocation, bagName, bagColor } = this.data;
      const params = {
        image: encodeURIComponent(imagePath),
        result: encodeURIComponent(JSON.stringify(recognitionResult))
      };
      
      if (boxId) {
        params.box_id = boxId;
        params.box_name = encodeURIComponent(boxName || '');
        params.box_color = encodeURIComponent(boxColor || '#1296db');
        params.box_location = encodeURIComponent(boxLocation || '');
      }
      if (bagId) {
        params.bag_id = bagId;
        params.bag_name = encodeURIComponent(bagName || '');
        params.bag_color = encodeURIComponent(bagColor || '#1296db');

      }
      
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
      this.setData({ processing: false });
    }
  },

  /**
   * 上传图片到服务器
   */
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
              
              // 检查是否是物品数量限制错误（后台返回的数据结构是 {detail: {...}}）
              if (data.detail && data.detail.status === 'error' && data.detail.data && data.detail.data.need_watch_ad) {
                // 显示物品数量限制提示
                this.showItemLimitDialog(data.detail);
                reject(new Error('物品数量已达上限'));
                return;
              }
              
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
   * 显示物品数量限制对话框
   */
  showItemLimitDialog(errorData) {
    const { message, data } = errorData;
    const { current_item_count, item_limit } = data;
    
    wx.showModal({
      title: '存储空间不足',
      content: `${message}\n\n当前物品：${current_item_count || 0}/${item_limit || 0}\n\n观看广告可获得更多存储空间，将为您返回首页。`,
      showCancel: false,
      confirmText: '返回首页',
      success: (res) => {
        // 强制返回首页
        wx.switchTab({
          url: '/pages/home/home'
        });
      }
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

});