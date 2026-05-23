/**
 * 敌人与Boss系统 - 心理博弈Roguelike卡牌游戏
 * 
 * 敌人设计原则：
 * 1. 每个敌人有明确的性格与博弈风格
 * 2. AI行为反映敌人特性
 * 3. 专属卡牌强化主题
 * 4. Boss有特殊机制
 */

const CardType = {
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  SKILL: 'SKILL',
  FINISHER: 'FINISHER'
};

const CardRarity = {
  COMMON: 'COMMON',
  UNCOMMON: 'UNCOMMON',
  RARE: 'RARE',
  LEGENDARY: 'LEGENDARY',
  FINISHER: 'FINISHER'
};

const RiskLevel = {
  SAFE: 'SAFE',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  EXTREME: 'EXTREME'
};

// ==================== 敌人类型 ====================

const EnemyType = {
  // 普通敌人
  JOKER_GAMBLER: 'JOKER_GAMBLER',     // 小丑赌徒
  CHEAT: 'CHEAT',                      // 老千
  CARD_SHARK: 'CARD_SHARK',            // 赌牌高手
  
  // Boss
  MECHANICAL_JUDGE: 'MECHANICAL_JUDGE', // 机械裁决者
  DEMON_DEALER: 'DEMON_DEALER',         // 恶魔庄家
  FATE_MASTER: 'FATE_MASTER'            // 命运主宰
};

// ==================== 小丑赌徒 ====================
// 性格：疯狂、不可预测、喜欢All-in
// 风格：高风险牌，随机性极强

const JOKER_GAMBLER_CARDS = [
  {
    id: 'joker_laugh',
    name: '小丑的嘲笑',
    description: '随机改变双方Roll范围',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [{ type: 'CHAOS_ROLL', value: 1, trigger: 'on_reveal' }],
    tags: ['混乱', '随机'],
    aiWeight: 30
  },
  {
    id: 'wild_card',
    name: '万能牌',
    description: 'Roll范围1-15，但结果随机决定',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 1, max: 15 },
    speed: 4,
    effects: [{ type: 'RANDOM_RESULT', value: 1 }],
    tags: ['随机', '赌博'],
    aiWeight: 50
  },
  {
    id: 'surprise_box',
    name: '惊喜盒子',
    description: '50%伤害翻倍，50%无效',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 6, max: 10 },
    speed: 6,
    effects: [{ type: 'COIN_FLIP', value: 2, trigger: 'on_reveal' }],
    tags: ['赌博', '随机'],
    aiWeight: 40
  }
];

const JOKER_GAMBLER_CONFIG = {
  id: EnemyType.JOKER_GAMBLER,
  name: '小丑赌徒',
  title: '疯狂的掷骰者',
  description: '一个疯狂的赌徒，他的出牌完全不可预测',
  icon: '🤡',
  color: '#FF6B9D',
  hp: 50,
  maxHp: 50,
  aiBehavior: {
    type: 'CHAOTIC',           // 混乱型AI
    riskTolerance: 0.8,        // 高风险容忍
    bluffFrequency: 0.6,       // 经常虚张声势
    pattern: 'RANDOM'          // 随机模式
  },
  specialMechanic: {
    name: '疯狂骰子',
    description: '每回合有30%几率Roll范围变为1-20',
    trigger: 'per_turn',
    chance: 0.3
  },
  deck: JOKER_GAMBLER_CARDS,
  difficulty: 1,
  rewards: {
    gold: 50,
    cardChoices: 2
  }
};

// ==================== 老千 ====================
// 性格：狡猾、欺骗、操控信息
// 风格：隐藏真实信息，误导对手

const CHEAT_CARDS = [
  {
    id: 'hidden_ace',
    name: '藏牌',
    description: '显示虚假的Roll范围',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 5, max: 10 },
    speed: 7,
    effects: [
      { type: 'FAKE_DISPLAY', value: 1, trigger: 'on_reveal' },
      { type: 'SHIELD', value: 3 }
    ],
    tags: ['欺骗', '伪装'],
    aiWeight: 60
  },
  {
    id: 'swap_card',
    name: '换牌',
    description: '偷看玩家手牌并选择最优对策',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [{ type: 'PEEK_AND_ADAPT', value: 1, trigger: 'immediate' }],
    tags: ['偷看', '适应'],
    aiWeight: 40
  },
  {
    id: 'loaded_die',
    name: '灌铅骰子',
    description: '本回合Roll最小值+2',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [{ type: 'ROLL_MIN_BOOST', value: 2, duration: 1 }],
    tags: ['作弊', '增益'],
    aiWeight: 50
  }
];

