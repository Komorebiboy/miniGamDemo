/**
 * 心理博弈卡牌数据库
 * 
 * 核心设计：
 * - 信息博弈：敌方只能看到部分信息
 * - 洞察系统：空过获得洞察点
 * - 终结牌：高风险高回报
 * - 欺诈/误导：隐藏真实信息
 */

const CardType = {
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  SKILL: 'SKILL',
  FINISHER: 'FINISHER'  // 终结牌类型
};

const CardRarity = {
  COMMON: 'COMMON',
  UNCOMMON: 'UNCOMMON',
  RARE: 'RARE',
  LEGENDARY: 'LEGENDARY',
  FINISHER: 'FINISHER'  // 终结牌稀有度
};

const RiskLevel = {
  SAFE: 'SAFE',           // 安全
  MODERATE: 'MODERATE',   // 中等
  HIGH: 'HIGH',           // 高风险
  EXTREME: 'EXTREME'      // 极限（终结牌）
};

// ==================== 基础卡牌（信息可见）====================

const BASIC_CARDS = [
  // 稳定攻击牌
  {
    id: 'steady_strike',
    name: '稳健打击',
    description: '可靠的攻击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    riskLevel: RiskLevel.SAFE,
    rollRange: { min: 5, max: 10 },
    speed: 5,
    effects: [],
    tags: ['稳定', '可靠'],
    // 信息可见性
    infoVisibility: {
      type: true,           // 类型可见
      riskLevel: true,      // 风险等级可见
      speedRange: 'exact',  // 速度精确值
      rollRange: 'exact',   // Roll范围精确
      effects: true         // 效果可见
    }
  },
  
  // 快速刺击
  {
    id: 'quick_thrust',
    name: '快速刺击',
    description: '速度快但伤害一般',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 3, max: 8 },
    speed: 8,
    effects: [],
    tags: ['快速'],
    infoVisibility: {
      type: true,
      riskLevel: true,
      speedRange: 'exact',
      rollRange: 'exact',
      effects: true
    }
  },
  
  // 防御姿态
  {
    id: 'defensive_stance',
    name: '防御姿态',
    description: '获得护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    riskLevel: RiskLevel.SAFE,
    rollRange: { min: 0, max: 5 },
    speed: 4,
    effects: [{ type: 'SHIELD', value: 5 }],
    tags: ['防御'],
    infoVisibility: {
      type: true,
      riskLevel: true,
      speedRange: 'exact',
      rollRange: 'exact',
      effects: true
    }
  }
];

// ==================== 信息博弈卡牌（部分信息隐藏）====================

