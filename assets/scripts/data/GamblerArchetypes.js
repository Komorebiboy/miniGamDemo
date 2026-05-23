/**
 * 赌徒职业 - 8流派完整扩展系统
 * 
 * 8个流派：
 * 1. ALL IN流 - 超大Roll，一击翻盘
 * 2. 幸运流 - 幸运值，暴击连锁
 * 3. 欺诈流 - 误导，假信息，读心
 * 4. 濒死狂赌流 - 残血爆发
 * 5. 连胜热手流 - 连胜Momentum
 * 6. 赌债流 - 透支，延迟代价
 * 7. 概率操控流 - 修改Roll区间
 * 8. 终焉豪赌流 - 超终结，极端风险
 */

// ==================== 流派定义 ====================

const GamblerArchetype = {
  ALL_IN: 'ALL_IN',           // ALL IN流
  LUCKY: 'LUCKY',             // 幸运流
  DECEPTION: 'DECEPTION',     // 欺诈流
  DESPERATION: 'DESPERATION', // 濒死狂赌流
  HOT_HAND: 'HOT_HAND',       // 连胜热手流
  DEBT: 'DEBT',               // 赌债流
  PROBABILITY: 'PROBABILITY', // 概率操控流
  APOCALYPSE: 'APOCALYPSE'    // 终焉豪赌流
};

// ==================== 高级机制状态 ====================

const GamblerState = {
  // 赌债状态
  debt: 0,                    // 当前赌债层数
  debtTimer: 0,               // 赌债结算倒计时
  
  // 热手状态
  hotHandStacks: 0,           // 热手层数
  maxHotHandStacks: 10,       // 最大热手层数
  
  // 连胜状态
  consecutiveWins: 0,         // 连胜次数
  
  // 濒死状态
  desperationStacks: 0,       // 绝望层数
  
  // 赌注累积
  betStacks: 0,               // 赌注层数（终焉流）
  maxBetStacks: 20,           // 最大赌注层数
  
  // 赌局状态
  tableState: null,           // 当前赌局状态
  
  // 幸运值
  luckValue: 0,               // 当前幸运值
  maxLuckValue: 100,          // 最大幸运值
  
  // 概率操控
  rollMinModifier: 0,         // Roll最小值修正
  rollMaxModifier: 0,         // Roll最大值修正
  critChanceModifier: 0,      // 暴击率修正
  
  // 隐藏信息
  hiddenRollValue: null,      // 隐藏的真实Roll值
  fakeRollDisplay: null,      // 显示给敌方的假Roll值
  
  // 命运锁定
  lockedRollValue: null,      // 锁定的Roll值
  doubleRollNext: false,      // 下次双重Roll
  
  // 终焉准备
  apocalypseReady: false,     // 终焉牌是否可用
  apocalypseStacks: 0         // 终焉层数
};

// ==================== 赌局状态类型 ====================

const TableState = {
  CRAZY: {                    // 疯狂赌局
    id: 'CRAZY',
    name: '疯狂赌局',
    description: '双方Roll范围翻倍，伤害翻倍',
    effect: {
      rollRangeMultiplier: 2,
      damageMultiplier: 2
    }
  },
  HIGH_STAKES: {              // 高倍率赌局
    id: 'HIGH_STAKES',
    name: '高倍率赌局',
    description: '胜者获得双倍奖励，败者受到双倍伤害',
    effect: {
      rewardMultiplier: 2,
      damageMultiplier: 2
    }
  },
  FATE: {                     // 命运赌局
    id: 'FATE',
    name: '命运赌局',
    description: '双方Roll值互换',
    effect: {
      swapRolls: true
    }
  },
  HELL: {                     // 地狱赌局
    id: 'HELL',
    name: '地狱赌局',
    description: '双方同时失去10生命，Roll+5',
    effect: {
      selfDamage: 10,
      rollBonus: 5
    }
  },
  DIVINE: {                   // 神恩赌局
    id: 'DIVINE',
    name: '神恩赌局',
    description: '双方最小Roll+5',
    effect: {
      minRollBonus: 5
    }
  }
};