const CHEAT_CONFIG = {
  id: EnemyType.CHEAT,
  name: '老千',
  title: '牌桌骗子',
  description: '一个狡猾的老千，擅长隐藏信息和误导对手',
  icon: '🎭',
  color: '#9B59B6',
  hp: 60,
  maxHp: 60,
  aiBehavior: {
    type: 'DECEPTIVE',         // 欺骗型AI
    riskTolerance: 0.4,        // 中等风险
    bluffFrequency: 0.8,       // 经常虚张声势
    pattern: 'ADAPTIVE'        // 适应型模式
  },
  specialMechanic: {
    name: '暗中操控',
    description: '每3回合可以查看玩家手牌',
    trigger: 'every_3_turns',
    effect: 'peek_hand'
  },
  deck: CHEAT_CARDS,
  difficulty: 2,
  rewards: {
    gold: 70,
    cardChoices: 2
  }
};

// ==================== 赌牌高手 ====================
// 性格：冷静、计算、概率大师
// 风格：稳定收益，概率优势

const CARD_SHARK_CARDS = [
  {
    id: 'calculated_risk',
    name: '计算风险',
    description: 'Roll范围6-12，稳定输出',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 6, max: 12 },
    speed: 5,
    effects: [],
    tags: ['稳定', '计算'],
    aiWeight: 70
  },
  {
    id: 'probability_shift',
    name: '概率转移',
    description: '下回合敌方Roll-2',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [{ type: 'ENEMY_ROLL_PENALTY', value: 2, duration: 1 }],
    tags: ['压制', '计算'],
    aiWeight: 40
  },
  {
    id: 'optimal_play',
    name: '最优解',
    description: '根据当前局势自动选择最优Roll',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 7, max: 11 },
    speed: 5,
    effects: [{ type: 'OPTIMAL_ROLL', value: 1 }],
    tags: ['计算', '最优'],
    aiWeight: 60
  }
];

const CARD_SHARK_CONFIG = {
  id: EnemyType.CARD_SHARK,
  name: '赌牌高手',
  title: '概率大师',
  description: '一个冷静的数学家，总能在概率中找到优势',
  icon: '🧮',
  color: '#3498DB',
  hp: 70,
  maxHp: 70,
  aiBehavior: {
    type: 'CALCULATED',        // 计算型AI
    riskTolerance: 0.3,        // 低风险
    bluffFrequency: 0.2,       // 很少虚张声势
    pattern: 'OPTIMAL'         // 最优模式
  },
  specialMechanic: {
    name: '概率优势',
    description: '每回合Roll有20%几率取范围内最优值',
    trigger: 'per_roll',
    chance: 0.2
  },
  deck: CARD_SHARK_CARDS,
  difficulty: 2,
  rewards: {
    gold: 80,
    cardChoices: 3
  }
};

// ==================== Boss：机械裁决者 ====================
// 性格：冷酷、绝对公平、无情执行
// 机制：强制公平，规则压制

const MECHANICAL_JUDGE_CARDS = [
  {
    id: 'absolute_fairness',
    name: '绝对公平',
    description: '本回合双方Roll都取平均值',
    type: CardType.SKILL,
    rarity: CardRarity.LEGENDARY,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [{ type: 'FORCE_AVERAGE', value: 1, trigger: 'on_reveal' }],
    tags: ['Boss技能', '压制'],
    aiWeight: 20,
    cooldown: 3
  },
  {
    id: 'rule_enforcement',
    name: '规则执行',
    description: '禁用玩家本回合所有特殊效果',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [{ type: 'SILENCE', value: 1, duration: 1 }],
    tags: ['Boss技能', '压制'],
    aiWeight: 30,
    cooldown: 2
  },
  {
    id: 'judgment_strike',
    name: '裁决打击',
    description: '若玩家上回合获胜，本回合伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 8, max: 12 },
    speed: 4,
    effects: [{ type: 'PUNISH_WIN', value: 2, trigger: 'on_reveal' }],
    tags: ['Boss技能', '惩罚'],
    aiWeight: 50
  },
  {
    id: 'mechanical_precision',
    name: '机械精准',
    description: 'Roll总是取范围内中间值',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.SAFE,
    rollRange: { min: 7, max: 9 },
    speed: 5,
    effects: [{ type: 'FIXED_MID', value: 1 }],
    tags: ['稳定', '机械'],
    aiWeight: 60
  }
];

