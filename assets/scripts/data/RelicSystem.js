/**
 * 遗物系统 - 心理博弈Roguelike卡牌游戏
 * 
 * 核心设计：
 * - 永久局内Buff
 * - 形成Build构筑
 * - 流派核心强化
 * - 稀有度分级
 */

// ==================== 遗物稀有度 ====================

const RelicRarity = {
  COMMON: 'COMMON',       // 普通
  UNCOMMON: 'UNCOMMON',   // 稀有
  RARE: 'RARE',           // 史诗
  LEGENDARY: 'LEGENDARY'  // 传说
};

// ==================== 遗物类型 ====================

const RelicType = {
  ROLL: 'ROLL',           // Roll相关
  INSIGHT: 'INSIGHT',     // 洞察相关
  GAMBLE: 'GAMBLE',       // 赌博相关
  MISDIRECT: 'MISDIRECT', // 误导相关
  COMBAT: 'COMBAT',       // 战斗相关
  SURVIVAL: 'SURVIVAL',   // 生存相关
  SPECIAL: 'SPECIAL'      // 特殊效果
};

// ==================== 遗物数据库 ====================

const RELICS = {
  // ========== Roll相关遗物 ==========
  
  loaded_dice: {
    id: 'loaded_dice',
    name: '灌铅骰子',
    description: '所有Roll最小值+1',
    flavor: '老千的必备工具',
    rarity: RelicRarity.COMMON,
    type: RelicType.ROLL,
    icon: '🎲',
    effect: {
      type: 'ROLL_MIN_BOOST',
      value: 1,
      scope: 'all_rolls'
    },
    unlockCondition: '完成1次游戏'
  },
  
  weighted_die: {
    id: 'weighted_die',
    name: '加重骰子',
    description: '所有Roll最大值+2',
    flavor: '让命运偏向你',
    rarity: RelicRarity.UNCOMMON,
    type: RelicType.ROLL,
    icon: '⚖️',
    effect: {
      type: 'ROLL_MAX_BOOST',
      value: 2,
      scope: 'all_rolls'
    },
    unlockCondition: '单次Roll出15+'
  },
  
  lucky_charm: {
    id: 'lucky_charm',
    name: '幸运符',
    description: '每3回合，下次Roll取最大值',
    flavor: '幸运女神的眷顾',
    rarity: RelicRarity.RARE,
    type: RelicType.ROLL,
    icon: '🍀',
    effect: {
      type: 'PERFECT_ROLL',
      interval: 3,
      trigger: 'turn_count'
    },
    unlockCondition: '连续获胜5次'
  },
  
  second_chance: {
    id: 'second_chance',
    name: '第二次机会',
    description: '首次Roll失败时，可以重Roll一次',
    flavor: '命运给你另一次机会',
    rarity: RelicRarity.RARE,
    type: RelicType.ROLL,
    icon: '🔄',
    effect: {
      type: 'REROLL_ONCE',
      trigger: 'on_lose_roll',
      oncePerBattle: true
    },
    unlockCondition: '在濒死状态下获胜'
  },
  
  extreme_gambler: {
    id: 'extreme_gambler',
    name: '极端赌徒',
    description: 'Roll范围变为1-25，但伤害波动±30%',
    flavor: '要么大赚，要么大亏',
    rarity: RelicRarity.LEGENDARY,
    type: RelicType.ROLL,
    icon: '🎰',
    effect: {
      type: 'EXTREME_ROLL',
      rollRange: { min: 1, max: 25 },
      damageVariance: 0.3
    },
    unlockCondition: '使用赌徒通关'
  },
  
  // ========== 洞察相关遗物 ==========
  
  crystal_ball: {
    id: 'crystal_ball',
    name: '水晶球',
    description: '游戏开始时获得2点洞察',
    flavor: '预见未来的一角',
    rarity: RelicRarity.COMMON,
    type: RelicType.INSIGHT,
    icon: '🔮',
    effect: {
      type: 'BONUS_INSIGHT',
      value: 2,
      trigger: 'game_start'
    },
    unlockCondition: '初始解锁'
  },
  
  mind_eye: {
    id: 'mind_eye',
    name: '心眼',
    description: '洞察消耗-1',
    flavor: '看透一切虚妄',
    rarity: RelicRarity.UNCOMMON,
    type: RelicType.INSIGHT,
    icon: '👁️',
    effect: {
      type: 'INSIGHT_DISCOUNT',
      value: 1
    },
    unlockCondition: '累计使用洞察10次'
  },
  
  truth_seeker: {
    id: 'truth_seeker',
    name: '真相追寻者',
    description: '使用洞察后，下回合Roll+2',
    flavor: '知识就是力量',
    rarity: RelicRarity.RARE,
    type: RelicType.INSIGHT,
    icon: '📖',
    effect: {
      type: 'INSIGHT_ROLL_BONUS',
      value: 2,
      duration: 1
    },
    unlockCondition: '单局使用洞察5次'
  },
  
  omniscient: {
    id: 'omniscient',
    name: '全视之眼',
    description: '始终可以看到敌方真实Roll范围',
    flavor: '没有任何秘密能逃过你的眼睛',
    rarity: RelicRarity.LEGENDARY,
    type: RelicType.INSIGHT,
    icon: '👁️‍🗨️',
    effect: {
      type: 'TRUE_SIGHT',
      scope: 'always'
    },
    unlockCondition: '使用魔术师通关'
  },
  
  // ========== 赌博相关遗物 ==========
  
  gamblers_faith: {
    id: 'gamblers_faith',
    name: '赌徒的信念',
    description: '赌博牌成功率+15%',
    flavor: '相信运气，运气就会眷顾你',
    rarity: RelicRarity.UNCOMMON,
    type: RelicType.GAMBLE,
    icon: '🎲',
    effect: {
      type: 'GAMBLE_SUCCESS_BOOST',
      value: 0.15
    },
    unlockCondition: '使用3张赌博牌获胜'
  },
  
  all_in_spirit: {
    id: 'all_in_spirit',
    name: 'All In之魂',
    description: 'All In牌伤害翻倍时，额外获得一回合',
    flavor: '要么全赢，要么全输',
    rarity: RelicRarity.RARE,
    type: RelicType.GAMBLE,
    icon: '💰',
    effect: {
      type: 'ALL_IN_EXTRA_TURN',
      trigger: 'on_all_in_success'
    },
    unlockCondition: '使用All In获胜3次'
  },
  
  fortune_favors: {
    id: 'fortune_favors',
    name: '勇者福运',
    description: '高风险牌Roll最小值+3',
    flavor: '命运眷顾勇敢者',
    rarity: RelicRarity.RARE,
    type: RelicType.GAMBLE,
    icon: '🍀',
    effect: {
      type: 'HIGH_RISK_ROLL_BOOST',
      value: 3,
      condition: 'high_risk_card'
    },
    unlockCondition: '使用10张高风险牌'
  },
  
  // ========== 误导相关遗物 ==========
  
  smoke_screen: {
    id: 'smoke_screen',
    name: '烟雾幕',
    description: '误导牌效果+50%',
    flavor: '看不见，摸不着',
    rarity: RelicRarity.UNCOMMON,
    type: RelicType.MISDIRECT,
    icon: '💨',
    effect: {
      type: 'MISDIRECT_BOOST',
      value: 0.5
    },
    unlockCondition: '成功误导敌人3次'
  },
  
  mirror_shard: {
    id: 'mirror_shard',
    name: '镜片碎片',
    description: '使用欺骗牌后，获得3点护盾',
    flavor: '虚虚实实，真真假假',
    rarity: RelicRarity.RARE,
    type: RelicType.MISDIRECT,
    icon: '🪞',
    effect: {
      type: 'DECEIVE_SHIELD',
      value: 3,
      trigger: 'on_deceive'
    },
    unlockCondition: '使用魔术师通关'
  },
  
  master_of_illusion: {
    id: 'master_of_illusion',
    name: '幻术大师',
    description: '敌方永远无法看到你的真实Roll范围',
    flavor: '你看到的只是我想让你看到的',
    rarity: RelicRarity.LEGENDARY,
    type: RelicType.MISDIRECT,
    icon: '🎭',
    effect: {
      type: 'PERMANENT_FAKE_DISPLAY',
      scope: 'always'
    },
    unlockCondition: '误导流通关'
  },
  
  // ========== 战斗相关遗物 ==========
  
  executioner_blade: {
    id: 'executioner_blade',
    name: '处刑者之刃',
    description: '对低血敌人伤害+30%',
    flavor: '给予致命一击',
    rarity: RelicRarity.UNCOMMON,
    type: RelicType.COMBAT,
    icon: '⚔️',
    effect: {
      type: 'EXECUTION_DAMAGE',
      value: 0.3,
      threshold: 0.3
    },
    unlockCondition: '斩杀3个低血敌人'
  },
  
  relentless_assault: {
    id: 'relentless_assault',
    name: '无情追击',
    description: '连续获胜时，每次伤害+20%',
    flavor: '不给敌人喘息的机会',
    rarity: RelicRarity.RARE,
    type: RelicType.COMBAT,
    icon: '⚡',
    effect: {
      type: 'WIN_STREAK_DAMAGE',
      value: 0.2,
      maxStacks: 3
    },
    unlockCondition: '连续获胜4次'
  },
  
  counter_master: {
    id: 'counter_master',
    name: '反击大师',
    description: '反击牌伤害+100%',
    flavor: '以彼之道，还施彼身',
    rarity: RelicRarity.RARE,
    type: RelicType.COMBAT,
    icon: '🛡️',
    effect: {
      type: 'COUNTER_DAMAGE_BOOST',
      value: 1.0
    },
    unlockCondition: '使用处刑者通关'
  },
  
  // ========== 生存相关遗物 ==========
  
  desperate_will: {
    id: 'desperate_will',
    name: '绝望意志',
    description: '生命低于20时，Roll+5',
    flavor: '绝境中爆发力量',
    rarity: RelicRarity.UNCOMMON,
    type: RelicType.SURVIVAL,
    icon: '🔥',
    effect: {
      type: 'LOW_HP_ROLL_BOOST',
      threshold: 20,
      value: 5
    },
    unlockCondition: '在生命低于10时获胜'
  },
  
  last_stand_power: {
    id: 'last_stand_power',
    name: '背水一战之力',
    description: '最后3张牌时，所有Roll+4',
    flavor: '无路可退，只能前进',
    rarity: RelicRarity.RARE,
    type: RelicType.SURVIVAL,
    icon: '💪',
    effect: {
      type: 'LOW_CARD_ROLL_BOOST',
      threshold: 3,
      value: 4
    },
    unlockCondition: '最后一张牌时获胜'
  },
  
  phoenix_feather: {
    id: 'phoenix_feather',
    name: '凤凰之羽',
    description: '首次生命归零时，恢复30生命并清空负面状态',
    flavor: '从灰烬中重生',
    rarity: RelicRarity.LEGENDARY,
    type: RelicType.SURVIVAL,
    icon: '🪶',
    effect: {
      type: 'REVIVE',
      healAmount: 30,
      oncePerRun: true
    },
    unlockCondition: '使用狂徒通关'
  },
  
  // ========== 特殊遗物 ==========
  
  double_edged_sword: {
    id: 'double_edged_sword',
    name: '双刃剑',
    description: '双方伤害+50%',
    flavor: '高风险，高回报',
    rarity: RelicRarity.UNCOMMON,
    type: RelicType.SPECIAL,
    icon: '⚔️',
    effect: {
      type: 'MUTUAL_DAMAGE_BOOST',
      value: 0.5
    },
    unlockCondition: '3回合内结束战斗'
  },
  
  time_warp: {
    id: 'time_warp',
    name: '时间扭曲',
    description: '每5回合，获得一个额外回合',
    flavor: '时间在你手中流转',
    rarity: RelicRarity.RARE,
    type: RelicType.SPECIAL,
    icon: '⏰',
    effect: {
      type: 'EXTRA_TURN',
      interval: 5
    },
    unlockCondition: '进行10回合以上的战斗'
  },
  
  collectors_coin: {
    id: 'collectors_coin',
    name: '收藏家硬币',
    description: '每持有一个遗物，Roll+1',
    flavor: '收藏的乐趣',
    rarity: RelicRarity.RARE,
    type: RelicType.SPECIAL,
    icon: '🪙',
    effect: {
      type: 'PER_RELIC_ROLL_BOOST',
      value: 1
    },
    unlockCondition: '单局获得5个遗物'
  },
  
  infinite_gamble: {
    id: 'infinite_gamble',
    name: '无限赌博',
    description: '牌库耗尽时，抽取"命运牌"（Roll 1-20）',
    flavor: '命运永远不会让你无牌可出',
    rarity: RelicRarity.LEGENDARY,
    type: RelicType.SPECIAL,
    icon: '♾️',
    effect: {
      type: 'INFINITE_CARDS',
      cardRollRange: { min: 1, max: 20 }
    },
    unlockCondition: '牌库耗尽后获胜'
  }
};