// ==================== 1. ALL IN流卡牌 (5张) ====================

const ALL_IN_CARDS = [
  {
    id: 'all_in_basic',
    name: '全押',
    description: 'Roll 1-20，若Roll≥15则伤害翻倍，若Roll≤5则自己受到一半伤害',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 1, max: 20 },
    speed: 2,
    effects: [
      { type: 'GAMBLE_DOUBLE', value: 15, condition: 'roll>=15' },
      { type: 'SELF_DAMAGE_HALF', value: 0.5, condition: 'roll<=5' }
    ],
    tags: ['ALL_IN', '赌博', '高风险'],
    archetype: GamblerArchetype.ALL_IN,
    flavor: '要么一夜暴富，要么倾家荡产。'
  },
  {
    id: 'double_down',
    name: '加倍下注',
    description: '失去5生命，本回合Roll最大值+5',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'SELF_DAMAGE', value: 5 },
      { type: 'ROLL_MAX_BOOST', value: 5, duration: 1 }
    ],
    tags: ['ALL_IN', '自伤', '增益'],
    archetype: GamblerArchetype.ALL_IN,
    flavor: '疼痛让我更加清醒。'
  },
  {
    id: 'triple_or_nothing',
    name: '三倍或归零',
    description: '33%几率伤害x3，33%几率伤害x2，33%几率伤害为0',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 6, max: 10 },
    speed: 3,
    effects: [
      { type: 'TRIPLE_GAMBLE', value: 3, weights: [0.33, 0.33, 0.34] }
    ],
    tags: ['ALL_IN', '赌博', '随机'],
    archetype: GamblerArchetype.ALL_IN,
    flavor: '三倍的快感，三倍的痛苦。'
  },
  {
    id: 'last_chip',
    name: '最后筹码',
    description: '生命越低伤害越高，每损失10生命Roll+2',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 4, max: 8 },
    speed: 4,
    effects: [
      { type: 'DAMAGE_PER_MISSING_HP', value: 2, threshold: 10 }
    ],
    tags: ['ALL_IN', '残血', '成长'],
    archetype: GamblerArchetype.ALL_IN,
    flavor: '当没有退路时，你只能向前。'
  },
  {
    id: 'apocalypse_bet',
    name: '末日赌注',
    description: '【终结技】失去当前一半生命，Roll 10-30，伤害x3',
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 10, max: 30 },
    speed: 1,
    effects: [
      { type: 'SELF_DAMAGE_PERCENT', value: 0.5 },
      { type: 'DAMAGE_MULTIPLY', value: 3 }
    ],
    tags: ['ALL_IN', '终结', '自杀式'],
    archetype: GamblerArchetype.ALL_IN,
    flavor: '如果这是最后一局，那就让它值得铭记。'
  }
];

// ==================== 2. 幸运流卡牌 (5张) ====================

