Page({
  data: {
    playerName: '勇者',
    playerHealth: 80,
    playerMaxHealth: 80,
    playerEnergy: 3,
    unlockedCards: 10,
    totalCards: 14,
    victories: 0,
    defeats: 0
  },

  onLoad() {
    // 加载玩家数据
    this.loadPlayerData()
    console.log('[Index] 首页加载')
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadPlayerData()
  },

  // 加载玩家数据
  loadPlayerData() {
    const victories = wx.getStorageSync('victories') || 0
    const defeats = wx.getStorageSync('defeats') || 0
    const unlockedCards = wx.getStorageSync('unlockedCards') || 10

    this.setData({
      victories,
      defeats,
      unlockedCards
    })
  },

  // 开始冒险
  startAdventure() {
    console.log('[Index] 开始冒险')

    wx.showModal({
      title: '开始新冒险',
      content: '准备好进入地牢了吗？',
      confirmText: '出发',
      cancelText: '再等等',
      success: (res) => {
        if (res.confirm) {
          // 跳转到战斗页面
          wx.navigateTo({
            url: '/pages/battle/battle'
          })
        }
      }
    })
  },

  // 查看卡组
  viewDeck() {
    console.log('[Index] 查看卡组')

    wx.showToast({
      title: '卡组功能开发中',
      icon: 'none',
      duration: 2000
    })

    // wx.navigateTo({
    //   url: '/pages/deck/deck'
    // })
  },

  // 查看成就
  viewAchievements() {
    console.log('[Index] 查看成就')

    const victories = this.data.victories
    let achievementText = '当前成就:\n'

    if (victories >= 1) {
      achievementText += '✓ 初次胜利\n'
    } else {
      achievementText += '○ 初次胜利\n'
    }

    if (victories >= 5) {
      achievementText += '✓ 常胜将军\n'
    } else {
      achievementText += '○ 常胜将军 (5胜)\n'
    }

    if (victories >= 10) {
      achievementText += '✓ 传说勇者\n'
    } else {
      achievementText += '○ 传说勇者 (10胜)\n'
    }

    achievementText += `\n当前胜场: ${victories}`

    wx.showModal({
      title: '成就系统',
      content: achievementText,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 打开设置
  openSettings() {
    console.log('[Index] 打开设置')

    wx.showActionSheet({
      itemList: ['游戏说明', '关于我们', '重置数据'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.showGameGuide()
            break
          case 1:
            this.showAbout()
            break
          case 2:
            this.resetData()
            break
        }
      }
    })
  },

  // 游戏说明
  showGameGuide() {
    const guide = `【游戏玩法】

1. 回合制战斗
   - 每回合双方同时出牌
   - 卡牌有基础值+Roll随机值

2. 胜负判定
   - 最终值大的卡牌生效
   - 小的卡牌失效
   - 不出牌直接吃伤害

3. 能量系统
   - 每回合恢复能量
   - 出牌需要消耗能量

4. 状态效果
   - 流血、点燃、冻结等
   - 合理搭配卡牌策略

祝你好运，勇者！`

    wx.showModal({
      title: '游戏说明',
      content: guide,
      showCancel: false,
      confirmText: '明白了'
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于游戏',
      content: 'Roguelike卡牌RPG\n\n基于 Cocos Creator 3.x 开发\n使用 TypeScript 编写\n\n版本: v1.0.0',
      showCancel: false,
      confirmText: '关闭'
    })
  },

  // 重置数据
  resetData() {
    wx.showModal({
      title: '重置数据',
      content: '确定要重置所有游戏数据吗？此操作不可恢复。',
      confirmText: '重置',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage()
          this.setData({
            victories: 0,
            defeats: 0,
            unlockedCards: 10
          })
          wx.showToast({
            title: '数据已重置',
            icon: 'success'
          })
        }
      }
    })
  }
})