const MECHANICAL_JUDGE_CONFIG = {
  id: EnemyType.MECHANICAL_JUDGE,
  name: '机械裁决者',
  title: '公平的执行者',
  description: '一台追求绝对公平的机械，它会强制让所有博弈变得"公平"',
  icon: '⚙️',
  color: '#7F8C8D',
  hp: 100,
  maxHp: 100,
  isBoss: true,
  bossMechanics: [
    {
      name: '公平领域',
      description: '战斗开始时，双方Roll范围都被限制在5-15',
      trigger: 'battle_start',
      effect: 'limit_roll_range'
    },
    {
      name: '裁决之眼',
      description: '每3回合，强制双方Roll相同',
      trigger: 'every_3_turns',
      effect: 'force_same_roll'
    }
  ],
  aiBehavior: {
    type: 'BOSS_JUDGE',        // Boss裁决型
    riskTolerance: 0.2,
    bluffFrequency: 0,
    pattern: 'CONTROL',
    specialMoves: ['absolute_fairness', 'rule_enforcement']
  },
  phases: [
    {
      hpThreshold: 100,
      behavior: 'CONTROL',
      description: '控制阶段 - 限制玩家选择'
    },
    {
      hpThreshold: 50,
      behavior: 'AGGRESSIVE',
      description: '激进阶段 - 频繁使用裁决打击'
    }
  ],
  deck: MECHANICAL_JUDGE_CARDS,
  difficulty: 3,
  rewards: {
    gold: 150,
    cardChoices: 3,
    specialReward: '机械核心'
  }
};

// ==================== Boss：恶魔庄家 ====================
// 性格：贪婪、诱惑、债务陷阱
// 机制：借贷系统，高利贷压迫

const DEMON_DEALER_CARDS = [
  {
    id: 'tempting_offer',
    name: '诱惑契约',
    description: '玩家获得+5Roll，但下回合受到10伤害',
    type: CardType.SKILL,
    rarity: CardRarity.LEGENDARY,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [{ type: 'DEBT_CONTRACT', value: 5, debt: 10 }],
    tags: ['Boss技能', '债务'],
    aiWeight: 30,
    cooldown: 2
  },
  {
    id: 'debt_collection',
    name: '债务催收',
    description: '伤害等于玩家当前债务值',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 0, max: 0 },
    speed: 3,
    effects: [{ type: 'DEBT_DAMAGE', value: 1 }],
    tags: ['Boss技能', '债务'],
    aiWeight: 40
  },
  {
    id: 'compound_interest',
    name: '利滚利',
    description: '玩家所有债务翻倍',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [{ type: 'DOUBLE_DEBT', value: 1 }],
    tags: ['Boss技能', '债务'],
    aiWeight: 25,
    cooldown: 3
  },
  {
    id: 'soul_gamble',
    name: '灵魂赌注',
    description: '双方各失去5生命，Roll+5',
    type: CardType.FINISHER,
    rarity: CardRarity.FINISHER,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 10, max: 20 },
    speed: 2,
    effects: [
      { type: 'SELF_DAMAGE', value: 5 },
      { type: 'FORCE_ENEMY_DAMAGE', value: 5 }
    ],
    tags: ['Boss技能', '终结', '赌博'],
    aiWeight: 20,
    hpThreshold: 30
  }
];