const LUCKY_CARDS = [
  {
    id: 'lucky_charm',
    name: '幸运符',
    description: '获得2层幸运，每层幸运使暴击率+5%',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 9,
    effects: [
      { type: 'GAIN_LUCK', value: 2 }
    ],
    tags: ['幸运', '增益', '暴击'],
    archetype: GamblerArchetype.LUCKY,
    flavor: '运气是可以积累的。'
  },
  {
    id: 'lucky_strike',
    name: '幸运一击',
    description: 'Roll 3-12，幸运层数x2加到Roll上',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 3, max: 12 },
    speed: 5,
    effects: [
      { type: 'ADD_LUCK_TO_ROLL', multiplier: 2 }
    ],
    tags: ['幸运', '攻击', '成长'],
    archetype: GamblerArchetype.LUCKY,
    flavor: '当运气成为实力的一部分。'
  },
  {
    id: 'jackpot',
    name: '头奖',
    description: 'Roll 1-6，若Roll出6则伤害x5并获得3层幸运',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 1, max: 6 },
    speed: 4,
    effects: [
      { type: 'JACKPOT', threshold: 6, damageMult: 5, luckGain: 3 }
    ],
    tags: ['幸运', '头奖', '暴击'],
    archetype: GamblerArchetype.LUCKY,
    flavor: '大奖总是留给有耐心的人。'
  },
  {
    id: 'lucky_streak',
    name: '好运连连',
    description: '若上回合暴击，本回合Roll最小值+5',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 2, max: 8 },
    speed: 6,
    effects: [
      { type: 'BONUS_IF_LAST_CRIT', rollMinBonus: 5 }
    ],
    tags: ['幸运', '连击', '条件'],
    archetype: GamblerArchetype.LUCKY,
    flavor: '好运会传染。'
  },
  {
    id: 'fortunes_favor',
    name: '命运眷顾',
    description: '【传奇】幸运层数不再衰减，Roll范围变为幸运值-幸运值+10',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'LUCK_NO_DECAY' },
      { type: 'ROLL_BASED_ON_LUCK', offset: 10 }
    ],
    tags: ['幸运', '传奇', '质变'],
    archetype: GamblerArchetype.LUCKY,
    flavor: '命运终于站在了我这边。'
  }
];

// ==================== 3. 欺诈流卡牌 (6张) ====================

const DECEPTION_CARDS = [
  {
    id: 'fake_out',
    name: '虚张声势',
    description: '向敌方显示虚假的Roll范围（显示为8-15，实际为3-8）',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 3, max: 8 },
    speed: 7,
    effects: [
      { type: 'FAKE_DISPLAY', fakeMin: 8, fakeMax: 15 }
    ],
    tags: ['欺诈', '误导', '伪装'],
    archetype: GamblerArchetype.DECEPTION,
    flavor: '让他们以为你很弱。'
  },
  {
    id: 'mind_game',
    name: '心理博弈',
    description: '查看敌方手牌，选择一张使其本回合无法使用',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'PEEK_AND_DISABLE', count: 1 }
    ],
    tags: ['欺诈', '读心', '控制'],
    archetype: GamblerArchetype.DECEPTION,
    flavor: '知道他们在想什么，你就赢了。'
  },
  {
    id: 'bluff',
    name: '诈唬',
    description: '本回合不显示任何信息给敌方，敌方无法预判你的行动',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 9,
    effects: [
      { type: 'HIDE_ALL_INFO', duration: 1 }
    ],
    tags: ['欺诈', '隐藏', '信息战'],
    archetype: GamblerArchetype.DECEPTION,
    flavor: '有时候，什么都不知道才是最可怕的。'
  },
  {
    id: 'misdirection',
    name: '声东击西',
    description: '若敌方误判你的牌型，你获得一次免费反击',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 4, max: 9 },
    speed: 6,
    effects: [
      { type: 'COUNTER_ON_MISREAD', damage: 5 }
    ],
    tags: ['欺诈', '反击', '心理'],
    archetype: GamblerArchetype.DECEPTION,
    flavor: '他们攻击的时候，就是破绽最大的时候。'
  },
  {
    id: 'puppet_master',
    name: '傀儡师',
    description: '操控敌方AI，使其下回合必定出最弱的牌',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'CONTROL_ENEMY_AI', behavior: ' weakest_card', duration: 1 }
    ],
    tags: ['欺诈', '控制', 'AI操控'],
    archetype: GamblerArchetype.DECEPTION,
    flavor: '他们以为自己在选择，其实是我替他们选的。'
  },
  {
    id: 'grand_deception',
    name: '惊天骗局',
    description: '【传奇】本局游戏中，你可以随时修改显示给敌方的Roll值',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'FREE_FAKE_DISPLAY' },
      { type: 'MIND_READ_PASSIVE' }
    ],
    tags: ['欺诈', '传奇', '质变'],
    archetype: GamblerArchetype.DECEPTION,
    flavor: '在这场游戏中，真相只是另一种谎言。'
  }
];

