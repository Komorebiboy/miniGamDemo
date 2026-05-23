/**
 * 职业系统 - 心理博弈Roguelike卡牌游戏
 * 
 * 四大职业：
 * 1. 赌徒 - 高风险高收益，8大流派
 * 2. 魔术师 - 信息欺骗与偷看
 * 3. 处刑者 - 稳定压制与反制
 * 4. 狂徒 - 低血爆发与翻盘
 */

const CardType = {
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  SKILL: 'SKILL',
  FINISHER: 'FINISHER',
  LEGENDARY: 'LEGENDARY'
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

// ==================== 职业定义 ====================

const PlayerClass = {
  GAMBLER: 'GAMBLER',      // 赌徒 - 8大流派
  MAGICIAN: 'MAGICIAN',    // 魔术师
  EXECUTIONER: 'EXECUTIONER', // 处刑者
  MANIAC: 'MANIAC'         // 狂徒
};

// ==================== 导入扩展系统 ====================

const GamblerArchetypes = require('./GamblerArchetypes');
const {
  GamblerArchetype,
  ARCHETYPE_DESCRIPTIONS: GAMBLER_ARCHETYPE_DESCRIPTIONS,
  GAMBLER_EXTENDED_CARDS
} = GamblerArchetypes;

const MagicianArchetypes = require('./MagicianArchetypes');
const {
  MagicianArchetype,
  MAGICIAN_ARCHETYPE_DESCRIPTIONS,
  MAGICIAN_EXTENDED_CARDS
} = MagicianArchetypes;

const ExecutionerArchetypes = require('./ExecutionerArchetypes');
const {
  ExecutionerArchetype,
  EXECUTIONER_ARCHETYPE_DESCRIPTIONS,
  EXECUTIONER_EXTENDED_CARDS
} = ExecutionerArchetypes;

const ManiacArchetypes = require('./ManiacArchetypes');
const {
  ManiacArchetype,
  MANIAC_ARCHETYPE_DESCRIPTIONS,
  MANIAC_EXTENDED_CARDS
} = ManiacArchetypes;

// ==================== 赌徒职业 ====================
// 高风险高收益，All-in机制

const GAMBLER_CARDS = [
  {
    id: 'all_in',
    name: 'All In',
    description: '本回合Roll范围变为1-20，若Roll出15+则伤害翻倍',
    type: CardType.FINISHER,
    rarity: CardRarity.FINISHER,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 1, max: 20 },
    speed: 3,
    effects: [{ type: 'GAMBLE_DOUBLE', value: 15, trigger: 'on_crit_roll' }],
    tags: ['终结', '赌博', '高风险'],
    classExclusive: PlayerClass.GAMBLER
  },
  {
    id: 'double_or_nothing',
    name: '孤注一掷',
    description: '50%几率伤害翻倍，50%几率无效',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 8, max: 12 },
    speed: 5,
    effects: [{ type: 'COIN_FLIP', value: 2, trigger: 'on_reveal' }],
    tags: ['赌博', '随机'],
    classExclusive: PlayerClass.GAMBLER
  },
  {
    id: 'loaded_dice',
    name: '灌铅骰子',
    description: '本回合Roll最小值+3',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [{ type: 'ROLL_MIN_BOOST', value: 3, duration: 1 }],
    tags: ['增益', '骰子操控'],
    classExclusive: PlayerClass.GAMBLER
  },
  {
    id: 'high_roller',
    name: '豪赌者',
    description: 'Roll出最大值时获得额外回合',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 6, max: 14 },
    speed: 4,
    effects: [{ type: 'EXTRA_TURN_ON_MAX', value: 1, trigger: 'on_max_roll' }],
    tags: ['赌博', '连击'],
    classExclusive: PlayerClass.GAMBLER
  },
  {
    id: 'risky_bet',
    name: '冒险赌注',
    description: '失去5生命，Roll范围变为10-20',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 10, max: 20 },
    speed: 3,
    effects: [{ type: 'SELF_DAMAGE', value: 5, trigger: 'immediate' }],
    tags: ['自伤', '高收益'],
    classExclusive: PlayerClass.GAMBLER
  }
];

