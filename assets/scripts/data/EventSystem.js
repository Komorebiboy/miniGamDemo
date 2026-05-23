/**
 * 随机事件系统 - 心理博弈Roguelike卡牌游戏
 * 
 * 核心设计：
 * - 高风险随机事件
 * - 恶魔交易、命运轮盘等
 * - 提高重复游玩体验
 */

// ==================== 事件类型 ====================

const EventType = {
  DEMON_DEAL: 'DEMON_DEAL',         // 恶魔交易
  FATE_WHEEL: 'FATE_WHEEL',         // 命运轮盘
  GAMBLER_GAME: 'GAMBLER_GAME',     // 老千赌局
  CURSE_CONTRACT: 'CURSE_CONTRACT', // 诅咒契约
  WELCOME_BONUS: 'WELCOME_BONUS',   // 欢迎奖励
  NEWBIE_LUCK: 'NEWBIE_LUCK',       // 新手运
  CHEAT_DETECTION: 'CHEAT_DETECTION', // 作弊检测
  TRAP_ROOM: 'TRAP_ROOM',           // 陷阱房间
  SYSTEM_GLITCH: 'SYSTEM_GLITCH',   // 系统故障
  FAIRNESS_TEST: 'FAIRNESS_TEST',   // 公平测试
  DEBT_OFFER: 'DEBT_OFFER',         // 债务提议
  SOUL_TRADE: 'SOUL_TRADE',         // 灵魂交易
  FINAL_WAGER: 'FINAL_WAGER',       // 最终赌注
  DESTINY_CHOICE: 'DESTINY_CHOICE'  // 命运选择
};

// ==================== 事件数据库 ====================