// ==================== 4. 濒死狂赌流卡牌 (5张) ====================

const DESPERATION_CARDS = [
  {
    id: 'desperate_gamble',
    name: '绝望赌博',
    description: '生命低于30%时可使用，Roll 1-25',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 1, max: 25 },
    speed: 3,
    effects: [
      { type: 'REQUIRE_LOW_HP', threshold: 0.3 }
    ],
    tags: ['濒死', '赌博', '高风险'],
    archetype: GamblerArchetype.DESPERATION,
    flavor: '当没有退路时，你只能相信命运。'
  },
  {
    id: 'last_stand',
    name: '背水一战',
    description: '生命越低Roll越高，生命10%时Roll+10',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 3, max: 8 },
    speed: 4,
    effects: [
      { type: 'ROLL_BONUS_PER_MISSING_HP', maxBonus: 10, threshold: 0.1 }
    ],
    tags: ['濒死', '成长', '残血'],
    archetype: GamblerArchetype.DESPERATION,
    flavor: '置之死地而后生。'
  },
  {
    id: 'death_dance',
    name: '死亡之舞',
    description: '失去当前生命的20%，本回合伤害x2.5',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 5, max: 10 },
    speed: 2,
    effects: [
      { type: 'SELF_DAMAGE_PERCENT', value: 0.2 },
      { type: 'DAMAGE_MULTIPLY', value: 2.5 }
    ],
    tags: ['濒死', '自伤', '爆发'],
    archetype: GamblerArchetype.DESPERATION,
    flavor: '在死亡的边缘跳舞。'
  },
  {
    id: 'second_wind',
    name: '第二 wind',
    description: '生命首次低于20%时，恢复15生命并获得绝望层数',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'HEAL_ON_LOW_HP_TRIGGER', heal: 15, threshold: 0.2 },
      { type: 'GAIN_DESPERATION', value: 1 }
    ],
    tags: ['濒死', '恢复', '被动'],
    archetype: GamblerArchetype.DESPERATION,
    flavor: '还没结束，我还能站起来。'
  },
  {
    id: 'phoenix_rise',
    name: '凤凰涅槃',
    description: '【终结技】生命低于10%时可使用，Roll 15-30，伤害x4',
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 15, max: 30 },
    speed: 1,
    effects: [
      { type: 'REQUIRE_CRITICAL_HP', threshold: 0.1 },
      { type: 'DAMAGE_MULTIPLY', value: 4 },
      { type: 'HEAL_ON_KILL', value: 20 }
    ],
    tags: ['濒死', '终结', '翻盘'],
    archetype: GamblerArchetype.DESPERATION,
    flavor: '从灰烬中重生。'
  }
];

// ==================== 5. 连胜热手流卡牌 (5张) ====================

