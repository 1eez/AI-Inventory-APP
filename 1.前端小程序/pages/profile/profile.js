// packageProfile/pages/profile/profile.js
const app = getApp();

Page({
  data: {
    // 用户信息
    userInfo: {},
    hasUserInfo: false,
    
    // 应用设置选项
    settingsOptions: [
      {
        id: 'update',
        title: '系统更新',
        subtitle: '检查应用更新',
        icon: 'cuIcon-refresh',
        color: '#667eea'
      },
      {
        id: 'about',
        title: '关于',
        subtitle: '版本信息',
        icon: 'cuIcon-info',
        color: '#43e97b'
      },
      {
        id: 'contact',
        title: '联系客服',
        subtitle: '获取帮助支持',
        icon: 'cuIcon-message',
        color: '#4facfe'
      }
    ],
    
    // 其他选项
    otherOptions: [
      {
        id: 'privacy',
        title: '隐私政策',
        subtitle: '了解隐私保护',
        icon: 'cuIcon-lock',
        color: '#fa709a'
      },
      {
        id: 'help',
        title: '使用帮助',
        subtitle: '使用指南和常见问题',
        icon: 'cuIcon-question',
        color: '#ffecd2'
      }
    ],
    
    // 加载状态
    loading: true,
    skeletonLoading: true
  },

  onLoad() {
    console.log('个人资料页加载');
    
    // 等待系统准备就绪
    this.waitForSystemReady();
  },

  onShow() {
    // 页面显示时刷新数据
    if (!this.data.loading) {
      this.loadUserData();
    }
  },

  // 等待系统准备就绪
  waitForSystemReady() {
    if (app.globalData.systemReady) {
      this.initPage();
    } else {
      app.registerSystemReadyCallback(() => {
        this.initPage();
      });
    }
  },

  // 初始化页面
  async initPage() {
    try {
      await this.loadUserData();
      
      this.setData({
        loading: false,
        skeletonLoading: false
      });
    } catch (error) {
      console.error('初始化个人资料页失败:', error);
      this.handleError('加载失败，请重试');
    }
  },

  // 加载用户数据
  async loadUserData() {
    try {
      // 获取用户信息
      const userInfo = app.globalData.userInfo || {};
      
      this.setData({
        userInfo,
        hasUserInfo: Object.keys(userInfo).length > 0
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
      throw error;
    }
  },



  // 错误处理
  handleError(message) {
    this.setData({
      loading: false,
      skeletonLoading: false
    });
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  // 获取用户信息
  onGetUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res.userInfo);
        
        // 保存用户信息
        app.globalData.userInfo = res.userInfo;
        
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // TODO: 上传用户信息到服务器
        this.uploadUserInfo(res.userInfo);
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 上传用户信息
  async uploadUserInfo(userInfo) {
    try {
      // TODO: 调用API上传用户信息
      console.log('上传用户信息:', userInfo);
    } catch (error) {
      console.error('上传用户信息失败:', error);
    }
  },

  // 设置选项点击
  onSettingTap(e) {
    const optionId = e.currentTarget.dataset.id;
    console.log('点击设置选项:', optionId);
    
    switch (optionId) {
      case 'update':
        this.handleUpdate();
        break;
      case 'about':
        this.handleAbout();
        break;
      case 'contact':
        this.handleContact();
        break;
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  },

  // 其他选项点击
  onOtherTap(e) {
    const optionId = e.currentTarget.dataset.id;
    console.log('点击其他选项:', optionId);
    
    switch (optionId) {
      case 'privacy':
        this.handlePrivacy();
        break;
      case 'help':
        this.handleHelp();
        break;
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  },

  // 系统更新
  handleUpdate() {
    wx.showLoading({
      title: '检查更新中...'
    });
    
    // TODO: 实现检查更新逻辑
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '检查更新',
        content: '当前已是最新版本',
        showCancel: false,
        confirmText: '知道了'
      });
    }, 1500);
  },

  // 联系客服
  handleContact() {
    wx.showModal({
      title: '联系客服',
      content: '客服邮箱：cnPro@163.com',
      showCancel: true,
      cancelText: '取消',
      confirmText: '复制邮箱',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'cnPro@163.com',
            success: () => {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 关于我们
  handleAbout() {
    wx.navigateTo({
      url: '/packageProfile/pages/about/about'
    });
  },

  // 隐私政策
  handlePrivacy() {
    wx.navigateTo({
      url: '/packageProfile/pages/privacy/privacy'
    });
  },

  // 使用帮助
  handleHelp() {
    wx.navigateTo({
      url: '/packageProfile/pages/help/help'
    });
  },



  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新个人资料');
    
    this.loadUserData().then(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
    }).catch((error) => {
      console.error('刷新失败:', error);
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '个人物品管理系统',
      path: '/pages/home/home',
      imageUrl: '/images/share-app.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '个人物品管理系统 - 智能收纳助手',
      imageUrl: '/images/share-app.png'
    };
  }
});