// packageProfile/pages/help/help.js
Page({
  data: {
    markdownContent: '',
    loading: true,
    // 帮助章节
    sections: [
      {
        id: 'getting-started',
        title: '快速开始',
        icon: 'cuIcon-shop',
        expanded: false
      },
      {
        id: 'box-management',
        title: '储物箱管理',
        icon: 'cuIcon-shop',
        expanded: false
      },
      {
        id: 'bag-management',
        title: '收纳袋管理',
        icon: 'cuIcon-goods',
        expanded: false
      },
      {
        id: 'item-management',
        title: '物品管理',
        icon: 'cuIcon-camera',
        expanded: false
      },
      {
        id: 'search-tips',
        title: '搜索技巧',
        icon: 'cuIcon-search',
        expanded: false
      },
      {
        id: 'common-issues',
        title: '常见问题',
        icon: 'cuIcon-question',
        expanded: false
      }
    ]
  },

  onLoad() {
    console.log('使用帮助页面加载');
    this.loadHelpContent();
  },

  /**
   * 加载帮助内容
   */
  loadHelpContent() {
    // 模拟加载延迟
    setTimeout(() => {
      this.setData({
        loading: false
      });
    }, 500);
  },

  /**
   * 切换章节展开状态
   */
  onToggleSection(e) {
    const sectionId = e.currentTarget.dataset.id;
    const sections = this.data.sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, expanded: !section.expanded };
      }
      return section;
    });
    
    this.setData({ sections });
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    return {
      title: '使用帮助',
      path: '/packageProfile/pages/help/help'
    };
  }
});