const HOT_HAND_CARDS = [
  {
    id: 'momentum',
    name: '气势如虹',
    description: '若上回合胜利，本回合Roll+3',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 5,
    effects: [
      { type: 'BONUS_IF_LAST_WIN', rollBonus: 3 }
    ],
    tags: ['热手', '连胜', '条件'],
    archetype: GamblerArchetype.HOT_HAND,
    flavor: '胜利是最好的兴奋剂。'
  },
  {
    id: 'hot_streak',
    name: '热手状态',
    description: '获得热手层数，每层使胜利时Roll永久+1',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'GAIN_HOT_HAND', value: 1 },
      { type: 'ROLL_BONUS_PER_HOT_HAND', value: 1 }
    ],
    tags: ['热手', '成长', '永久'],
    archetype: GamblerArchetype.HOT_HAND,
    flavor: '手感来了，挡都挡不住。'
  },
  {
    id: 'unstoppable',
    name: '势不可挡',
    description: '连胜次数x2加到Roll上，失败时失去所有连胜',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 3, max: 7 },
    speed: 4,
    effects: [
      { type: 'ADD_WIN_STREAK_TO_ROLL', multiplier: 2 },
      { type: 'RESET_ON_LOSS' }
    ],
    tags: ['热手', '连胜', '高风险'],
    archetype: GamblerArchetype.HOT_HAND,
    flavor: '一旦开始，就无法停止。'
  },
  {
    id: 'clutch_performer',
    name: '关键先生',
    description: '连胜3次以上时，本回合伤害x2',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 5, max: 9 },
    speed: 5,
    effects: [
      { type: 'DAMAGE_MULTIPLY_IF_STREAK', multiplier: 2, threshold: 3 }
    ],
    tags: ['热手', '连胜', '爆发'],
    archetype: GamblerArchetype.HOT_HAND,
    flavor: '关键时刻，从不手软。'
  },
  {
    id: 'legendary_streak',
    name: '传奇连胜',
    description: '【传奇】连胜不再中断，每层连胜使暴击率+10%',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'STREAK_NO_RESET' },
      { type: 'CRIT_PER_STREAK', value: 0.1 }
    ],
    tags: ['热手', '传奇', '质变'],
    archetype: GamblerArchetype.HOT_HAND,
    flavor: '我已经超越了胜负。'
  }
];

// ==================== 6. 赌债流卡牌 (5张) ====================

const DEBT_CARDS = [
  {
    id: 'borrowed_power',
    name: '借来的力量',
    description: '立即获得+5 Roll，下回合受到5伤害',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'ROLL_BOOST_NOW', value: 5 },
      { type: 'DEBT', value: 5, delay: 1 }
    ],
    tags: ['赌债', '透支', '延迟'],
    archetype: GamblerArchetype.DEBT,
    flavor: '现在借用，未来偿还。'
  },
  {
    id: 'future_gamble',
    name: '未来赌注',
    description: '本回合Roll+8，3回合后受到15伤害',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 4, max: 8 },
    speed: 4,
    effects: [
      { type: 'ROLL_BOOST_NOW', value: 8 },
      { type: 'DEBT', value: 15, delay: 3 }
    ],
    tags: ['赌债', '透支', '高风险'],
    archetype: GamblerArchetype.DEBT,
    flavor: '未来的我会理解的...大概。'
  },
  {
    id: 'compound_interest',
    name: '利滚利',
    description: '每有1层赌债，本回合Roll+2',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 3, max: 6 },
    speed: 5,
    effects: [
      { type: 'ROLL_BONUS_PER_DEBT', value: 2 }
    ],
    tags: ['赌债', '成长', '风险'],
    archetype: GamblerArchetype.DEBT,
    flavor: '债务越多，力量越大。'
  },
  {
    id: 'debt_collector',
    name: '债务清算',
    description: '清除所有赌债，每层赌债造成3伤害',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 2, max: 5 },
    speed: 3,
    effects: [
      { type: 'CLEAR_DEBT' },
      { type: 'DAMAGE_PER_DEBT', value: 3 }
    ],
    tags: ['赌债', '清算', '爆发'],
    archetype: GamblerArchetype.DEBT,
    flavor: '该结账了。'
  },
  {
    id: 'soul_contract',
    name: '灵魂契约',
    description: '【传奇】获得10层赌债，本局游戏中所有Roll+5',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'GAIN_DEBT', value: 10 },
      { type: 'PERMANENT_ROLL_BONUS', value: 5 }
    ],
    tags: ['赌债', '传奇', '质变'],
    archetype: GamblerArchetype.DEBT,
    flavor: '用灵魂做抵押，换取永恒的力量。'
  }
];

// ==================== 7. 概率操控流卡牌 (5张) ====================

