// pages/splash/splash.js
const app = getApp();

Page({
  /*** 页面的初始数据   */
  data: {
    loadingText: '正在初始化...',
    progress: 0,
    showError: false,
    errorMessage: ''
  },

  /*** 生命周期函数--监听页面加载   */
  onLoad(options) {
    console.log('启动页加载');
    this.startInitialization();
  },

  /*** 开始初始化流程   */
  async startInitialization() {
    try {
      // 步骤1: 检查系统环境
      this.updateProgress('检查系统环境...', 25);
      await this.checkSystemEnvironment();
      
      // 步骤2: 初始化用户数据
      this.updateProgress('初始化用户数据...', 50);
      await this.initializeUserData();
      
      // 步骤3: 预加载资源
      this.updateProgress('预加载资源...', 80);
      await this.preloadResources();
      
      // 步骤4: 完成初始化
      this.updateProgress('初始化完成', 100);
      
      // 延迟一下再跳转，让用户看到完成状态
      setTimeout(() => {
        this.navigateToHome();
      }, 500);
      
    } catch (error) {
      console.error('初始化失败:', error);
      this.handleInitializationError(error);
    }
  },

  /*** 更新进度   */
  updateProgress(text, progress) {
    this.setData({
      loadingText: text,
      progress: progress
    });
  },

  /*** 检查系统环境   */
  checkSystemEnvironment() {
    return new Promise((resolve, reject) => {
      // 使用新的API获取微信APP基础信息
      const appBaseInfo = wx.getAppBaseInfo();
      const version = appBaseInfo.version;
      const SDKVersion = appBaseInfo.SDKVersion;
      
      console.log('微信版本:', version);
      console.log('基础库版本:', SDKVersion);
      
      // 将主题、字体设置、语言信息保存到globalData
      app.globalData.theme = appBaseInfo.theme;
      app.globalData.fontSizeSetting = appBaseInfo.fontSizeSetting;
      app.globalData.language = appBaseInfo.language;
      
      console.log('主题:', appBaseInfo.theme);
      console.log('字体大小设置:', appBaseInfo.fontSizeSetting);
      console.log('语言:', appBaseInfo.language);
      
      // 模拟检查延迟
      setTimeout(() => {
        resolve();
      }, 800);
    });
  },

  /*** 初始化用户数据   */
  async initializeUserData() {
    try {
      // 等待获取openid
      let openid = app.globalData.openid;
      
      // 如果没有openid，等待获取
      if (!openid) {
        console.log('等待获取openid...');
        openid = await app.getOpenId();
      }
      //console.log('获取到openid:', openid);
      
      // 获取baseUrl
      const baseUrl = app.globalData.baseUrl;
      
      // 调用后台接口获取用户信息
      const userHomeData = await this.fetchUserHomeData(baseUrl, openid);
      
      // 将数据保存到全局数据中，供home页使用
      app.globalData.userHomeData = userHomeData;
      
      console.log('传给home页的数据:', userHomeData);
      
    } catch (error) {
      console.error('初始化用户数据失败:', error);
      throw error;
    }
  },

  /*** 获取用户首页数据   */
  fetchUserHomeData(baseUrl, openid) {
    return new Promise((resolve, reject) => {
      const url = `${baseUrl}v0/home/info?openid=${openid}`;
      
      wx.request({
        url: url,
        method: 'GET',
        success: (res) => {
          console.log('后台接口响应:', res);
          
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error(`接口请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('接口请求失败:', error);
          reject(error);
        }
      });
    });
  },

  /*** 预加载资源   */
  preloadResources() {
    return new Promise((resolve) => {
      // 预加载一些关键图片资源
      const imagesToPreload = [
        '/assets/icons/home.png',
        '/assets/icons/search.png',
        '/assets/icons/profile.png'
      ];
      
      let loadedCount = 0;
      const totalCount = imagesToPreload.length;
      
      if (totalCount === 0) {
        resolve();
        return;
      }
      
      imagesToPreload.forEach((imagePath) => {
        wx.getImageInfo({
          src: imagePath,
          success: () => {
            loadedCount++;
            if (loadedCount === totalCount) {
              resolve();
            }
          },
          fail: () => {
            // 即使某些图片加载失败，也继续
            loadedCount++;
            if (loadedCount === totalCount) {
              resolve();
            }
          }
        });
      });
      
      // 设置最大等待时间
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  },

  /*** 处理初始化错误   */
  handleInitializationError(error) {
    this.setData({
      showError: true,
      errorMessage: error.message || '初始化失败，请重试'
    });
  },

  /*** 重试初始化   */
  onRetry() {
    this.setData({
      showError: false,
      errorMessage: '',
      progress: 0,
      loadingText: '正在重新初始化...'
    });
    
    this.startInitialization();
  },

  /*** 跳转到首页   */
  navigateToHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    });
  },

});