// packageProfile/pages/about/about.js

/**
 * 关于页面
 * 显示应用的详细信息、版本历史、开发团队等
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 应用信息
    appInfo: {
      name: '智能物品管理',
      version: '1.0.0',
      buildNumber: '20250718',
      releaseDate: '2025-07-18',
      description: '一款个人物品收纳整理应用，帮助您轻松管理和查找物品。'
    },
    
    // 开发团队
    teamInfo: {
      company: 'Lordli',
      website: 'https://lordli.com/',
      email: 'cnPro@163.com'
    },
    
    // 功能特性
    features: [
      {
        icon: 'cuIcon-scan',
        title: '智能扫描',
        description: '支持图像识别，快速录入物品信息'
      },
      {
        icon: 'cuIcon-search',
        title: '快速搜索',
        description: '多维度搜索，快速定位物品位置'
      },
      {
        icon: 'cuIcon-location',
        title: '位置管理',
        description: '分层级管理存储位置，清晰的物品归属'
      },
      {
        icon: 'cuIcon-circle',
        title: '云端同步',
        description: '数据云端备份，多设备同步访问'
      },
      {
        icon: 'cuIcon-share',
        title: '分享协作',
        description: '支持家庭成员共享，协作管理物品'
      },
      {
        icon: 'cuIcon-notification',
        title: '智能提醒',
        description: '物品到期提醒，位置变更通知'
      }
    ],
    
    // 版本历史
    versionHistory: [
      {
        version: '1.0.0',
        date: '2025-07-27',
        changes: [
          '首次发布',
          '基础物品管理功能',
          '扫描识别功能',
          '搜索和分类功能'
        ]
      },
      {
        version: '0.9.0',
        date: '2025-7-15',
        changes: [
          'Beta版本发布',
          '核心功能测试',
          '用户界面优化',
          '性能提升'
        ]
      }
    ],
    
    // 技术栈
    techStack: [
      { name: '微信小程序', description: '前端框架' },
      { name: 'ColorUI', description: 'UI组件库' },
      { name: 'Node.js', description: '后端服务' },
      { name: 'MongoDB', description: '数据存储' },
      { name: 'AI识别', description: '图像识别技术' }
    ],
    
    // 许可证信息
    licenseInfo: {
      type: 'MIT License',
      year: '2025',
      holder: 'Lordli'
    },
    
    // 第三方库
    thirdPartyLibs: [
      { name: 'ColorUI', version: '2.1.6', license: 'MIT' },
      { name: 'WeUI', version: '2.5.11', license: 'MIT' },
      { name: 'Lodash', version: '4.17.21', license: 'MIT' }
    ],
    
    // 统计信息
    statistics: {
      downloads: '10,000',
      users: '5,000',
      rating: 4.8,
      reviews: 1250
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('关于页面加载', options);
    
    // 加载应用统计信息
    this.loadAppStatistics();
  },

  /**
   * 加载应用统计信息
   */
  async loadAppStatistics() {
    try {
      // 模拟获取统计数据
      const statistics = {
        downloads: '12,500+',
        users: '6,800+',
        rating: 4.9,
        reviews: 1456
      };
      
      this.setData({ statistics });
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  },

  /**
   * 访问官网
   */
  onVisitWebsite() {
    wx.setClipboardData({
      data: this.data.teamInfo.website,
      success: () => {
        wx.showToast({
          title: '网址已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 联系邮箱
   */
  onContactEmail() {
    wx.setClipboardData({
      data: this.data.teamInfo.email,
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 拨打电话
   */
  onCallPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.teamInfo.phone,
      fail: () => {
        wx.setClipboardData({
          data: this.data.teamInfo.phone,
          success: () => {
            wx.showToast({
              title: '电话已复制',
              icon: 'success'
            });
          }
        });
      }
    });
  },

  /**
   * 查看许可证
   */
  onViewLicense() {
    const { type, year, holder } = this.data.licenseInfo;
    wx.showModal({
      title: '许可证信息',
      content: `${type}\n\nCopyright (c) ${year} ${holder}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software...`,
      showCancel: false,
      confirmText: '确定'
    });
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacyPolicy() {
    wx.navigateTo({
      url: '/packageProfile/pages/privacy/privacy'
    });
  },

  /**
   * 查看用户协议
   */
  onViewUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '使用本应用即表示您同意我们的用户协议。请合理使用应用功能，遵守相关法律法规。详细条款请访问官网查看。',
      showCancel: false,
      confirmText: '确定'
    });
  },

  /**
   * 检查更新
   */
  onCheckUpdate() {
    wx.showLoading({ title: '检查中...' });
    
    // 模拟检查更新
    setTimeout(() => {
      wx.hideLoading();
      
      const hasUpdate = Math.random() > 0.7;
      
      if (hasUpdate) {
        wx.showModal({
          title: '发现新版本',
          content: '发现新版本 v1.1.0，包含以下更新：\n• 新增批量操作功能\n• 优化搜索性能\n• 修复已知问题\n\n是否立即更新？',
          success: (res) => {
            if (res.confirm) {
              wx.showToast({
                title: '开始下载更新',
                icon: 'success'
              });
            }
          }
        });
      } else {
        wx.showToast({
          title: '已是最新版本',
          icon: 'success'
        });
      }
    }, 1500);
  },

  /**
   * 意见反馈
   */
  onFeedback() {
    wx.showActionSheet({
      itemList: ['问题反馈', '功能建议', '使用咨询'],
      success: (res) => {
        const types = ['问题反馈', '功能建议', '使用咨询'];
        const type = types[res.tapIndex];
        
        wx.showToast({
          title: `正在打开${type}`,
          icon: 'success'
        });
      }
    });
  },

  /**
   * 评分应用
   */
  onRateApp() {
    wx.showModal({
      title: '应用评分',
      content: '如果您觉得这个应用不错，请给我们一个好评，这将是对我们最大的鼓励！',
      confirmText: '去评分',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '感谢您的支持',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 分享应用
   */
  onShareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 复制版本信息
   */
  onCopyVersionInfo() {
    const { name, version, buildNumber } = this.data.appInfo;
    const versionText = `${name} v${version} (${buildNumber})`;
    
    wx.setClipboardData({
      data: versionText,
      success: () => {
        wx.showToast({
          title: '版本信息已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 查看开源项目
   */
  onViewOpenSource() {
    wx.showModal({
      title: '开源项目',
      content: '本项目部分代码已开源，欢迎开发者参与贡献。GitHub地址已复制到剪贴板。',
      showCancel: false,
      success: () => {
        wx.setClipboardData({
          data: 'https://github.com/1eez/AI-Inventory-APP'
        });
      }
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '智能物品管理 - 让收纳更简单',
      path: '/packageProfile/pages/about/about',
      imageUrl: '/images/share-cover.png'
    };
  }
});