// ==================== 魔术师职业 ====================
// 信息欺骗与偷看

const MAGICIAN_CARDS = [
  {
    id: 'mirror_image',
    name: '镜像术',
    description: '显示虚假的Roll范围给对手',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 5, max: 10 },
    speed: 6,
    effects: [
      { type: 'FAKE_DISPLAY', value: 1, trigger: 'on_reveal' },
      { type: 'SHIELD', value: 3 }
    ],
    tags: ['欺骗', '伪装', '护盾'],
    classExclusive: PlayerClass.MAGICIAN
  },
  {
    id: 'mind_read',
    name: '读心术',
    description: '查看敌方真实Roll范围',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.SAFE,
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [{ type: 'REVEAL_ENEMY_ROLL', value: 1, trigger: 'immediate' }],
    tags: ['洞察', '信息'],
    classExclusive: PlayerClass.MAGICIAN
  },
  {
    id: 'sleight_of_hand',
    name: '妙手空空',
    description: '偷看敌方手牌，并可以交换一张',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [{ type: 'STEAL_PEEK', value: 1, trigger: 'immediate' }],
    tags: ['偷看', '交换'],
    classExclusive: PlayerClass.MAGICIAN
  },
  {
    id: 'smoke_bomb',
    name: '烟雾弹',
    description: '本回合敌方无法看到你的出牌',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 9,
    effects: [{ type: 'HIDE_PLAY', value: 1, duration: 1 }],
    tags: ['隐藏', '欺骗'],
    classExclusive: PlayerClass.MAGICIAN
  },
  {
    id: 'illusion_strike',
    name: '幻影打击',
    description: '若敌方误判你的牌型，伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 4, max: 8 },
    speed: 6,
    effects: [{ type: 'MISDIRECT_BONUS', value: 2, trigger: 'on_misread' }],
    tags: ['欺骗', '心理'],
    classExclusive: PlayerClass.MAGICIAN
  }
];

// ==================== 处刑者职业 ====================
// 稳定压制与反制

const EXECUTIONER_CARDS = [
  {
    id: 'cold_judgment',
    name: '冷血裁决',
    description: '敌方生命低于30%时直接斩杀',
    type: CardType.FINISHER,
    rarity: CardRarity.FINISHER,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 8, max: 12 },
    speed: 2,
    effects: [{ type: 'EXECUTE', value: 30, trigger: 'on_reveal' }],
    tags: ['终结', '斩杀'],
    classExclusive: PlayerClass.EXECUTIONER
  },
  {
    id: 'counter_strike',
    name: '反击',
    description: '若敌方攻击，你获得先手并伤害+50%',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 3, max: 6 },
    speed: 10,
    effects: [
      { type: 'COUNTER_ATTACK', value: 1.5, trigger: 'vs_attack' },
      { type: 'SPEED_PRIORITY', value: 1 }
    ],
    tags: ['反制', '先手'],
    classExclusive: PlayerClass.EXECUTIONER
  },
  {
    id: 'suppress',
    name: '压制',
    description: '本回合敌方Roll-3',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [{ type: 'ENEMY_ROLL_PENALTY', value: 3, duration: 1 }],
    tags: ['压制', '减益'],
    classExclusive: PlayerClass.EXECUTIONER
  },
  {
    id: 'iron_will',
    name: '钢铁意志',
    description: '获得护盾，下回合Roll+2',
    type: CardType.DEFENSE,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.SAFE,
    rollRange: { min: 0, max: 4 },
    speed: 4,
    effects: [
      { type: 'SHIELD', value: 8 },
      { type: 'NEXT_ROLL_BOOST', value: 2, duration: 1 }
    ],
    tags: ['防御', '增益'],
    classExclusive: PlayerClass.EXECUTIONER
  },
  {
    id: 'relentless',
    name: '无情追击',
    description: '连续获胜时伤害递增',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 6, max: 10 },
    speed: 5,
    effects: [{ type: 'WIN_STREAK', value: 1.3, trigger: 'on_consecutive_win' }],
    tags: ['连击', '压制'],
    classExclusive: PlayerClass.EXECUTIONER
  }
];

