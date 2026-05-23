/**
 * 处刑者职业 - 8流派完整扩展系统
 * 
 * 8个流派：
 * 1. 压制流 - 连胜，节奏，统治
 * 2. 斩杀流 - Execute，低血终结
 * 3. 铁壁反制流 - 反击，防守反杀
 * 4. 审判规则流 - 强制规则，限制行动
 * 5. 连斩流 - 连续行动，连杀
 * 6. 威压流 - 恐惧，威慑，压迫
 * 7. 精准裁决流 - 稳定，精准，固定值
 * 8. 最终审判流 - 超终结，审判降临
 */

// ==================== 流派定义 ====================

const ExecutionerArchetype = {
  DOMINATION: 'DOMINATION',     // 压制流
  EXECUTE: 'EXECUTE',           // 斩杀流
  COUNTER: 'COUNTER',           // 铁壁反制流
  JUDGEMENT: 'JUDGEMENT',       // 审判规则流
  CHAIN_KILL: 'CHAIN_KILL',     // 连斩流
  PRESSURE: 'PRESSURE',         // 威压流
  PRECISION: 'PRECISION',       // 精准裁决流
  FINAL_VERDICT: 'FINAL_VERDICT' // 最终审判流
};

// ==================== 高级机制状态 ====================

const ExecutionerState = {
  // 压制状态
  dominationStacks: 0,        // 压制层数
  maxDominationStacks: 10,    // 最大压制层数
  dominationBonus: 0,         // 压制加成
  
  // 审判状态
  judgementStacks: 0,         // 审判层数
  maxJudgementStacks: 10,     // 最大审判层数
  judgementThreshold: 5,      // 审判触发阈值
  
  // 威压状态
  pressureStacks: 0,          // 威压层数
  maxPressureStacks: 5,       // 最大威压层数
  enemyUnderPressure: false,  // 敌方是否处于威压下
  
  // 执行状态
  executeThreshold: 0.3,      // 执行阈值（30%生命）
  executeBonus: 0,            // 执行加成
  
  // 铁律状态
  activeLaw: null,            // 当前生效的铁律
  lawDuration: 0,             // 铁律持续回合
  
  // 连斩状态
  chainKillCount: 0,          // 连斩次数
  maxChainKill: 5,            // 最大连斩
  chainKillBonus: 0,          // 连斩加成
  
  // 精准状态
  precisionStacks: 0,         // 精准层数
  rollMinBonus: 0,            // Roll最小值加成
  rollVarianceReduction: 0,   // Roll方差减少
  
  // 最终审判
  verdictPreparation: 0,      // 审判准备层数
  verdictReady: false,        // 是否可发动最终审判
  verdictDamage: 0            // 审判累积伤害
};

// ==================== 铁律类型 ====================

const IronLaw = {
  NO_PASS: {                  // 禁止空过
    id: 'NO_PASS',
    name: '铁律：禁止逃避',
    description: '双方不能空过，必须出牌',
    effect: { disablePass: true }
  },
  NO_FAST: {                  // 禁止高速
    id: 'NO_FAST',
    name: '铁律：限制速度',
    description: '速度超过7的牌无法使用',
    effect: { maxSpeed: 7 }
  },
  NO_FINISHER: {              // 禁止终结
    id: 'NO_FINISHER',
    name: '铁律：禁止终结',
    description: '终结技无法使用',
    effect: { disableFinisher: true }
  },
  ROLL_CAP: {                 // Roll上限
    id: 'ROLL_CAP',
    name: '铁律：Roll限制',
    description: '双方Roll不能超过15',
    effect: { maxRoll: 15 }
  },
  FORCED_DUEL: {              // 强制对决
    id: 'FORCED_DUEL',
    name: '铁律：强制对决',
    description: '双方必须出攻击牌',
    effect: { forceAttack: true }
  }
};

// ==================== 1. 压制流卡牌 (5张) ====================

