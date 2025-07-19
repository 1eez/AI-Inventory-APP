// packageCamera/pages/item-confirm/item-confirm.js

/**
 * 物品确认页面
 * 确认AI识别的物品信息并添加到收纳系统
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 拍摄的图片
    imagePath: '',
    // AI识别结果
    recognitionResult: null,
    // 选中的物品
    selectedItem: null,
    // 编辑后的物品信息
    itemInfo: {
      name: '',
      description: '',
      category: '',
      tags: [],
      location: {
        boxId: '',
        bagId: '',
        boxName: '',
        bagName: ''
      }
    },
    // 可选分类
    categories: [
      '服装配饰', '床上用品', '家居用品', '电子设备', '生活用品', 
      '化妆用品', '食品饮料', '书籍资料', '工具用品', '文具用品', 
      '运动用品', '玩具游戏', '其他'
    ],
    // 常用标签
    commonTags: [
      '重要', '常用', '备用', '新品', '二手',
      '易碎', '贵重', '临时', '待处理', '收藏'
    ],
    // 收纳位置选项
    storageOptions: {
      boxes: [],
      bags: []
    },
    // 提交状态
    submitting: false,
    // 显示位置选择器
    showLocationPicker: false,
    // 自定义标签输入
    customTagInput: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('物品确认页面加载', options);
    
    const imagePath = decodeURIComponent(options.image || '');
    const resultStr = decodeURIComponent(options.result || '{}');
    
    // 获取box和bag信息
    const boxId = options.box_id || '';
    const bagId = options.bag_id || '';
    const boxName = decodeURIComponent(options.box_name || '');
    const boxColor = decodeURIComponent(options.box_color || '#1296db');
    const boxLocation = decodeURIComponent(options.box_location || '');
    const bagName = decodeURIComponent(options.bag_name || '');
    const bagColor = decodeURIComponent(options.bag_color || '#1296db');

    
    try {
      const recognitionResult = JSON.parse(resultStr);
      
      // 从后台返回的嵌套数据结构中提取分析结果
      const analysisResult = recognitionResult.data?.analysis_result || recognitionResult.analysis_result || recognitionResult;
      
      // 使用后台返回的数据作为预填信息
      const itemInfo = {
        name: analysisResult.name || '',
        description: analysisResult.description || '',
        category: analysisResult.category || '',
        tags: analysisResult.tags || [],
        location: {
          boxId: boxId,
          bagId: bagId,
          boxName: boxName,
          bagName: bagName
        }
      };
      
      this.setData({
        imagePath,
        recognitionResult,
        itemInfo,
        boxInfo: {
          id: boxId,
          name: boxName,
          color: boxColor,
          location: boxLocation
        },
        bagInfo: {
          id: bagId,
          name: bagName,
          color: bagColor
        }
      });
      
      // 加载收纳位置选项（如果没有预设位置）
      if (!boxId) {
        this.loadStorageOptions();
      }
      
    } catch (error) {
      console.error('解析识别结果失败:', error);
      wx.showToast({
        title: '数据错误',
        icon: 'error'
      });
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
      [`itemInfo.${field}`]: value
    });
  },

  /**
   * 选择分类
   */
  onCategoryChange(e) {
    const category = this.data.categories[e.detail.value];
    this.setData({
      'itemInfo.category': category
    });
  },

  /**
   * 添加标签
   */
  onAddTag(e) {
    const { tag } = e.currentTarget.dataset;
    const { tags } = this.data.itemInfo;
    
    if (!tags.includes(tag)) {
      this.setData({
        'itemInfo.tags': [...tags, tag]
      });
    }
  },

  /**
   * 移除标签
   */
  onRemoveTag(e) {
    const { index } = e.currentTarget.dataset;
    const { tags } = this.data.itemInfo;
    
    tags.splice(index, 1);
    this.setData({
      'itemInfo.tags': tags
    });
  },

  /**
   * 自定义标签输入变化
   */
  onCustomTagInput(e) {
    this.setData({
      customTagInput: e.detail.value
    });
  },

  /**
   * 添加自定义标签
   */
  onAddCustomTag(e) {
    const tagValue = e.detail.value.trim();
    
    if (tagValue && tagValue.length > 0) {
      const { tags } = this.data.itemInfo;
      
      // 检查标签是否已存在
      if (!tags.includes(tagValue)) {
        this.setData({
          'itemInfo.tags': [...tags, tagValue],
          customTagInput: '' // 清空输入框但不收起键盘
        });
      } else {
        wx.showToast({
          title: '标签已存在',
          icon: 'none',
          duration: 1500
        });
      }
    }
  },

  /**
   * 显示位置选择器
   */
  onShowLocationPicker() {
    this.setData({ showLocationPicker: true });
  },

  /**
   * 隐藏位置选择器
   */
  onHideLocationPicker() {
    this.setData({ showLocationPicker: false });
  },

  /**
   * 选择收纳盒
   */
  onSelectBox(e) {
    const { box } = e.currentTarget.dataset;
    
    this.setData({
      'itemInfo.location.boxId': box.id,
      'itemInfo.location.boxName': box.name,
      'itemInfo.location.bagId': '',
      'itemInfo.location.bagName': ''
    });
    

  },



  /**
   * 确认位置选择
   */
  onConfirmLocation() {
    this.setData({ showLocationPicker: false });
  },

  /**
   * 加载收纳位置选项
   */
  async loadStorageOptions() {
    try {

      
      this.setData({
        'storageOptions.boxes': mockBoxes
      });
      
    } catch (error) {
      console.error('加载收纳位置失败:', error);
    }
  },



  /**
   * 重新拍照
   */
  onRetakePhoto() {
    wx.navigateBack();
  },



  /**
   * 提交物品信息
   */
  async onSubmit() {
    const { itemInfo, imagePath, recognitionResult } = this.data;
    
    // 验证必填信息
    if (!itemInfo.name.trim()) {
      wx.showToast({
        title: '请输入物品名称',
        icon: 'none'
      });
      return;
    }
    
    if (!itemInfo.category) {
      wx.showToast({
        title: '请选择物品分类',
        icon: 'none'
      });
      return;
    }
    
    if (!itemInfo.location.boxId) {
      wx.showToast({
        title: '请选择收纳盒',
        icon: 'none'
      });
      return;
    }
    
    if (!itemInfo.location.bagId) {
      wx.showToast({
        title: '请选择收纳袋',
        icon: 'none'
      });
      return;
    }
    
    try {
      this.setData({ submitting: true });
      
      wx.showLoading({ title: '添加中...' });
      
      // 获取全局数据
      const app = getApp();
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      // 提取图片文件名（从recognitionResult中获取）
      const imageFilename = recognitionResult?.data?.image_filename || recognitionResult?.image_filename || '';
      
      // 构建请求数据
      const requestData = {
        openid: openid,
        box_id: parseInt(itemInfo.location.boxId),
        bag_id: parseInt(itemInfo.location.bagId),
        title: itemInfo.name.trim(),
        description: itemInfo.description || '',
        category: itemInfo.category || '',
        image_filename: imageFilename,
        tags: itemInfo.tags || []
      };
      
      console.log('提交物品数据:', requestData);
      
      // 调用后台接口
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: baseUrl + 'v3/item/add',
          method: 'POST',
          header: {
            'content-type': 'application/json'
          },
          data: requestData,
          success: (res) => {
            console.log('添加物品接口响应:', res);
            if (res.statusCode === 200 && res.data && res.data.status === 'success') {
              resolve(res.data);
            } else {
              reject(new Error(res.data?.message || '添加失败'));
            }
          },
          fail: (error) => {
            console.error('添加物品接口调用失败:', error);
            reject(error);
          }
        });
      });
      
      wx.hideLoading();
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
      
      console.log('物品添加成功:', result);
      
      // 返回两层页面
      setTimeout(() => {
        wx.navigateBack({
          delta: 2
        });
      }, 1500);
      
    } catch (error) {
      console.error('添加物品失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '添加失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '物品识别确认 - 物品管理',
      path: '/packageCamera/pages/item-confirm/item-confirm'
    };
  }
});