const PSYCHO_CARDS = [
  // 伪装攻击 - 看起来像防御牌
  {
    id: 'deceptive_attack',
    name: '诡诈一击',
    description: '伪装成防御的攻击',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 8, max: 15 },
    speed: 6,
    effects: [],
    tags: ['欺诈'],
    // 对外显示的信息（敌方看到）
    displayedInfo: {
      name: '防御准备',
      type: CardType.DEFENSE,
      riskLevel: RiskLevel.SAFE,
      speedRange: 'low',
      rollRange: { min: 0, max: 5 },
      fakeEffects: [{ type: 'SHIELD', value: 3 }]
    },
    // 真实信息（需要洞察才能看到）
    infoVisibility: {
      type: false,          // 类型隐藏
      riskLevel: false,     // 风险隐藏
      speedRange: 'hidden', // 速度隐藏
      rollRange: 'hidden',  // Roll范围隐藏
      effects: false,       // 效果隐藏
      insightRequired: 1    // 需要1点洞察才能看到真实信息
    },
    // 洞察后显示
    revealedInfo: {
      name: '诡诈一击',
      type: CardType.ATTACK,
      riskLevel: RiskLevel.MODERATE,
      speed: 6,
      rollRange: { min: 8, max: 15 }
    }
  },
  
  // 误导牌 - 显示错误的速度
  {
    id: 'misleading_strike',
    name: '误导打击',
    description: '速度难以预测',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 6, max: 18 },
    speed: 9,
    effects: [],
    tags: ['误导'],
    displayedInfo: {
      type: CardType.ATTACK,
      riskLevel: RiskLevel.MODERATE,
      speedRange: 'slow',   // 显示慢速
      displayedSpeed: 3,    // 显示速度3
      rollRange: { min: 5, max: 12 }
    },
    infoVisibility: {
      type: true,
      riskLevel: 'partial', // 部分可见
      speedRange: 'fake',   // 速度是假的
      rollRange: 'partial', // 部分可见
      effects: true,
      insightRequired: 2
    },
    revealedInfo: {
      speed: 9,
      riskLevel: RiskLevel.HIGH,
      rollRange: { min: 6, max: 18 }
    }
  },
  
  // 隐藏杀机 - 看起来像普通牌
  {
    id: 'hidden_threat',
    name: '暗藏杀机',
    description: '普通的外表下隐藏着危险',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 10, max: 25 },
    speed: 5,
    effects: [{ type: 'BLEEDING', value: 2 }],
    tags: ['隐藏', '流血'],
    displayedInfo: {
      name: '普通攻击',
      type: CardType.ATTACK,
      riskLevel: RiskLevel.SAFE,
      speedRange: 'normal',
      rollRange: { min: 4, max: 8 }
    },
    infoVisibility: {
      type: true,
      riskLevel: false,
      speedRange: 'exact',
      rollRange: false,
      effects: false,
      insightRequired: 3
    },
    revealedInfo: {
      name: '暗藏杀机',
      riskLevel: RiskLevel.HIGH,
      rollRange: { min: 10, max: 25 },
      effects: [{ type: 'BLEEDING', value: 2 }]
    }
  }
];

// ==================== 终结牌（高风险高回报）====================

