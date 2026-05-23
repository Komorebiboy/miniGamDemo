/**
 * 狂徒职业 - 8流派完整扩展系统
 * 
 * 8个流派：
 * 1. 血怒流 - 低血，血怒，暴走
 * 2. 自残爆发流 - 自伤，透支，疯狂输出
 * 3. 暴走连击流 - 连击，高速，连续行动
 * 4. 混乱污染流 - 混乱，扭曲，污染赌局
 * 5. 变异进化流 - 进化，变异，成长
 * 6. 痛苦共鸣流 - 反伤，共伤，痛苦传播
 * 7. 失控命运流 - 不可预测，极端随机，混沌
 * 8. 终末暴走流 - 最终暴走，毁灭，全场崩坏
 */

// ==================== 流派定义 ====================

const ManiacArchetype = {
  BLOOD_RAGE: 'BLOOD_RAGE',       // 血怒流
  SELF_HARM: 'SELF_HARM',         // 自残爆发流
  RAMPAGE: 'RAMPAGE',             // 暴走连击流
  CORRUPTION: 'CORRUPTION',       // 混乱污染流
  MUTATION: 'MUTATION',           // 变异进化流
  PAIN_LINK: 'PAIN_LINK',         // 痛苦共鸣流
  CHAOS: 'CHAOS',                 // 失控命运流
  APOCALYPSE: 'APOCALYPSE'        // 终末暴走流
};

// ==================== 高级机制状态 ====================

const ManiacState = {
  // 疯狂值
  madness: 0,                   // 当前疯狂值
  maxMadness: 100,              // 最大疯狂值
  madnessThreshold: 50,         // 暴走阈值
  
  // 暴走状态
  rampageActive: false,         // 是否处于暴走
  rampageStacks: 0,             // 暴走层数
  rampageDuration: 0,           // 暴走剩余回合
  
  // 血怒状态
  bloodRageStacks: 0,           // 血怒层数
  maxBloodRage: 10,             // 最大血怒
  hpThresholdBonus: 0,          // 低血加成
  
  // 污染状态
  corruptionLevel: 0,           // 污染等级
  maxCorruption: 5,             // 最大污染
  globalCorruption: false,      // 是否全场污染
  
  // 变异状态
  mutationStacks: 0,            // 变异层数
  mutatedCards: [],             // 已变异卡牌
  evolutionCount: 0,            // 进化次数
  
  // 痛苦共鸣
  painLinkActive: false,        // 是否激活痛苦共鸣
  painLinkPercentage: 0,        // 伤害反弹百分比
  
  // 混乱状态
  chaosLevel: 0,                // 混乱等级
  randomEffectBonus: 0,         // 随机效果加成
  
  // 终末暴走
  apocalypseStacks: 0,          // 终末层数
  apocalypseReady: false,       // 是否可发动终末
  finalRampageTriggered: false  // 是否已触发终末
};

// ==================== 污染类型 ====================

const CorruptionType = {
  ROLL_SHIFT: {                 // Roll偏移
    id: 'ROLL_SHIFT',
    name: 'Roll污染',
    description: '双方Roll随机±3',
    effect: { rollRandomOffset: 3 }
  },
  RANDOM_DAMAGE: {              // 随机伤害
    id: 'RANDOM_DAMAGE',
    name: '伤害污染',
    description: '每回合双方随机受到1-5伤害',
    effect: { randomDamage: { min: 1, max: 5 } }
  },
  RULE_CHAOS: {                 // 规则混乱
    id: 'RULE_CHAOS',
    name: '规则污染',
    description: '每回合随机改变一条规则',
    effect: { randomRuleChange: true }
  },
  SPEED_SWAP: {                 // 速度互换
    id: 'SPEED_SWAP',
    name: '速度污染',
    description: '双方速度互换',
    effect: { swapSpeed: true }
  },
  MIRROR_DAMAGE: {              // 伤害镜像
    id: 'MIRROR_DAMAGE',
    name: '伤害镜像',
    description: '胜者受到败者一半的伤害',
    effect: { winnerTakesHalf: true }
  }
};

// ==================== 1. 血怒流卡牌 (5张) ====================

