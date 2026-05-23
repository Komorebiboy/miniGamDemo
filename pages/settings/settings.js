// 命运赌局 - 设置页面

// 默认设置
const DEFAULT_SETTINGS = {
  // 音频设置
  bgmEnabled: true,
  sfxEnabled: true,
  bgmVolume: 70,
  
  // 游戏设置
  animationEnabled: true,
  screenShake: true,
  fastBattle: false,
  
  // 显示设置
  quality: 'high',
  particlesEnabled: true,
  damageNumbers: true,
  
  // 其他
  tutorialCompleted: false,
  firstTime: true
}

// 设置存储键
const SETTINGS_KEY = 'fate_gamble_settings'

Page({
  data: {
    settings: { ...DEFAULT_SETTINGS },
    showCreditsModal: false,
    showAgreementModal: false
  },

  onLoad() {
    this.loadSettings()
  },

  // 加载设置
  loadSettings() {
    try {
      const savedSettings = wx.getStorageSync(SETTINGS_KEY)
      if (savedSettings) {
        this.setData({
          settings: { ...DEFAULT_SETTINGS, ...savedSettings }
        })
      } else {
        // 首次进入，保存默认设置
        this.saveSettings()
      }
    } catch (e) {
      console.error('加载设置失败:', e)
      this.setData({
        settings: { ...DEFAULT_SETTINGS }
      })
    }
  },

  // 保存设置
  saveSettings() {
    try {
      wx.setStorageSync(SETTINGS_KEY, this.data.settings)
    } catch (e) {
      console.error('保存设置失败:', e)
    }
  },

  // 切换开关设置
  toggleSetting(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail.value
    
    this.setData({
      [`settings.${key}`]: value
    }, () => {
      this.saveSettings()
      
      // 如果切换了背景音乐，立即生效
      if (key === 'bgmEnabled') {
        if (value) {
          this.playBGM()
        } else {
          this.stopBGM()
        }
      }
      
      // 如果切换了音效，播放测试音效
      if (key === 'sfxEnabled' && value) {
        this.playTestSound()
      }
    })
  },

  // 改变音量
  changeVolume(e) {
    const key = e.currentTarget.dataset.key
    const value = e.detail.value
    
    this.setData({
      [`settings.${key}`]: value
    }, () => {
      this.saveSettings()
      // 调整背景音乐音量
      this.adjustBGMVolume(value)
    })
  },

  // 设置画质
  setQuality(e) {
    const quality = e.currentTarget.dataset.quality
    
    this.setData({
      'settings.quality': quality
    }, () => {
      this.saveSettings()
      wx.showToast({
        title: `画质已切换为${this.getQualityText(quality)}`,
        icon: 'none',
        duration: 1500
      })
    })
  },

  // 获取画质文本
  getQualityText(quality) {
    const qualityTexts = {
      'low': '低',
      'medium': '中',
      'high': '高'
    }
    return qualityTexts[quality] || quality
  },

  // 清除存档
  clearSaveData() {
    wx.showModal({
      title: '⚠️ 警告',
      content: '确定要清除所有游戏存档吗？此操作不可恢复！\n\n将删除：\n• 游戏进度\n• 解锁内容\n• 成就记录\n• 统计数据',
      confirmText: '确认清除',
      confirmColor: '#B3001B',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除所有游戏数据
            wx.removeStorageSync('fate_gamble_save')
            wx.removeStorageSync('fate_gamble_achievements')
            wx.removeStorageSync('fate_gamble_stats')
            wx.removeStorageSync('fate_gamble_unlocks')
            
            // 重置设置（保留音频设置）
            const currentSettings = this.data.settings
            const newSettings = {
              ...DEFAULT_SETTINGS,
              bgmEnabled: currentSettings.bgmEnabled,
              sfxEnabled: currentSettings.sfxEnabled,
              bgmVolume: currentSettings.bgmVolume
            }
            
            this.setData({ settings: newSettings }, () => {
              this.saveSettings()
            })
            
            wx.showToast({
              title: '存档已清除',
              icon: 'success',
              duration: 2000
            })
          } catch (e) {
            console.error('清除存档失败:', e)
            wx.showToast({
              title: '清除失败',
              icon: 'error',
              duration: 2000
            })
          }
        }
      }
    })
  },

  // 重置教程
  resetTutorial() {
    wx.showModal({
      title: '重置教程',
      content: '确定要重新显示游戏教程吗？',
      confirmText: '确认',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'settings.tutorialCompleted': false,
            'settings.firstTime': true
          }, () => {
            this.saveSettings()
            wx.showToast({
              title: '教程已重置',
              icon: 'success',
              duration: 1500
            })
          })
        }
      }
    })
  },

  // 导出数据
  exportData() {
    try {
      const gameData = {
        settings: this.data.settings,
        save: wx.getStorageSync('fate_gamble_save') || {},
        achievements: wx.getStorageSync('fate_gamble_achievements') || {},
        stats: wx.getStorageSync('fate_gamble_stats') || {},
        unlocks: wx.getStorageSync('fate_gamble_unlocks') || {}
      }
      
      const dataStr = JSON.stringify(gameData, null, 2)
      
      // 复制到剪贴板
      wx.setClipboardData({
        data: dataStr,
        success: () => {
          wx.showModal({
            title: '导出成功',
            content: '游戏数据已复制到剪贴板，您可以粘贴保存到安全的地方。',
            showCancel: false
          })
        }
      })
    } catch (e) {
      console.error('导出数据失败:', e)
      wx.showToast({
        title: '导出失败',
        icon: 'error',
        duration: 2000
      })
    }
  },

  // 显示制作团队弹窗
  showCredits() {
    this.setData({
      showCreditsModal: true
    })
  },

  // 关闭制作团队弹窗
  closeCreditsModal() {
    this.setData({
      showCreditsModal: false
    })
  },

  // 显示用户协议弹窗
  showUserAgreement() {
    this.setData({
      showAgreementModal: true
    })
  },

  // 关闭用户协议弹窗
  closeAgreementModal() {
    this.setData({
      showAgreementModal: false
    })
  },

  // 阻止事件冒泡
  preventClose() {
    // 什么都不做，只是阻止事件冒泡
  },

  // 播放背景音乐
  playBGM() {
    // 这里可以实现背景音乐播放逻辑
    console.log('播放背景音乐')
  },

  // 停止背景音乐
  stopBGM() {
    // 这里可以实现背景音乐停止逻辑
    console.log('停止背景音乐')
  },

  // 调整背景音乐音量
  adjustBGMVolume(volume) {
    // 这里可以实现音量调整逻辑
    console.log('调整音量:', volume)
  },

  // 播放测试音效
  playTestSound() {
    // 这里可以播放一个测试音效
    console.log('播放测试音效')
  },

  // 返回主菜单
  goBack() {
    wx.navigateBack()
  }
})