const DOMINATION_CARDS = [
  {
    id: 'dominating_strike',
    name: '压制打击',
    description: '若上回合胜利，本回合Roll+3',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 5, max: 10 },
    speed: 5,
    effects: [
      { type: 'BONUS_IF_LAST_WIN', value: 3 },
      { type: 'GAIN_DOMINATION_ON_WIN', value: 1 }
    ],
    tags: ['压制', '连胜', '成长'],
    archetype: ExecutionerArchetype.DOMINATION,
    flavor: '一旦开始，就不会停止。'
  },
  {
    id: 'iron_momentum',
    name: '钢铁气势',
    description: '获得1层压制，每层使Roll最小值+1',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'GAIN_DOMINATION', value: 1 },
      { type: 'DOMINATION_BONUS', value: 1 }
    ],
    tags: ['压制', '增益', '稳定'],
    archetype: ExecutionerArchetype.DOMINATION,
    flavor: '气势如虹，不可阻挡。'
  },
  {
    id: 'crushing_blow',
    name: '粉碎打击',
    description: '压制层数x2加到Roll上',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 4, max: 8 },
    speed: 4,
    effects: [
      { type: 'ADD_DOMINATION_TO_ROLL', multiplier: 2 },
      { type: 'LOSE_DOMINATION_ON_LOSS', value: 2 }
    ],
    tags: ['压制', '爆发', '风险'],
    archetype: ExecutionerArchetype.DOMINATION,
    flavor: '累积的力量，一击释放。'
  },
  {
    id: 'unstoppable_force',
    name: '不可阻挡',
    description: '压制5层以上时，本回合伤害x2且无法被反制',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 6, max: 10 },
    speed: 5,
    effects: [
      { type: 'DAMAGE_MULTIPLY_IF_DOMINATION', multiplier: 2, threshold: 5 },
      { type: 'UNCOUNTERABLE', condition: 'domination>=5' }
    ],
    tags: ['压制', '爆发', '不可反制'],
    archetype: ExecutionerArchetype.DOMINATION,
    flavor: '在我的压制下，你没有还手之力。'
  },
  {
    id: 'supreme_domination',
    name: '绝对压制',
    description: '【传奇】压制层数不再减少，每层压制使敌方Roll-1',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'DOMINATION_NO_DECAY' },
      { type: 'ENEMY_ROLL_PENALTY_PER_DOMINATION', value: 1 }
    ],
    tags: ['压制', '传奇', '统治'],
    archetype: ExecutionerArchetype.DOMINATION,
    flavor: '在我的领域内，你只能臣服。'
  }
];

// ==================== 2. 斩杀流卡牌 (5张) ====================

const EXECUTE_CARDS = [
  {
    id: 'execute_strike',
    name: '处刑打击',
    description: '敌方生命低于30%时，Roll+5',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 4,
    effects: [
      { type: 'BONUS_VS_LOW_HP', threshold: 0.3, value: 5 },
      { type: 'EXECUTE_DAMAGE_BONUS', value: 3 }
    ],
    tags: ['斩杀', '低血', '终结'],
    archetype: ExecutionerArchetype.EXECUTE,
    flavor: '你的生命已经走到尽头。'
  },
  {
    id: 'judgement_blade',
    name: '审判之刃',
    description: '敌方生命低于20%时，此牌直接造成15伤害（无视Roll）',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 3, max: 6 },
    speed: 3,
    effects: [
      { type: 'INSTANT_KILL_THRESHOLD', threshold: 0.2, damage: 15 },
      { type: 'EXECUTE_MARK', duration: 1 }
    ],
    tags: ['斩杀', '处刑', '即死'],
    archetype: ExecutionerArchetype.EXECUTE,
    flavor: '审判已至，无需挣扎。'
  },
  {
    id: 'mercy_kill',
    name: '仁慈终结',
    description: '敌方生命低于10%时，伤害x3',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 5, max: 9 },
    speed: 5,
    effects: [
      { type: 'DAMAGE_MULTIPLY_IF_CRITICAL_HP', multiplier: 3, threshold: 0.1 }
    ],
    tags: ['斩杀', '爆发', '终结'],
    archetype: ExecutionerArchetype.EXECUTE,
    flavor: '这是最后的仁慈。'
  },
  {
    id: 'executioner_instinct',
    name: '处刑本能',
    description: '每有一个敌方生命低于50%，你的所有牌Roll+2',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'ROLL_BONUS_PER_WOUNDED_ENEMY', threshold: 0.5, value: 2 },
      { type: 'EXECUTE_THRESHOLD_REDUCTION', value: 0.05 }
    ],
    tags: ['斩杀', '增益', '被动'],
    archetype: ExecutionerArchetype.EXECUTE,
    flavor: '猎物的恐惧，是我的兴奋剂。'
  },
  {
    id: 'death_sentence',
    name: '死刑宣告',
    description: '【终结技】敌方生命低于25%时可直接斩杀，否则造成10伤害',
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 1,
    effects: [
      { type: 'EXECUTE_IF_THRESHOLD', threshold: 0.25 },
      { type: 'FLAT_DAMAGE_IF_NOT', damage: 10 }
    ],
    tags: ['斩杀', '终结', '即死'],
    archetype: ExecutionerArchetype.EXECUTE,
    flavor: '死刑，立即执行。'
  }
];

