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
    // 编辑模式标识
    isEdit: false,
    // 物品ID（编辑模式使用）
    itemId: '',
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
    
    // 检查是否为编辑模式，兼容不同的参数格式
    const itemId = options.item_id || options.itemId || '';
    const isEdit = !!itemId;
    
    this.setData({
      isEdit: isEdit,
      itemId: itemId
    });
    
    if (isEdit) {
      // 编辑模式：加载现有物品数据
      this.loadItemData(itemId, options);
    } else {
      // 添加模式：处理AI识别结果
      this.handleAddMode(options);
    }
  },

  /**
   * 处理添加模式
   */
  handleAddMode(options) {
    const imagePath = decodeURIComponent(options.image || '');
    const resultStr = decodeURIComponent(options.result || '{}');
    
    // 获取box和bag信息，兼容新旧参数格式
    const boxId = options.boxId || options.box_id || '';
    const bagId = options.bagId || options.bag_id || '';
    const boxName = decodeURIComponent(options.boxName || options.box_name || '');
    const boxColor = decodeURIComponent(options.boxColor || options.box_color || '#1296db');
    const boxLocation = decodeURIComponent(options.boxLocation || options.box_location || '');
    const bagName = decodeURIComponent(options.bagName || options.bag_name || '');
    const bagColor = decodeURIComponent(options.bagColor || options.bag_color || '#1296db');

    try {
      const recognitionResult = JSON.parse(resultStr);
      
      // 从后台返回的嵌套数据结构中提取分析结果
      const analysisResult = recognitionResult.data?.analysis_result || recognitionResult.analysis_result || recognitionResult;
      
      // 处理tags数据结构，将对象数组转换为字符串数组
      let tags = [];
      if (analysisResult.tags && Array.isArray(analysisResult.tags)) {
        tags = analysisResult.tags.map(tag => {
          // 如果tag是对象（包含tag_id和name），则提取name
          if (typeof tag === 'object' && tag.name) {
            return tag.name;
          }
          // 如果tag是字符串，直接返回
          return tag;
        });
      }
      
      // 使用后台返回的数据作为预填信息
      const itemInfo = {
        name: analysisResult.name || '',
        description: analysisResult.description || '',
        category: analysisResult.category || '',
        tags: tags,
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
   * 加载物品数据（编辑模式）
   */
  async loadItemData(itemId, options) {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 获取box和bag信息，兼容新旧参数格式
      const boxId = options.boxId || options.box_id || '';
      const bagId = options.bagId || options.bag_id || '';
      
      // 调用后台API获取物品详情
      const itemData = await this.requestItemDetail(itemId, boxId, bagId);
      
      // 从接口响应中获取box_info和bag_info
      const boxInfo = itemData.box_info || {};
      const bagInfo = itemData.bag_info || {};
      
      // 设置物品信息，使用接口返回的位置信息
      const itemInfo = {
        name: itemData.title || '',
        description: itemData.description || '',
        category: itemData.category || '',
        tags: itemData.tags || [],
        location: {
          boxId: boxInfo.box_id || boxId,
          bagId: bagInfo.bag_id || bagId,
          boxName: boxInfo.name || '',
          bagName: bagInfo.name || ''
        }
      };
      
      this.setData({
        itemInfo,
        imagePath: itemData.image_url || '',
        boxInfo: {
          id: boxInfo.box_id || boxId,
          name: boxInfo.name || '',
          color: boxInfo.color || '#1296db',
          location: boxInfo.location || ''
        },
        bagInfo: {
          id: bagInfo.bag_id || bagId,
          name: bagInfo.name || '',
          color: bagInfo.color || '#1296db'
        }
      });
      
      // 更新页面标题
      wx.setNavigationBarTitle({
        title: '编辑物品'
      });
      
      wx.hideLoading();
      
    } catch (error) {
      wx.hideLoading();
      console.error('加载物品数据失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
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
   * 获取物品详情
   */
  requestItemDetail(itemId, boxId, bagId) {
    const app = getApp();
    const baseUrl = app.globalData.baseUrl;
    const openid = app.globalData.openid;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${baseUrl}v3/item/get`,
        method: 'GET',
        data: {
          openid: openid,
          box_id: parseInt(boxId),
          bag_id: parseInt(bagId),
          item_id: parseInt(itemId)
        },
        success: (res) => {
          console.log('获取物品详情接口响应:', res);
          
          if (res.statusCode === 200 && res.data.status === 'success') {
            const responseData = res.data.data;
            
            // 检查物品信息是否存在
            if (responseData && responseData.item_info) {
              const itemData = responseData.item_info;
              
              // 构建完整的图片URL
              let imageUrl = '';
              if (itemData.image_filename) {
                imageUrl = `${baseUrl}Photos/${itemData.image_filename}`;
              }
              
              // 处理tags数据结构，将对象数组转换为字符串数组
              let tags = [];
              if (itemData.tags && Array.isArray(itemData.tags)) {
                tags = itemData.tags.map(tag => {
                  // 如果tag是对象（包含tag_id和name），则提取name
                  if (typeof tag === 'object' && tag.name) {
                    return tag.name;
                  }
                  // 如果tag是字符串，直接返回
                  return tag;
                });
              }
              
              resolve({
                title: itemData.title,
                description: itemData.description || '',
                category: itemData.category || '',
                tags: tags,
                image_url: imageUrl,
                box_info: responseData.box_info || {},
                bag_info: responseData.bag_info || {}
              });
            } else {
              console.error('物品信息不存在:', responseData);
              reject(new Error('物品信息不存在'));
            }
          } else {
            console.error('API响应错误:', res.data);
            reject(new Error(res.data.message || '获取物品详情失败'));
          }
        },
        fail: (error) => {
          console.error('获取物品详情接口失败:', error);
          reject(new Error('网络请求失败'));
        }
      });
    });
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
   * 添加物品到服务器
   */
  async addItemToServer(requestData, baseUrl) {
    console.log('提交物品数据:', requestData);
    
    return new Promise((resolve, reject) => {
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
  },

  /**
   * 编辑物品到服务器
   */
  async editItemToServer(requestData, baseUrl) {
    console.log('编辑物品数据:', requestData);
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: baseUrl + 'v3/item/edit',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: requestData,
        success: (res) => {
          console.log('编辑物品接口响应:', res);
          if (res.statusCode === 200 && res.data && res.data.status === 'success') {
            resolve(res.data);
          } else {
            reject(new Error(res.data?.message || '编辑失败'));
          }
        },
        fail: (error) => {
          console.error('编辑物品接口调用失败:', error);
          reject(error);
        }
      });
    });
  },

  /**
   * 提交物品信息
   */
  async onSubmit() {
    const { itemInfo, imagePath, recognitionResult, isEdit, itemId } = this.data;
    
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
      
      const loadingTitle = isEdit ? '保存中...' : '添加中...';
      wx.showLoading({ title: loadingTitle });
      
      // 获取全局数据
      const app = getApp();
      const baseUrl = app.globalData.baseUrl;
      const openid = app.globalData.openid;
      
      let result;
      
      if (isEdit) {
        // 编辑模式：调用编辑接口
        result = await this.editItemToServer({
          openid: openid,
          item_id: parseInt(itemId),
          title: itemInfo.name.trim(),
          description: itemInfo.description || '',
          category: itemInfo.category || '',
          tags: itemInfo.tags || []
        }, baseUrl);
      } else {
        // 添加模式：调用添加接口
        const imageFilename = recognitionResult?.data?.image_filename || recognitionResult?.image_filename || '';
        
        result = await this.addItemToServer({
          openid: openid,
          box_id: parseInt(itemInfo.location.boxId),
          bag_id: parseInt(itemInfo.location.bagId),
          title: itemInfo.name.trim(),
          description: itemInfo.description || '',
          category: itemInfo.category || '',
          image_filename: imageFilename,
          tags: itemInfo.tags || []
        }, baseUrl);
      }
      
      wx.hideLoading();
      
      const successTitle = isEdit ? '保存成功' : '添加成功';
      wx.showToast({
        title: successTitle,
        icon: 'success'
      });
      
      console.log(isEdit ? '物品编辑成功:' : '物品添加成功:', result);
      
      // 根据模式返回不同层数
      const delta = isEdit ? 1 : 2;
      setTimeout(() => {
        wx.navigateBack({
          delta: delta
        });
      }, 1500);
      
    } catch (error) {
      console.error(isEdit ? '编辑物品失败:' : '添加物品失败:', error);
      wx.hideLoading();
      const errorTitle = isEdit ? '保存失败，请重试' : '添加失败，请重试';
      wx.showToast({
        title: error.message || errorTitle,
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },


});