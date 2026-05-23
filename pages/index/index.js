const gameModule = require('../../assets/scripts/index.js')

Page({
  data: {
    selectedClass: null,
    victories: 0,
    defeats: 0,
    unlockedClasses: []
  },

  onLoad() {
    // 加载玩家数据
    this.loadPlayerData()
    // 加载职业系统
    this.loadClassSystem()
    console.log('[Index] 首页加载')
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadPlayerData()
  },

  // 加载职业系统
  loadClassSystem() {
    const classConfig = gameModule.CLASS_CONFIG
    const progressionMgr = gameModule.ProgressionManager.getInstance()
    
    // 获取已解锁的职业
    const unlockedClasses = progressionMgr.getUnlockStatus().classes
    
    // 检查本地存储是否有已选择的职业
    const savedClass = wx.getStorageSync('selectedClass')
    let defaultClass
    
    if (savedClass && classConfig[savedClass]) {
      // 使用已保存的职业
      defaultClass = classConfig[savedClass]
    } else {
      // 默认选择赌徒
      defaultClass = classConfig[gameModule.PlayerClass.GAMBLER]
      // 保存到本地存储
      wx.setStorageSync('selectedClass', gameModule.PlayerClass.GAMBLER)
    }
    
    this.setData({
      unlockedClasses: unlockedClasses,
      selectedClass: defaultClass
    })
  },

  // 加载玩家数据
  loadPlayerData() {
    const victories = wx.getStorageSync('victories') || 0
    const defeats = wx.getStorageSync('defeats') || 0

    this.setData({
      victories,
      defeats
    })
  },

  // 选择职业
  selectClass() {
    console.log('[Index] 选择职业')
    
    const classConfig = gameModule.CLASS_CONFIG
    const playerClasses = gameModule.PlayerClass
    
    // 构建职业列表
    const classList = [
      {
        id: playerClasses.GAMBLER,
        name: classConfig[playerClasses.GAMBLER].name,
        icon: classConfig[playerClasses.GAMBLER].icon,
        description: classConfig[playerClasses.GAMBLER].description,
        hp: classConfig[playerClasses.GAMBLER].startingHp,
        mechanic: classConfig[playerClasses.GAMBLER].specialMechanic
      },
      {
        id: playerClasses.MAGICIAN,
        name: classConfig[playerClasses.MAGICIAN].name,
        icon: classConfig[playerClasses.MAGICIAN].icon,
        description: classConfig[playerClasses.MAGICIAN].description,
        hp: classConfig[playerClasses.MAGICIAN].startingHp,
        mechanic: classConfig[playerClasses.MAGICIAN].specialMechanic
      },
      {
        id: playerClasses.EXECUTIONER,
        name: classConfig[playerClasses.EXECUTIONER].name,
        icon: classConfig[playerClasses.EXECUTIONER].icon,
        description: classConfig[playerClasses.EXECUTIONER].description,
        hp: classConfig[playerClasses.EXECUTIONER].startingHp,
        mechanic: classConfig[playerClasses.EXECUTIONER].specialMechanic
      },
      {
        id: playerClasses.MANIAC,
        name: classConfig[playerClasses.MANIAC].name,
        icon: classConfig[playerClasses.MANIAC].icon,
        description: classConfig[playerClasses.MANIAC].description,
        hp: classConfig[playerClasses.MANIAC].startingHp,
        mechanic: classConfig[playerClasses.MANIAC].specialMechanic
      }
    ]
    
    // 显示职业选择弹窗
    const itemList = classList.map(c => `${c.icon} ${c.name} (HP:${c.hp})`)
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        const selectedClassData = classList[res.tapIndex]
        const fullClassData = classConfig[selectedClassData.id]
        
        this.setData({
          selectedClass: fullClassData
        })
        
        // 保存选择的职业
        wx.setStorageSync('selectedClass', selectedClassData.id)
        
        wx.showToast({
          title: `选择了${selectedClassData.name}`,
          icon: 'none',
          duration: 1500
        })
      }
    })
  },

  // 开始冒险
  startAdventure() {
    console.log('[Index] 开始冒险')
    
    if (!this.data.selectedClass) {
      wx.showToast({
        title: '请先选择职业',
        icon: 'none',
        duration: 2000
      })
      return
    }

    wx.showModal({
      title: '开始新冒险',
      content: `以${this.data.selectedClass.name}身份进入暗黑赌场，准备好了吗？`,
      confirmText: '出发',
      cancelText: '再等等',
      success: (res) => {
        if (res.confirm) {
          // 初始化Roguelike游戏
          const roguelikeMgr = gameModule.RoguelikeManager.getInstance()
          const classDeck = gameModule.getClassDeck(this.data.selectedClass.id)
          
          roguelikeMgr.startRun(this.data.selectedClass.id, classDeck)
          
          // 跳转到地图页面（如果有）或战斗页面
          wx.navigateTo({
            url: '/pages/battle/battle'
          })
        }
      }
    })
  },

  // 查看卡组百科
  viewCardEncyclopedia() {
    console.log('[Index] 查看卡组百科')
    
    // 跳转到卡组百科页面
    wx.navigateTo({
      url: '/pages/encyclopedia/encyclopedia'
    })
  },

  // 查看成就
  viewAchievements() {
    console.log('[Index] 查看成就')
    
    const progressionMgr = gameModule.ProgressionManager.getInstance()
    const unlockStatus = progressionMgr.getUnlockStatus()
    
    let achievementText = '已解锁内容:\n\n'
    
    achievementText += `【职业】(${unlockStatus.classes.length}个)\n`
    unlockStatus.classes.forEach(classId => {
      const classConfig = gameModule.CLASS_CONFIG[classId]
      if (classConfig) {
        achievementText += `${classConfig.icon} ${classConfig.name}\n`
      }
    })
    
    achievementText += `\n【成就】(${unlockStatus.achievements.length}个)\n`
    unlockStatus.achievements.forEach(achId => {
      const ach = gameModule.ACHIEVEMENTS[achId]
      if (ach) {
        achievementText += `${ach.icon} ${ach.name}\n`
      }
    })
    
    achievementText += `\n胜场: ${this.data.victories}`

    wx.showModal({
      title: '成就与解锁',
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
    const guide = `【游戏核心玩法】

1. 心理博弈
   - 双方同时出牌
   - 可以选择虚张声势
   - 洞察敌方意图

2. Roll对撞
   - 每张牌有Roll范围
   - Roll值大的牌生效
   - Roll值就是伤害

3. 职业特色
   🎲 赌徒：高风险高收益
   🎩 魔术师：信息欺骗
   ⚔️ 处刑者：稳定压制
   🔥 狂徒：低血爆发

4. Roguelike元素
   - 分岔路线选择
   - 遗物Build构筑
   - 牌库管理（15张上限）
   - 牌打完即失败

5. 胜利条件
   - 击败所有Boss
   - 管理好你的牌库
   - 构建强力流派

祝你好运，赌徒！`

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
      content: '暗黑赌场\n心理博弈Roguelike卡牌\n\n版本: v1.0.0',
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
            selectedClass: null
          })
          
          // 重新加载职业系统
          this.loadClassSystem()
          
          wx.showToast({
            title: '数据已重置',
            icon: 'success'
          })
        }
      }
    })
  }
})