const DEMON_DEALER_CONFIG = {
  id: EnemyType.DEMON_DEALER,
  name: '恶魔庄家',
  title: '债务的收割者',
  description: '一个贪婪的恶魔，它会用诱人的条件让你陷入债务陷阱',
  icon: '👿',
  color: '#8E44AD',
  hp: 120,
  maxHp: 120,
  isBoss: true,
  bossMechanics: [
    {
      name: '高利贷',
      description: '玩家每回合开始时，债务增加20%',
      trigger: 'turn_start',
      effect: 'interest_accumulation'
    },
    {
      name: '灵魂契约',
      description: '玩家可以在任何时候借贷生命获得Roll加成',
      trigger: 'player_choice',
      effect: 'life_loan'
    }
  ],
  aiBehavior: {
    type: 'BOSS_DEALER',
    riskTolerance: 0.5,
    bluffFrequency: 0.4,
    pattern: 'DEBT_TRAP',
    specialMoves: ['tempting_offer', 'compound_interest']
  },
  phases: [
    {
      hpThreshold: 120,
      behavior: 'TEMPT',
      description: '诱惑阶段 - 频繁提供"优惠"契约'
    },
    {
      hpThreshold: 60,
      behavior: 'COLLECT',
      description: '催收阶段 - 频繁使用债务催收'
    },
    {
      hpThreshold: 30,
      behavior: 'DESPERATE',
      description: '绝望阶段 - 使用灵魂赌注拼命'
    }
  ],
  deck: DEMON_DEALER_CARDS,
  difficulty: 4,
  rewards: {
    gold: 200,
    cardChoices: 3,
    specialReward: '恶魔契约'
  }
};

// ==================== 敌人配置集合 ====================

const ENEMY_CONFIGS = {
  [EnemyType.JOKER_GAMBLER]: JOKER_GAMBLER_CONFIG,
  [EnemyType.CHEAT]: CHEAT_CONFIG,
  [EnemyType.CARD_SHARK]: CARD_SHARK_CONFIG,
  [EnemyType.MECHANICAL_JUDGE]: MECHANICAL_JUDGE_CONFIG,
  [EnemyType.DEMON_DEALER]: DEMON_DEALER_CONFIG
};

// ==================== 生成敌人卡组 ====================

function getEnemyDeck(enemyType) {
  const config = ENEMY_CONFIGS[enemyType];
  if (!config) return [];
  
  const deck = [];
  
  // 加入专属牌
  if (config.deck) {
    deck.push(...config.deck.map(card => ({
      ...card,
      instanceId: `enemy_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })));
  }
  
  // 填充基础牌
  const basicCards = [
    {
      id: 'steady_strike',
      name: '稳健打击',
      type: 'ATTACK',
      rarity: 'COMMON',
      riskLevel: 'SAFE',
      rollRange: { min: 5, max: 10 },
      speed: 5,
      effects: [],
      tags: ['稳定']
    },
    {
      id: 'defensive_stance',
      name: '防御姿态',
      type: 'DEFENSE',
      rarity: 'COMMON',
      riskLevel: 'SAFE',
      rollRange: { min: 0, max: 5 },
      speed: 4,
      effects: [{ type: 'SHIELD', value: 5 }],
      tags: ['防御']
    }
  ];
  
  while (deck.length < 15) {
    const randomBasic = basicCards[Math.floor(Math.random() * basicCards.length)];
    deck.push({
      ...randomBasic,
      instanceId: `enemy_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }
  
  return deck.map((card, index) => ({
    ...card,
    instanceId: `enemy_card_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
  }));
}

function getEnemyConfig(enemyType) {
  return ENEMY_CONFIGS[enemyType] || ENEMY_CONFIGS[EnemyType.JOKER_GAMBLER];
}

// ==================== 关卡配置 ====================

const STAGE_CONFIG = {
  stages: [
    {
      id: 1,
      name: '新手试炼',
      enemies: [EnemyType.JOKER_GAMBLER],
      reward: { gold: 50, cardChoices: 2 }
    },
    {
      id: 2,
      name: '赌桌陷阱',
      enemies: [EnemyType.CHEAT, EnemyType.CARD_SHARK],
      reward: { gold: 100, cardChoices: 2 }
    },
    {
      id: 3,
      name: '机械审判',
      enemies: [EnemyType.MECHANICAL_JUDGE],
      isBoss: true,
      reward: { gold: 150, cardChoices: 3, special: '机械核心' }
    },
    {
      id: 4,
      name: '恶魔契约',
      enemies: [EnemyType.DEMON_DEALER],
      isBoss: true,
      reward: { gold: 200, cardChoices: 3, special: '恶魔契约' }
    }
  ]
};

module.exports = {
  EnemyType,
  ENEMY_CONFIGS,
  JOKER_GAMBLER_CARDS,
  CHEAT_CARDS,
  CARD_SHARK_CARDS,
  MECHANICAL_JUDGE_CARDS,
  DEMON_DEALER_CARDS,
  getEnemyDeck,
  getEnemyConfig,
  STAGE_CONFIG
};