// ==================== 狂徒职业 ====================
// 低血爆发与翻盘

const MANIAC_CARDS = [
  {
    id: 'desperate_gamble',
    name: '亡命一搏',
    description: '生命越低Roll范围越大，最低1生命',
    type: CardType.FINISHER,
    rarity: CardRarity.FINISHER,
    riskLevel: RiskLevel.EXTREME,
    rollRange: { min: 1, max: 25 },
    speed: 2,
    effects: [{ type: 'DESPERATION', value: 1, trigger: 'scale_with_missing_hp' }],
    tags: ['终结', '翻盘', '绝望'],
    classExclusive: PlayerClass.MANIAC
  },
  {
    id: 'berserk',
    name: '狂暴',
    description: '失去10生命，本回合伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 5, max: 10 },
    speed: 4,
    effects: [
      { type: 'SELF_DAMAGE', value: 10, trigger: 'immediate' },
      { type: 'DAMAGE_MULTIPLY', value: 2, duration: 1 }
    ],
    tags: ['自伤', '爆发'],
    classExclusive: PlayerClass.MANIAC
  },
  {
    id: 'last_stand',
    name: '背水一战',
    description: '生命低于20时，Roll最小值+5',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.HIGH,
    rollRange: { min: 0, max: 0 },
    speed: 3,
    effects: [{ type: 'LOW_HP_BOOST', value: 5, threshold: 20 }],
    tags: ['翻盘', '低血'],
    classExclusive: PlayerClass.MANIAC
  },
  {
    id: 'adrenaline_rush',
    name: '肾上腺素',
    description: '受到伤害后，下回合Roll+4',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    riskLevel: RiskLevel.MODERATE,
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [{ type: 'POST_DAMAGE_BOOST', value: 4, duration: 1 }],
    tags: ['反击', '增益'],
    classExclusive: PlayerClass.MANIAC
  },
  {
    id: 'second_wind',
    name: '第二 wind',
    description: '生命首次低于10时，恢复15生命',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    riskLevel: RiskLevel.SAFE,
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [{ type: 'EMERGENCY_HEAL', value: 15, threshold: 10, trigger: 'once_per_battle' }],
    tags: ['治疗', '保命'],
    classExclusive: PlayerClass.MANIAC
  }
];

// ==================== 职业配置 ====================

const CLASS_CONFIG = {
  [PlayerClass.GAMBLER]: {
    name: '赌徒',
    description: '高风险高收益，All-in机制',
    icon: '🎲',
    color: '#FFD700',
    startingHp: 70,
    maxHp: 70,
    specialMechanic: '幸运值系统 - 每3回合获得一次"幸运"，下次Roll取最大值',
    playstyle: '喜欢高风险高回报，关键时刻All-in',
    deckStrategy: '多带赌博牌，追求一击必杀'
  },
  [PlayerClass.MAGICIAN]: {
    name: '魔术师',
    description: '信息欺骗与偷看',
    icon: '🎩',
    color: '#8A2BE2',
    startingHp: 75,
    maxHp: 75,
    specialMechanic: '幻象层数 - 每使用一张欺骗牌获得幻象，满3层时下次伤害免疫',
    playstyle: '操控信息，误导对手，偷看手牌',
    deckStrategy: '多带欺骗和洞察牌，控制信息差'
  },
  [PlayerClass.EXECUTIONER]: {
    name: '处刑者',
    description: '稳定压制与反制',
    icon: '⚔️',
    color: '#DC143C',
    startingHp: 85,
    maxHp: 85,
    specialMechanic: '处刑标记 - 对同一敌人连续攻击3次后，下次攻击必暴击',
    playstyle: '稳扎稳打，压制对手，寻找斩杀时机',
    deckStrategy: '平衡攻防，带反制和终结牌'
  },
  [PlayerClass.MANIAC]: {
    name: '狂徒',
    description: '低血爆发与翻盘',
    icon: '🔥',
    color: '#FF4500',
    startingHp: 60,
    maxHp: 60,
    specialMechanic: '狂怒值 - 每次受伤积累狂怒，满10点时下次攻击伤害翻倍',
    playstyle: '故意卖血，低血爆发，绝境翻盘',
    deckStrategy: '多带自伤和翻盘牌，追求极限输出'
  }
};