// ==================== 流派核心遗物组合 ====================

const BUILD_CORES = {
  // 误导流
  misdirect_build: {
    name: '幻影大师',
    description: '通过信息欺骗控制战局',
    coreRelics: ['smoke_screen', 'mirror_shard', 'master_of_illusion'],
    keyCards: ['mirror_image', 'smoke_bomb', 'illusion_strike'],
    strategy: '隐藏真实信息，误导对手，在对手误判时发动致命一击'
  },
  
  // 赌博流
  gamble_build: {
    name: '命运赌徒',
    description: '高风险高回报，依靠运气和概率',
    coreRelics: ['gamblers_faith', 'all_in_spirit', 'fortune_favors', 'extreme_gambler'],
    keyCards: ['all_in', 'double_or_nothing', 'high_roller'],
    strategy: '使用赌博牌追求极限伤害，通过遗物提高成功率和收益'
  },
  
  // 压制流
  suppress_build: {
    name: '战场统治者',
    description: '稳定压制，控制节奏',
    coreRelics: ['executioner_blade', 'relentless_assault', 'counter_master'],
    keyCards: ['suppress', 'counter_strike', 'iron_will'],
    strategy: '降低敌方Roll值，连续获胜滚雪球，寻找斩杀时机'
  },
  
  // 终结流
  finisher_build: {
    name: '死神使者',
    description: '低血爆发，绝境翻盘',
    coreRelics: ['desperate_will', 'last_stand_power', 'phoenix_feather'],
    keyCards: ['desperate_gamble', 'berserk', 'last_stand'],
    strategy: '故意卖血，在低血状态下发动超强终结技'
  },
  
  // 洞察流
  insight_build: {
    name: '全知者',
    description: '信息优势，精准决策',
    coreRelics: ['crystal_ball', 'mind_eye', 'truth_seeker', 'omniscient'],
    keyCards: ['mind_read', 'sleight_of_hand'],
    strategy: '最大化信息获取，通过洞察做出最优决策'
  }
};

