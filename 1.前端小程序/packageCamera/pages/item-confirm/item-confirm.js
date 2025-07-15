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
      '电子设备', '生活用品', '文具用品', '服装配饰',
      '化妆用品', '食品饮料', '书籍资料', '工具用品',
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
    showLocationPicker: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('物品确认页面加载', options);
    
    const imagePath = decodeURIComponent(options.image || '');
    const resultStr = decodeURIComponent(options.result || '{}');
    
    try {
      const recognitionResult = JSON.parse(resultStr);
      
      // 为每个识别结果添加百分比显示
      if (recognitionResult.items) {
        recognitionResult.items = recognitionResult.items.map(item => ({
          ...item,
          confidencePercent: Math.round(item.confidence * 100)
        }));
      }
      
      this.setData({
        imagePath,
        recognitionResult
      });
      
      // 如果有识别结果，选择第一个作为默认
      if (recognitionResult.items && recognitionResult.items.length > 0) {
        this.selectItem(recognitionResult.items[0]);
      }
      
      // 加载收纳位置选项
      this.loadStorageOptions();
      
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
   * 选择识别的物品
   */
  selectItem(item) {
    const itemInfo = {
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      tags: [],
      location: {
        boxId: '',
        bagId: '',
        boxName: '',
        bagName: ''
      }
    };
    
    this.setData({
      selectedItem: item,
      itemInfo
    });
  },

  /**
   * 选择识别结果中的物品
   */
  onSelectRecognizedItem(e) {
    const { item } = e.currentTarget.dataset;
    this.selectItem(item);
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
    
    // 加载该收纳盒下的收纳袋
    this.loadBagsForBox(box.id);
  },

  /**
   * 选择收纳袋
   */
  onSelectBag(e) {
    const { bag } = e.currentTarget.dataset;
    
    this.setData({
      'itemInfo.location.bagId': bag.id,
      'itemInfo.location.bagName': bag.name
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
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟收纳盒数据
      const mockBoxes = [
        {
          id: 'box_1',
          name: '电子设备收纳盒',
          color: '#4facfe',
          location: '书房书桌下方'
        },
        {
          id: 'box_2',
          name: '生活用品收纳盒',
          color: '#43e97b',
          location: '客厅电视柜'
        },
        {
          id: 'box_3',
          name: '文具收纳盒',
          color: '#f093fb',
          location: '书房书架'
        }
      ];
      
      this.setData({
        'storageOptions.boxes': mockBoxes
      });
      
    } catch (error) {
      console.error('加载收纳位置失败:', error);
    }
  },

  /**
   * 加载指定收纳盒下的收纳袋
   */
  async loadBagsForBox(boxId) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 模拟收纳袋数据
      const mockBags = [
        {
          id: 'bag_1',
          name: '数据线收纳袋',
          color: '#667eea',
          type: 'electronics'
        },
        {
          id: 'bag_2',
          name: '充电器收纳袋',
          color: '#fa709a',
          type: 'electronics'
        }
      ];
      
      this.setData({
        'storageOptions.bags': mockBags
      });
      
    } catch (error) {
      console.error('加载收纳袋失败:', error);
    }
  },

  /**
   * 重新拍照
   */
  onRetakePhoto() {
    wx.navigateBack();
  },

  /**
   * 手动输入
   */
  onManualInput() {
    this.setData({
      selectedItem: null,
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
      }
    });
  },

  /**
   * 提交物品信息
   */
  async onSubmit() {
    const { itemInfo, imagePath } = this.data;
    
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
    
    try {
      this.setData({ submitting: true });
      
      wx.showLoading({ title: '添加中...' });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      wx.hideLoading();
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
      
      // 返回首页并刷新
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }, 1500);
      
    } catch (error) {
      console.error('添加物品失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '添加失败，请重试',
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