// ==================== 3. 铁壁反制流卡牌 (5张) ====================

const COUNTER_CARDS = [
  {
    id: 'iron_defense',
    name: '钢铁防御',
    description: '若敌方Roll大于10，你获得5护盾并反击3伤害',
    type: 'DEFENSE',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 5 },
    speed: 4,
    effects: [
      { type: 'SHIELD', value: 3 },
      { type: 'COUNTER_IF_ENEMY_HIGH_ROLL', threshold: 10, damage: 3 }
    ],
    tags: ['反制', '防御', '反击'],
    archetype: ExecutionerArchetype.COUNTER,
    flavor: '你的力量，将成为你的弱点。'
  },
  {
    id: 'retaliation',
    name: '报复',
    description: '若上回合被敌方压制，本回合Roll+4且伤害+3',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 5,
    effects: [
      { type: 'BONUS_IF_LAST_LOSS', rollBonus: 4, damageBonus: 3 },
      { type: 'COUNTER_STRIKE' }
    ],
    tags: ['反制', '复仇', '爆发'],
    archetype: ExecutionerArchetype.COUNTER,
    flavor: '以牙还牙，以血还血。'
  },
  {
    id: 'perfect_parry',
    name: '完美格挡',
    description: '预测敌方Roll，若预测正确，敌方伤害为0且你获得一次免费攻击',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'PREDICT_ENEMY_ROLL' },
      { type: 'NULLIFY_IF_CORRECT' },
      { type: 'FREE_ATTACK_IF_CORRECT' }
    ],
    tags: ['反制', '预测', '奖励'],
    archetype: ExecutionerArchetype.COUNTER,
    flavor: '你的每一个动作，都在我的计算之中。'
  },
  {
    id: 'iron_will',
    name: '钢铁意志',
    description: '本回合无法被压制，若敌方尝试压制，其受到5伤害',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'UNSTOPPABLE', duration: 1 },
      { type: 'DAMAGE_TO_DOMINATION_ATTEMPT', damage: 5 }
    ],
    tags: ['反制', '免疫', '惩罚'],
    archetype: ExecutionerArchetype.COUNTER,
    flavor: '你无法撼动我的意志。'
  },
  {
    id: 'counter_master',
    name: '反制大师',
    description: '【传奇】每回合自动反制敌方第一次攻击，造成敌方Roll值一半的伤害',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'AUTO_COUNTER_FIRST_ATTACK' },
      { type: 'COUNTER_DAMAGE_PERCENT', value: 0.5 }
    ],
    tags: ['反制', '传奇', '自动'],
    archetype: ExecutionerArchetype.COUNTER,
    flavor: '攻击我，就是攻击你自己。'
  }
];

// ==================== 4. 审判规则流卡牌 (5张) ====================