const FINISHER_CARDS = [
  // 赌徒之刃 - 经典终结牌
  {
    id: 'gambler_blade',
    name: '赌徒之刃',
    description: 'ALL IN！要么大胜要么惨败',
    type: CardType.FINISHER,
    rarity: CardRarity.FINISHER,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 0, max: 40 },
    speed: 5,
    effects: [],
    tags: ['终结', '赌博', 'ALL IN'],
    // 终结牌特殊标识
    isFinisher: true,
    // 终结牌信息完全隐藏
    displayedInfo: {
      name: '???',
      type: CardType.SKILL,
      riskLevel: RiskLevel.HIGH,
      speedRange: 'unknown',
      rollRange: { min: '?', max: '?' },
      hint: '某种危险的东西...'
    },
    infoVisibility: {
      type: false,
      riskLevel: false,
      speedRange: false,
      rollRange: false,
      effects: false,
      insightRequired: 5  // 需要5点洞察才能看到
    },
    revealedInfo: {
      name: '赌徒之刃',
      type: CardType.FINISHER,
      riskLevel: RiskLevel.EXTREME,
      speed: 5,
      rollRange: { min: 0, max: 40 },
      description: 'ALL IN！要么大胜要么惨败'
    },
    // 终结特效
    finisherEffects: {
      onHighRoll: {     // 高Roll时
        threshold: 30,
        animation: 'legendary',
        bonusDamage: 10,
        screenShake: true,
        flashGold: true
      },
      onLowRoll: {      // 低Roll时
        threshold: 5,
        animation: 'fail',
        selfDamage: 5,
        screenShake: true,
        flashRed: true
      }
    }
  },
  
  // 命运骰子
  {
    id: 'destiny_dice',
    name: '命运骰子',
    description: '让命运决定一切',
    type: CardType.FINISHER,
    rarity: CardRarity.FINISHER,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 1, max: 35 },
    speed: 7,
    effects: [{ type: 'RANDOM_EFFECT', value: 0 }],
    tags: ['终结', '命运', '随机'],
    isFinisher: true,
    displayedInfo: {
      name: '???',
      type: CardType.SKILL,
      riskLevel: RiskLevel.HIGH,
      speedRange: 'unknown',
      rollRange: { min: '?', max: '?' },
      hint: '命运的呼唤...'
    },
    infoVisibility: {
      type: false,
      riskLevel: false,
      speedRange: false,
      rollRange: false,
      effects: false,
      insightRequired: 5
    },
    revealedInfo: {
      name: '命运骰子',
      type: CardType.FINISHER,
      riskLevel: RiskLevel.EXTREME,
      speed: 7,
      rollRange: { min: 1, max: 35 }
    },
    finisherEffects: {
      onHighRoll: {
        threshold: 25,
        animation: 'destiny',
        bonusEffect: 'HEAL',
        healValue: 15
      },
      onCriticalFail: {  // 大失败
        threshold: 3,
        animation: 'curse',
        applyEffect: 'WEAK'
      }
    }
  },
  
  // 底牌
  {
    id: 'trump_card',
    name: '底牌',
    description: '最后的底牌，藏到最后才能发挥最大威力',
    type: CardType.FINISHER,
    rarity: CardRarity.FINISHER,
    riskLevel: RiskLevel.EXTREME,
    // 手牌越少，Roll范围越大
    rollRange: { min: 5, max: 20 },  // 基础范围
    dynamicRollRange: {
      baseMin: 5,
      baseMax: 20,
      handSizeBonus: 2,  // 每少1张手牌，上限+2
      maxBonus: 20       // 最大加成
    },
    speed: 4,
    effects: [],
    tags: ['终结', '底牌', '绝境'],
    isFinisher: true,
    displayedInfo: {
      name: '???',
      type: CardType.ATTACK,
      riskLevel: RiskLevel.MODERATE,
      speedRange: 'slow',
      rollRange: { min: 5, max: 12 },
      hint: '似乎藏着什么...'
    },
    infoVisibility: {
      type: false,
      riskLevel: false,
      speedRange: false,
      rollRange: 'partial',
      effects: false,
      insightRequired: 4
    },
    revealedInfo: {
      name: '底牌',
      type: CardType.FINISHER,
      riskLevel: RiskLevel.EXTREME,
      speed: 4,
      specialMechanic: '手牌越少威力越大'
    },
    finisherEffects: {
      onHighRoll: {
        threshold: 30,
        animation: 'comeback',
        bonusDamage: 15,
        heal: 10
      }
    }
  }
];

// ==================== 洞察相关卡牌 ====================

const INSIGHT_CARDS = [
  // 洞察之眼 - 使用获得洞察
  {
    id: 'insight_eye',
    name: '洞察之眼',
    description: '看穿敌人的意图',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 8 },
    speed: 6,
    effects: [
      { type: 'GAIN_INSIGHT', value: 2 },  // 获得2点洞察
      { type: 'REVEAL_ENEMY', value: 1 }  // 揭示1张敌方卡牌
    ],
    tags: ['洞察', '信息'],
    infoVisibility: {
      type: true,
      riskLevel: true,
      speedRange: 'exact',
      rollRange: 'exact',
      effects: true
    }
  },
  
  // 读心术
  {
    id: 'mind_read',
    name: '读心术',
    description: '窥探敌人的思维',
    type: CardType.SKILL,
    rarity: CardRarity.LEGENDARY,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 0, max: 5 },
    speed: 8,
    effects: [
      { type: 'GAIN_INSIGHT', value: 3 },
      { type: 'REVEAL_ALL_ENEMY', value: 1 },  // 揭示所有敌方卡牌
      { type: 'SEE_NEXT_ENEMY_CARD', value: 1 }  // 看到敌人下回合要出的牌
    ],
    tags: ['洞察', '预知', '传奇'],
    infoVisibility: {
      type: true,
      riskLevel: true,
      speedRange: 'exact',
      rollRange: 'exact',
      effects: true
    }
  }
];