const PROBABILITY_CARDS = [
  {
    id: 'weighted_dice',
    name: '加权骰子',
    description: '本回合Roll最小值+3',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'ROLL_MIN_BOOST', value: 3, duration: 1 }
    ],
    tags: ['概率', '骰子操控', '稳定'],
    archetype: GamblerArchetype.PROBABILITY,
    flavor: '让运气变得更可靠。'
  },
  {
    id: 'fixed_roll',
    name: '固定点数',
    description: '锁定下一次Roll为当前手牌数+5',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'LOCK_ROLL', baseValue: 5, handMultiplier: 1 }
    ],
    tags: ['概率', '锁定', '确定性'],
    archetype: GamblerArchetype.PROBABILITY,
    flavor: '命运已经被我计算好了。'
  },
  {
    id: 'double_roll',
    name: '双重Roll',
    description: '本回合Roll两次，取较高值',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'DOUBLE_ROLL', take: 'higher' }
    ],
    tags: ['概率', '双重', '优势'],
    archetype: GamblerArchetype.PROBABILITY,
    flavor: '两次机会，总比一次好。'
  },
  {
    id: 'reroll',
    name: '重Roll',
    description: '对Roll结果不满意？重Roll一次',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 9,
    effects: [
      { type: 'REROLL', count: 1 }
    ],
    tags: ['概率', '重Roll', '第二次机会'],
    archetype: GamblerArchetype.PROBABILITY,
    flavor: '再来一次。'
  },
  {
    id: 'master_of_odds',
    name: '概率大师',
    description: '【传奇】所有Roll最小值+2，最大值+2，可以无限重Roll',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'PERMANENT_ROLL_MIN', value: 2 },
      { type: 'PERMANENT_ROLL_MAX', value: 2 },
      { type: 'INFINITE_REROLL' }
    ],
    tags: ['概率', '传奇', '质变'],
    archetype: GamblerArchetype.PROBABILITY,
    flavor: '在我眼中，概率只是数字。'
  }
];

// ==================== 8. 终焉豪赌流卡牌 (5张) ====================

const APOCALYPSE_CARDS = [
  {
    id: 'place_bet',
    name: '下注',
    description: '获得2层赌注，当赌注达到10层时可以打出终焉牌',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'GAIN_BET', value: 2 }
    ],
    tags: ['终焉', '赌注', '准备'],
    archetype: GamblerArchetype.APOCALYPSE,
    flavor: '每一局都在为最后的时刻做准备。'
  },
  {
    id: 'all_or_nothing',
    name: '孤注一掷',
    description: '消耗所有赌注层数，每层造成2伤害',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 1, max: 6 },
    speed: 3,
    effects: [
      { type: 'CONSUME_ALL_BETS' },
      { type: 'DAMAGE_PER_BET', value: 2 }
    ],
    tags: ['终焉', '赌注', '爆发'],
    archetype: GamblerArchetype.APOCALYPSE,
    flavor: '要么全赢，要么全输。'
  },
  {
    id: 'apocalypse_charge',
    name: '终焉蓄力',
    description: '失去5生命，获得5层赌注',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'SELF_DAMAGE', value: 5 },
      { type: 'GAIN_BET', value: 5 }
    ],
    tags: ['终焉', '赌注', '自伤'],
    archetype: GamblerArchetype.APOCALYPSE,
    flavor: '痛苦是力量的代价。'
  },
  {
    id: 'final_gamble',
    name: '终极赌博',
    description: '【终结技】需要15层赌注，Roll 20-40，伤害x5',
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 20, max: 40 },
    speed: 1,
    effects: [
      { type: 'REQUIRE_BET', value: 15 },
      { type: 'CONSUME_ALL_BETS' },
      { type: 'DAMAGE_MULTIPLY', value: 5 }
    ],
    tags: ['终焉', '终结', '超爆发'],
    archetype: GamblerArchetype.APOCALYPSE,
    flavor: '这是最后的时刻。'
  },
  {
    id: 'doomsday_prophecy',
    name: '末日预言',
    description: '【传奇】游戏开始时获得预言：当赌注达到20层时，自动触发末日审判（对敌方造成50伤害）',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'PROPHECY', trigger: 'bet>=20', effect: 'deal_damage', value: 50 },
      { type: 'GAIN_BET_PER_TURN', value: 1 }
    ],
    tags: ['终焉', '传奇', '自动触发'],
    archetype: GamblerArchetype.APOCALYPSE,
    flavor: '末日终将降临。'
  }
];