const JUDGEMENT_CARDS = [
  {
    id: 'impose_law',
    name: '施加铁律',
    description: '设置一条铁律，持续2回合（禁止空过/禁止高速/禁止终结）',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'SET_IRON_LAW', duration: 2 },
      { type: 'BONUS_IF_ENEMY_BREAKS', value: 4 }
    ],
    tags: ['审判', '规则', '控制'],
    archetype: ExecutionerArchetype.JUDGEMENT,
    flavor: '规则，由我制定。'
  },
  {
    id: 'forced_duel',
    name: '强制对决',
    description: '双方必须出攻击牌，不能出技能或防御',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'FORCE_ATTACK_ONLY', duration: 1 },
      { type: 'BONUS_IN_DUEL', value: 3 }
    ],
    tags: ['审判', '强制', '对决'],
    archetype: ExecutionerArchetype.JUDGEMENT,
    flavor: '没有退路，只有生死。'
  },
  {
    id: 'judgement_mark',
    name: '审判标记',
    description: '给敌方施加1层审判，达到5层时敌方下回合无法行动',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'APPLY_JUDGEMENT', value: 1 },
      { type: 'STUN_AT_THRESHOLD', threshold: 5 }
    ],
    tags: ['审判', '控制', '累积'],
    archetype: ExecutionerArchetype.JUDGEMENT,
    flavor: '审判的烙印，无法抹去。'
  },
  {
    id: 'rule_enforcement',
    name: '规则执行',
    description: '若敌方违反当前铁律，其受到10伤害并失去下回合',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'MODERATE',
    rollRange: { min: 5, max: 9 },
    speed: 4,
    effects: [
      { type: 'PUNISH_LAW_BREAK', damage: 10 },
      { type: 'SKIP_ENEMY_TURN_IF_PUNISHED' }
    ],
    tags: ['审判', '惩罚', '控制'],
    archetype: ExecutionerArchetype.JUDGEMENT,
    flavor: '违反规则，就要付出代价。'
  },
  {
    id: 'supreme_judge',
    name: '至高审判者',
    description: '【传奇】每回合自动施加一条随机铁律，敌方违反时受到8伤害',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'AUTO_LAW_PER_TURN' },
      { type: 'AUTO_PUNISH', damage: 8 },
      { type: 'LAW_DURATION', value: 2 }
    ],
    tags: ['审判', '传奇', '自动'],
    archetype: ExecutionerArchetype.JUDGEMENT,
    flavor: '我就是规则本身。'
  }
];

// ==================== 5. 连斩流卡牌 (5张) ====================

const CHAIN_KILL_CARDS = [
  {
    id: 'chain_strike',
    name: '连斩',
    description: '若上回合胜利，本回合可再出一张牌',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 6,
    effects: [
      { type: 'EXTRA_CARD_IF_LAST_WIN' },
      { type: 'CHAIN_COUNT', value: 1 }
    ],
    tags: ['连斩', '连胜', '节奏'],
    archetype: ExecutionerArchetype.CHAIN_KILL,
    flavor: '一刀接一刀，永不停歇。'
  },
  {
    id: 'momentum_slash',
    name: '气势斩',
    description: '连斩次数x3加到Roll上',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 3, max: 6 },
    speed: 5,
    effects: [
      { type: 'ADD_CHAIN_KILL_TO_ROLL', multiplier: 3 },
      { type: 'RESET_CHAIN_ON_LOSS' }
    ],
    tags: ['连斩', '爆发', '风险'],
    archetype: ExecutionerArchetype.CHAIN_KILL,
    flavor: '气势如虹，越战越勇。'
  },
  {
    id: 'relentless_assault',
    name: '无情猛攻',
    description: '连斩3次以上时，本回合伤害x2且速度+3',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 5, max: 9 },
    speed: 4,
    effects: [
      { type: 'DAMAGE_MULTIPLY_IF_CHAIN', multiplier: 2, threshold: 3 },
      { type: 'SPEED_BOOST_IF_CHAIN', value: 3, threshold: 3 }
    ],
    tags: ['连斩', '爆发', '加速'],
    archetype: ExecutionerArchetype.CHAIN_KILL,
    flavor: '在我的猛攻下，你没有喘息之机。'
  },
  {
    id: 'bloodlust',
    name: '嗜血',
    description: '每次胜利后恢复5生命，连斩5次以上时恢复10',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'HEAL_ON_WIN', value: 5 },
      { type: 'INCREASED_HEAL_IF_CHAIN', base: 5, bonus: 5, threshold: 5 }
    ],
    tags: ['连斩', '恢复', '续航'],
    archetype: ExecutionerArchetype.CHAIN_KILL,
    flavor: '胜利，是最好的良药。'
  },
  {
    id: 'endless_chain',
    name: '无尽连斩',
    description: '【传奇】连斩不再中断，每层连斩使暴击率+15%',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'CHAIN_NO_RESET' },
      { type: 'CRIT_PER_CHAIN', value: 0.15 },
      { type: 'MAX_CHAIN', value: 10 }
    ],
    tags: ['连斩', '传奇', '无限'],
    archetype: ExecutionerArchetype.CHAIN_KILL,
    flavor: '直到最后一刻，我都不会停下。'
  }
];

