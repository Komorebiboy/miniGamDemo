/**
 * 长期成长系统 - 心理博弈Roguelike卡牌游戏
 * 
 * 核心设计：
 * - 卡牌解锁
 * - 职业解锁
 * - Boss解锁
 * - 成就系统
 * - 遗物解锁
 * - 提高长期游玩动力
 */

// ==================== 成就系统 ====================

const AchievementType = {
  VICTORY: 'VICTORY',           // 通关相关
  COMBAT: 'COMBAT',             // 战斗相关
  GAMBLE: 'GAMBLE',             // 赌博相关
  BUILD: 'BUILD',               // 构筑相关
  SECRET: 'SECRET'              // 隐藏成就
};

const ACHIEVEMENTS = {
  // ========== 通关成就 ==========
  first_victory: {
    id: 'first_victory',
    name: '初胜',
    description: '首次通关',
    type: AchievementType.VICTORY,
    icon: '🏆',
    condition: { type: 'COMPLETE_RUN', count: 1 },
    reward: { type: 'UNLOCK_CARD', cardId: 'victory_lap' }
  },
  
  veteran_gambler: {
    id: 'veteran_gambler',
    name: '老练赌徒',
    description: '通关5次',
    type: AchievementType.VICTORY,
    icon: '🎰',
    condition: { type: 'COMPLETE_RUN', count: 5 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'veterans_luck' }
  },
  
  master_of_fate: {
    id: 'master_of_fate',
    name: '命运主宰',
    description: '通关10次',
    type: AchievementType.VICTORY,
    icon: '👑',
    condition: { type: 'COMPLETE_RUN', count: 10 },
    reward: { type: 'UNLOCK_CLASS', classId: 'FATE_WEAVER' }
  },
  
  perfect_run: {
    id: 'perfect_run',
    name: '完美通关',
    description: '满生命通关',
    type: AchievementType.VICTORY,
    icon: '💎',
    condition: { type: 'FULL_HP_VICTORY' },
    reward: { type: 'UNLOCK_RELIC', relicId: 'perfectionist' }
  },
  
  // ========== 职业成就 ==========
  gambler_master: {
    id: 'gambler_master',
    name: '赌徒大师',
    description: '使用赌徒通关',
    type: AchievementType.VICTORY,
    icon: '🎲',
    condition: { type: 'CLASS_VICTORY', classId: 'GAMBLER' },
    reward: { type: 'UNLOCK_CARD', cardId: 'jackpot' }
  },
  
  magician_master: {
    id: 'magician_master',
    name: '幻术大师',
    description: '使用魔术师通关',
    type: AchievementType.VICTORY,
    icon: '🎩',
    condition: { type: 'CLASS_VICTORY', classId: 'MAGICIAN' },
    reward: { type: 'UNLOCK_CARD', cardId: 'grand_finale' }
  },
  
  executioner_master: {
    id: 'executioner_master',
    name: '处刑者大师',
    description: '使用处刑者通关',
    type: AchievementType.VICTORY,
    icon: '⚔️',
    condition: { type: 'CLASS_VICTORY', classId: 'EXECUTIONER' },
    reward: { type: 'UNLOCK_CARD', cardId: 'death_sentence' }
  },
  
  maniac_master: {
    id: 'maniac_master',
    name: '狂徒大师',
    description: '使用狂徒通关',
    type: AchievementType.VICTORY,
    icon: '🔥',
    condition: { type: 'CLASS_VICTORY', classId: 'MANIAC' },
    reward: { type: 'UNLOCK_CARD', cardId: 'final_rampage' }
  },
  
  // ========== 战斗成就 ==========
  first_blood: {
    id: 'first_blood',
    name: '首杀',
    description: '首次击败敌人',
    type: AchievementType.COMBAT,
    icon: '⚔️',
    condition: { type: 'DEFEAT_ENEMY', count: 1 },
    reward: { type: 'GOLD', value: 50 }
  },
  
  boss_slayer: {
    id: 'boss_slayer',
    name: 'Boss杀手',
    description: '击败10个Boss',
    type: AchievementType.COMBAT,
    icon: '👹',
    condition: { type: 'DEFEAT_BOSS', count: 10 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'boss_slayer_badge' }
  },
  
  elite_hunter: {
    id: 'elite_hunter',
    name: '精英猎手',
    description: '击败20个精英敌人',
    type: AchievementType.COMBAT,
    icon: '🎯',
    condition: { type: 'DEFEAT_ELITE', count: 20 },
    reward: { type: 'UNLOCK_CARD', cardId: 'elite_slayer' }
  },
  
  comeback_king: {
    id: 'comeback_king',
    name: '翻盘之王',
    description: '在生命低于10时获胜10次',
    type: AchievementType.COMBAT,
    icon: '👑',
    condition: { type: 'LOW_HP_VICTORY', count: 10, threshold: 10 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'comeback_amulet' }
  },
  
  last_card_standing: {
    id: 'last_card_standing',
    name: '最后一张牌',
    description: '使用最后一张牌获胜',
    type: AchievementType.COMBAT,
    icon: '🃏',
    condition: { type: 'FINAL_CARD_VICTORY' },
    reward: { type: 'UNLOCK_RELIC', relicId: 'last_hope' }
  },
  
  // ========== 赌博成就 ==========
  risk_taker: {
    id: 'risk_taker',
    name: '冒险家',
    description: '使用50张高风险牌',
    type: AchievementType.GAMBLE,
    icon: '🎲',
    condition: { type: 'USE_HIGH_RISK_CARDS', count: 50 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'risk_takers_charm' }
  },
  
  all_in_winner: {
    id: 'all_in_winner',
    name: 'All In之王',
    description: '使用All In获胜5次',
    type: AchievementType.GAMBLE,
    icon: '💰',
    condition: { type: 'ALL_IN_VICTORY', count: 5 },
    reward: { type: 'UNLOCK_CARD', cardId: 'true_gamble' }
  },
  
  lucky_streak: {
    id: 'lucky_streak',
    name: '幸运连击',
    description: '连续获胜7次',
    type: AchievementType.GAMBLE,
    icon: '🍀',
    condition: { type: 'WIN_STREAK', count: 7 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'lucky_streak_charm' }
  },
  
  jackpot: {
    id: 'jackpot',
    name: ' jackpot',
    description: '单次Roll出20',
    type: AchievementType.GAMBLE,
    icon: '💎',
    condition: { type: 'MAX_ROLL', value: 20 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'jackpot_coin' }
  },
  
  // ========== 构筑成就 ==========
  deck_master: {
    id: 'deck_master',
    name: '牌库大师',
    description: '拥有15张牌通关',
    type: AchievementType.BUILD,
    icon: '📚',
    condition: { type: 'FULL_DECK_VICTORY', count: 15 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'deck_masters_book' }
  },
  
  minimalism: {
    id: 'minimalism',
    name: '极简主义',
    description: '使用少于8张牌通关',
    type: AchievementType.BUILD,
    icon: '📄',
    condition: { type: 'SMALL_DECK_VICTORY', maxCount: 8 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'minimalists_stone' }
  },
  
  relic_collector: {
    id: 'relic_collector',
    name: '遗物收藏家',
    description: '单局获得8个遗物',
    type: AchievementType.BUILD,
    icon: '🏺',
    condition: { type: 'COLLECT_RELICS', count: 8 },
    reward: { type: 'UNLOCK_RELIC', relicId: 'collectors_bag' }
  },
  
  misdirect_master: {
    id: 'misdirect_master',
    name: '误导大师',
    description: '使用误导流通关',
    type: AchievementType.BUILD,
    icon: '🎭',
    condition: { type: 'BUILD_VICTORY', buildId: 'misdirect' },
    reward: { type: 'UNLOCK_CARD', cardId: 'master_of_shadows' }
  },
  
  gamble_master: {
    id: 'gamble_master',
    name: '赌博大师',
    description: '使用赌博流通关',
    type: AchievementType.BUILD,
    icon: '🎰',
    condition: { type: 'BUILD_VICTORY', buildId: 'gamble' },
    reward: { type: 'UNLOCK_CARD', cardId: 'ultimate_gamble' }
  },
  
  // ========== 隐藏成就 ==========
  secret_deal: {
    id: 'secret_deal',
    name: '秘密交易',
    description: '在恶魔交易中选择隐藏选项',
    type: AchievementType.SECRET,
    icon: '🔮',
    condition: { type: 'SECRET_CHOICE', eventId: 'DEMON_DEAL' },
    reward: { type: 'UNLOCK_RELIC', relicId: 'secret_deal_relic' }
  },
  
  fate_denier: {
    id: 'fate_denier',
    name: '命运反抗者',
    description: '在命运选择中拒绝所有道路',
    type: AchievementType.SECRET,
    icon: '✊',
    condition: { type: 'DENY_ALL_PATHS' },
    reward: { type: 'UNLOCK_CLASS', classId: 'REBEL' }
  },
  
  true_gambler: {
    id: 'true_gambler',
    name: '真正的赌徒',
    description: '在最终赌注中选择All In并获胜',
    type: AchievementType.SECRET,
    icon: '💀',
    condition: { type: 'FINAL_WAGER_ALL_IN_WIN' },
    reward: { type: 'UNLOCK_RELIC', relicId: 'true_gamblers_soul' }
  }
};