// ==================== 生成职业卡组 ====================
// 初始牌组：10张固定职业专属牌，自然混合各流派

function getClassDeck(playerClass, options = {}) {
  const deck = [];
  let allClassCards = [];
  
  // 根据职业选择对应的扩展卡牌
  switch (playerClass) {
    case PlayerClass.GAMBLER:
      allClassCards = GAMBLER_EXTENDED_CARDS;
      break;
    case PlayerClass.MAGICIAN:
      allClassCards = MAGICIAN_EXTENDED_CARDS;
      break;
    case PlayerClass.EXECUTIONER:
      allClassCards = EXECUTIONER_EXTENDED_CARDS;
      break;
    case PlayerClass.MANIAC:
      allClassCards = MANIAC_EXTENDED_CARDS;
      break;
    default:
      allClassCards = GAMBLER_EXTENDED_CARDS;
  }
  
  // 获取所有流派类型
  const archetypes = [...new Set(allClassCards.map(card => card.archetype))];
  const selectedCards = [];
  
  // 从每个流派随机抽取1-2张，确保流派多样性
  archetypes.forEach(archetype => {
    const archetypeCards = allClassCards.filter(card => card.archetype === archetype);
    const shuffled = [...archetypeCards].sort(() => Math.random() - 0.5);
    // 每个流派随机选1-2张
    const count = Math.random() > 0.5 ? 2 : 1;
    selectedCards.push(...shuffled.slice(0, count));
  });
  
  // 如果不足10张，从剩余卡牌中随机补充
  if (selectedCards.length < 10) {
    const remainingCards = allClassCards.filter(card => 
      !selectedCards.some(selected => selected.id === card.id)
    );
    const shuffledRemaining = [...remainingCards].sort(() => Math.random() - 0.5);
    const needCount = 10 - selectedCards.length;
    selectedCards.push(...shuffledRemaining.slice(0, needCount));
  }
  
  // 如果超过10张，随机截取10张
  if (selectedCards.length > 10) {
    const shuffled = [...selectedCards].sort(() => Math.random() - 0.5);
    selectedCards.length = 10;
  }
  
  // 最终洗牌
  const finalCards = [...selectedCards].sort(() => Math.random() - 0.5);
  
  // 加入10张职业专属牌
  deck.push(...finalCards.map(card => ({
    ...card,
    instanceId: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })));
  
  // 统计流派分布
  const archetypeCount = {};
  deck.forEach(card => {
    archetypeCount[card.archetype] = (archetypeCount[card.archetype] || 0) + 1;
  });
  
  console.log(`[ClassSystem] 生成${playerClass}卡组: ${deck.length}张专属牌`);
  console.log(`[ClassSystem] 流派分布:`, archetypeCount);
  
  return deck.map((card, index) => ({
    ...card,
    instanceId: `card_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
  }));
}

// ==================== 获取赌徒流派信息 ====================

function getGamblerArchetypeInfo(archetype) {
  return ARCHETYPE_DESCRIPTIONS[archetype] || null;
}

function getAllGamblerArchetypes() {
  return Object.keys(GamblerArchetype).map(key => ({
    id: GamblerArchetype[key],
    ...ARCHETYPE_DESCRIPTIONS[GamblerArchetype[key]]
  }));
}

// ==================== 获取赌徒扩展卡牌 ====================

function getGamblerExtendedCards() {
  return GAMBLER_EXTENDED_CARDS;
}

function getCardsByArchetype(archetype, playerClass = 'GAMBLER') {
  if (playerClass === 'MAGICIAN') {
    return MAGICIAN_EXTENDED_CARDS.filter(card => card.archetype === archetype);
  } else if (playerClass === 'EXECUTIONER') {
    return EXECUTIONER_EXTENDED_CARDS.filter(card => card.archetype === archetype);
  } else if (playerClass === 'MANIAC') {
    return MANIAC_EXTENDED_CARDS.filter(card => card.archetype === archetype);
  }
  return GAMBLER_EXTENDED_CARDS.filter(card => card.archetype === archetype);
}

// ==================== 获取魔术师流派信息 ====================

function getMagicianArchetypeInfo(archetype) {
  return MAGICIAN_ARCHETYPE_DESCRIPTIONS[archetype] || null;
}

function getAllMagicianArchetypes() {
  return Object.keys(MagicianArchetype).map(key => ({
    id: MagicianArchetype[key],
    ...MAGICIAN_ARCHETYPE_DESCRIPTIONS[MagicianArchetype[key]]
  }));
}

// ==================== 获取魔术师扩展卡牌 ====================

function getMagicianExtendedCards() {
  return MAGICIAN_EXTENDED_CARDS;
}

// ==================== 获取处刑者流派信息 ====================

function getExecutionerArchetypeInfo(archetype) {
  return EXECUTIONER_ARCHETYPE_DESCRIPTIONS[archetype] || null;
}

function getAllExecutionerArchetypes() {
  return Object.keys(ExecutionerArchetype).map(key => ({
    id: ExecutionerArchetype[key],
    ...EXECUTIONER_ARCHETYPE_DESCRIPTIONS[ExecutionerArchetype[key]]
  }));
}

// ==================== 获取处刑者扩展卡牌 ====================

function getExecutionerExtendedCards() {
  return EXECUTIONER_EXTENDED_CARDS;
}

// ==================== 获取狂徒流派信息 ====================

function getManiacArchetypeInfo(archetype) {
  return MANIAC_ARCHETYPE_DESCRIPTIONS[archetype] || null;
}

function getAllManiacArchetypes() {
  return Object.keys(ManiacArchetype).map(key => ({
    id: ManiacArchetype[key],
    ...MANIAC_ARCHETYPE_DESCRIPTIONS[ManiacArchetype[key]]
  }));
}

// ==================== 获取狂徒扩展卡牌 ====================

function getManiacExtendedCards() {
  return MANIAC_EXTENDED_CARDS;
}

function getClassConfig(playerClass) {
  return CLASS_CONFIG[playerClass] || CLASS_CONFIG[PlayerClass.GAMBLER];
}

module.exports = {
  PlayerClass,
  CLASS_CONFIG,
  GamblerArchetype,
  MagicianArchetype,
  ExecutionerArchetype,
  ManiacArchetype,
  GAMBLER_ARCHETYPE_DESCRIPTIONS,
  MAGICIAN_ARCHETYPE_DESCRIPTIONS,
  EXECUTIONER_ARCHETYPE_DESCRIPTIONS,
  MANIAC_ARCHETYPE_DESCRIPTIONS,
  GAMBLER_CARDS,
  GAMBLER_EXTENDED_CARDS,
  MAGICIAN_CARDS,
  MAGICIAN_EXTENDED_CARDS,
  EXECUTIONER_CARDS,
  EXECUTIONER_EXTENDED_CARDS,
  MANIAC_CARDS,
  MANIAC_EXTENDED_CARDS,
  getClassDeck,
  getClassConfig,
  getGamblerArchetypeInfo,
  getAllGamblerArchetypes,
  getGamblerExtendedCards,
  getMagicianArchetypeInfo,
  getAllMagicianArchetypes,
  getMagicianExtendedCards,
  getExecutionerArchetypeInfo,
  getAllExecutionerArchetypes,
  getExecutionerExtendedCards,
  getManiacArchetypeInfo,
  getAllManiacArchetypes,
  getManiacExtendedCards,
  getCardsByArchetype
};
