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
    // 编辑模式标识
    isEdit: false,
    boxId: null,
    
    // 表单数据
    formData: {
      name: '',
      description: '',
      color: '#e54d42',
      location: '',

    },
    // 颜色选项
    colorOptions: [
      { value: '#e54d42', name: '红色' },
      { value: '#f37b1d', name: '橙色' },
      { value: '#fbbd08', name: '黄色' },
      { value: '#3eb93b', name: '绿色' },
      { value: '#37c0fe', name: '青色' },
      { value: '#0081ff', name: '蓝色' },
      { value: '#8044de', name: '紫色' },
      { value: '#e03997', name: '粉色' }
    ],

    // 提交状态
    submitting: false,
    // 表单验证错误
    errors: {},

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('添加收纳盒页面加载', options);
    
    // 如果是编辑模式，加载现有数据
    if (options.boxId) {
      this.setData({
        isEdit: true,
        boxId: options.boxId
      });
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
      
      // 获取全局数据
      const app = getApp();
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      if (!openid) {
        throw new Error('用户未登录，请重新打开小程序');
      }
      
      // 调用后台接口获取箱子详情
      const result = await this.requestBoxDetail(baseUrl, {
        openid: openid,
        box_id: parseInt(boxId)
      });
      
      if (result.status === 'success' && result.data && result.data.box_info) {
        const boxInfo = result.data.box_info;
        
        // 格式化数据以适配表单
        const formData = {
          name: boxInfo.name || '',
          description: boxInfo.description || '',
          color: boxInfo.color || '#e54d42',
          location: boxInfo.location || ''
        };
        
        this.setData({
          formData: formData
        });
        
        // 更新页面标题
        wx.setNavigationBarTitle({
          title: '编辑收纳盒'
        });
      } else {
        throw new Error(result.message || '获取箱子信息失败');
      }
      
      wx.hideLoading();
      
    } catch (error) {
      console.error('加载箱子数据失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      });
      
      // 加载失败时返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
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
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data;
    const errors = {};
    
    // 验证名称
    if (!formData.name.trim()) {
      errors.name = '请输入收纳盒名称';
    } else if (formData.name.trim().length > 100) {
      errors.name = '名称不能超过100个字符';
    }
    
    // 验证描述
    if (formData.description && formData.description.length > 500) {
      errors.description = '描述不能超过500个字符';
    }
    
    // 验证位置
    if (formData.location && formData.location.length > 200) {
      errors.location = '位置描述不能超过200个字符';
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
      
      if (isEdit) {
        // 编辑模式 - 调用后台编辑接口
        await this.editBox(formData);
      } else {
        // 创建模式 - 调用后台接口
        await this.createBox(formData);
      }
      
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
        title: error.message || '操作失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 调用后台接口创建箱子
   */
  async createBox(formData) {
    return new Promise((resolve, reject) => {
      // 获取全局数据
      const app = getApp();
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      if (!openid) {
        reject(new Error('用户未登录，请重新打开小程序'));
        return;
      }
      
      // 构建请求数据
      const requestData = {
        openid: openid,
        name: formData.name.trim(),
        description: formData.description || '',
        color: formData.color || '#1296db',
        location: formData.location || ''
      };
      
      console.log('创建箱子请求数据:', requestData);
      
      wx.request({
        url: baseUrl + 'v1/box/add',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: requestData,
        success: (res) => {
          console.log('创建箱子接口响应:', res);
          
          if (res.statusCode === 200) {
            if (res.data && res.data.success !== false) {
              resolve(res.data);
            } else {
              reject(new Error(res.data?.message || '创建失败'));
            }
          } else {
            reject(new Error(`服务器错误 (${res.statusCode})`));
          }
        },
        fail: (error) => {
          console.error('创建箱子接口调用失败:', error);
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
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
              color: '#e54d42',
              location: ''
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
      content: `名称：${formData.name}\n描述：${formData.description || '无'}\n位置：${formData.location || '未设置'}`,
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
   * 获取箱子详情
   */
  async requestBoxDetail(baseUrl, data) {
    return new Promise((resolve, reject) => {
      // 构建GET请求的URL参数
      const params = `openid=${encodeURIComponent(data.openid)}&box_id=${data.box_id}`;
      
      wx.request({
        url: baseUrl + 'v1/box/get?' + params,
        method: 'GET',
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          console.log('获取箱子详情接口响应:', res);
          
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`服务器错误 (${res.statusCode})`));
          }
        },
        fail: (error) => {
          console.error('获取箱子详情接口调用失败:', error);
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
  },

  /**
   * 调用后台接口编辑箱子
   */
  async editBox(formData) {
    return new Promise((resolve, reject) => {
      // 获取全局数据
      const app = getApp();
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      if (!openid) {
        reject(new Error('用户未登录，请重新打开小程序'));
        return;
      }
      
      if (!this.boxId) {
        reject(new Error('箱子ID缺失'));
        return;
      }
      
      // 构建请求数据
      const requestData = {
        openid: openid,
        box_id: parseInt(this.boxId),
        name: formData.name.trim(),
        description: formData.description || '',
        color: formData.color || '#1296db',
        location: formData.location || ''
      };
      
      console.log('编辑箱子请求数据:', requestData);
      
      wx.request({
        url: baseUrl + 'v1/box/edit',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: requestData,
        success: (res) => {
          console.log('编辑箱子接口响应:', res);
          
          if (res.statusCode === 200) {
            if (res.data && res.data.status === 'success') {
              resolve(res.data);
            } else {
              reject(new Error(res.data?.message || '编辑失败'));
            }
          } else {
            reject(new Error(`服务器错误 (${res.statusCode})`));
          }
        },
        fail: (error) => {
          console.error('编辑箱子接口调用失败:', error);
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      });
    });
  },

});
