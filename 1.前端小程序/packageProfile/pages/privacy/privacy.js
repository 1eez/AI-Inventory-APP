// packageProfile/pages/privacy/privacy.js
Page({
  data: {
    markdownContent: '',
    loading: true
  },

  onLoad() {
    console.log('隐私政策页面加载');
    this.loadPrivacyContent();
  },

  /**
   * 加载隐私政策内容
   */
  loadPrivacyContent() {
    // 这里可以从本地文件或服务器加载隐私政策内容
    // 目前使用静态内容
    const content = `# 隐私政策

## 信息收集
我们收集您提供的信息以改善服务质量。

## 信息使用
我们仅将您的信息用于提供和改善服务。

## 信息保护
我们采取适当的安全措施保护您的个人信息。`;
    
    this.setData({
      markdownContent: content,
      loading: false
    });
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    return {
      title: '隐私政策',
      path: '/packageProfile/pages/privacy/privacy'
    };
  }
});