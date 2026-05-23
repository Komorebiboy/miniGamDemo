/**
 * Roguelike闯关系统 - 心理博弈卡牌游戏
 * 
 * 核心机制：
 * 1. 闯关结构 - 多关卡，每关有不同敌人
 * 2. 奖励选择 - 胜利后二选一：删牌或拿牌
 * 3. 牌库管理 - 15张牌上限，牌打完即失败
 * 4. 资源积累 - 金币购买、特殊奖励
 */

// ==================== 游戏状态管理 ====================

const GameState = {
  currentStage: 0,
  playerClass: null,
  playerDeck: [],
  playerHp: 0,
  playerMaxHp: 0,
  gold: 0,
  specialItems: [],
  runHistory: [],
  isRunActive: false
};

// ==================== 奖励类型 ====================

const RewardType = {
  REMOVE_CARD: 'REMOVE_CARD',     // 删除一张牌
  ADD_CARD: 'ADD_CARD',           // 添加一张牌（三选一）
  UPGRADE_CARD: 'UPGRADE_CARD',   // 升级一张牌
  HEAL: 'HEAL',                   // 恢复生命
  GOLD: 'GOLD',                   // 金币
  SPECIAL_ITEM: 'SPECIAL_ITEM'    // 特殊道具
};

// ==================== 奖励配置 ====================

const REWARD_POOLS = {
  // 普通战斗奖励
  normal: {
    choices: 2,
    options: [
      { type: RewardType.REMOVE_CARD, weight: 50 },
      { type: RewardType.ADD_CARD, weight: 50 },
      { type: RewardType.HEAL, value: 15, weight: 30 },
      { type: RewardType.GOLD, value: 30, weight: 40 }
    ]
  },
  
  // Boss战奖励
  boss: {
    choices: 3,
    options: [
      { type: RewardType.REMOVE_CARD, weight: 40 },
      { type: RewardType.ADD_CARD, weight: 40 },
      { type: RewardType.UPGRADE_CARD, weight: 30 },
      { type: RewardType.HEAL, value: 30, weight: 25 },
      { type: RewardType.GOLD, value: 50, weight: 30 },
      { type: RewardType.SPECIAL_ITEM, weight: 20 }
    ]
  }
};

// ==================== 卡牌奖励池 ====================

const CARD_REWARD_POOLS = {
  // 赌徒卡牌池
  gambler: [
    { id: 'double_or_nothing', name: '孤注一掷', rarity: 'RARE' },
    { id: 'loaded_dice', name: '灌铅骰子', rarity: 'UNCOMMON' },
    { id: 'high_roller', name: '豪赌者', rarity: 'RARE' },
    { id: 'risky_bet', name: '冒险赌注', rarity: 'UNCOMMON' }
  ],
  
  // 魔术师卡牌池
  magician: [
    { id: 'mirror_image', name: '镜像术', rarity: 'RARE' },
    { id: 'mind_read', name: '读心术', rarity: 'UNCOMMON' },
    { id: 'sleight_of_hand', name: '妙手空空', rarity: 'RARE' },
    { id: 'smoke_bomb', name: '烟雾弹', rarity: 'UNCOMMON' }
  ],
  
  // 处刑者卡牌池
  executioner: [
    { id: 'counter_strike', name: '反击', rarity: 'UNCOMMON' },
    { id: 'suppress', name: '压制', rarity: 'UNCOMMON' },
    { id: 'iron_will', name: '钢铁意志', rarity: 'RARE' },
    { id: 'relentless', name: '无情追击', rarity: 'RARE' }
  ],
  
  // 狂徒卡牌池
  maniac: [
    { id: 'berserk', name: '狂暴', rarity: 'RARE' },
    { id: 'last_stand', name: '背水一战', rarity: 'UNCOMMON' },
    { id: 'adrenaline_rush', name: '肾上腺素', rarity: 'UNCOMMON' },
    { id: 'second_wind', name: '第二 wind', rarity: 'RARE' }
  ],
  
  // 通用卡牌池
  common: [
    { id: 'steady_strike', name: '稳健打击', rarity: 'COMMON' },
    { id: 'quick_thrust', name: '快速刺击', rarity: 'COMMON' },
    { id: 'defensive_stance', name: '防御姿态', rarity: 'COMMON' }
  ]
};

