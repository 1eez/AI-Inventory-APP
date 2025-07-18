// packageProfile/pages/profile/profile.js
const app = getApp();

Page({
  data: {
    // 用户信息
    userInfo: {},
    hasUserInfo: false,
    
    // 统计数据
    statistics: {
      totalBoxes: 0,
      totalBags: 0,
      totalItems: 0,
      totalValue: 0
    },
    
    // 最近活动
    recentActivities: [],
    
    // 设置选项
    settingsOptions: [
      {
        id: 'backup',
        title: '数据备份',
        subtitle: '备份到云端',
        icon: 'cuIcon-upload',
        color: '#667eea'
      },
      {
        id: 'export',
        title: '数据导出',
        subtitle: '导出为Excel',
        icon: 'cuIcon-down',
        color: '#f093fb'
      }
    ],
    
    // 其他选项
    otherOptions: [
      {
        id: 'settings',
        title: '应用设置',
        subtitle: '通知、隐私、显示等设置',
        icon: 'cuIcon-settings',
        color: '#667eea'
      },
      {
        id: 'feedback',
        title: '意见反馈',
        subtitle: '帮助我们改进',
        icon: 'cuIcon-message',
        color: '#4facfe'
      },
      {
        id: 'about',
        title: '关于我们',
        subtitle: '版本信息',
        icon: 'cuIcon-info',
        color: '#43e97b'
      },
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
        subtitle: '常见问题',
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
      
      // TODO: 替换为真实API调用
      const [statistics, activities] = await Promise.all([
        this.mockGetStatistics(),
        this.mockGetRecentActivities()
      ]);
      
      this.setData({
        userInfo,
        hasUserInfo: Object.keys(userInfo).length > 0,
        statistics,
        recentActivities: activities
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
      throw error;
    }
  },

  // 模拟获取统计数据
  mockGetStatistics() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalBoxes: 8,
          totalBags: 25,
          totalItems: 156,
          totalValue: 12580
        });
      }, 800);
    });
  },

  // 模拟获取最近活动
  mockGetRecentActivities() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            type: 'add_item',
            title: '添加了新物品',
            description: '在"充电器袋"中添加了"iPhone 充电器"',
            time: '2小时前',
            icon: 'cuIcon-add',
            color: '#667eea'
          },
          {
            id: '2',
            type: 'create_bag',
            title: '创建了新袋子',
            description: '在"电子设备箱"中创建了"耳机袋"',
            time: '1天前',
            icon: 'cuIcon-goods',
            color: '#764ba2'
          },
          {
            id: '3',
            type: 'move_item',
            title: '移动了物品',
            description: '将"蓝牙鼠标"从"办公用品袋"移动到"电脑配件袋"',
            time: '2天前',
            icon: 'cuIcon-move',
            color: '#f093fb'
          },
          {
            id: '4',
            type: 'scan_item',
            title: '扫描识别物品',
            description: '通过拍照识别添加了"护手霜"',
            time: '3天前',
            icon: 'cuIcon-camera',
            color: '#4facfe'
          }
        ]);
      }, 1000);
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
      case 'backup':
        this.handleBackup();
        break;
      case 'sync':
        this.handleSync();
        break;
      case 'export':
        this.handleExport();
        break;
      case 'import':
        this.handleImport();
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
      case 'settings':
        this.handleSettings();
        break;
      case 'feedback':
        this.handleFeedback();
        break;
      case 'about':
        this.handleAbout();
        break;
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

  // 数据备份
  handleBackup() {
    wx.showLoading({
      title: '备份中...'
    });
    
    // TODO: 实现数据备份逻辑
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '备份成功',
        icon: 'success'
      });
    }, 2000);
  },

  // 数据同步
  handleSync() {
    wx.showLoading({
      title: '同步中...'
    });
    
    // TODO: 实现数据同步逻辑
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '同步成功',
        icon: 'success'
      });
    }, 2000);
  },

  // 数据导出
  handleExport() {
    wx.showActionSheet({
      itemList: ['导出为Excel', '导出为CSV', '导出为JSON'],
      success: (res) => {
        const formats = ['Excel', 'CSV', 'JSON'];
        const format = formats[res.tapIndex];
        
        wx.showLoading({
          title: `导出${format}中...`
        });
        
        // TODO: 实现数据导出逻辑
        setTimeout(() => {
          wx.hideLoading();
          wx.showToast({
            title: `${format}导出成功`,
            icon: 'success'
          });
        }, 2000);
      }
    });
  },

  // 数据导入
  handleImport() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        console.log('选择的文件:', file);
        
        wx.showLoading({
          title: '导入中...'
        });
        
        // TODO: 实现数据导入逻辑
        setTimeout(() => {
          wx.hideLoading();
          wx.showToast({
            title: '导入成功',
            icon: 'success'
          });
        }, 2000);
      },
      fail: (error) => {
        console.error('选择文件失败:', error);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  },

  // 应用设置
  handleSettings() {
    wx.navigateTo({
      url: '/packageProfile/pages/settings/settings'
    });
  },

  // 意见反馈
  handleFeedback() {
    // TODO: 跳转到意见反馈页面
    wx.showToast({
      title: '意见反馈功能开发中',
      icon: 'none'
    });
  },

  // 关于我们
  handleAbout() {
    wx.showModal({
      title: '关于我们',
      content: '个人物品管理系统\n版本：1.0.0\n\n一个智能的个人物品收纳管理工具，帮助您更好地整理和管理个人物品。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 隐私政策
  handlePrivacy() {
    // TODO: 跳转到隐私政策页面
    wx.showToast({
      title: '隐私政策页面开发中',
      icon: 'none'
    });
  },

  // 使用帮助
  handleHelp() {
    // TODO: 跳转到帮助页面
    wx.showToast({
      title: '帮助页面开发中',
      icon: 'none'
    });
  },

  // 查看统计详情
  onStatisticTap(e) {
    const type = e.currentTarget.dataset.type;
    console.log('查看统计详情:', type);
    
    // TODO: 跳转到对应的统计详情页面
    wx.showToast({
      title: '统计详情页面开发中',
      icon: 'none'
    });
  },

  // 查看更多活动
  onViewMoreActivities() {
    // TODO: 跳转到活动历史页面
    wx.showToast({
      title: '活动历史页面开发中',
      icon: 'none'
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