const BLOOD_RAGE_CARDS = [
  {
    id: 'blood_rage_strike',
    name: '血怒打击',
    description: '生命每损失10%，Roll+2',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 3, max: 7 },
    speed: 5,
    effects: [
      { type: 'ROLL_BONUS_PER_MISSING_HP', percent: 10, value: 2 },
      { type: 'GAIN_BLOOD_RAGE', value: 1 }
    ],
    tags: ['血怒', '残血', '成长'],
    archetype: ManiacArchetype.BLOOD_RAGE,
    flavor: '疼痛让我更加清醒。'
  },
  {
    id: 'desperate_frenzy',
    name: '绝望狂暴',
    description: '生命低于30%时可使用，Roll 8-20',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 8, max: 20 },
    speed: 4,
    effects: [
      { type: 'REQUIRE_LOW_HP', threshold: 0.3 },
      { type: 'GAIN_BLOOD_RAGE', value: 2 }
    ],
    tags: ['血怒', '残血', '高风险'],
    archetype: ManiacArchetype.BLOOD_RAGE,
    flavor: '当没有退路时，你只能疯狂。'
  },
  {
    id: 'life_for_power',
    name: '以命换力',
    description: '失去5生命，本回合Roll+6',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'SELF_DAMAGE', value: 5 },
      { type: 'ROLL_BOOST_NOW', value: 6 },
      { type: 'GAIN_BLOOD_RAGE', value: 1 }
    ],
    tags: ['血怒', '自伤', '爆发'],
    archetype: ManiacArchetype.BLOOD_RAGE,
    flavor: '生命只是力量的货币。'
  },
  {
    id: 'berserker_roar',
    name: '狂战士咆哮',
    description: '获得2层血怒，每层使Roll最小值+1，但无法防御',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'GAIN_BLOOD_RAGE', value: 2 },
      { type: 'ROLL_MIN_PER_BLOOD_RAGE', value: 1 },
      { type: 'DISABLE_DEFENSE', duration: 1 }
    ],
    tags: ['血怒', '增益', '代价'],
    archetype: ManiacArchetype.BLOOD_RAGE,
    flavor: '吼！！！'
  },
  {
    id: 'immortal_rage',
    name: '不朽狂怒',
    description: '【传奇】血怒层数不再减少，生命首次归零时恢复20生命并获得5层血怒',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'BLOOD_RAGE_NO_DECAY' },
      { type: 'REVIVE_ON_DEATH', heal: 20, bloodRageGain: 5 },
      { type: 'DAMAGE_PER_BLOOD_RAGE', value: 1 }
    ],
    tags: ['血怒', '传奇', '复活'],
    archetype: ManiacArchetype.BLOOD_RAGE,
    flavor: '死亡？那是什么？'
  }
];

// ==================== 2. 自残爆发流卡牌 (5张) ====================

const SELF_HARM_CARDS = [
  {
    id: 'self_destruct',
    name: '自毁',
    description: '失去当前生命的30%，本回合伤害x3',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 5, max: 10 },
    speed: 3,
    effects: [
      { type: 'SELF_DAMAGE_PERCENT', value: 0.3 },
      { type: 'DAMAGE_MULTIPLY', value: 3 },
      { type: 'GAIN_MADNESS', value: 10 }
    ],
    tags: ['自残', '爆发', '自杀式'],
    archetype: ManiacArchetype.SELF_HARM,
    flavor: '要么一起死，要么一起活。'
  },
  {
    id: 'blood_sacrifice',
    name: '血祭',
    description: '失去10生命，获得3层疯狂值和一次额外行动',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'SELF_DAMAGE', value: 10 },
      { type: 'GAIN_MADNESS', value: 15 },
      { type: 'EXTRA_ACTION' }
    ],
    tags: ['自残', '疯狂', '额外行动'],
    archetype: ManiacArchetype.SELF_HARM,
    flavor: '鲜血是最好的祭品。'
  },
  {
    id: 'pain_for_gain',
    name: '痛并快乐',
    description: '每失去1生命，本回合Roll+1（最多+10）',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 2, max: 6 },
    speed: 5,
    effects: [
      { type: 'ROLL_BONUS_PER_SELF_DAMAGE', value: 1, max: 10 },
      { type: 'SELF_DAMAGE', value: 5 }
    ],
    tags: ['自残', '成长', '爆发'],
    archetype: ManiacArchetype.SELF_HARM,
    flavor: '疼痛是最好的老师。'
  },
  {
    id: 'suicide_charge',
    name: '自杀冲锋',
    description: '失去15生命，Roll 15-25，无视敌方防御',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 15, max: 25 },
    speed: 2,
    effects: [
      { type: 'SELF_DAMAGE', value: 15 },
      { type: 'IGNORE_DEFENSE' },
      { type: 'GAIN_MADNESS', value: 20 }
    ],
    tags: ['自残', '爆发', '穿透'],
    archetype: ManiacArchetype.SELF_HARM,
    flavor: '冲啊啊啊啊！！！'
  },
  {
    id: 'living_bomb',
    name: '活体炸弹',
    description: '【传奇】当你生命归零时，对敌方造成你失去生命的50%伤害',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'DEATH_EXPLOSION', percent: 0.5 },
      { type: 'SELF_DAMAGE_BOOST', value: 0.2 }
    ],
    tags: ['自残', '传奇', '死亡爆发'],
    archetype: ManiacArchetype.SELF_HARM,
    flavor: '我死，你也别想活。'
  }
];