const EVENTS = {
  // ========== 恶魔交易 ==========
  [EventType.DEMON_DEAL]: {
    id: EventType.DEMON_DEAL,
    name: '恶魔的交易',
    description: '一个恶魔出现在你面前，提出了一个诱人的交易...',
    icon: '👿',
    color: '#8B0000',
    choices: [
      {
        id: 'accept_power',
        text: '接受力量',
        description: '获得一张强力卡牌，但失去10生命',
        effect: {
          type: 'ADD_CARD',
          cardType: 'powerful',
          cost: { hp: 10 }
        },
        risk: 'medium'
      },
      {
        id: 'accept_gold',
        text: '接受金币',
        description: '获得100金币，但下回合Roll-3',
        effect: {
          type: 'ADD_GOLD',
          value: 100,
          cost: { nextRollPenalty: 3 }
        },
        risk: 'low'
      },
      {
        id: 'refuse',
        text: '拒绝交易',
        description: '什么都不发生',
        effect: { type: 'NOTHING' },
        risk: 'none'
      }
    ]
  },

  // ========== 命运轮盘 ==========
  [EventType.FATE_WHEEL]: {
    id: EventType.FATE_WHEEL,
    name: '命运轮盘',
    description: '一个神秘的轮盘在你面前旋转，决定你的命运...',
    icon: '🎡',
    color: '#FFD700',
    choices: [
      {
        id: 'spin_once',
        text: '转动一次',
        description: '随机获得：+20生命 / +50金币 / 一张稀有卡 / 失去10生命',
        effect: {
          type: 'RANDOM_REWARD',
          pool: [
            { type: 'HEAL', value: 20, weight: 25 },
            { type: 'GOLD', value: 50, weight: 25 },
            { type: 'CARD', rarity: 'RARE', weight: 25 },
            { type: 'DAMAGE', value: 10, weight: 25 }
          ]
        },
        risk: 'high'
      },
      {
        id: 'spin_twice',
        text: '转动两次（高风险）',
        description: '两次结果叠加，但负面效果翻倍',
        effect: {
          type: 'DOUBLE_SPIN',
          pool: [
            { type: 'HEAL', value: 20, weight: 25 },
            { type: 'GOLD', value: 50, weight: 25 },
            { type: 'CARD', rarity: 'RARE', weight: 25 },
            { type: 'DAMAGE', value: 10, weight: 25 }
          ]
        },
        risk: 'extreme'
      },
      {
        id: 'walk_away',
        text: '离开',
        description: '不冒险',
        effect: { type: 'NOTHING' },
        risk: 'none'
      }
    ]
  },

  // ========== 老千赌局 ==========
  [EventType.GAMBLER_GAME]: {
    id: EventType.GAMBLER_GAME,
    name: '老千的赌局',
    description: '一个可疑的赌徒邀请你参加一场特殊的赌局...',
    icon: '🎲',
    color: '#8B4513',
    choices: [
      {
        id: 'play_fair',
        text: '公平游戏',
        description: '50%赢得遗物，50%失去10生命',
        effect: {
          type: 'COIN_FLIP',
          win: { type: 'RELIC', rarity: 'UNCOMMON' },
          lose: { type: 'DAMAGE', value: 10 }
        },
        risk: 'medium'
      },
      {
        id: 'play_cheat',
        text: '尝试作弊',
        description: '70%赢得遗物，但30%被发现，失去20生命',
        effect: {
          type: 'WEIGHTED_COIN_FLIP',
          winChance: 0.7,
          win: { type: 'RELIC', rarity: 'RARE' },
          lose: { type: 'DAMAGE', value: 20 }
        },
        risk: 'high'
      },
      {
        id: 'watch_only',
        text: '只看不玩',
        description: '获得1点洞察',
        effect: { type: 'INSIGHT', value: 1 },
        risk: 'none'
      }
    ]
  },

  // ========== 诅咒契约 ==========
  [EventType.CURSE_CONTRACT]: {
    id: EventType.CURSE_CONTRACT,
    name: '诅咒契约',
    description: '一份古老的契约飘到你面前，上面写满了神秘的符文...',
    icon: '📜',
    color: '#4B0082',
    choices: [
      {
        id: 'sign_blood',
        text: '血之契约',
        description: '所有Roll+2，但每回合失去2生命',
        effect: {
          type: 'CURSE_BUFF',
          buff: { rollBoost: 2 },
          curse: { hpLossPerTurn: 2 }
        },
        risk: 'high'
      },
      {
        id: 'sign_soul',
        text: '灵魂契约',
        description: '获得传说遗物，但无法恢复生命',
        effect: {
          type: 'SOUL_CONTRACT',
          gain: { type: 'RELIC', rarity: 'LEGENDARY' },
          cost: { noHealing: true }
        },
        risk: 'extreme'
      },
      {
        id: 'burn_contract',
        text: '烧毁契约',
        description: '获得10金币',
        effect: { type: 'GOLD', value: 10 },
        risk: 'none'
      }
    ]
  },

  // ========== 欢迎奖励（区域1专属）==========
  [EventType.WELCOME_BONUS]: {
    id: EventType.WELCOME_BONUS,
    name: '赌场欢迎礼',
    description: '赌场为新玩家准备了欢迎礼物！',
    icon: '🎁',
    color: '#FFD700',
    choices: [
      {
        id: 'take_gold',
        text: '拿取金币',
        description: '获得30金币',
        effect: { type: 'GOLD', value: 30 },
        risk: 'none'
      },
      {
        id: 'take_card',
        text: '拿取卡牌',
        description: '获得一张随机卡牌',
        effect: { type: 'ADD_CARD', rarity: 'COMMON' },
        risk: 'none'
      },
      {
        id: 'gamble_bonus',
        text: '赌博加成',
        description: '50%获得100金币，50%什么都没有',
        effect: {
          type: 'COIN_FLIP',
          win: { type: 'GOLD', value: 100 },
          lose: { type: 'NOTHING' }
        },
        risk: 'low'
      }
    ]
  },

  // ========== 新手运（区域1专属）==========
  [EventType.NEWBIE_LUCK]: {
    id: EventType.NEWBIE_LUCK,
    name: '新手运',
    description: '幸运女神眷顾着你！',
    icon: '🍀',
    color: '#00FF00',
    choices: [
      {
        id: 'accept_luck',
        text: '接受好运',
        description: '下3场战斗Roll+2',
        effect: { type: 'TEMP_ROLL_BOOST', value: 2, duration: 3 },
        risk: 'none'
      }
    ],
    forced: true
  },

  // ========== 作弊检测（区域2专属）==========
  [EventType.CHEAT_DETECTION]: {
    id: EventType.CHEAT_DETECTION,
    name: '作弊检测',
    description: '赌场警卫怀疑你作弊，正在检查你...',
    icon: '👮',
    color: '#FF0000',
    choices: [
      {
        id: 'bribe',
        text: '贿赂（50金币）',
        description: '支付50金币，无事发生',
        effect: { type: 'PAY_GOLD', value: 50 },
        condition: { minGold: 50 },
        risk: 'low'
      },
      {
        id: 'convince',
        text: '说服',
        description: '50%成功，50%被罚款30金币',
        effect: {
          type: 'COIN_FLIP',
          win: { type: 'NOTHING' },
          lose: { type: 'PAY_GOLD', value: 30 }
        },
        risk: 'medium'
      },
      {
        id: 'run',
        text: '逃跑',
        description: '失去10生命，跳过下一场战斗',
        effect: { type: 'DAMAGE_AND_SKIP', damage: 10, skipBattles: 1 },
        risk: 'high'
      }
    ]
  },

  // ========== 陷阱房间（区域2专属）==========
  [EventType.TRAP_ROOM]: {
    id: EventType.TRAP_ROOM,
    name: '陷阱房间',
    description: '你走进了一个布满陷阱的房间！',
    icon: '🕸️',
    color: '#8B4513',
    choices: [
      {
        id: 'careful',
        text: '小心通过',
        description: '失去5生命，获得一个遗物',
        effect: {
          type: 'DAMAGE_AND_REWARD',
          damage: 5,
          reward: { type: 'RELIC', rarity: 'COMMON' }
        },
        risk: 'medium'
      },
      {
        id: 'rush',
        text: '快速冲过',
        description: '失去15生命，获得两个遗物',
        effect: {
          type: 'DAMAGE_AND_REWARD',
          damage: 15,
          reward: { type: 'RELIC', rarity: 'UNCOMMON', count: 2 }
        },
        risk: 'high'
      },
      {
        id: 'find_another_way',
        text: '寻找其他路',
        description: '什么都不发生，但浪费时间',
        effect: { type: 'TIME_PENALTY', value: 1 },
        risk: 'low'
      }
    ]
  },

  // ========== 系统故障（区域3专属）==========
  [EventType.SYSTEM_GLITCH]: {
    id: EventType.SYSTEM_GLITCH,
    name: '系统故障',
    description: '机械系统出现故障，规则变得混乱...',
    icon: '⚠️',
    color: '#FFA500',
    choices: [
      {
        id: 'exploit',
        text: '利用故障',
        description: '下一场战斗Roll范围+2，但敌方也+2',
        effect: {
          type: 'MUTUAL_GLITCH',
          rollBoost: 2,
          duration: 1
        },
        risk: 'medium'
      },
      {
        id: 'repair',
        text: '修复系统',
        description: '获得20金币',
        effect: { type: 'GOLD', value: 20 },
        risk: 'none'
      },
      {
        id: 'ignore',
        text: '无视故障',
        description: '50%无事，50%下一场战斗Roll-2',
        effect: {
          type: 'COIN_FLIP',
          win: { type: 'NOTHING' },
          lose: { type: 'TEMP_ROLL_PENALTY', value: 2, duration: 1 }
        },
        risk: 'low'
      }
    ]
  },

  // ========== 公平测试（区域3专属）==========
  [EventType.FAIRNESS_TEST]: {
    id: EventType.FAIRNESS_TEST,
    name: '公平测试',
    description: '机械裁决者要求你通过公平测试...',
    icon: '⚖️',
    color: '#708090',
    choices: [
      {
        id: 'accept_test',
        text: '接受测试',
        description: '下一场战斗双方Roll都取平均值',
        effect: { type: 'FAIR_BATTLE', duration: 1 },
        reward: { type: 'RELIC', rarity: 'RARE' },
        risk: 'medium'
      },
      {
        id: 'refuse_test',
        text: '拒绝测试',
        description: '失去15生命',
        effect: { type: 'DAMAGE', value: 15 },
        risk: 'high'
      }
    ]
  },

  // ========== 债务提议（区域4专属）==========
  [EventType.DEBT_OFFER]: {
    id: EventType.DEBT_OFFER,
    name: '债务提议',
    description: '恶魔庄家向你提供了一个"优惠"的贷款...',
    icon: '💰',
    color: '#8B0000',
    choices: [
      {
        id: 'small_loan',
        text: '小额贷款',
        description: '获得50金币，下一场战斗受到5额外伤害',
        effect: {
          type: 'LOAN',
          gold: 50,
          debt: { extraDamage: 5, duration: 1 }
        },
        risk: 'low'
      },
      {
        id: 'large_loan',
        text: '大额贷款',
        description: '获得150金币，每场战斗受到10额外伤害直到还清',
        effect: {
          type: 'LOAN',
          gold: 150,
          debt: { extraDamage: 10, untilPaid: true }
        },
        risk: 'high'
      },
      {
        id: 'refuse',
        text: '拒绝',
        description: '什么都不发生',
        effect: { type: 'NOTHING' },
        risk: 'none'
      }
    ]
  },

  // ========== 灵魂交易（区域4专属）==========
  [EventType.SOUL_TRADE]: {
    id: EventType.SOUL_TRADE,
    name: '灵魂交易',
    description: '一个恶魔想要购买你的灵魂碎片...',
    icon: '👻',
    color: '#4B0082',
    choices: [
      {
        id: 'trade_small',
        text: '交易一小部分',
        description: '失去5最大生命，获得传说遗物',
        effect: {
          type: 'MAX_HP_TRADE',
          maxHpCost: 5,
          reward: { type: 'RELIC', rarity: 'LEGENDARY' }
        },
        risk: 'high'
      },
      {
        id: 'trade_large',
        text: '交易大部分',
        description: '失去15最大生命，获得两个传说遗物',
        effect: {
          type: 'MAX_HP_TRADE',
          maxHpCost: 15,
          reward: { type: 'RELIC', rarity: 'LEGENDARY', count: 2 }
        },
        risk: 'extreme'
      },
      {
        id: 'keep_soul',
        text: '保留灵魂',
        description: '获得10金币（恶魔的小费）',
        effect: { type: 'GOLD', value: 10 },
        risk: 'none'
      }
    ]
  },

  // ========== 最终赌注（区域5专属）==========
  [EventType.FINAL_WAGER]: {
    id: EventType.FINAL_WAGER,
    name: '最终赌注',
    description: '命运主宰提出最后的赌注...',
    icon: '🎰',
    color: '#FFD700',
    choices: [
      {
        id: 'all_in',
        text: 'All In',
        description: '50%直接获胜，50%直接失败',
        effect: {
          type: 'ALL_IN_WAGER',
          win: { type: 'INSTANT_VICTORY' },
          lose: { type: 'INSTANT_DEFEAT' }
        },
        risk: 'extreme'
      },
      {
        id: 'safe_bet',
        text: '稳妥赌注',
        description: '获得一个强力遗物，继续战斗',
        effect: { type: 'RELIC', rarity: 'LEGENDARY' },
        risk: 'low'
      }
    ]
  },

  // ========== 命运选择（区域5专属）==========
  [EventType.DESTINY_CHOICE]: {
    id: EventType.DESTINY_CHOICE,
    name: '命运选择',
    description: '命运在你面前展开三条道路...',
    icon: '🔮',
    color: '#9370DB',
    choices: [
      {
        id: 'path_power',
        text: '力量之路',
        description: '所有Roll+3，但无法使用防御牌',
        effect: {
          type: 'PATH_BLESSING',
          blessing: { rollBoost: 3 },
          restriction: { noDefense: true }
        },
        risk: 'high'
      },
      {
        id: 'path_wisdom',
        text: '智慧之路',
        description: '始终可以看到敌方真实信息，但Roll-2',
        effect: {
          type: 'PATH_BLESSING',
          blessing: { trueSight: true },
          restriction: { rollPenalty: 2 }
        },
        risk: 'medium'
      },
      {
        id: 'path_luck',
        text: '幸运之路',
        description: '所有赌博牌成功率+25%，但非赌博牌Roll-1',
        effect: {
          type: 'PATH_BLESSING',
          blessing: { gambleBoost: 0.25 },
          restriction: { nonGamblePenalty: 1 }
        },
        risk: 'medium'
      }
    ]
  }
};