// ==================== 特殊道具 ====================

const SPECIAL_ITEMS = [
  {
    id: 'mechanical_core',
    name: '机械核心',
    description: 'Roll范围最小值+1',
    effect: { type: 'ROLL_MIN_BOOST', value: 1 },
    source: '机械裁决者'
  },
  {
    id: 'demon_contract',
    name: '恶魔契约',
    description: '生命低于20时，Roll+3',
    effect: { type: 'LOW_HP_ROLL_BOOST', threshold: 20, value: 3 },
    source: '恶魔庄家'
  },
  {
    id: 'lucky_coin',
    name: '幸运币',
    description: '每3回合，下次Roll取最大值',
    effect: { type: 'LUCKY_ROLL', interval: 3 },
    source: '商店'
  },
  {
    id: 'insight_lens',
    name: '洞察镜片',
    description: '游戏开始时额外获得2点洞察',
    effect: { type: 'BONUS_INSIGHT', value: 2 },
    source: '商店'
  }
];

// ==================== 游戏流程管理 ====================

class RoguelikeManager {
  constructor() {
    this.state = { ...GameState };
    this.runHistory = [];
  }

  static getInstance() {
    if (!RoguelikeManager._instance) {
      RoguelikeManager._instance = new RoguelikeManager();
    }
    return RoguelikeManager._instance;
  }

  // 开始新 run
  startRun(playerClass, classDeck) {
    this.state = {
      currentStage: 1,
      playerClass: playerClass,
      playerDeck: [...classDeck],
      playerHp: this._getStartingHp(playerClass),
      playerMaxHp: this._getStartingHp(playerClass),
      gold: 0,
      specialItems: [],
      runHistory: [],
      isRunActive: true
    };
    
    console.log('[Roguelike] 新游戏开始:', playerClass);
    return this.state;
  }

  // 获取职业初始生命
  _getStartingHp(playerClass) {
    const hpMap = {
      'GAMBLER': 70,
      'MAGICIAN': 75,
      'EXECUTIONER': 85,
      'MANIAC': 60
    };
    return hpMap[playerClass] || 70;
  }

  // 战斗胜利后获得奖励选择
  generateRewardOptions(isBoss = false) {
    const pool = isBoss ? REWARD_POOLS.boss : REWARD_POOLS.normal;
    const options = [];
    
    // 必定包含删牌和拿牌选项
    options.push({ type: RewardType.REMOVE_CARD, label: '删除一张牌' });
    options.push({ 
      type: RewardType.ADD_CARD, 
      label: '获得一张新牌',
      cardChoices: this._generateCardChoices()
    });
    
    // 随机额外选项
    const extraOptions = pool.options
      .filter(opt => opt.type !== RewardType.REMOVE_CARD && opt.type !== RewardType.ADD_CARD)
      .sort(() => Math.random() - 0.5)
      .slice(0, pool.choices - 2);
    
    extraOptions.forEach(opt => {
      options.push({
        type: opt.type,
        label: this._getRewardLabel(opt),
        value: opt.value
      });
    });
    
    return options;
  }