// ==================== 3. 暴走连击流卡牌 (5张) ====================

const RAMPAGE_CARDS = [
  {
    id: 'frenzied_strike',
    name: '狂乱打击',
    description: '若上回合胜利，本回合可再出一张牌',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 6,
    effects: [
      { type: 'EXTRA_CARD_IF_LAST_WIN' },
      { type: 'GAIN_RAMPAGE_STACK', value: 1 }
    ],
    tags: ['暴走', '连击', '节奏'],
    archetype: ManiacArchetype.RAMPAGE,
    flavor: '停不下来！'
  },
  {
    id: 'enter_rampage',
    name: '进入暴走',
    description: '进入暴走状态2回合：Roll范围+3，速度+2，但无法防御',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'ENTER_RAMPAGE', duration: 2 },
      { type: 'ROLL_RANGE_BOOST', value: 3 },
      { type: 'SPEED_BOOST', value: 2 },
      { type: 'DISABLE_DEFENSE', duration: 2 }
    ],
    tags: ['暴走', '状态', '高风险'],
    archetype: ManiacArchetype.RAMPAGE,
    flavor: '啊啊啊啊啊！！！'
  },
  {
    id: 'unstoppable_onslaught',
    name: '不可阻挡的猛攻',
    description: '暴走状态下，本回合伤害x2且可以打出3张牌',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 5, max: 9 },
    speed: 7,
    effects: [
      { type: 'REQUIRE_RAMPAGE' },
      { type: 'DAMAGE_MULTIPLY', value: 2 },
      { type: 'TRIPLE_CARD' }
    ],
    tags: ['暴走', '爆发', '多动'],
    archetype: ManiacArchetype.RAMPAGE,
    flavor: '挡我者死！'
  },
  {
    id: 'bloodlust_chain',
    name: '嗜血连锁',
    description: '每次造成伤害后，50%几率获得一次额外行动',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'EXTRA_ACTION_ON_DAMAGE', chance: 0.5 },
      { type: 'RAMPAGE_DURATION_BOOST', value: 1 }
    ],
    tags: ['暴走', '连锁', '续航'],
    archetype: ManiacArchetype.RAMPAGE,
    flavor: '血，更多的血！'
  },
  {
    id: 'eternal_rampage',
    name: '永恒暴走',
    description: '【传奇】暴走不再自动结束，每回合必须攻击，但伤害x2',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'RAMPAGE_NO_DECAY' },
      { type: 'FORCE_ATTACK_PER_TURN' },
      { type: 'RAMPAGE_DAMAGE_MULTIPLY', value: 2 }
    ],
    tags: ['暴走', '传奇', '永久'],
    archetype: ManiacArchetype.RAMPAGE,
    flavor: '直到世界毁灭！'
  }
];

// ==================== 4. 混乱污染流卡牌 (5张) ====================