// ==================== 事件管理器 ====================

class EventManager {
  constructor() {
    this.activeEffects = [];
    this.eventHistory = [];
  }

  static getInstance() {
    if (!EventManager._instance) {
      EventManager._instance = new EventManager();
    }
    return EventManager._instance;
  }

  // 获取随机事件
  getRandomEvent(areaId, excludeEvents = []) {
    const areaEvents = this._getAreaEvents(areaId);
    const availableEvents = areaEvents.filter(e => !excludeEvents.includes(e));
    
    if (availableEvents.length === 0) return null;
    
    const eventId = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    return EVENTS[eventId];
  }

  // 获取区域专属事件
  _getAreaEvents(areaId) {
    const areaEventMap = {
      'CASINO_ENTRANCE': [EventType.WELCOME_BONUS, EventType.NEWBIE_LUCK, EventType.DEMON_DEAL],
      'CHEATERS_DEN': [EventType.CHEAT_DETECTION, EventType.TRAP_ROOM, EventType.GAMBLER_GAME],
      'MECHANICAL_FLOOR': [EventType.SYSTEM_GLITCH, EventType.FAIRNESS_TEST, EventType.FATE_WHEEL],
      'DEMON_VAULT': [EventType.DEBT_OFFER, EventType.SOUL_TRADE, EventType.CURSE_CONTRACT],
      'FATE_ARENA': [EventType.FINAL_WAGER, EventType.DESTINY_CHOICE]
    };
    
    return areaEventMap[areaId] || [EventType.DEMON_DEAL, EventType.FATE_WHEEL];
  }

