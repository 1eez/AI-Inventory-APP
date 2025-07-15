// app.js
App({
  /**
   * 全局数据
   */
  globalData: {
    openid: '',
    userInfo: null,
    systemReady: false,
    userDataReady: false,
    // 后台接口基础URL
    baseUrl: 'https://prd.shouna.nidele.com/',
    // 系统信息
    StatusBar: 0,
    CustomBar: 0,
    Custom: null,
    sysNavBar: 0
  },

  /**
   * 小程序启动时触发
   */
  async onLaunch() {
    console.log('小程序启动');
    
    try {
      // 1. 获取系统信息
      await this.getSystemInfo();
      
      // 2. 获取用户openid
      await this.getOpenId();
      
      // 3. 预加载用户基础数据
      await this.preloadUserData();
      
      // 4. 标记系统就绪
      this.globalData.systemReady = true;
      
      // 5. 通知所有等待的页面
      this.notifyPagesReady();
      
      console.log('系统初始化完成');
    } catch (error) {
      console.error('系统初始化失败:', error);
      this.handleInitError(error);
    }
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    return new Promise((resolve) => {
      // 使用新的 API 替代已废弃的 wx.getSystemInfo
      try {
        // 获取窗口信息（基础库 2.20.1 开始支持）
        const windowInfo = wx.getWindowInfo();
        this.globalData.StatusBar = windowInfo.statusBarHeight;
        this.globalData.CustomBar = windowInfo.statusBarHeight + 45;
        
        // 获取设备信息以判断平台
        const deviceInfo = wx.getDeviceInfo();
        if (deviceInfo.platform === 'android') {
          this.globalData.CustomBar = windowInfo.statusBarHeight + 50;
        }
        
        // 获取胶囊按钮位置信息
        const custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;
        this.globalData.CustomBar = custom.bottom + custom.top - windowInfo.statusBarHeight;
        
        resolve(windowInfo);
      } catch (error) {
        // 兼容低版本基础库，降级使用 wx.getSystemInfo
        wx.getSystemInfo({
          success: (res) => {
            this.globalData.StatusBar = res.statusBarHeight;
            this.globalData.CustomBar = res.statusBarHeight + 45;
            
            if (res.platform === 'android') {
              this.globalData.CustomBar = res.statusBarHeight + 50;
            }
            
            // 获取胶囊按钮位置信息
            const custom = wx.getMenuButtonBoundingClientRect();
            this.globalData.Custom = custom;
            this.globalData.CustomBar = custom.bottom + custom.top - res.statusBarHeight;
            
            resolve(res);
          },
          fail: () => {
            resolve({});
          }
        });
      }
    });
  },

  /**
   * 获取用户openid
   */
  async getOpenId() {
    return new Promise((resolve, reject) => {
      // 先检查本地存储
      const localOpenId = wx.getStorageSync('openid');
      if (localOpenId) {
        console.log('从本地存储获取到openid:', localOpenId);
        this.globalData.openid = localOpenId;
        resolve(localOpenId);
        return;
      }

      //console.log('开始获取微信登录code');
      // 登录获取code
      wx.login({
        success: (res) => {
          if (res.code) {
            //console.log('获取到微信登录code:', res.code);
            // 发送code到后台换取openid
            this.exchangeOpenId(res.code)
              .then((openid) => {
                //console.log('成功获取到openid:', openid);
                this.globalData.openid = openid;
                // 保存到本地存储
                wx.setStorageSync('openid', openid);
                resolve(openid);
              })
              .catch((error) => {
                console.error('获取openid失败:', error);
                reject(error);
              });
          } else {
            console.error('微信登录失败，未获取到code');
            reject(new Error('登录失败'));
          }
        },
        fail: (error) => {
          console.error('微信登录调用失败:', error);
          reject(error);
        }
      });
    });
  },

  /**
   * 向后台发送code换取openid
   */
  exchangeOpenId(code) {
    return new Promise((resolve, reject) => {
      //console.log('向后台发送登录请求，code:', code);
      
      wx.request({
        url: this.globalData.baseUrl + 'auth/login',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          code: code
        },
        success: (res) => {
          //console.log('后台登录接口响应:', res);
          
          if (res.statusCode === 200 && res.data && res.data.openid) {
            console.log('成功从后台获取openid:', res.data.openid);
            resolve(res.data.openid);
          } else {
            console.error('后台返回数据格式错误或无openid:', res.data);
            reject(new Error('获取openid失败: ' + JSON.stringify(res.data)));
          }
        },
        fail: (error) => {
          console.error('请求后台登录接口失败:', error);
          reject(error);
        }
      });
    });
  },

  /**
   * 预加载用户基础数据
   */
  async preloadUserData() {
    try {
      // TODO: 加载用户的箱子列表等基础数据
      // const userData = await this.loadUserBasicData();
      // this.globalData.userInfo = userData;
      this.globalData.userDataReady = true;
    } catch (error) {
      console.error('预加载用户数据失败:', error);
      // 即使预加载失败，也不阻止系统启动
      this.globalData.userDataReady = false;
    }
  },

  /**
   * 通知页面系统就绪
   */
  notifyPagesReady() {
    // 通过事件总线通知所有页面
    if (this.systemReadyCallbacks) {
      this.systemReadyCallbacks.forEach(callback => {
        if (typeof callback === 'function') {
          callback();
        }
      });
      this.systemReadyCallbacks = [];
    }
  },

  /**
   * 注册系统就绪回调
   */
  onSystemReady(callback) {
    if (this.globalData.systemReady) {
      callback();
    } else {
      if (!this.systemReadyCallbacks) {
        this.systemReadyCallbacks = [];
      }
      this.systemReadyCallbacks.push(callback);
    }
  },

  /**
   * 处理初始化错误
   */
  handleInitError(error) {
    console.error('系统初始化错误:', error);
    
    // 显示错误提示
    wx.showModal({
      title: '初始化失败',
      content: '系统初始化失败，请检查网络连接后重试',
      showCancel: false,
      confirmText: '重试',
      success: () => {
        // 重新启动初始化流程
        this.onLaunch();
      }
    });
  },

  /**
   * 小程序显示时触发
   */
  onShow() {

  },

  /**
   * 小程序隐藏时触发
   */
  onHide() {
    console.log('小程序隐藏');
  }
});