const CORRUPTION_CARDS = [
  {
    id: 'corrupt_field',
    name: '污染领域',
    description: '污染赌局1回合：双方Roll随机±2',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'APPLY_CORRUPTION', level: 1, duration: 1 },
      { type: 'ROLL_RANDOM_OFFSET', value: 2 }
    ],
    tags: ['污染', '混乱', '环境'],
    archetype: ManiacArchetype.CORRUPTION,
    flavor: '规则开始崩坏了。'
  },
  {
    id: 'chaos_seed',
    name: '混乱种子',
    description: '每回合随机触发一个效果：伤害+3、Roll+3、或自伤3',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'RANDOM_EFFECT_PER_TURN', effects: ['damage+3', 'roll+3', 'self_damage3'] },
      { type: 'GAIN_MADNESS', value: 5 }
    ],
    tags: ['污染', '随机', '不稳定'],
    archetype: ManiacArchetype.CORRUPTION,
    flavor: '混乱已经扎根。'
  },
  {
    id: 'reality_tear',
    name: '现实撕裂',
    description: '污染赌局2回合：每回合双方随机受到1-5伤害',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'APPLY_CORRUPTION', level: 2, duration: 2 },
      { type: 'RANDOM_DAMAGE_BOTH', min: 1, max: 5 }
    ],
    tags: ['污染', '灾难', '全场'],
    archetype: ManiacArchetype.CORRUPTION,
    flavor: '现实正在崩溃。'
  },
  {
    id: 'rule_breaker',
    name: '规则破坏者',
    description: '随机改变一条战斗规则，持续3回合',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'RANDOM_RULE_CHANGE', duration: 3 },
      { type: 'BONUS_IN_CHAOS', value: 4 }
    ],
    tags: ['污染', '规则', '改变'],
    archetype: ManiacArchetype.CORRUPTION,
    flavor: '规则？那只是建议。'
  },
  {
    id: 'chaos_incarnate',
    name: '混沌化身',
    description: '【传奇】赌局永久污染，所有Roll变为1-20完全随机，但你在混乱中Roll+5',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'PERMANENT_CORRUPTION' },
      { type: 'ALL_ROLL_RANDOM', min: 1, max: 20 },
      { type: 'CHAOS_BONUS', value: 5 }
    ],
    tags: ['污染', '传奇', '混沌'],
    archetype: ManiacArchetype.CORRUPTION,
    flavor: '我就是混乱本身。'
  }
];

// ==================== 5. 变异进化流卡牌 (5张) ====================

const MUTATION_CARDS = [
  {
    id: 'mutate',
    name: '变异',
    description: '选择一张手牌，使其Roll上限+2',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'MUTATE_CARD', rollMaxBonus: 2 },
      { type: 'GAIN_MUTATION_STACK', value: 1 }
    ],
    tags: ['变异', '成长', '永久'],
    archetype: ManiacArchetype.MUTATION,
    flavor: '进化，永不停歇。'
  },
  {
    id: 'evolve',
    name: '进化',
    description: '本局游戏中，你每使用3张牌，永久获得Roll+1',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'EVOLVE_EVERY_CARDS', count: 3, rollBonus: 1 },
      { type: 'GAIN_MUTATION_STACK', value: 2 }
    ],
    tags: ['变异', '进化', '成长'],
    archetype: ManiacArchetype.MUTATION,
    flavor: '我已经不是刚才的我了。'
  },
  {
    id: 'adaptive_form',
    name: '适应形态',
    description: '若上回合失败，本回合Roll+4并获得一个新效果',
    type: 'ATTACK',
    rarity: 'RARE',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 5,
    effects: [
      { type: 'BONUS_IF_LAST_LOSS', value: 4 },
      { type: 'GAIN_RANDOM_EFFECT' },
      { type: 'MUTATE_ON_PLAY' }
    ],
    tags: ['变异', '适应', '成长'],
    archetype: ManiacArchetype.MUTATION,
    flavor: '杀不死我的，只会让我更强。'
  },
  {
    id: 'unstable_growth',
    name: '不稳定成长',
    description: '本回合Roll范围扩大（-2~+4），但伤害x2',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 2, max: 12 },
    speed: 4,
    effects: [
      { type: 'EXPAND_ROLL_RANGE', minOffset: -2, maxOffset: 4 },
      { type: 'DAMAGE_MULTIPLY', value: 2 },
      { type: 'MUTATE_AFTER_PLAY' }
    ],
    tags: ['变异', '不稳定', '爆发'],
    archetype: ManiacArchetype.MUTATION,
    flavor: '不稳定性，就是我的力量。'
  },
  {
    id: 'perfect_being',
    name: '完美生物',
    description: '【传奇】每回合自动变异一张牌，变异5次的牌获得额外效果',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'AUTO_MUTATE_PER_TURN' },
      { type: 'BONUS_AT_5_MUTATIONS', extraEffect: true },
      { type: 'ALL_CARDS_EVOLVE' }
    ],
    tags: ['变异', '传奇', '自动'],
    archetype: ManiacArchetype.MUTATION,
    flavor: '完美，只是另一个起点。'
  }
];