  // 执行事件选择
  executeChoice(eventId, choiceId, gameState) {
    const event = EVENTS[eventId];
    if (!event) return null;
    
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return null;
    
    const result = this._applyEffect(choice.effect, gameState);
    
    this.eventHistory.push({
      event: eventId,
      choice: choiceId,
      result: result,
      timestamp: Date.now()
    });
    
    return result;
  }

  // 应用效果
  _applyEffect(effect, gameState) {
    switch (effect.type) {
      case 'ADD_CARD':
        return { type: 'CARD', rarity: effect.rarity || 'COMMON' };
        
      case 'ADD_GOLD':
        return { type: 'GOLD', value: effect.value };
        
      case 'HEAL':
        return { type: 'HEAL', value: effect.value };
        
      case 'DAMAGE':
        return { type: 'DAMAGE', value: effect.value };
        
      case 'RELIC':
        return { type: 'RELIC', rarity: effect.rarity || 'COMMON' };
        
      case 'INSIGHT':
        return { type: 'INSIGHT', value: effect.value };
        
      case 'COIN_FLIP':
        const win = Math.random() < 0.5;
        return {
          type: 'COIN_FLIP',
          result: win ? 'WIN' : 'LOSE',
          reward: win ? this._applyEffect(effect.win, gameState) : this._applyEffect(effect.lose, gameState)
        };
        
      case 'RANDOM_REWARD':
        const reward = this._rollRandomReward(effect.pool);
        return this._applyEffect(reward, gameState);
        
      case 'NOTHING':
        return { type: 'NOTHING' };
        
      default:
        return { type: 'UNKNOWN', effect: effect };
    }
  }

  // 随机奖励抽取
  _rollRandomReward(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    
    for (const item of pool) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    
    return pool[0];
  }

  // 添加临时效果
  addTemporaryEffect(effect) {
    this.activeEffects.push({
      ...effect,
      appliedAt: Date.now()
    });
  }

  // 获取所有活跃效果
  getActiveEffects() {
    return this.activeEffects.filter(effect => {
      if (!effect.duration) return true;
      // 检查是否过期
      return true; // 简化处理
    });
  }

  // 清除过期效果
  clearExpiredEffects() {
    // 实现效果过期逻辑
  }
}

// ==================== 导出 ====================

module.exports = {
  EventType,
  EVENTS,
  EventManager
};