// ==================== 反制卡牌 ====================

const COUNTER_CARDS = [
  // 预判格挡
  {
    id: 'predict_block',
    name: '预判格挡',
    description: '如果敌方速度更快，完全格挡',
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 2, max: 6 },
    speed: 6,
    effects: [
      { 
        type: 'COUNTER_SPEED',
        condition: 'enemySpeedHigher',
        effect: 'BLOCK_ALL'
      }
    ],
    tags: ['反制', '预判'],
    infoVisibility: {
      type: true,
      riskLevel: true,
      speedRange: 'exact',
      rollRange: 'exact',
      effects: true
    }
  },
  
  // 赌徒狂笑 - 针对接近的Roll
  {
    id: 'gambler_laugh',
    name: '赌徒狂笑',
    description: '如果双方Roll差值≤1，额外行动',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 3, max: 12 },
    speed: 5,
    effects: [
      {
        type: 'CLOSE_ROLL_BONUS',
        condition: 'rollDiffLessThan2',
        effect: 'EXTRA_ACTION'
      }
    ],
    tags: ['反制', '赌博'],
    infoVisibility: {
      type: true,
      riskLevel: true,
      speedRange: 'exact',
      rollRange: 'exact',
      effects: true
    }
  }
];

// ==================== 导出 ====================

module.exports = {
  CardType,
  CardRarity,
  RiskLevel,
  
  // 卡牌库
  BASIC_CARDS,
  PSYCHO_CARDS,
  FINISHER_CARDS,
  INSIGHT_CARDS,
  COUNTER_CARDS,
  
  // 获取所有卡牌
  getAllCards() {
    return [
      ...BASIC_CARDS,
      ...PSYCHO_CARDS,
      ...INSIGHT_CARDS,
      ...COUNTER_CARDS
    ];
  },
  
  // 获取终结牌
  getFinisherCards() {
    return FINISHER_CARDS;
  },
  
  // 生成起始牌组（15张）
  getStartingDeck() {
    const deck = [];
    // 基础牌
    deck.push(...BASIC_CARDS.map(card => ({ ...card, instanceId: `card_${Date.now()}_${Math.random()}` })));
    // 信息博弈牌
    deck.push(...PSYCHO_CARDS.slice(0, 2).map(card => ({ ...card, instanceId: `card_${Date.now()}_${Math.random()}` })));
    // 反制牌
    deck.push(...COUNTER_CARDS.map(card => ({ ...card, instanceId: `card_${Date.now()}_${Math.random()}` })));
    // 洞察牌
    deck.push(INSIGHT_CARDS[0]);
    
    // 填充到15张
    while (deck.length < 15) {
      const randomBasic = BASIC_CARDS[Math.floor(Math.random() * BASIC_CARDS.length)];
      deck.push({ ...randomBasic, instanceId: `card_${Date.now()}_${Math.random()}` });
    }
    
    return deck.map((card, index) => ({
      ...card,
      instanceId: `card_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));
  },
  
  // 生成敌人牌组（包含终结牌）
  getEnemyDeck() {
    const deck = [];
    // 基础牌
    deck.push(...BASIC_CARDS.slice(0, 3).map(card => ({ ...card })));
    // 信息博弈牌
    deck.push(...PSYCHO_CARDS.map(card => ({ ...card })));
    // 终结牌（1张）
    deck.push(FINISHER_CARDS[0]);
    
    // 填充到15张
    while (deck.length < 15) {
      const randomCard = PSYCHO_CARDS[Math.floor(Math.random() * PSYCHO_CARDS.length)];
      deck.push({ ...randomCard });
    }
    
    return deck.map((card, index) => ({
      ...card,
      instanceId: `enemy_card_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));
  }
};
