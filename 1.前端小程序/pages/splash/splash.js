// pages/splash/splash.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loadingText: '正在初始化...',
    progress: 0,
    showError: false,
    errorMessage: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('启动页加载');
    this.startInitialization();
  },

  /**
   * 开始初始化流程
   */
  async startInitialization() {
    try {
      // 步骤1: 检查系统环境
      this.updateProgress('检查系统环境...', 20);
      await this.checkSystemEnvironment();
      
      // 步骤2: 获取用户授权
      this.updateProgress('获取用户授权...', 40);
      await this.getUserAuthorization();
      
      // 步骤3: 初始化用户数据
      this.updateProgress('初始化用户数据...', 60);
      await this.waitForSystemReady();
      
      // 步骤4: 预加载资源
      this.updateProgress('预加载资源...', 80);
      await this.preloadResources();
      
      // 步骤5: 完成初始化
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

  /**
   * 更新进度
   */
  updateProgress(text, progress) {
    this.setData({
      loadingText: text,
      progress: progress
    });
  },

  /**
   * 检查系统环境
   */
  checkSystemEnvironment() {
    return new Promise((resolve, reject) => {
      // 检查微信版本
      const systemInfo = wx.getSystemInfoSync();
      const version = systemInfo.version;
      
      // 检查基础库版本
      const SDKVersion = systemInfo.SDKVersion;
      
      console.log('微信版本:', version);
      console.log('基础库版本:', SDKVersion);
      
      // 模拟检查延迟
      setTimeout(() => {
        resolve();
      }, 800);
    });
  },

  /**
   * 获取用户授权
   */
  getUserAuthorization() {
    return new Promise((resolve, reject) => {
      // 检查是否已经授权
      wx.getSetting({
        success: (res) => {
          console.log('用户授权状态:', res.authSetting);
          
          // 这里可以根据需要请求特定权限
          // 比如相机权限、相册权限等
          
          setTimeout(() => {
            resolve();
          }, 600);
        },
        fail: (error) => {
          console.error('获取授权状态失败:', error);
          reject(error);
        }
      });
    });
  },

  /**
   * 等待系统就绪
   */
  waitForSystemReady() {
    return new Promise((resolve, reject) => {
      const checkReady = () => {
        if (app.globalData.systemReady) {
          resolve();
        } else {
          // 注册回调等待系统就绪
          app.onSystemReady(() => {
            resolve();
          });
        }
      };
      
      // 设置超时保护
      const timeout = setTimeout(() => {
        reject(new Error('系统初始化超时'));
      }, 10000); // 10秒超时
      
      checkReady();
      
      // 清除超时
      resolve = ((originalResolve) => {
        return (...args) => {
          clearTimeout(timeout);
          originalResolve(...args);
        };
      })(resolve);
    });
  },

  /**
   * 预加载资源
   */
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

  /**
   * 处理初始化错误
   */
  handleInitializationError(error) {
    this.setData({
      showError: true,
      errorMessage: error.message || '初始化失败，请重试'
    });
  },

  /**
   * 重试初始化
   */
  onRetry() {
    this.setData({
      showError: false,
      errorMessage: '',
      progress: 0,
      loadingText: '正在重新初始化...'
    });
    
    this.startInitialization();
  },

  /**
   * 跳转到首页
   */
  navigateToHome() {
    wx.reLaunch({
      url: '/pages/home/home'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示
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
  }
});