// packageStorage/pages/add-box/add-box.js

/**
 * 添加收纳盒页面
 * 用户可以创建新的收纳盒，设置名称、描述、颜色等属性
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 表单数据
    formData: {
      name: '',
      description: '',
      color: '#667eea',
      location: '',
      capacity: 'medium'
    },
    // 颜色选项
    colorOptions: [
      { value: '#667eea', name: '蓝色' },
      { value: '#f093fb', name: '粉色' },
      { value: '#4facfe', name: '天蓝' },
      { value: '#43e97b', name: '绿色' },
      { value: '#fa709a', name: '玫红' },
      { value: '#ffecd2', name: '橙色' },
      { value: '#a8edea', name: '青色' },
      { value: '#d299c2', name: '紫色' }
    ],
    // 容量选项
    capacityOptions: [
      { value: 'small', name: '小型', desc: '适合存放小物件' },
      { value: 'medium', name: '中型', desc: '适合存放日常用品' },
      { value: 'large', name: '大型', desc: '适合存放大件物品' }
    ],
    // 提交状态
    submitting: false,
    // 表单验证错误
    errors: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('添加收纳盒页面加载', options);
    
    // 如果是编辑模式，加载现有数据
    if (options.boxId) {
      this.boxId = options.boxId;
      this.loadBoxData(options.boxId);
    }
  },

  /**
   * 加载收纳盒数据（编辑模式）
   */
  async loadBoxData(boxId) {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟数据
      const mockData = {
        id: boxId,
        name: '电子设备收纳盒',
        description: '存放各种电子设备和配件',
        color: '#4facfe',
        location: '书房书桌下方',
        capacity: 'large'
      };
      
      this.setData({
        formData: mockData
      });
      
      // 更新页面标题
      wx.setNavigationBarTitle({
        title: '编辑收纳盒'
      });
      
      wx.hideLoading();
      
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: '' // 清除错误信息
    });
  },

  /**
   * 选择颜色
   */
  onColorSelect(e) {
    const { color } = e.currentTarget.dataset;
    
    this.setData({
      'formData.color': color
    });
  },

  /**
   * 选择容量
   */
  onCapacitySelect(e) {
    const { capacity } = e.currentTarget.dataset;
    
    this.setData({
      'formData.capacity': capacity
    });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data;
    const errors = {};
    
    // 验证名称
    if (!formData.name.trim()) {
      errors.name = '请输入收纳盒名称';
    } else if (formData.name.trim().length > 20) {
      errors.name = '名称不能超过20个字符';
    }
    
    // 验证描述
    if (formData.description && formData.description.length > 100) {
      errors.description = '描述不能超过100个字符';
    }
    
    // 验证位置
    if (formData.location && formData.location.length > 50) {
      errors.location = '位置描述不能超过50个字符';
    }
    
    this.setData({ errors });
    
    return Object.keys(errors).length === 0;
  },

  /**
   * 提交表单
   */
  async onSubmit() {
    // 验证表单
    if (!this.validateForm()) {
      wx.showToast({
        title: '请检查输入内容',
        icon: 'none'
      });
      return;
    }
    
    try {
      this.setData({ submitting: true });
      
      const { formData } = this.data;
      const isEdit = !!this.boxId;
      
      wx.showLoading({ 
        title: isEdit ? '保存中...' : '创建中...' 
      });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      wx.hideLoading();
      
      wx.showToast({
        title: isEdit ? '保存成功' : '创建成功',
        icon: 'success'
      });
      
      // 返回上一页并刷新
      setTimeout(() => {
        wx.navigateBack({
          success: () => {
            // 通知上一页刷新数据
            const pages = getCurrentPages();
            if (pages.length > 1) {
              const prevPage = pages[pages.length - 2];
              if (prevPage.onShow) {
                prevPage.onShow();
              }
            }
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error('提交失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 重置表单
   */
  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有输入内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            formData: {
              name: '',
              description: '',
              color: '#667eea',
              location: '',
              capacity: 'medium'
            },
            errors: {}
          });
        }
      }
    });
  },

  /**
   * 预览效果
   */
  onPreview() {
    const { formData } = this.data;
    
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请先输入名称',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '预览效果',
      content: `名称：${formData.name}\n描述：${formData.description || '无'}\n位置：${formData.location || '未设置'}\n容量：${this.data.capacityOptions.find(item => item.value === formData.capacity)?.name}`,
      showCancel: false
    });
  },

  /**
   * 扫码添加
   */
  onScanAdd() {
    wx.scanCode({
      success: (res) => {
        console.log('扫码结果:', res);
        
        // 根据扫码结果自动填充信息
        wx.showToast({
          title: '扫码功能开发中',
          icon: 'none'
        });
      },
      fail: (error) => {
        console.error('扫码失败:', error);
        wx.showToast({
          title: '扫码失败',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '添加收纳盒 - 物品管理',
      path: '/packageStorage/pages/add-box/add-box'
    };
  }
});