// ==================== 解锁内容 ====================

const UNLOCKABLES = {
  // ========== 解锁卡牌 ==========
  cards: {
    victory_lap: {
      id: 'victory_lap',
      name: '胜利巡游',
      description: '获胜后，下回合Roll+5',
      type: 'SKILL',
      rarity: 'RARE',
      rollRange: { min: 0, max: 0 },
      speed: 5,
      effects: [{ type: 'POST_WIN_BOOST', value: 5 }],
      unlockRequirement: 'first_victory'
    },
    
    jackpot: {
      id: 'jackpot',
      name: ' jackpot',
      description: 'Roll出最大值时，伤害翻倍',
      type: 'ATTACK',
      rarity: 'LEGENDARY',
      rollRange: { min: 8, max: 12 },
      speed: 4,
      effects: [{ type: 'MAX_ROLL_DOUBLE', trigger: 'on_max_roll' }],
      unlockRequirement: 'gambler_master'
    },
    
    grand_finale: {
      id: 'grand_finale',
      name: '盛大终章',
      description: '最后一张牌时，Roll范围变为10-20',
      type: 'FINISHER',
      rarity: 'LEGENDARY',
      rollRange: { min: 10, max: 20 },
      speed: 3,
      effects: [{ type: 'FINAL_CARD_BOOST' }],
      unlockRequirement: 'magician_master'
    },
    
    death_sentence: {
      id: 'death_sentence',
      name: '死刑判决',
      description: '敌方生命低于25%时直接斩杀',
      type: 'FINISHER',
      rarity: 'LEGENDARY',
      rollRange: { min: 6, max: 10 },
      speed: 2,
      effects: [{ type: 'EXECUTE', threshold: 0.25 }],
      unlockRequirement: 'executioner_master'
    },
    
    final_rampage: {
      id: 'final_rampage',
      name: '最终暴走',
      description: '生命低于15时，Roll范围变为5-25',
      type: 'FINISHER',
      rarity: 'LEGENDARY',
      rollRange: { min: 5, max: 25 },
      speed: 2,
      effects: [{ type: 'DESPERATION_BOOST', threshold: 15 }],
      unlockRequirement: 'maniac_master'
    },
    
    true_gamble: {
      id: 'true_gamble',
      name: '真正的赌博',
      description: '50%造成50伤害，50%自己受到25伤害',
      type: 'FINISHER',
      rarity: 'LEGENDARY',
      rollRange: { min: 0, max: 0 },
      speed: 1,
      effects: [{ type: 'TRUE_COIN_FLIP', winDamage: 50, loseDamage: 25 }],
      unlockRequirement: 'all_in_winner'
    },
    
    master_of_shadows: {
      id: 'master_of_shadows',
      name: '暗影大师',
      description: '本回合完全隐形，敌方无法看到任何信息',
      type: 'SKILL',
      rarity: 'LEGENDARY',
      rollRange: { min: 0, max: 0 },
      speed: 8,
      effects: [{ type: 'FULL_STEALTH', duration: 1 }],
      unlockRequirement: 'misdirect_master'
    },
    
    ultimate_gamble: {
      id: 'ultimate_gamble',
      name: '终极赌博',
      description: '本回合Roll范围1-30，结果随机决定胜负',
      type: 'FINISHER',
      rarity: 'LEGENDARY',
      rollRange: { min: 1, max: 30 },
      speed: 1,
      effects: [{ type: 'ULTIMATE_GAMBLE' }],
      unlockRequirement: 'gamble_master'
    }
  },
  
  // ========== 解锁遗物 ==========
  relics: {
    veterans_luck: {
      id: 'veterans_luck',
      name: '老兵的运气',
      description: '每局游戏开始时，获得1个随机普通遗物',
      rarity: 'RARE',
      effect: { type: 'START_WITH_RELIC', rarity: 'COMMON' },
      unlockRequirement: 'veteran_gambler'
    },
    
    perfectionist: {
      id: 'perfectionist',
      name: '完美主义者',
      description: '满生命时，所有Roll+3',
      rarity: 'LEGENDARY',
      effect: { type: 'FULL_HP_ROLL_BOOST', value: 3 },
      unlockRequirement: 'perfect_run'
    },
    
    boss_slayer_badge: {
      id: 'boss_slayer_badge',
      name: 'Boss杀手徽章',
      description: '对Boss伤害+25%',
      rarity: 'RARE',
      effect: { type: 'BOSS_DAMAGE_BOOST', value: 0.25 },
      unlockRequirement: 'boss_slayer'
    },
    
    comeback_amulet: {
      id: 'comeback_amulet',
      name: '翻盘护符',
      description: '生命低于20时，Roll+3且伤害+30%',
      rarity: 'RARE',
      effect: { type: 'COMEBACK_BOOST', threshold: 20, rollBoost: 3, damageBoost: 0.3 },
      unlockRequirement: 'comeback_king'
    },
    
    last_hope: {
      id: 'last_hope',
      name: '最后的希望',
      description: '最后一张牌时，Roll取最大值',
      rarity: 'LEGENDARY',
      effect: { type: 'FINAL_CARD_PERFECT_ROLL' },
      unlockRequirement: 'last_card_standing'
    },
    
    risk_takers_charm: {
      id: 'risk_takers_charm',
      name: '冒险家护符',
      description: '高风险牌成功率+20%',
      rarity: 'UNCOMMON',
      effect: { type: 'HIGH_RISK_SUCCESS_BOOST', value: 0.2 },
      unlockRequirement: 'risk_taker'
    },
    
    lucky_streak_charm: {
      id: 'lucky_streak_charm',
      name: '连击护符',
      description: '每连续获胜一次，Roll+1（最多+5）',
      rarity: 'RARE',
      effect: { type: 'STREAK_ROLL_BOOST', maxStacks: 5 },
      unlockRequirement: 'lucky_streak'
    },
    
    jackpot_coin: {
      id: 'jackpot_coin',
      name: ' jackpot硬币',
      description: 'Roll出最大值时，获得10金币',
      rarity: 'UNCOMMON',
      effect: { type: 'MAX_ROLL_GOLD', value: 10 },
      unlockRequirement: 'jackpot'
    },
    
    deck_masters_book: {
      id: 'deck_masters_book',
      name: '牌库大师之书',
      description: '每有5张牌，Roll+1',
      rarity: 'RARE',
      effect: { type: 'PER_5_CARDS_ROLL_BOOST', value: 1 },
      unlockRequirement: 'deck_master'
    },
    
    minimalists_stone: {
      id: 'minimalists_stone',
      name: '极简主义者之石',
      description: '牌库少于8张时，所有Roll+2',
      rarity: 'RARE',
      effect: { type: 'SMALL_DECK_ROLL_BOOST', threshold: 8, value: 2 },
      unlockRequirement: 'minimalism'
    },
    
    collectors_bag: {
      id: 'collectors_bag',
      name: '收藏家背包',
      description: '可以携带10个遗物（原为无上限）',
      rarity: 'LEGENDARY',
      effect: { type: 'INCREASE_RELIC_LIMIT', value: 10 },
      unlockRequirement: 'relic_collector'
    },
    
    true_gamblers_soul: {
      id: 'true_gamblers_soul',
      name: '真正赌徒的灵魂',
      description: '所有赌博牌成功率+25%，失败时只受到一半伤害',
      rarity: 'LEGENDARY',
      effect: { type: 'TRUE_GAMBLER', successBoost: 0.25, damageReduction: 0.5 },
      unlockRequirement: 'true_gambler'
    }
  },
  
  // ========== 解锁职业 ==========
  classes: {
    FATE_WEAVER: {
      id: 'FATE_WEAVER',
      name: '命运编织者',
      description: '操控命运，预知未来',
      icon: '🕸️',
      color: '#9400D3',
      startingHp: 65,
      specialMechanic: '命运丝线 - 每回合可以预览下回合的Roll结果',
      unlockRequirement: 'master_of_fate'
    },
    
    REBEL: {
      id: 'REBEL',
      name: '反抗者',
      description: '反抗命运，打破规则',
      icon: '✊',
      color: '#DC143C',
      startingHp: 55,
      specialMechanic: '规则破坏 - 每3回合可以无视一次规则限制',
      unlockRequirement: 'fate_denier'
    }
  }
};