// ==================== 遗物管理器 ====================

class RelicManager {
  constructor() {
    this.ownedRelics = [];
    this.unlockedRelics = new Set(['loaded_dice', 'crystal_ball']); // 初始解锁
  }

  static getInstance() {
    if (!RelicManager._instance) {
      RelicManager._instance = new RelicManager();
    }
    return RelicManager._instance;
  }

  // 获得遗物
  acquireRelic(relicId) {
    const relic = RELICS[relicId];
    if (!relic) return null;
    
    const instance = {
      ...relic,
      instanceId: `relic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      acquiredAt: Date.now()
    };
    
    this.ownedRelics.push(instance);
    console.log('[Relic] 获得遗物:', relic.name);
    return instance;
  }

  // 获取遗物效果
  getAllEffects() {
    const effects = {};
    
    for (const relic of this.ownedRelics) {
      if (relic.effect) {
        const type = relic.effect.type;
        if (!effects[type]) {
          effects[type] = [];
        }
        effects[type].push(relic.effect);
      }
    }
    
    return effects;
  }

  // 计算Roll加成
  calculateRollBoost(context = {}) {
    let minBoost = 0;
    let maxBoost = 0;
    
    for (const relic of this.ownedRelics) {
      const effect = relic.effect;
      
      switch (effect.type) {
        case 'ROLL_MIN_BOOST':
          if (effect.scope === 'all_rolls' || effect.scope === context.cardType) {
            minBoost += effect.value;
          }
          break;
          
        case 'ROLL_MAX_BOOST':
          if (effect.scope === 'all_rolls' || effect.scope === context.cardType) {
            maxBoost += effect.value;
          }
          break;
          
        case 'HIGH_RISK_ROLL_BOOST':
          if (context.isHighRisk && effect.condition === 'high_risk_card') {
            minBoost += effect.value;
          }
          break;
          
        case 'LOW_HP_ROLL_BOOST':
          if (context.playerHp <= effect.threshold) {
            minBoost += effect.value;
          }
          break;
          
        case 'LOW_CARD_ROLL_BOOST':
          if (context.cardsRemaining <= effect.threshold) {
            minBoost += effect.value;
          }
          break;
          
        case 'PER_RELIC_ROLL_BOOST':
          minBoost += effect.value * this.ownedRelics.length;
          break;
      }
    }
    
    return { minBoost, maxBoost };
  }

  // 检查是否解锁遗物
  unlockRelic(relicId) {
    if (RELICS[relicId] && !this.unlockedRelics.has(relicId)) {
      this.unlockedRelics.add(relicId);
      console.log('[Relic] 解锁遗物:', RELICS[relicId].name);
      return true;
    }
    return false;
  }

  // 获取已解锁遗物列表
  getUnlockedRelics() {
    return Array.from(this.unlockedRelics).map(id => RELICS[id]).filter(Boolean);
  }

  // 获取已拥有遗物
  getOwnedRelics() {
    return [...this.ownedRelics];
  }

  // 清空遗物（新游戏）
  clearRelics() {
    this.ownedRelics = [];
  }

  // 保存进度
  saveProgress() {
    const data = {
      unlockedRelics: Array.from(this.unlockedRelics),
      ownedRelics: this.ownedRelics
    };
    wx.setStorageSync('relic_progress', JSON.stringify(data));
  }

  // 加载进度
  loadProgress() {
    const saved = wx.getStorageSync('relic_progress');
    if (saved) {
      const data = JSON.parse(saved);
      this.unlockedRelics = new Set(data.unlockedRelics || ['loaded_dice', 'crystal_ball']);
      this.ownedRelics = data.ownedRelics || [];
      return true;
    }
    return false;
  }
}

// ==================== 导出 ====================

module.exports = {
  RelicRarity,
  RelicType,
  RELICS,
  BUILD_CORES,
  RelicManager
};