// ==================== 6. 威压流卡牌 (5张) ====================

const PRESSURE_CARDS = [
  {
    id: 'intimidate',
    name: '威吓',
    description: '给敌方施加1层威压，每层使其Roll-1',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'APPLY_PRESSURE', value: 1, maxStack: 5 },
      { type: 'ENEMY_ROLL_PENALTY', value: 1 }
    ],
    tags: ['威压', '削弱', '持续'],
    archetype: ExecutionerArchetype.PRESSURE,
    flavor: '在我的目光下，你在颤抖。'
  },
  {
    id: 'crushing_presence',
    name: '压迫气场',
    description: '敌方在威压下空过时，受到8伤害',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'PUNISH_PASS_UNDER_PRESSURE', damage: 8 },
      { type: 'PRESSURE_DURATION', value: 2 }
    ],
    tags: ['威压', '惩罚', '控制'],
    archetype: ExecutionerArchetype.PRESSURE,
    flavor: '连逃避的勇气都没有。'
  },
  {
    id: 'fear_strike',
    name: '恐惧打击',
    description: '威压层数x2加到伤害上',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 5,
    effects: [
      { type: 'ADD_PRESSURE_TO_DAMAGE', multiplier: 2 },
      { type: 'GAIN_PRESSURE_ON_HIT', value: 1 }
    ],
    tags: ['威压', '爆发', '成长'],
    archetype: ExecutionerArchetype.PRESSURE,
    flavor: '恐惧，让你更加脆弱。'
  },
  {
    id: 'paralyzing_fear',
    name: '麻痹恐惧',
    description: '威压5层时，敌方下回合有50%几率无法出牌',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'STUN_CHANCE_AT_MAX_PRESSURE', chance: 0.5, threshold: 5 },
      { type: 'PRESSURE_CAP', value: 5 }
    ],
    tags: ['威压', '控制', '终结'],
    archetype: ExecutionerArchetype.PRESSURE,
    flavor: '恐惧已经吞噬了你的意志。'
  },
  {
    id: 'avatar_of_dread',
    name: '恐惧化身',
    description: '【传奇】威压不再衰减，敌方在威压下所有Roll视为最低值',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'PRESSURE_NO_DECAY' },
      { type: 'ENEMY_MIN_ROLL_UNDER_PRESSURE' },
      { type: 'AUTO_PRESSURE_PER_TURN', value: 1 }
    ],
    tags: ['威压', '传奇', '统治'],
    archetype: ExecutionerArchetype.PRESSURE,
    flavor: '在我面前，你只能颤抖。'
  }
];

// ==================== 7. 精准裁决流卡牌 (5张) ====================