// ==================== 合并所有赌徒卡牌 ====================

const GAMBLER_EXTENDED_CARDS = [
  ...ALL_IN_CARDS,
  ...LUCKY_CARDS,
  ...DECEPTION_CARDS,
  ...DESPERATION_CARDS,
  ...HOT_HAND_CARDS,
  ...DEBT_CARDS,
  ...PROBABILITY_CARDS,
  ...APOCALYPSE_CARDS
];

// ==================== 流派说明 ====================

const ARCHETYPE_DESCRIPTIONS = {
  [GamblerArchetype.ALL_IN]: {
    name: 'ALL IN流',
    description: '超大Roll，一击翻盘。要么一夜暴富，要么倾家荡产。',
    coreMechanic: '高风险高回报，自伤换取力量',
    buildDirection: '收集自伤牌和伤害放大牌',
    finisher: '末日赌注',
    difficulty: '★★★★★'
  },
  [GamblerArchetype.LUCKY]: {
    name: '幸运流',
    description: '累积幸运值，让暴击成为常态。',
    coreMechanic: '幸运层数增加暴击率和Roll值',
    buildDirection: '累积幸运，追求极限Roll',
    finisher: '命运眷顾',
    difficulty: '★★★☆☆'
  },
  [GamblerArchetype.DECEPTION]: {
    name: '欺诈流',
    description: '操控信息，让敌人误判你的意图。',
    coreMechanic: '显示假信息，偷看敌方',
    buildDirection: '信息战，心理博弈',
    finisher: '惊天骗局',
    difficulty: '★★★★☆'
  },
  [GamblerArchetype.DESPERATION]: {
    name: '濒死狂赌流',
    description: '血越少越强，绝境中爆发。',
    coreMechanic: '低生命时获得巨大加成',
    buildDirection: '主动压低生命，残血爆发',
    finisher: '凤凰涅槃',
    difficulty: '★★★★★'
  },
  [GamblerArchetype.HOT_HAND]: {
    name: '连胜热手流',
    description: '连胜不断强化，但一旦失败全部归零。',
    coreMechanic: '连胜层数提供永久加成',
    buildDirection: '维持连胜，避免失败',
    finisher: '传奇连胜',
    difficulty: '★★★★☆'
  },
  [GamblerArchetype.DEBT]: {
    name: '赌债流',
    description: '现在借用力量，未来付出代价。',
    coreMechanic: '获得即时收益，延迟伤害',
    buildDirection: '累积债务，最后清算',
    finisher: '灵魂契约',
    difficulty: '★★★★☆'
  },
  [GamblerArchetype.PROBABILITY]: {
    name: '概率操控流',
    description: '将赌博变成科学，让随机变得可控。',
    coreMechanic: '修改Roll区间，重Roll',
    buildDirection: '稳定输出，降低方差',
    finisher: '概率大师',
    difficulty: '★★★☆☆'
  },
  [GamblerArchetype.APOCALYPSE]: {
    name: '终焉豪赌流',
    description: '慢速启动，最终释放毁灭性终结技。',
    coreMechanic: '累积赌注层数，释放超终结',
    buildDirection: '快速累积赌注，一击必杀',
    finisher: '末日预言',
    difficulty: '★★★★★'
  }
};

// ==================== 导出 ====================

module.exports = {
  GamblerArchetype,
  GamblerState,
  TableState,
  ARCHETYPE_DESCRIPTIONS,
  ALL_IN_CARDS,
  LUCKY_CARDS,
  DECEPTION_CARDS,
  DESPERATION_CARDS,
  HOT_HAND_CARDS,
  DEBT_CARDS,
  PROBABILITY_CARDS,
  APOCALYPSE_CARDS,
  GAMBLER_EXTENDED_CARDS
};
