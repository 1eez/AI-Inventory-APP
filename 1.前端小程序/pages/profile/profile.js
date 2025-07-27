// packageProfile/pages/profile/profile.js
const app = getApp();

Page({
  data: {
    // 用户信息
    userInfo: {},
    
    // 昵称编辑相关
    editingNickname: false,
    editNickname: '',
    
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
      // 先尝试从全局数据获取
      let userInfo = app.globalData.userInfo || {};
      
      // 如果全局数据中没有用户信息，则从首页数据中获取
      if (!userInfo.nickname && app.globalData.userHomeData && app.globalData.userHomeData.data && app.globalData.userHomeData.data.user_info) {
        userInfo = app.globalData.userHomeData.data.user_info;
        // 更新全局数据
        app.globalData.userInfo = userInfo;
      }
      
      // 如果仍然没有用户信息，则直接调用接口获取
      if (!userInfo.nickname) {
        const homeData = await this.fetchUserHomeData();
        if (homeData && homeData.data && homeData.data.user_info) {
          userInfo = homeData.data.user_info;
          // 更新全局数据
          app.globalData.userInfo = userInfo;
          app.globalData.userHomeData = homeData;
        }
      }
      
      this.setData({
        userInfo
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
      throw error;
    }
  },

  // 获取用户首页数据
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



  // 开始编辑昵称
  startEditNickname() {
    const currentNickname = this.data.userInfo.nickname || '';
    this.setData({
      editingNickname: true,
      editNickname: currentNickname
    });
  },

  // 昵称输入事件
  onNicknameInput(e) {
    this.setData({
      editNickname: e.detail.value
    });
  },

  // 取消编辑昵称
  cancelEditNickname() {
    this.setData({
      editingNickname: false,
      editNickname: ''
    });
  },

  // 确认编辑昵称
  async confirmEditNickname() {
    const nickname = this.data.editNickname.trim();
    
    if (!nickname) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }

    if (nickname.length > 20) {
      wx.showToast({
        title: '昵称不能超过20个字符',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '保存中...'
      });

      // 调用后台接口修改昵称
      await this.updateNickname(nickname);
      
      // 更新本地数据
      const updatedUserInfo = {
        ...this.data.userInfo,
        nickname: nickname
      };
      
      this.setData({
        userInfo: updatedUserInfo,
        editingNickname: false,
        editNickname: ''
      });
      
      // 更新全局数据
      app.globalData.userInfo = updatedUserInfo;
      
      wx.hideLoading();
      wx.showToast({
        title: '昵称修改成功',
        icon: 'success'
      });
      
    } catch (error) {
      wx.hideLoading();
      console.error('修改昵称失败:', error);
      wx.showToast({
        title: error.message || '修改失败，请重试',
        icon: 'none'
      });
    }
  },

  // 调用后台接口修改昵称
  async updateNickname(nickname) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.baseUrl + 'v0/user/edit_nickname',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          openid: app.globalData.openid,
          nickname: nickname
        },
        success: (res) => {
          console.log('修改昵称接口响应:', res);
          
          if (res.statusCode === 200 && res.data && res.data.status === 'success') {
            resolve(res.data);
          } else {
            reject(new Error(res.data?.message || '修改昵称失败'));
          }
        },
        fail: (error) => {
          console.error('请求修改昵称接口失败:', error);
          reject(new Error('网络请求失败'));
        }
      });
    });
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