const PRECISION_CARDS = [
  {
    id: 'precise_strike',
    name: '精准打击',
    description: 'Roll范围很小（7-9），但伤害+2',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 7, max: 9 },
    speed: 5,
    effects: [
      { type: 'FLAT_DAMAGE_BONUS', value: 2 },
      { type: 'PRECISION_STACK', value: 1 }
    ],
    tags: ['精准', '稳定', '低方差'],
    archetype: ExecutionerArchetype.PRECISION,
    flavor: '没有意外，只有必然。'
  },
  {
    id: 'calculated_blow',
    name: '计算打击',
    description: '你可以看到敌方的Roll后再决定自己的Roll（在范围内）',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'MODERATE',
    rollRange: { min: 5, max: 10 },
    speed: 4,
    effects: [
      { type: 'SEE_ENEMY_ROLL_FIRST' },
      { type: 'CHOOSE_YOUR_ROLL' }
    ],
    tags: ['精准', '信息', '控制'],
    archetype: ExecutionerArchetype.PRECISION,
    flavor: '我已经算好了一切。'
  },
  {
    id: 'perfect_form',
    name: '完美姿态',
    description: '获得2层精准，每层使Roll最小值+1',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'GAIN_PRECISION', value: 2 },
      { type: 'ROLL_MIN_BONUS_PER_PRECISION', value: 1 }
    ],
    tags: ['精准', '增益', '稳定'],
    archetype: ExecutionerArchetype.PRECISION,
    flavor: '完美，是一种习惯。'
  },
  {
    id: 'mathematical_certainty',
    name: '数学必然',
    description: '本回合Roll固定为8（无视随机）',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 8, max: 8 },
    speed: 5,
    effects: [
      { type: 'FIXED_ROLL', value: 8 },
      { type: 'BONUS_ON_FIXED', value: 2 }
    ],
    tags: ['精准', '固定', '确定性'],
    archetype: ExecutionerArchetype.PRECISION,
    flavor: '概率只是弱者的借口。'
  },
  {
    id: 'absolute_precision',
    name: '绝对精准',
    description: '【传奇】所有Roll最小值+3，最大值-2，你可以精确控制Roll值±2',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'PERMANENT_ROLL_MIN', value: 3 },
      { type: 'PERMANENT_ROLL_MAX_REDUCTION', value: 2 },
      { type: 'ROLL_ADJUST', value: 2 }
    ],
    tags: ['精准', '传奇', '绝对控制'],
    archetype: ExecutionerArchetype.PRECISION,
    flavor: '误差，已经不存在了。'
  }
];

// ==================== 8. 最终审判流卡牌 (5张) ====================

const FINAL_VERDICT_CARDS = [
  {
    id: 'gather_evidence',
    name: '收集证据',
    description: '获得1层审判准备，当达到5层时可以发动最终审判',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'GAIN_VERDICT_STACK', value: 1 },
      { type: 'SMALL_DAMAGE_BONUS', value: 1 }
    ],
    tags: ['审判', '准备', '积累'],
    archetype: ExecutionerArchetype.FINAL_VERDICT,
    flavor: '证据确凿，无可辩驳。'
  },
  {
    id: 'build_case',
    name: '建立案件',
    description: '记录敌方本回合的行动，在最终审判时作为额外伤害',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'RECORD_ENEMY_ACTION' },
      { type: 'GAIN_VERDICT_STACK', value: 1 },
      { type: 'VERDICT_DAMAGE_PER_RECORD', value: 3 }
    ],
    tags: ['审判', '记录', '准备'],
    archetype: ExecutionerArchetype.FINAL_VERDICT,
    flavor: '你的每一个罪行，都被记录。'
  },
  {
    id: 'accusation',
    name: '指控',
    description: '给敌方施加2层审判标记，加速最终审判的发动',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'APPLY_JUDGEMENT', value: 2 },
      { type: 'GAIN_VERDICT_STACK', value: 2 },
      { type: 'CRIT_ON_VERDICT' }
    ],
    tags: ['审判', '标记', '加速'],
    archetype: ExecutionerArchetype.FINAL_VERDICT,
    flavor: '罪名成立。'
  },
  {
    id: 'final_verdict',
    name: '最终审判',
    description: '【终结技】需要5层准备，造成20+每层准备3点伤害',
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 15, max: 25 },
    speed: 1,
    effects: [
      { type: 'REQUIRE_VERDICT_STACK', value: 5 },
      { type: 'BASE_DAMAGE', value: 20 },
      { type: 'DAMAGE_PER_VERDICT_STACK', value: 3 },
      { type: 'CONSUME_ALL_VERDICT_STACKS' }
    ],
    tags: ['审判', '终结', '超爆发'],
    archetype: ExecutionerArchetype.FINAL_VERDICT,
    flavor: '审判，现在开始。'
  },
  {
    id: 'divine_judgement',
    name: '神圣审判',
    description: '【传奇】最终审判后，若敌方存活，自动进行第二次审判（伤害减半）',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'SECOND_VERDICT_IF_SURVIVE', multiplier: 0.5 },
      { type: 'AUTO_VERDICT_STACK', value: 1 }
    ],
    tags: ['审判', '传奇', '二次机会'],
    archetype: ExecutionerArchetype.FINAL_VERDICT,
    flavor: '审判，永不止息。'
  }
];