// ==================== 6. 痛苦共鸣流卡牌 (5张) ====================

const PAIN_LINK_CARDS = [
  {
    id: 'pain_share',
    name: '痛苦共享',
    description: '激活痛苦共鸣2回合：你受到的伤害50%反弹给敌方',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'ACTIVATE_PAIN_LINK', duration: 2, percent: 0.5 },
      { type: 'GAIN_MADNESS', value: 5 }
    ],
    tags: ['痛苦', '反伤', '共鸣'],
    archetype: ManiacArchetype.PAIN_LINK,
    flavor: '疼痛，是共享的。'
  },
  {
    id: 'self_wound',
    name: '自伤伤敌',
    description: '失去3生命，敌方受到等量伤害',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'SELF_DAMAGE', value: 3 },
      { type: 'ENEMY_DAMAGE_EQUAL', multiplier: 1 }
    ],
    tags: ['痛苦', '自伤', '直接'],
    archetype: ManiacArchetype.PAIN_LINK,
    flavor: '我痛，你也痛。'
  },
  {
    id: 'masochism',
    name: '受虐狂',
    description: '本回合受到的所有伤害+2，但每受1伤害获得1层疯狂',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'INCREASE_DAMAGE_TAKEN', value: 2 },
      { type: 'GAIN_MADNESS_PER_DAMAGE', value: 1 },
      { type: 'PAIN_LINK_BOOST', value: 0.3 }
    ],
    tags: ['痛苦', '受虐', '疯狂'],
    archetype: ManiacArchetype.PAIN_LINK,
    flavor: '更多！更多！'
  },
  {
    id: 'sympathy_pain',
    name: '同情痛苦',
    description: '敌方造成伤害时，其也受到该伤害的30%',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'PAIN_LINK_PASSIVE', percent: 0.3 },
      { type: 'DURATION', value: 3 }
    ],
    tags: ['痛苦', '被动', '持续'],
    archetype: ManiacArchetype.PAIN_LINK,
    flavor: '攻击我，就是攻击你自己。'
  },
  {
    id: 'pain_incarnate',
    name: '痛苦化身',
    description: '【传奇】所有受到的伤害100%反弹，且你受到的伤害减少30%',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'FULL_PAIN_LINK', percent: 1.0 },
      { type: 'DAMAGE_REDUCTION', value: 0.3 },
      { type: 'MADNESS_ON_PAIN', value: 2 }
    ],
    tags: ['痛苦', '传奇', '绝对反伤'],
    archetype: ManiacArchetype.PAIN_LINK,
    flavor: '我就是痛苦的化身。'
  }
];

// ==================== 7. 失控命运流卡牌 (5张) ====================

