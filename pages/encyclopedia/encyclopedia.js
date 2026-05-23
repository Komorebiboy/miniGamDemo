const gameModule = require('../../assets/scripts/index.js')

Page({
  data: {
    currentTab: 'classes',
    selectedClass: 'GAMBLER',
    classData: {},
    classCards: [],
    normalEnemies: [],
    bossList: [],
    relicList: []
  },

  onLoad() {
    this.loadClassData()
    this.loadEnemyData()
    this.loadBossData()
    this.loadRelicData()
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  // 选择职业
  selectClass(e) {
    const classId = e.currentTarget.dataset.class
    this.setData({ selectedClass: classId }, () => {
      this.loadClassData()
    })
  },

  // 加载职业数据
  loadClassData() {
    const classConfig = gameModule.CLASS_CONFIG
    const selectedClass = this.data.selectedClass

    // 获取职业配置
    const classData = classConfig[selectedClass]

    // 获取职业专属卡牌（基础卡牌 + 扩展卡牌）
    let classCards = []
    let extendedCards = []
    switch (selectedClass) {
      case 'GAMBLER':
        classCards = gameModule.GAMBLER_CARDS || []
        extendedCards = gameModule.GAMBLER_EXTENDED_CARDS || []
        break
      case 'MAGICIAN':
        classCards = gameModule.MAGICIAN_CARDS || []
        extendedCards = gameModule.MAGICIAN_EXTENDED_CARDS || []
        break
      case 'EXECUTIONER':
        classCards = gameModule.EXECUTIONER_CARDS || []
        extendedCards = gameModule.EXECUTIONER_EXTENDED_CARDS || []
        break
      case 'MANIAC':
        classCards = gameModule.MANIAC_CARDS || []
        extendedCards = gameModule.MANIAC_EXTENDED_CARDS || []
        break
    }

    // 合并基础卡牌和扩展卡牌
    const allCards = [...classCards, ...extendedCards]

    // 按稀有度排序
    const rarityOrder = { 'COMMON': 1, 'UNCOMMON': 2, 'RARE': 3, 'LEGENDARY': 4, 'FINISHER': 5 }
    allCards.sort((a, b) => (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0))

    // 处理卡牌数据，添加显示文本
    const processedCards = allCards.map(card => ({
      ...card,
      rarityText: this.getRarityText(card.rarity),
      riskText: this.getRiskText(card.riskLevel),
      typeIcon: this.getTypeIcon(card.type)
    }))

    this.setData({
      classData: classData,
      classCards: processedCards
    })
  },

  // 加载敌人数据
  loadEnemyData() {
    // 使用 NORMAL_ENEMIES 获取所有普通敌人（8个）
    const normalEnemiesData = gameModule.NORMAL_ENEMIES || {}
    const enemyList = Object.values(normalEnemiesData)
    
    // 处理普通敌人数据
    const normalEnemies = enemyList.map(enemy => ({
      ...enemy,
      name: enemy.name || '未知敌人',
      description: enemy.description || '暂无描述',
      hp: enemy.stats?.maxHp || 50,
      difficulty: enemy.dangerLevel || 'NORMAL',
      difficultyText: this.getDangerLevelText(enemy.dangerLevel),
      factionText: this.getFactionText(enemy.faction),
      aiTypeText: this.getAITypeText(enemy.aiType),
      icon: this.getEnemyIcon(enemy.id),
      abilities: enemy.skills?.map(skill => skill.name) || []
    }))
    
    this.setData({
      normalEnemies: normalEnemies
    })
  },

  // 加载Boss数据
  loadBossData() {
    // 使用默认Boss数据（5个Boss）
    const bossList = this.getDefaultBossList()
    
    this.setData({
      bossList: bossList
    })
  },

  // 获取默认Boss列表（5个Boss）
  getDefaultBossList() {
    return [
      {
        id: 'BOSS_1',
        name: '恶魔庄家',
        title: 'The Devil Dealer',
        icon: '👿',
        hp: 200,
        maxHp: 200,
        difficulty: 'HARD',
        difficultyText: '困难',
        description: '掌控赌局规则的恶魔，擅长债务操控和概率扭曲。在战斗中会不断施加"赌债"效果，迫使玩家在攻击和生存之间做出艰难选择。',
        coreMechanic: {
          name: '债务赌局',
          description: '每回合开始时，Boss会施加1层"赌债"。玩家可以选择立即偿还（失去5点生命）或累积债务（每层赌债使受到的伤害+1）。当赌债达到5层时，强制扣除20点生命。'
        },
        phases: [
          { name: '诱惑阶段', hpThreshold: 100, description: 'Boss主要使用低伤害但高赌债的卡牌' },
          { name: '收债阶段', hpThreshold: 50, description: 'Boss开始使用高伤害卡牌，并加速赌债累积' },
          { name: '清算阶段', hpThreshold: 0, description: 'Boss获得巨大强化，所有攻击附带额外赌债效果' }
        ],
        currentPhase: 1,
        phase: 'phase-1',
        faction: 'DEMON',
        factionText: '恶魔阵营'
      },
      {
        id: 'BOSS_2',
        name: '舞台主宰',
        title: 'Master of Stage',
        icon: '🎭',
        hp: 250,
        maxHp: 250,
        difficulty: 'HARD',
        difficultyText: '困难',
        description: '操纵真相的魔术师，让真假难辨。擅长制造幻象和假信息，让玩家无法判断真实的威胁。',
        coreMechanic: {
          name: '真假舞台',
          description: 'Boss的卡牌会显示虚假信息（如显示高伤害但实际低伤害，或反之）。玩家需要通过观察Boss的动作和特效来判断真实效果。每3回合，Boss会揭示一次真相。'
        },
        phases: [
          { name: '幻象阶段', hpThreshold: 150, description: 'Boss主要使用假信息卡牌，误导玩家' },
          { name: '迷惑阶段', hpThreshold: 75, description: '假信息更加频繁，且开始混合真实攻击' },
          { name: '真相阶段', hpThreshold: 0, description: 'Boss解除所有幻象，获得速度和攻击力大幅提升' }
        ],
        currentPhase: 1,
        phase: 'phase-1',
        faction: 'MAGIC',
        factionText: '魔术阵营'
      },
      {
        id: 'BOSS_3',
        name: '机械裁决者',
        title: 'Machine Judge',
        icon: '🤖',
        hp: 300,
        maxHp: 300,
        difficulty: 'EXTREME',
        difficultyText: '极限',
        description: '绝对公平的机械生命体，用规则压制一切。强制双方遵守严格的战斗规则，违反规则将受到惩罚。',
        coreMechanic: {
          name: '绝对公平',
          description: '每回合开始时，Boss会宣布一条规则（如"本回合只能使用攻击卡牌"、"双方Roll点范围强制变为1-6"等）。违反规则将受到10点惩罚伤害。Boss自身不受规则限制。'
        },
        phases: [
          { name: '规则阶段', hpThreshold: 200, description: '每2回合宣布一条简单规则' },
          { name: '强化阶段', hpThreshold: 100, description: '每回合宣布一条规则，且规则更加严格' },
          { name: '审判阶段', hpThreshold: 0, description: '同时宣布多条规则，违反惩罚提升至20点' }
        ],
        currentPhase: 1,
        phase: 'phase-1',
        faction: 'MACHINE',
        factionText: '机械阵营'
      },
      {
        id: 'BOSS_4',
        name: '终末狂徒',
        title: 'Final Madman',
        icon: '👹',
        hp: 280,
        maxHp: 280,
        difficulty: 'EXTREME',
        difficultyText: '极限',
        description: '彻底失控的疯狂存在，战斗会越来越疯狂。随着战斗进行，Boss会不断获得强化，同时战场环境也会恶化。',
        coreMechanic: {
          name: '疯狂污染',
          description: '每过3回合，战场进入"疯狂状态"：所有Roll点范围扩大（1-15），暴击率提升，但同时失误率也提升。Boss在疯狂状态下获得攻击力+50%，玩家获得速度+30%。'
        },
        phases: [
          { name: '躁动阶段', hpThreshold: 200, description: '每4回合进入一次疯狂状态' },
          { name: '狂乱阶段', hpThreshold: 100, description: '每3回合进入疯狂状态，Boss获得额外攻击次数' },
          { name: '崩坏阶段', hpThreshold: 0, description: '永久处于疯狂状态，Boss每回合攻击2次' }
        ],
        currentPhase: 1,
        phase: 'phase-1',
        faction: 'CHAOS',
        factionText: '混沌阵营'
      },
      {
        id: 'BOSS_FINAL',
        name: '命运之主',
        title: 'Lord of Fate',
        icon: '👁️',
        hp: 500,
        maxHp: 500,
        difficulty: 'NIGHTMARE',
        difficultyText: '噩梦',
        description: '掌控命运的最终Boss，拥有绝对的掌控感。可以预知玩家的行动，并改写战斗结果。',
        coreMechanic: {
          name: '命运审判',
          description: '每5回合，Boss发动"命运审判"：随机选择一名玩家，使其下回合的Roll点结果由Boss决定（1-100随机）。Boss可以选择让玩家大成功（Roll 100）或大失败（Roll 1）。'
        },
        phases: [
          { name: '观测阶段', hpThreshold: 350, description: 'Boss主要使用防御和预知能力，很少主动攻击' },
          { name: '干预阶段', hpThreshold: 200, description: 'Boss开始使用命运审判，并配合高伤害攻击' },
          { name: '裁决阶段', hpThreshold: 0, description: '每3回合发动命运审判，且Boss获得伤害免疫（每次最多受到50点伤害）' }
        ],
        currentPhase: 1,
        phase: 'phase-1',
        faction: 'FATE',
        factionText: '命运阵营'
      }
    ]
  },

  // 加载遗物数据
  loadRelicData() {
    const relics = gameModule.RELICS
    const relicList = Object.values(relics || {})
    
    // 处理遗物数据
    const processedRelics = relicList.map(relic => ({
      ...relic,
      rarityText: this.getRarityText(relic.rarity)
    }))
    
    this.setData({
      relicList: processedRelics
    })
  },

  // 获取稀有度文本
  getRarityText(rarity) {
    const rarityTexts = {
      'COMMON': '普通',
      'UNCOMMON': '稀有',
      'RARE': '史诗',
      'LEGENDARY': '传说',
      'FINISHER': '终结'
    }
    return rarityTexts[rarity] || rarity
  },

  // 获取风险等级文本
  getRiskText(riskLevel) {
    const riskTexts = {
      'SAFE': '安全',
      'MODERATE': '中等',
      'HIGH': '高风险',
      'EXTREME': '极限'
    }
    return riskTexts[riskLevel] || riskLevel
  },

  // 获取类型图标
  getTypeIcon(type) {
    const typeIcons = {
      'ATTACK': '⚔️',
      'DEFENSE': '🛡️',
      'SPECIAL': '✨',
      'CURSE': '💀'
    }
    return typeIcons[type] || '🃏'
  },

  // 获取阵营文本
  getFactionText(faction) {
    const factionTexts = {
      'GAMBLER': '赌徒阵营',
      'DEMON': '恶魔阵营',
      'MACHINE': '机械阵营',
      'CHAOS': '混沌阵营'
    }
    return factionTexts[faction] || faction
  },

  // 获取难度文本
  getDifficultyText(difficulty) {
    const difficultyTexts = {
      'EASY': '简单',
      'NORMAL': '普通',
      'HARD': '困难',
      'EXTREME': '极限',
      'NIGHTMARE': '噩梦'
    }
    return difficultyTexts[difficulty] || difficulty
  },

  // 获取AI类型文本
  getAITypeText(aiType) {
    const aiTypeTexts = {
      'AGGRESSIVE': '激进型',
      'DEFENSIVE': '防御型',
      'BALANCED': '平衡型',
      'RANDOM': '随机型',
      'CHAOTIC': '混乱型',
      'DECEPTIVE': '欺诈型',
      'PRECOGNITIVE': '预知型',
      'DOMINATING': '压制型'
    }
    return aiTypeTexts[aiType] || aiType
  },

  // 获取危险等级文本
  getDangerLevelText(dangerLevel) {
    const dangerLevelTexts = {
      'LOW': '低',
      'MEDIUM': '中',
      'HIGH': '高',
      'EXTREME': '极限',
      'BOSS': 'Boss'
    }
    return dangerLevelTexts[dangerLevel] || dangerLevel
  },

  // 获取敌人图标
  getEnemyIcon(enemyId) {
    const enemyIcons = {
      'joker_gambler': '🤡',
      'cheat': '🦊',
      'card_shark': '🦈',
      'fortune_teller': '🔮',
      'iron_guard': '🛡️',
      'mad_gambler': '🎰',
      'puppet_master': '🎭',
      'time_gambler': '⏰'
    }
    return enemyIcons[enemyId] || '👹'
  },

  // 显示卡牌详情
  showCardDetail(e) {
    const card = e.currentTarget.dataset.card

    // 效果类型中文映射
    const effectTypeMap = {
      'DAMAGE': '伤害',
      'DAMAGE_MULTIPLY': '伤害倍增',
      'DAMAGE_PER_MISSING_HP': '残血增伤',
      'SELF_DAMAGE': '自伤',
      'SELF_DAMAGE_HALF': '半额自伤',
      'SELF_DAMAGE_PERCENT': '百分比自伤',
      'GAMBLE_DOUBLE': '赌博双倍',
      'TRIPLE_GAMBLE': '三倍赌博',
      'ROLL_MIN_BOOST': 'Roll下限提升',
      'ROLL_MAX_BOOST': 'Roll上限提升',
      'GAIN_LUCK': '获得幸运',
      'ADD_LUCK_TO_ROLL': '幸运加成',
      'GAIN_HOT_HAND': '获得热手',
      'BONUS_PER_HOT_HAND': '热手加成',
      'GAIN_DEBT': '获得赌债',
      'DEBT_PAYMENT': '偿还赌债',
      'DELAYED_DAMAGE': '延迟伤害',
      'GAIN_BET_STACK': '获得赌注',
      'DAMAGE_PER_BET': '赌注伤害',
      'SHIELD': '护盾',
      'HEAL': '治疗',
      'HEAL_ON_LOW_HP_TRIGGER': '低血治疗',
      'REQUIRE_LOW_HP': '低血需求',
      'REQUIRE_CRITICAL_HP': '濒血需求',
      'BONUS_IF_LAST_CRIT': '暴击奖励',
      'FAKE_DISPLAY': '假信息',
      'PEEK_ENEMY_HAND': '偷看手牌',
      'COUNTER_ATTACK': '反击'
    }

    let effectText = ''
    if (card.effects && card.effects.length > 0) {
      effectText = card.effects.map(effect => {
        const typeName = effectTypeMap[effect.type] || effect.type
        let text = `• ${typeName}`
        if (effect.value !== undefined && effect.value !== null) {
          text += `: ${effect.value}`
        }
        if (effect.condition) {
          text += ` (条件: ${effect.condition})`
        }
        if (effect.duration) {
          text += ` [持续${effect.duration}回合]`
        }
        return text
      }).join('\n')
    }

    wx.showModal({
      title: `${card.name} ${card.tags ? card.tags[0] : ''}`,
      content: `${card.description}\n\n类型: ${card.type}\n稀有度: ${card.rarityText}\n风险: ${card.riskText || '未知'}\nRoll范围: ${card.rollRange.min}-${card.rollRange.max}\n速度: ${card.speed}${card.archetype ? '\n流派: ' + card.archetype : ''}\n\n效果:\n${effectText || '无'}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 显示敌人详情
  showEnemyDetail(e) {
    const enemy = e.currentTarget.dataset.enemy
    
    let content = `${enemy.description}\n\n生命: ${enemy.hp}\n难度: ${enemy.difficultyText}\nAI类型: ${enemy.aiTypeText}`
    
    if (enemy.specialMechanic) {
      content += `\n\n特殊机制: ${enemy.specialMechanic.name}\n${enemy.specialMechanic.description}`
    }
    
    if (enemy.abilities && enemy.abilities.length > 0) {
      content += '\n\n能力:'
      enemy.abilities.forEach(ability => {
        content += `\n• ${ability}`
      })
    }
    
    wx.showModal({
      title: `${enemy.icon} ${enemy.name}`,
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 显示Boss详情
  showBossDetail(e) {
    const boss = e.currentTarget.dataset.boss
    
    let content = `${boss.description}\n\n生命: ${boss.hp}/${boss.maxHp}\n难度: ${boss.difficultyText}\n阵营: ${boss.factionText}`
    
    if (boss.coreMechanic) {
      content += `\n\n核心机制: ${boss.coreMechanic.name}\n${boss.coreMechanic.description}`
    }
    
    if (boss.phases && boss.phases.length > 0) {
      content += '\n\n三阶段系统:'
      boss.phases.forEach((phase, index) => {
        content += `\n${index + 1}. ${phase.name} (HP ≤ ${phase.hpThreshold})`
        content += `\n   ${phase.description}`
      })
    }
    
    wx.showModal({
      title: `${boss.icon} ${boss.name} - ${boss.title}`,
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 返回首页
  goBack() {
    wx.navigateBack()
  }
})