  // 生成卡牌选择（三选一）
  _generateCardChoices() {
    const classPool = CARD_REWARD_POOLS[this.state.playerClass.toLowerCase()] || [];
    const commonPool = CARD_REWARD_POOLS.common;
    
    // 2张职业牌 + 1张通用牌
    const choices = [
      ...this._pickRandom(classPool, 2),
      ...this._pickRandom(commonPool, 1)
    ];
    
    return choices.map(card => ({
      ...card,
      instanceId: `reward_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  _pickRandom(array, count) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  _getRewardLabel(option) {
    switch (option.type) {
      case RewardType.HEAL:
        return `恢复 ${option.value} 生命`;
      case RewardType.GOLD:
        return `获得 ${option.value} 金币`;
      case RewardType.UPGRADE_CARD:
        return '升级一张牌';
      case RewardType.SPECIAL_ITEM:
        return '特殊道具';
      default:
        return '未知奖励';
    }
  }

  // 应用奖励
  applyReward(rewardType, targetCard = null) {
    switch (rewardType) {
      case RewardType.REMOVE_CARD:
        if (targetCard) {
          this.state.playerDeck = this.state.playerDeck.filter(
            c => c.instanceId !== targetCard.instanceId
          );
          console.log('[Roguelike] 删除卡牌:', targetCard.name);
        }
        break;
        
      case RewardType.ADD_CARD:
        if (targetCard && this.state.playerDeck.length < 15) {
          this.state.playerDeck.push(targetCard);
          console.log('[Roguelike] 添加卡牌:', targetCard.name);
        }
        break;
        
      case RewardType.UPGRADE_CARD:
        if (targetCard) {
          this._upgradeCard(targetCard);
          console.log('[Roguelike] 升级卡牌:', targetCard.name);
        }
        break;
        
      case RewardType.HEAL:
        this.state.playerHp = Math.min(
          this.state.playerHp + reward.value,
          this.state.playerMaxHp
        );
        break;
        
      case RewardType.GOLD:
        this.state.gold += reward.value;
        break;
        
      case RewardType.SPECIAL_ITEM:
        const item = this._getRandomSpecialItem();
        this.state.specialItems.push(item);
        break;
    }
    
    return this.state;
  }

  // 升级卡牌
  _upgradeCard(card) {
    // 增加Roll范围
    if (card.rollRange) {
      card.rollRange.max += 2;
      card.rollRange.min += 1;
    }
    // 增加速度
    card.speed += 1;
    // 标记为已升级
    card.isUpgraded = true;
    card.name += '+';
  }

  // 获取随机特殊道具
  _getRandomSpecialItem() {
    return SPECIAL_ITEMS[Math.floor(Math.random() * SPECIAL_ITEMS.length)];
  }

  // 进入下一关
  nextStage() {
    this.state.currentStage++;
    console.log('[Roguelike] 进入第', this.state.currentStage, '关');
    return this.state.currentStage;
  }

  // 记录战斗历史
  recordBattleResult(result) {
    this.state.runHistory.push({
      stage: this.state.currentStage,
      result: result,
      timestamp: Date.now()
    });
  }

  // 检查游戏结束
  checkGameOver() {
    // 生命归零
    if (this.state.playerHp <= 0) {
      return { isOver: true, reason: 'DEATH', victory: false };
    }
    
    // 牌库耗尽
    if (this.state.playerDeck.length === 0) {
      return { isOver: true, reason: 'NO_CARDS', victory: false };
    }
    
    // 通关所有关卡
    if (this.state.currentStage > 4) {
      return { isOver: true, reason: 'VICTORY', victory: true };
    }
    
    return { isOver: false };
  }

  // 结束当前run
  endRun(victory) {
    this.state.isRunActive = false;
    
    const finalStats = {
      victory: victory,
      stagesCleared: this.state.currentStage - 1,
      gold: this.state.gold,
      specialItems: this.state.specialItems.length,
      history: this.state.runHistory
    };
    
    console.log('[Roguelike] Run结束:', finalStats);
    return finalStats;
  }

  // 获取当前状态
  getState() {
    return { ...this.state };
  }

  // 保存进度
  saveProgress() {
    wx.setStorageSync('roguelike_progress', JSON.stringify(this.state));
  }

  // 加载进度
  loadProgress() {
    const saved = wx.getStorageSync('roguelike_progress');
    if (saved) {
      this.state = JSON.parse(saved);
      return true;
    }
    return false;
  }
}

// ==================== 导出 ====================

module.exports = {
  RoguelikeManager,
  RewardType,
  REWARD_POOLS,
  CARD_REWARD_POOLS,
  SPECIAL_ITEMS,
  GameState
};