const CHAOS_CARDS = [
  {
    id: 'chaos_strike',
    name: '混沌打击',
    description: 'Roll 1-15，完全随机',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 1, max: 15 },
    speed: 4,
    effects: [
      { type: 'CHAOS_ROLL' },
      { type: 'GAIN_MADNESS', value: 3 }
    ],
    tags: ['混沌', '随机', '不可预测'],
    archetype: ManiacArchetype.CHAOS,
    flavor: '连我自己都不知道会发生什么。'
  },
  {
    id: 'random_burst',
    name: '随机爆发',
    description: '随机造成5-20伤害，无视Roll',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'RANDOM_DAMAGE', min: 5, max: 20 },
      { type: 'GAIN_MADNESS', value: 5 }
    ],
    tags: ['混沌', '随机', '爆发'],
    archetype: ManiacArchetype.CHAOS,
    flavor: '命运之骰已经掷出。'
  },
  {
    id: 'unpredictable',
    name: '不可预测',
    description: '本回合所有效果随机化，但威力翻倍',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'RANDOMIZE_ALL_EFFECTS' },
      { type: 'EFFECT_MULTIPLY', value: 2 },
      { type: 'GAIN_MADNESS', value: 10 }
    ],
    tags: ['混沌', '随机', '高风险'],
    archetype: ManiacArchetype.CHAOS,
    flavor: '计划？那是什么？'
  },
  {
    id: 'fate_gamble',
    name: '命运赌博',
    description: '50%几率伤害x3，50%几率自伤5',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'EXTREME',
    rollRange: { min: 4, max: 8 },
    speed: 3,
    effects: [
      { type: 'COIN_FLIP', heads: 'damage_x3', tails: 'self_damage_5' },
      { type: 'GAIN_MADNESS', value: 5 }
    ],
    tags: ['混沌', '赌博', '极端'],
    archetype: ManiacArchetype.CHAOS,
    flavor: '要么天堂，要么地狱。'
  },
  {
    id: 'avatar_of_chaos',
    name: '混沌化身',
    description: '【传奇】每回合随机获得一个效果（Roll+5、伤害x2、或额外行动），但也会随机受到1-5伤害',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'RANDOM_BONUS_PER_TURN' },
      { type: 'RANDOM_SELF_DAMAGE', min: 1, max: 5 },
      { type: 'CHAOS_MASTERY' }
    ],
    tags: ['混沌', '传奇', '自动'],
    archetype: ManiacArchetype.CHAOS,
    flavor: '混沌即秩序。'
  }
];

// ==================== 8. 终末暴走流卡牌 (5张) ====================

const APOCALYPSE_CARDS = [
  {
    id: 'gather_madness',
    name: '聚集疯狂',
    description: '获得10层疯狂值，当达到50层时可以发动终末暴走',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'GAIN_MADNESS', value: 10 },
      { type: 'APOCALYPSE_STACK', value: 1 }
    ],
    tags: ['终末', '准备', '积累'],
    archetype: ManiacArchetype.APOCALYPSE,
    flavor: '疯狂在聚集。'
  },
  {
    id: 'world_tear',
    name: '世界撕裂',
    description: '失去20生命，获得20层疯狂值',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'EXTREME',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'SELF_DAMAGE', value: 20 },
      { type: 'GAIN_MADNESS', value: 20 },
      { type: 'APOCALYPSE_STACK', value: 2 }
    ],
    tags: ['终末', '自伤', '加速'],
    archetype: ManiacArchetype.APOCALYPSE,
    flavor: '现实在崩塌。'
  },
  {
    id: 'madness_overflow',
    name: '疯狂溢出',
    description: '若疯狂值超过30，本回合伤害x3且污染全场',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'HIGH',
    rollRange: { min: 5, max: 10 },
    speed: 4,
    effects: [
      { type: 'REQUIRE_MADNESS', threshold: 30 },
      { type: 'DAMAGE_MULTIPLY', value: 3 },
      { type: 'APPLY_CORRUPTION', level: 2 }
    ],
    tags: ['终末', '爆发', '污染'],
    archetype: ManiacArchetype.APOCALYPSE,
    flavor: '疯狂已经控制不住了！'
  },
  {
    id: 'final_rampage',
    name: '终末暴走',
    description: '【终结技】需要50层疯狂值，进入终末状态3回合：每回合自动攻击，Roll 10-30，但每回合失去5生命',
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 10, max: 30 },
    speed: 1,
    effects: [
      { type: 'REQUIRE_MADNESS', threshold: 50 },
      { type: 'ENTER_FINAL_RAMPAGE', duration: 3 },
      { type: 'AUTO_ATTACK_PER_TURN' },
      { type: 'SELF_DAMAGE_PER_TURN', value: 5 },
      { type: 'CONSUME_MADNESS', value: 50 }
    ],
    tags: ['终末', '终结', '毁灭'],
    archetype: ManiacArchetype.APOCALYPSE,
    flavor: '所有人，一起毁灭吧！'
  },
  {
    id: 'total_collapse',
    name: '全面崩坏',
    description: '【传奇】当你生命归零时，触发全场崩坏：对双方造成50伤害，赌局永久污染',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'DEATH_TRIGGER', effect: 'total_collapse' },
      { type: 'COLLAPSE_DAMAGE', value: 50 },
      { type: 'PERMANENT_CORRUPTION' },
      { type: 'MADNESS_ON_DEATH', value: 100 }
    ],
    tags: ['终末', '传奇', '同归于尽'],
    archetype: ManiacArchetype.APOCALYPSE,
    flavor: '如果我要死，那就一起死。'
  }
];