// ==================== 进度管理器 ====================

class ProgressionManager {
  constructor() {
    this.unlockedCards = new Set();
    this.unlockedRelics = new Set();
    this.unlockedClasses = new Set(['GAMBLER', 'MAGICIAN', 'EXECUTIONER', 'MANIAC']);
    this.completedAchievements = new Set();
    this.totalRuns = 0;
    this.totalVictories = 0;
    this.statistics = {
      enemiesDefeated: 0,
      bossesDefeated: 0,
      goldEarned: 0,
      cardsPlayed: 0,
      maxRoll: 0
    };
  }

  static getInstance() {
    if (!ProgressionManager._instance) {
      ProgressionManager._instance = new ProgressionManager();
    }
    return ProgressionManager._instance;
  }

  // 检查成就
  checkAchievements(event, data = {}) {
    const unlocked = [];
    
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (this.completedAchievements.has(id)) continue;
      
      if (this._checkCondition(achievement.condition, event, data)) {
        this.completedAchievements.add(id);
        unlocked.push(achievement);
        
        // 应用奖励
        this._applyReward(achievement.reward);
        
        console.log('[Progression] 解锁成就:', achievement.name);
      }
    }
    
    return unlocked;
  }

  // 检查条件
  _checkCondition(condition, event, data) {
    switch (condition.type) {
      case 'COMPLETE_RUN':
        return event === 'RUN_COMPLETE' && this.totalVictories >= condition.count;
      
      case 'CLASS_VICTORY':
        return event === 'VICTORY' && data.classId === condition.classId;
      
      case 'DEFEAT_ENEMY':
        return event === 'ENEMY_DEFEATED' && this.statistics.enemiesDefeated >= condition.count;
      
      case 'DEFEAT_BOSS':
        return event === 'BOSS_DEFEATED' && this.statistics.bossesDefeated >= condition.count;
      
      case 'LOW_HP_VICTORY':
        return event === 'VICTORY' && data.finalHp <= condition.threshold;
      
      case 'USE_HIGH_RISK_CARDS':
        // 需要统计
        return false;
      
      case 'ALL_IN_VICTORY':
        // 需要统计
        return false;
      
      case 'WIN_STREAK':
        return data.streak >= condition.count;
      
      case 'MAX_ROLL':
        return data.rollValue >= condition.value;
      
      default:
        return false;
    }
  }

  // 应用奖励
  _applyReward(reward) {
    switch (reward.type) {
      case 'UNLOCK_CARD':
        this.unlockedCards.add(reward.cardId);
        break;
      
      case 'UNLOCK_RELIC':
        this.unlockedRelics.add(reward.relicId);
        break;
      
      case 'UNLOCK_CLASS':
        this.unlockedClasses.add(reward.classId);
        break;
      
      case 'GOLD':
        // 添加金币到存档
        break;
    }
  }

  // 更新统计
  updateStatistics(key, value) {
    if (this.statistics[key] !== undefined) {
      this.statistics[key] += value;
    }
  }

  // 记录胜利
  recordVictory(classId, data = {}) {
    this.totalVictories++;
    this.checkAchievements('VICTORY', { classId, ...data });
  }

  // 记录游戏完成
  recordRunComplete(victory) {
    this.totalRuns++;
    if (victory) {
      this.recordVictory();
    }
    this.checkAchievements('RUN_COMPLETE');
  }

  // 获取解锁状态
  getUnlockStatus() {
    return {
      cards: Array.from(this.unlockedCards),
      relics: Array.from(this.unlockedRelics),
      classes: Array.from(this.unlockedClasses),
      achievements: Array.from(this.completedAchievements)
    };
  }

  // 保存进度
  saveProgress() {
    const data = {
      unlockedCards: Array.from(this.unlockedCards),
      unlockedRelics: Array.from(this.unlockedRelics),
      unlockedClasses: Array.from(this.unlockedClasses),
      completedAchievements: Array.from(this.completedAchievements),
      totalRuns: this.totalRuns,
      totalVictories: this.totalVictories,
      statistics: this.statistics
    };
    wx.setStorageSync('progression_data', JSON.stringify(data));
  }

  // 加载进度
  loadProgress() {
    const saved = wx.getStorageSync('progression_data');
    if (saved) {
      const data = JSON.parse(saved);
      this.unlockedCards = new Set(data.unlockedCards || []);
      this.unlockedRelics = new Set(data.unlockedRelics || []);
      this.unlockedClasses = new Set(data.unlockedClasses || ['GAMBLER', 'MAGICIAN', 'EXECUTIONER', 'MANIAC']);
      this.completedAchievements = new Set(data.completedAchievements || []);
      this.totalRuns = data.totalRuns || 0;
      this.totalVictories = data.totalVictories || 0;
      this.statistics = data.statistics || this.statistics;
      return true;
    }
    return false;
  }
}

// ==================== 导出 ====================

module.exports = {
  AchievementType,
  ACHIEVEMENTS,
  UNLOCKABLES,
  ProgressionManager
};
