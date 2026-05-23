// 命运赌局 - 主菜单逻辑
Page({
  data: {
    selectedClass: null
  },

  onLoad() {
    // 检查是否有保存的职业
    const savedClass = wx.getStorageSync('playerClass');
    if (savedClass) {
      this.setData({ selectedClass: savedClass });
    }
  },

  // 选择职业
  selectClass(e) {
    const classType = e.currentTarget.dataset.class;
    this.setData({ selectedClass: classType });
    
    // 添加振动反馈
    wx.vibrateShort({
      type: 'medium'
    });
  },

  // 开始游戏
  startGame() {
    if (!this.data.selectedClass) return;
    
    // 保存职业选择
    wx.setStorageSync('playerClass', this.data.selectedClass);
    
    // 添加振动反馈
    wx.vibrateShort({
      type: 'heavy'
    });
    
    // 跳转到战斗页面
    wx.redirectTo({
      url: '/pages/battle/battle'
    });
  },

  // 跳转百科
  goToEncyclopedia() {
    wx.navigateTo({
      url: '/pages/encyclopedia/encyclopedia'
    });
  },

  // 跳转设置
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  }
});
