// packageStorage/pages/add-bag/add-bag.js

/**
 * 添加收纳袋页面
 * 用户可以在指定收纳盒中创建新的收纳袋
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
      color: '#43e97b',
      type: 'general',
      boxId: ''
    },
    // 收纳袋类型选项
    typeOptions: [
      { value: 'general', name: '通用袋', desc: '适合存放各类物品', icon: 'bagfill' },
      { value: 'clothes', name: '衣物袋', desc: '专门存放衣物配件', icon: 'clothesfill' },
      { value: 'electronics', name: '电子袋', desc: '存放电子设备和配件', icon: 'phonefill' },
      { value: 'documents', name: '文件袋', desc: '存放重要文件资料', icon: 'documentfill' },
      { value: 'cosmetics', name: '化妆袋', desc: '存放化妆品和护肤品', icon: 'beautyfill' },
      { value: 'tools', name: '工具袋', desc: '存放各种工具用品', icon: 'settingsfill' }
    ],
    // 颜色选项
    colorOptions: [
      { value: '#43e97b', name: '绿色' },
      { value: '#667eea', name: '蓝色' },
      { value: '#f093fb', name: '粉色' },
      { value: '#4facfe', name: '天蓝' },
      { value: '#fa709a', name: '玫红' },
      { value: '#ffecd2', name: '橙色' },
      { value: '#a8edea', name: '青色' },
      { value: '#d299c2', name: '紫色' }
    ],
    // 所属收纳盒信息
    boxInfo: null,
    // 提交状态
    submitting: false,
    // 表单验证错误
    errors: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('添加收纳袋页面加载', options);
    
    // 获取收纳盒ID
    const boxId = options.boxId;
    if (!boxId) {
      wx.showToast({
        title: '缺少收纳盒信息',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 保存收纳盒ID
    this.setData({
      'formData.boxId': boxId
    });
    
    // 如果是编辑模式，加载现有数据
    if (options.bagId) {
      this.bagId = options.bagId;
      this.loadBagData(options.bagId);
    }
    
    // 加载收纳盒信息
    this.loadBoxInfo(boxId);
  },

  /**
   * 加载收纳盒信息
   */
  async loadBoxInfo(boxId) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟收纳盒数据
      const mockBoxInfo = {
        id: boxId,
        name: '电子设备收纳盒',
        color: '#4facfe',
        location: '书房书桌下方'
      };
      
      this.setData({
        boxInfo: mockBoxInfo
      });
      
    } catch (error) {
      console.error('加载收纳盒信息失败:', error);
    }
  },

  /**
   * 加载收纳袋数据（编辑模式）
   */
  async loadBagData(bagId) {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟数据
      const mockData = {
        id: bagId,
        name: '笔记本电脑袋',
        description: '专门存放笔记本电脑和相关配件',
        color: '#667eea',
        type: 'electronics',
        boxId: this.data.formData.boxId
      };
      
      this.setData({
        formData: mockData
      });
      
      // 更新页面标题
      wx.setNavigationBarTitle({
        title: '编辑收纳袋'
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
   * 选择类型
   */
  onTypeSelect(e) {
    const { type } = e.currentTarget.dataset;
    
    this.setData({
      'formData.type': type
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
      errors.name = '请输入收纳袋名称';
    } else if (formData.name.trim().length > 20) {
      errors.name = '名称不能超过20个字符';
    }
    
    // 验证描述
    if (formData.description && formData.description.length > 100) {
      errors.description = '描述不能超过100个字符';
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
      const isEdit = !!this.bagId;
      
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
              color: '#43e97b',
              type: 'general',
              boxId: this.data.formData.boxId
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
    const { formData, typeOptions } = this.data;
    
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请先输入名称',
        icon: 'none'
      });
      return;
    }
    
    const typeInfo = typeOptions.find(item => item.value === formData.type);
    
    wx.showModal({
      title: '预览效果',
      content: `名称：${formData.name}\n描述：${formData.description || '无'}\n类型：${typeInfo?.name}\n所属收纳盒：${this.data.boxInfo?.name}`,
      showCancel: false
    });
  },

  /**
   * 查看收纳盒
   */
  onViewBox() {
    const { boxInfo } = this.data;
    if (boxInfo) {
      wx.navigateTo({
        url: `/packageStorage/pages/box-detail/box-detail?boxId=${boxInfo.id}`
      });
    }
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '添加收纳袋 - 物品管理',
      path: `/packageStorage/pages/add-bag/add-bag?boxId=${this.data.formData.boxId}`
    };
  }
});