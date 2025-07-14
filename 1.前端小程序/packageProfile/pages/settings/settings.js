// packageProfile/pages/settings/settings.js

/**
 * 设置页面
 * 用户可以在此页面配置应用的各种设置选项
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户设置
    settings: {
      // 通知设置
      notifications: {
        enabled: true,
        itemReminder: true,
        locationAlert: false,
        systemUpdate: true
      },
      // 隐私设置
      privacy: {
        dataSync: true,
        locationAccess: false,
        cameraAccess: true,
        analyticsEnabled: false
      },
      // 显示设置
      display: {
        theme: 'auto', // auto, light, dark
        language: 'zh-CN',
        fontSize: 'medium', // small, medium, large
        gridView: true
      },
      // 功能设置
      features: {
        autoBackup: true,
        smartSuggestions: true,
        voiceInput: false,
        gestureControl: false
      }
    },
    // 主题选项
    themeOptions: [
      { value: 'auto', name: '跟随系统' },
      { value: 'light', name: '浅色模式' },
      { value: 'dark', name: '深色模式' }
    ],
    // 语言选项
    languageOptions: [
      { value: 'zh-CN', name: '简体中文' },
      { value: 'zh-TW', name: '繁体中文' },
      { value: 'en-US', name: 'English' }
    ],
    // 字体大小选项
    fontSizeOptions: [
      { value: 'small', name: '小' },
      { value: 'medium', name: '中' },
      { value: 'large', name: '大' }
    ],
    // 存储信息
    storageInfo: {
      used: 0,
      total: 0,
      items: 0,
      images: 0
    },
    // 版本信息
    versionInfo: {
      version: '1.0.0',
      buildNumber: '2024010101',
      updateTime: '2024-01-01'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('设置页面加载', options);
    
    // 加载用户设置
    this.loadUserSettings();
    
    // 加载存储信息
    this.loadStorageInfo();
  },

  /**
   * 加载用户设置
   */
  async loadUserSettings() {
    try {
      // 从本地存储加载设置
      const settings = wx.getStorageSync('userSettings');
      if (settings) {
        this.setData({
          settings: { ...this.data.settings, ...settings }
        });
      }
    } catch (error) {
      console.error('加载用户设置失败:', error);
    }
  },

  /**
   * 保存用户设置
   */
  async saveUserSettings() {
    try {
      wx.setStorageSync('userSettings', this.data.settings);
    } catch (error) {
      console.error('保存用户设置失败:', error);
    }
  },

  /**
   * 加载存储信息
   */
  async loadStorageInfo() {
    try {
      // 模拟获取存储信息
      const storageInfo = {
        used: 15.6, // MB
        total: 100, // MB
        items: 156,
        images: 89
      };
      
      this.setData({ storageInfo });
    } catch (error) {
      console.error('加载存储信息失败:', error);
    }
  },

  /**
   * 切换开关设置
   */
  onSwitchChange(e) {
    const { category, key } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`settings.${category}.${key}`]: value
    });
    
    // 保存设置
    this.saveUserSettings();
    
    // 特殊处理
    this.handleSpecialSettings(category, key, value);
  },

  /**
   * 处理特殊设置
   */
  handleSpecialSettings(category, key, value) {
    if (category === 'privacy' && key === 'locationAccess') {
      if (value) {
        // 请求位置权限
        wx.authorize({
          scope: 'scope.userLocation',
          success: () => {
            wx.showToast({
              title: '位置权限已开启',
              icon: 'success'
            });
          },
          fail: () => {
            this.setData({
              'settings.privacy.locationAccess': false
            });
            wx.showModal({
              title: '权限提示',
              content: '需要在设置中手动开启位置权限',
              showCancel: false
            });
          }
        });
      }
    } else if (category === 'privacy' && key === 'cameraAccess') {
      if (value) {
        // 请求相机权限
        wx.authorize({
          scope: 'scope.camera',
          success: () => {
            wx.showToast({
              title: '相机权限已开启',
              icon: 'success'
            });
          },
          fail: () => {
            this.setData({
              'settings.privacy.cameraAccess': false
            });
            wx.showModal({
              title: '权限提示',
              content: '需要在设置中手动开启相机权限',
              showCancel: false
            });
          }
        });
      }
    }
  },

  /**
   * 选择主题
   */
  onThemeChange(e) {
    const theme = this.data.themeOptions[e.detail.value].value;
    this.setData({
      'settings.display.theme': theme
    });
    this.saveUserSettings();
  },

  /**
   * 选择语言
   */
  onLanguageChange(e) {
    const language = this.data.languageOptions[e.detail.value].value;
    this.setData({
      'settings.display.language': language
    });
    this.saveUserSettings();
    
    wx.showToast({
      title: '语言设置已保存',
      icon: 'success'
    });
  },

  /**
   * 选择字体大小
   */
  onFontSizeChange(e) {
    const fontSize = this.data.fontSizeOptions[e.detail.value].value;
    this.setData({
      'settings.display.fontSize': fontSize
    });
    this.saveUserSettings();
  },

  /**
   * 清理缓存
   */
  onClearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理应用缓存吗？这将删除临时文件但不会影响您的数据。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清理中...' });
          
          // 模拟清理过程
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '缓存已清理',
              icon: 'success'
            });
            
            // 更新存储信息
            this.loadStorageInfo();
          }, 1500);
        }
      }
    });
  },

  /**
   * 数据备份
   */
  onBackupData() {
    wx.showLoading({ title: '备份中...' });
    
    // 模拟备份过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '备份完成',
        icon: 'success'
      });
    }, 2000);
  },

  /**
   * 数据恢复
   */
  onRestoreData() {
    wx.showModal({
      title: '数据恢复',
      content: '确定要从云端恢复数据吗？这将覆盖当前的本地数据。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '恢复中...' });
          
          // 模拟恢复过程
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '恢复完成',
              icon: 'success'
            });
          }, 2000);
        }
      }
    });
  },

  /**
   * 导出数据
   */
  onExportData() {
    wx.showActionSheet({
      itemList: ['导出为Excel', '导出为PDF', '导出为JSON'],
      success: (res) => {
        const formats = ['Excel', 'PDF', 'JSON'];
        const format = formats[res.tapIndex];
        
        wx.showLoading({ title: `导出${format}中...` });
        
        // 模拟导出过程
        setTimeout(() => {
          wx.hideLoading();
          wx.showToast({
            title: `${format}导出完成`,
            icon: 'success'
          });
        }, 1500);
      }
    });
  },

  /**
   * 重置设置
   */
  onResetSettings() {
    wx.showModal({
      title: '重置设置',
      content: '确定要重置所有设置为默认值吗？',
      success: (res) => {
        if (res.confirm) {
          // 重置为默认设置
          const defaultSettings = {
            notifications: {
              enabled: true,
              itemReminder: true,
              locationAlert: false,
              systemUpdate: true
            },
            privacy: {
              dataSync: true,
              locationAccess: false,
              cameraAccess: true,
              analyticsEnabled: false
            },
            display: {
              theme: 'auto',
              language: 'zh-CN',
              fontSize: 'medium',
              gridView: true
            },
            features: {
              autoBackup: true,
              smartSuggestions: true,
              voiceInput: false,
              gestureControl: false
            }
          };
          
          this.setData({ settings: defaultSettings });
          this.saveUserSettings();
          
          wx.showToast({
            title: '设置已重置',
            icon: 'success'
          });
        }
      }
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
      
      // 模拟有更新
      const hasUpdate = Math.random() > 0.5;
      
      if (hasUpdate) {
        wx.showModal({
          title: '发现新版本',
          content: '发现新版本 v1.1.0，是否立即更新？',
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
   * 查看关于页面
   */
  onViewAbout() {
    wx.navigateTo({
      url: '/packageProfile/pages/about/about'
    });
  },

  /**
   * 联系客服
   */
  onContactSupport() {
    wx.showActionSheet({
      itemList: ['在线客服', '电话客服', '邮件反馈'],
      success: (res) => {
        const options = ['在线客服', '电话客服', '邮件反馈'];
        const option = options[res.tapIndex];
        
        wx.showToast({
          title: `正在打开${option}`,
          icon: 'success'
        });
      }
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '应用设置 - 物品管理',
      path: '/packageProfile/pages/settings/settings'
    };
  }
});