// ==================== 合并所有狂徒卡牌 ====================

const MANIAC_EXTENDED_CARDS = [
  ...BLOOD_RAGE_CARDS,
  ...SELF_HARM_CARDS,
  ...RAMPAGE_CARDS,
  ...CORRUPTION_CARDS,
  ...MUTATION_CARDS,
  ...PAIN_LINK_CARDS,
  ...CHAOS_CARDS,
  ...APOCALYPSE_CARDS
];

// ==================== 流派说明 ====================

const MANIAC_ARCHETYPE_DESCRIPTIONS = {
  [ManiacArchetype.BLOOD_RAGE]: {
    name: '血怒流',
    description: '血越低越强，持续获得强化，残血时极度危险。',
    coreMechanic: '低生命时获得巨大加成',
    buildDirection: '主动压低生命，残血爆发',
    finisher: '不朽狂怒',
    difficulty: '★★★★★'
  },
  [ManiacArchetype.SELF_HARM]: {
    name: '自残爆发流',
    description: '主动消耗生命换强度，短时间超高爆发，风险极大。',
    coreMechanic: '自伤换取力量',
    buildDirection: '高风险高回报，自杀式攻击',
    finisher: '活体炸弹',
    difficulty: '★★★★★'
  },
  [ManiacArchetype.RAMPAGE]: {
    name: '暴走连击流',
    description: '获胜后不断追加行动，形成疯狂攻势，越打越停不下来。',
    coreMechanic: '暴走状态提供连续行动',
    buildDirection: '维持暴走，无限连击',
    finisher: '永恒暴走',
    difficulty: '★★★★☆'
  },
  [ManiacArchetype.CORRUPTION]: {
    name: '混乱污染流',
    description: '修改全场规则，让双方进入疯狂状态，增加随机灾难。',
    coreMechanic: '污染赌局，制造混乱',
    buildDirection: '全场污染，混乱中取胜',
    finisher: '混沌化身',
    difficulty: '★★★★★'
  },
  [ManiacArchetype.MUTATION]: {
    name: '变异进化流',
    description: '战斗中不断永久强化，卡牌会成长，后期极度恐怖。',
    coreMechanic: '卡牌永久成长进化',
    buildDirection: '累积变异，后期碾压',
    finisher: '完美生物',
    difficulty: '★★★★☆'
  },
  [ManiacArchetype.PAIN_LINK]: {
    name: '痛苦共鸣流',
    description: '自己受伤敌人也受伤，形成互相毁灭，高压消耗战。',
    coreMechanic: '伤害反弹，痛苦共享',
    buildDirection: '反伤流，以伤换伤',
    finisher: '痛苦化身',
    difficulty: '★★★★☆'
  },
  [ManiacArchetype.CHAOS]: {
    name: '失控命运流',
    description: '效果随机变化，Roll极端波动，战局随时爆炸。',
    coreMechanic: '极端随机性',
    buildDirection: '拥抱混乱，随机应变',
    finisher: '混沌化身',
    difficulty: '★★★★★'
  },
  [ManiacArchetype.APOCALYPSE]: {
    name: '终末暴走流',
    description: '前期不断积累疯狂值，最后进入终末状态，全场规则彻底失控。',
    coreMechanic: '累积疯狂，发动终末',
    buildDirection: '快速累积，毁灭全场',
    finisher: '全面崩坏',
    difficulty: '★★★★★'
  }
};

// ==================== 导出 ====================

module.exports = {
  ManiacArchetype,
  ManiacState,
  CorruptionType,
  MANIAC_ARCHETYPE_DESCRIPTIONS,
  BLOOD_RAGE_CARDS,
  SELF_HARM_CARDS,
  RAMPAGE_CARDS,
  CORRUPTION_CARDS,
  MUTATION_CARDS,
  PAIN_LINK_CARDS,
  CHAOS_CARDS,
  APOCALYPSE_CARDS,
  MANIAC_EXTENDED_CARDS
};