// ==================== 合并所有处刑者卡牌 ====================

const EXECUTIONER_EXTENDED_CARDS = [
  ...DOMINATION_CARDS,
  ...EXECUTE_CARDS,
  ...COUNTER_CARDS,
  ...JUDGEMENT_CARDS,
  ...CHAIN_KILL_CARDS,
  ...PRESSURE_CARDS,
  ...PRECISION_CARDS,
  ...FINAL_VERDICT_CARDS
];

// ==================== 流派说明 ====================

const EXECUTIONER_ARCHETYPE_DESCRIPTIONS = {
  [ExecutionerArchetype.DOMINATION]: {
    name: '压制流',
    description: '连续胜利不断强化，敌方越来越难反击，一旦建立节奏极其恐怖。',
    coreMechanic: '压制层数提供永久加成',
    buildDirection: '维持连胜，累积压制',
    finisher: '绝对压制',
    difficulty: '★★★★☆'
  },
  [ExecutionerArchetype.EXECUTE]: {
    name: '斩杀流',
    description: '敌方越残血越危险，擅长快速结束战斗，拥有大量终结技。',
    coreMechanic: '低血时获得巨大加成和即死能力',
    buildDirection: '压低敌方生命，精准收割',
    finisher: '死刑宣告',
    difficulty: '★★★☆☆'
  },
  [ExecutionerArchetype.COUNTER]: {
    name: '铁壁反制流',
    description: '敌方主动进攻反而吃亏，擅长克制赌博流，可精准反制大Roll。',
    coreMechanic: '反击敌方攻击，化攻为守',
    buildDirection: '等待敌方攻击，反制制胜',
    finisher: '反制大师',
    difficulty: '★★★★☆'
  },
  [ExecutionerArchetype.JUDGEMENT]: {
    name: '审判规则流',
    description: '改变战斗规则，限制敌方选择，强制危险对决。',
    coreMechanic: '施加铁律，惩罚违规',
    buildDirection: '控制规则，限制敌方',
    finisher: '至高审判者',
    difficulty: '★★★★★'
  },
  [ExecutionerArchetype.CHAIN_KILL]: {
    name: '连斩流',
    description: '连续获胜后无限强化，形成滚雪球，后期极度暴力。',
    coreMechanic: '连斩次数提供加成',
    buildDirection: '保持连胜，无限连斩',
    finisher: '无尽连斩',
    difficulty: '★★★★☆'
  },
  [ExecutionerArchetype.PRESSURE]: {
    name: '威压流',
    description: '降低敌方判断能力，强迫敌方空过，削弱敌方出牌意志。',
    coreMechanic: '威压层数削弱敌方',
    buildDirection: '累积威压，让敌方崩溃',
    finisher: '恐惧化身',
    difficulty: '★★★★☆'
  },
  [ExecutionerArchetype.PRECISION]: {
    name: '精准裁决流',
    description: '极低随机性，高稳定Roll，可计算敌方结果。',
    coreMechanic: '降低方差，提高稳定性',
    buildDirection: '追求确定性，数学压制',
    finisher: '绝对精准',
    difficulty: '★★★☆☆'
  },
  [ExecutionerArchetype.FINAL_VERDICT]: {
    name: '最终审判流',
    description: '前期建立审判层数，后期发动超终结，极强压迫感。',
    coreMechanic: '累积审判准备，发动超级终结',
    buildDirection: '隐藏布局，一击必杀',
    finisher: '神圣审判',
    difficulty: '★★★★★'
  }
};

// ==================== 导出 ====================

module.exports = {
  ExecutionerArchetype,
  ExecutionerState,
  IronLaw,
  EXECUTIONER_ARCHETYPE_DESCRIPTIONS,
  DOMINATION_CARDS,
  EXECUTE_CARDS,
  COUNTER_CARDS,
  JUDGEMENT_CARDS,
  CHAIN_KILL_CARDS,
  PRESSURE_CARDS,
  PRECISION_CARDS,
  FINAL_VERDICT_CARDS,
  EXECUTIONER_EXTENDED_CARDS
};
