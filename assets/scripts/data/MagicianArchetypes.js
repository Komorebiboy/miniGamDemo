/**
 * 魔术师职业 - 8流派完整扩展系统
 * 
 * 8个流派：
 * 1. 幻术欺诈流 - 假信息，误导，诱骗
 * 2. 读心预知流 - 预测，洞察，偷看
 * 3. 戏法连锁流 - 连锁，Combo，节奏
 * 4. 镜像复制流 - 复制，镜像，模仿
 * 5. 舞台控制流 - 控场，改规则，改环境
 * 6. 心理崩溃流 - 恐惧，压迫，精神攻击
 * 7. 命运戏法流 - 概率篡改，现实扭曲
 * 8. 最终演出流 - 超级戏法，最终骗局
 */

// ==================== 流派定义 ====================

const MagicianArchetype = {
  ILLUSION: 'ILLUSION',       // 幻术欺诈流
  PREDICTION: 'PREDICTION',   // 读心预知流
  TRICK_CHAIN: 'TRICK_CHAIN', // 戏法连锁流
  MIRROR: 'MIRROR',           // 镜像复制流
  STAGE: 'STAGE',             // 舞台控制流
  MENTAL: 'MENTAL',           // 心理崩溃流
  FATE_TRICK: 'FATE_TRICK',   // 命运戏法流
  GRAND_FINALE: 'GRAND_FINALE' // 最终演出流
};

// ==================== 高级机制状态 ====================

const MagicianState = {
  // 幻觉状态
  illusionActive: false,      // 是否激活幻觉
  fakeRollDisplay: null,      // 显示的假Roll值
  fakeSpeedDisplay: null,     // 显示的假速度
  fakeTypeDisplay: null,      // 显示的假类型
  
  // 预知状态
  predictionCount: 0,         // 预知次数
  nextEnemyCardRevealed: false, // 是否揭示敌方下一张牌
  enemyDeckOrder: [],         // 敌方牌库顺序（预知）
  
  // 戏法连锁
  trickChainCount: 0,         // 当前连锁数
  maxTrickChain: 10,          // 最大连锁数
  trickBonus: 0,              // 连锁加成
  
  // 镜像状态
  mirrorActive: false,        // 是否激活镜像
  mirroredCard: null,         // 镜像的卡牌
  copyNextEnemyCard: false,   // 是否复制敌方下一张牌
  
  // 舞台状态
  stageState: null,           // 当前舞台状态
  stageDuration: 0,           // 舞台持续回合
  
  // 心理崩溃
  mentalBreakStacks: 0,       // 心理崩溃层数
  maxMentalBreak: 5,          // 最大崩溃层数
  enemyConfused: false,       // 敌方是否混乱
  
  // 命运篡改
  fateManipulation: 0,        // 命运操控层数
  rollSwapAvailable: false,   // 是否可交换Roll
  
  // 最终演出
  finalePreparation: 0,       // 演出准备层数
  finaleReady: false,         // 是否可发动最终演出
  hiddenTricks: []            // 隐藏的戏法
};

// ==================== 舞台状态类型 ====================

const StageState = {
  MIRROR_STAGE: {             // 镜像舞台
    id: 'MIRROR_STAGE',
    name: '镜像舞台',
    description: '双方Roll值互换',
    effect: { swapRolls: true }
  },
  SILENT_STAGE: {             // 静音舞台
    id: 'SILENT_STAGE',
    name: '静音舞台',
    description: '双方无法看到对方任何信息',
    effect: { hideAllInfo: true }
  },
  DECEPTION_STAGE: {          // 欺诈舞台
    id: 'DECEPTION_STAGE',
    name: '欺诈舞台',
    name: '欺诈舞台',
    description: '双方看到的信息都是假的',
    effect: { allInfoFake: true }
  },
  TWISTED_STAGE: {            // 扭曲舞台
    id: 'TWISTED_STAGE',
    name: '扭曲舞台',
    description: '双方Roll范围反转（最小变最大）',
    effect: { reverseRollRange: true }
  },
  TRICK_STAGE: {              // 戏法舞台
    id: 'TRICK_STAGE',
    name: '戏法舞台',
    description: '魔术师戏法牌效果翻倍',
    effect: { trickEffectDouble: true }
  }
};

// ==================== 1. 幻术欺诈流卡牌 (5张) ====================

const ILLUSION_CARDS = [
  {
    id: 'false_appearance',
    name: '虚假表象',
    description: '向敌方显示错误的Roll范围（显示5-12，实际2-8）',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 2, max: 8 },
    speed: 6,
    effects: [
      { type: 'FAKE_ROLL_DISPLAY', fakeMin: 5, fakeMax: 12 }
    ],
    tags: ['幻术', '欺诈', '误导'],
    archetype: MagicianArchetype.ILLUSION,
    flavor: '你的眼睛在欺骗你。'
  },
  {
    id: 'phantom_speed',
    name: '幻影速度',
    description: '向敌方显示错误的速度（显示9，实际4）',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 9 },
    speed: 4,
    effects: [
      { type: 'FAKE_SPEED_DISPLAY', fakeSpeed: 9 },
      { type: 'BONUS_IF_ENEMY_MISREAD', value: 3 }
    ],
    tags: ['幻术', '速度欺诈', '误导'],
    archetype: MagicianArchetype.ILLUSION,
    flavor: '快与慢，只是相对的。'
  },
  {
    id: 'disguise',
    name: '伪装',
    description: '将这张攻击牌显示为防御牌给敌方看',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 5, max: 10 },
    speed: 5,
    effects: [
      { type: 'FAKE_TYPE_DISPLAY', fakeType: 'DEFENSE' },
      { type: 'CRIT_IF_ENEMY_FOOLED', critBonus: 5 }
    ],
    tags: ['幻术', '类型欺诈', '暴击'],
    archetype: MagicianArchetype.ILLUSION,
    flavor: '你以为我在防守？太天真了。'
  },
  {
    id: 'grand_illusion',
    name: '宏大幻术',
    description: '本回合所有信息都是假的，敌方无法判断真实情况',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'FULL_ILLUSION', duration: 1 },
      { type: 'NEXT_ATTACK_BONUS', value: 5 }
    ],
    tags: ['幻术', '全面欺诈', '准备'],
    archetype: MagicianArchetype.ILLUSION,
    flavor: '在幻术中，真相是最奢侈的东西。'
  },
  {
    id: 'master_of_illusion',
    name: '幻术大师',
    description: '【传奇】每回合自动制造一个随机假信息，敌方永远不知道什么是真的',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'AUTO_ILLUSION_PER_TURN' },
      { type: 'ILLUSION_BONUS', rollBonus: 2 }
    ],
    tags: ['幻术', '传奇', '自动'],
    archetype: MagicianArchetype.ILLUSION,
    flavor: '我已经分不清自己是在表演还是现实。'
  }
];

// ==================== 2. 读心预知流卡牌 (5张) ====================

const PREDICTION_CARDS = [
  {
    id: 'mind_read',
    name: '读心术',
    description: '查看敌方手牌中最强的一张',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 9,
    effects: [
      { type: 'REVEAL_ENEMY_STRONGEST_CARD' },
      { type: 'GAIN_INSIGHT', value: 1 }
    ],
    tags: ['预知', '读心', '信息'],
    archetype: MagicianArchetype.PREDICTION,
    flavor: '你的想法，我都知道。'
  },
  {
    id: 'future_sight',
    name: '预知未来',
    description: '查看敌方下一张要抽的牌',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'REVEAL_ENEMY_NEXT_DRAW' },
      { type: 'PREPARE_COUNTER', value: 1 }
    ],
    tags: ['预知', '未来', '准备'],
    archetype: MagicianArchetype.PREDICTION,
    flavor: '未来已经写好了，只是你还没看到。'
  },
  {
    id: 'predictive_strike',
    name: '预判打击',
    description: '若正确预判敌方出牌类型，伤害翻倍',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 6,
    effects: [
      { type: 'PREDICT_ENEMY_TYPE' },
      { type: 'DOUBLE_DAMAGE_IF_CORRECT' }
    ],
    tags: ['预知', '预判', '爆发'],
    archetype: MagicianArchetype.PREDICTION,
    flavor: '在你出手之前，我已经赢了。'
  },
  {
    id: 'clairvoyance',
    name: '千里眼',
    description: '查看敌方牌库顶部的3张牌',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'REVEAL_ENEMY_DECK_TOP', count: 3 },
      { type: 'REARRANGE_ENEMY_DECK', count: 3 }
    ],
    tags: ['预知', '洞察', '操控'],
    archetype: MagicianArchetype.PREDICTION,
    flavor: '知识就是力量，而我拥有全部知识。'
  },
  {
    id: 'omniscience',
    name: '全知',
    description: '【传奇】每回合开始时自动查看敌方手牌和牌库顶部',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'AUTO_REVEAL_ENEMY_HAND' },
      { type: 'AUTO_REVEAL_ENEMY_DECK' },
      { type: 'ROLL_BONUS_PER_INFO', value: 1 }
    ],
    tags: ['预知', '传奇', '全视'],
    archetype: MagicianArchetype.PREDICTION,
    flavor: '在我面前，没有秘密。'
  }
];

// ==================== 3. 戏法连锁流卡牌 (5张) ====================

const TRICK_CHAIN_CARDS = [
  {
    id: 'sleight_of_hand',
    name: '手法',
    description: '快速戏法，若上一张是戏法牌，Roll+3',
    type: 'ATTACK',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 3, max: 7 },
    speed: 7,
    effects: [
      { type: 'CHAIN_BONUS', condition: 'last_was_trick', value: 3 },
      { type: 'TAG_AS_TRICK' }
    ],
    tags: ['戏法', '连锁', '节奏'],
    archetype: MagicianArchetype.TRICK_CHAIN,
    flavor: '手法要快，眼睛要更快。'
  },
  {
    id: 'card_palming',
    name: '藏牌',
    description: '将一张手牌藏起来，下回合免费打出',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'HIDE_CARD_FOR_NEXT_TURN' },
      { type: 'CHAIN_CONTINUE' }
    ],
    tags: ['戏法', '准备', '资源'],
    archetype: MagicianArchetype.TRICK_CHAIN,
    flavor: '现在你看不到，等一下也看不到。'
  },
  {
    id: 'rapid_tricks',
    name: '快速戏法',
    description: '本回合可以打出两张牌，第二张速度+3',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 9,
    effects: [
      { type: 'EXTRA_CARD_THIS_TURN' },
      { type: 'SECOND_CARD_SPEED_BOOST', value: 3 }
    ],
    tags: ['戏法', '连击', '节奏'],
    archetype: MagicianArchetype.TRICK_CHAIN,
    flavor: '真正的魔术师，手永远比眼睛快。'
  },
  {
    id: 'trick_mastery',
    name: '戏法精通',
    description: '每打出一张戏法牌，下一张戏法牌Roll+2',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'TRICK_CHAIN_STACK', value: 2, maxStack: 10 },
      { type: 'TRICK_BONUS_APPLY' }
    ],
    tags: ['戏法', '成长', '连锁'],
    archetype: MagicianArchetype.TRICK_CHAIN,
    flavor: '越玩越顺手。'
  },
  {
    id: 'endless_tricks',
    name: '无尽戏法',
    description: '【传奇】每打出3张戏法牌，获得一张随机戏法牌',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'GENERATE_TRICK_EVERY_3', count: 3 },
      { type: 'TRICK_SPEED_BOOST', value: 2 }
    ],
    tags: ['戏法', '传奇', '资源生成'],
    archetype: MagicianArchetype.TRICK_CHAIN,
    flavor: '戏法永远不会结束。'
  }
];

// ==================== 4. 镜像复制流卡牌 (5张) ====================

const MIRROR_CARDS = [
  {
    id: 'mirror_image',
    name: '镜像',
    description: '复制敌方上一张打出的牌',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'COPY_ENEMY_LAST_CARD' },
      { type: 'MIRROR_BONUS', value: 1 }
    ],
    tags: ['镜像', '复制', '模仿'],
    archetype: MagicianArchetype.MIRROR,
    flavor: '你的招式，我学会了。'
  },
  {
    id: 'reflect',
    name: '反射',
    description: '复制敌方当前Roll值作为你的Roll',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'COPY_ENEMY_ROLL' },
      { type: 'BONUS_IF_HIGHER', value: 3 }
    ],
    tags: ['镜像', 'Roll复制', '对抗'],
    archetype: MagicianArchetype.MIRROR,
    flavor: '以彼之道，还施彼身。'
  },
  {
    id: 'twin_spell',
    name: '双生法术',
    description: '复制你上一张打出的牌的效果',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'COPY_OWN_LAST_EFFECT' },
      { type: 'DOUBLE_EFFECT' }
    ],
    tags: ['镜像', '效果复制', '强化'],
    archetype: MagicianArchetype.MIRROR,
    flavor: '一次不够，那就两次。'
  },
  {
    id: 'perfect_copy',
    name: '完美复制',
    description: '复制敌方手牌中的一张，并立即打出',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'COPY_AND_PLAY_ENEMY_CARD' },
      { type: 'STEAL_EFFECT' }
    ],
    tags: ['镜像', '偷牌', '即时'],
    archetype: MagicianArchetype.MIRROR,
    flavor: '你的王牌，现在是我的了。'
  },
  {
    id: 'mirror_dimension',
    name: '镜像维度',
    description: '【传奇】每回合自动镜像敌方最强效果，你可以同时使用自己的牌和镜像',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'AUTO_MIRROR_ENEMY_EFFECT' },
      { type: 'DUAL_PLAY' }
    ],
    tags: ['镜像', '传奇', '自动'],
    archetype: MagicianArchetype.MIRROR,
    flavor: '在这个维度里，我就是你，你就是我。'
  }
];

// ==================== 5. 舞台控制流卡牌 (5张) ====================

const STAGE_CARDS = [
  {
    id: 'stage_setup',
    name: '舞台布置',
    description: '设置一个舞台状态，持续2回合',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'SET_STAGE', duration: 2 },
      { type: 'STAGE_BONUS', value: 1 }
    ],
    tags: ['舞台', '控场', '环境'],
    archetype: MagicianArchetype.STAGE,
    flavor: '欢迎来到我的表演场地。'
  },
  {
    id: 'spotlight',
    name: '聚光灯',
    description: '强制敌方只能攻击，不能出技能牌',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'RESTRICT_ENEMY_TYPE', allowed: 'ATTACK', duration: 1 },
      { type: 'BONUS_IF_ENEMY_COMPLIES', value: 4 }
    ],
    tags: ['舞台', '限制', '控制'],
    archetype: MagicianArchetype.STAGE,
    flavor: '在我的舞台上，你只能按我的剧本演。'
  },
  {
    id: 'curtain_call',
    name: '谢幕',
    description: '结束当前舞台状态，根据持续回合获得加成',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 8 },
    speed: 5,
    effects: [
      { type: 'END_STAGE' },
      { type: 'BONUS_PER_STAGE_TURN', value: 2 }
    ],
    tags: ['舞台', '终结', '爆发'],
    archetype: MagicianArchetype.STAGE,
    flavor: '表演结束，该结账了。'
  },
  {
    id: 'backstage',
    name: '后台操控',
    description: '在舞台状态下，你可以秘密改变一个规则',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'SECRET_RULE_CHANGE' },
      { type: 'ENEMY_CONFUSION', duration: 1 }
    ],
    tags: ['舞台', '规则', '秘密'],
    archetype: MagicianArchetype.STAGE,
    flavor: '观众看不到的地方，才是真正的魔术。'
  },
  {
    id: 'theater_of_mind',
    name: '心灵剧场',
    description: '【传奇】永久改变战斗规则：双方Roll值公开，但你可以随时修改自己的Roll值一次',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'PERMANENT_RULE_CHANGE' },
      { type: 'ONCE_PER_TURN_ROLL_MODIFY', value: 3 }
    ],
    tags: ['舞台', '传奇', '规则'],
    archetype: MagicianArchetype.STAGE,
    flavor: '整个世界都是我的舞台。'
  }
];

// ==================== 6. 心理崩溃流卡牌 (5张) ====================

const MENTAL_CARDS = [
  {
    id: 'doubt',
    name: '怀疑',
    description: '给敌方施加1层心理崩溃，每层使其Roll-1',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'MENTAL_BREAK_STACK', value: 1, maxStack: 5 },
      { type: 'ENEMY_ROLL_PENALTY', value: 1 }
    ],
    tags: ['心理', '削弱', '持续'],
    archetype: MagicianArchetype.MENTAL,
    flavor: '怀疑的种子一旦种下...'
  },
  {
    id: 'confusion',
    name: '混乱',
    description: '敌方下回合有50%几率打出随机牌',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'ENEMY_RANDOM_PLAY', chance: 0.5, duration: 1 },
      { type: 'BONUS_IF_ENEMY_RANDOM', value: 4 }
    ],
    tags: ['心理', '混乱', '控制'],
    archetype: MagicianArchetype.MENTAL,
    flavor: '你确定你要出那张牌吗？'
  },
  {
    id: 'fear',
    name: '恐惧',
    description: '敌方生命越低，其Roll范围越小',
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 4, max: 9 },
    speed: 5,
    effects: [
      { type: 'ENEMY_ROLL_RANGE_SHRINK', percent: 0.2 },
      { type: 'BONUS_VS_LOW_HP_ENEMY', value: 3 }
    ],
    tags: ['心理', '恐惧', '压制'],
    archetype: MagicianArchetype.MENTAL,
    flavor: '恐惧是最好的武器。'
  },
  {
    id: 'paranoia',
    name: '偏执',
    description: '敌方看到的信息全部相反（高变低，攻击变防御）',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 6,
    effects: [
      { type: 'INVERT_ENEMY_INFO', duration: 2 },
      { type: 'CRIT_IF_ENEMY_MISREAD', value: 5 }
    ],
    tags: ['心理', '信息扭曲', '暴击'],
    archetype: MagicianArchetype.MENTAL,
    flavor: '不要相信你的眼睛。'
  },
  {
    id: 'mental_breakdown',
    name: '精神崩溃',
    description: '【传奇】当敌方心理崩溃达到5层时，其所有信息完全混乱，且每回合失去5生命',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'MENTAL_BREAK_THRESHOLD', threshold: 5 },
      { type: 'ENEMY_DOT_ON_BREAK', value: 5 },
      { type: 'TOTAL_INFO_CHAOS' }
    ],
    tags: ['心理', '传奇', '终结'],
    archetype: MagicianArchetype.MENTAL,
    flavor: '欢迎来到疯狂的边缘。'
  }
];

// ==================== 7. 命运戏法流卡牌 (5张) ====================

const FATE_TRICK_CARDS = [
  {
    id: 'fate_weave',
    name: '编织命运',
    description: '改变下一次Roll的最小值+2',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'MODIFY_NEXT_ROLL_MIN', value: 2 },
      { type: 'FATE_STACK', value: 1 }
    ],
    tags: ['命运', '概率', '操控'],
    archetype: MagicianArchetype.FATE_TRICK,
    flavor: '命运之线，由我编织。'
  },
  {
    id: 'probability_shift',
    name: '概率转移',
    description: '将敌方的高Roll概率转移到自己身上',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'STEAL_ENEMY_HIGH_ROLL_CHANCE', value: 0.15 },
      { type: 'FATE_STACK', value: 2 }
    ],
    tags: ['命运', '概率窃取', '增益'],
    archetype: MagicianArchetype.FATE_TRICK,
    flavor: '你的好运，现在是我的了。'
  },
  {
    id: 'destiny_swap',
    name: '命运交换',
    description: '与敌方交换Roll结果',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 5,
    effects: [
      { type: 'SWAP_ROLL_WITH_ENEMY' },
      { type: 'BONUS_IF_ENEMY_HIGHER', value: 5 }
    ],
    tags: ['命运', '交换', '逆转'],
    archetype: MagicianArchetype.FATE_TRICK,
    flavor: '你的命运，我收下了。'
  },
  {
    id: 'rewrite_fate',
    name: '重写命运',
    description: '重Roll一次，并可以选择使用哪个结果',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 9,
    effects: [
      { type: 'REROLL_AND_CHOOSE' },
      { type: 'FATE_STACK', value: 1 }
    ],
    tags: ['命运', '重Roll', '选择'],
    archetype: MagicianArchetype.FATE_TRICK,
    flavor: '命运不是注定的。'
  },
  {
    id: 'fate_master',
    name: '命运主宰',
    description: '【传奇】你可以看到双方的Roll结果后再决定是否交换',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'SEE_BEFORE_CHOOSE' },
      { type: 'FREE_ROLL_SWAP' },
      { type: 'FATE_MANIPULATION_PASSIVE' }
    ],
    tags: ['命运', '传奇', '绝对控制'],
    archetype: MagicianArchetype.FATE_TRICK,
    flavor: '我是命运的主人。'
  }
];

// ==================== 8. 最终演出流卡牌 (5张) ====================

const GRAND_FINALE_CARDS = [
  {
    id: 'preparation',
    name: '准备演出',
    description: '获得1层演出准备，当达到5层时可以发动最终演出',
    type: 'SKILL',
    rarity: 'COMMON',
    riskLevel: 'SAFE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'GAIN_FINALE_STACK', value: 1 },
      { type: 'SMALL_ROLL_BOOST', value: 1 }
    ],
    tags: ['演出', '准备', '积累'],
    archetype: MagicianArchetype.GRAND_FINALE,
    flavor: '好戏即将开场。'
  },
  {
    id: 'setup_trick',
    name: '布局',
    description: '设置一个隐藏的戏法，在最终演出时触发',
    type: 'SKILL',
    rarity: 'UNCOMMON',
    riskLevel: 'MODERATE',
    rollRange: { min: 0, max: 0 },
    speed: 8,
    effects: [
      { type: 'SET_HIDDEN_TRICK', trickType: 'damage', value: 5 },
      { type: 'GAIN_FINALE_STACK', value: 1 }
    ],
    tags: ['演出', '布局', '隐藏'],
    archetype: MagicianArchetype.GRAND_FINALE,
    flavor: '观众看不到的，才是最关键的。'
  },
  {
    id: 'misdirection_setup',
    name: '误导准备',
    description: '让敌方以为你在准备攻击，实际上你在准备演出',
    type: 'SKILL',
    rarity: 'RARE',
    riskLevel: 'HIGH',
    rollRange: { min: 0, max: 0 },
    speed: 7,
    effects: [
      { type: 'FAKE_ATTACK_PREPARATION' },
      { type: 'GAIN_FINALE_STACK', value: 2 },
      { type: 'CRIT_ON_FINALE' }
    ],
    tags: ['演出', '误导', '暴击'],
    archetype: MagicianArchetype.GRAND_FINALE,
    flavor: '看这边！不对，看那边！'
  },
  {
    id: 'grand_finale',
    name: '最终演出',
    description: '【终结技】需要5层准备，触发所有隐藏的戏法，造成毁灭性打击',
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    riskLevel: 'EXTREME',
    rollRange: { min: 10, max: 20 },
    speed: 2,
    effects: [
      { type: 'REQUIRE_FINALE_STACK', value: 5 },
      { type: 'TRIGGER_ALL_HIDDEN_TRICKS' },
      { type: 'DAMAGE_PER_HIDDEN_TRICK', value: 8 },
      { type: 'CONSUME_ALL_FINALE_STACKS' }
    ],
    tags: ['演出', '终结', '爆发'],
    archetype: MagicianArchetype.GRAND_FINALE,
    flavor: '现在，见证奇迹的时刻！'
  },
  {
    id: 'encore',
    name: '安可',
    description: '【传奇】最终演出后，如果敌方未被击败，你可以立即进行第二次演出（不需要准备）',
    type: 'LEGENDARY',
    rarity: 'LEGENDARY',
    riskLevel: 'RARE',
    rollRange: { min: 0, max: 0 },
    speed: 10,
    effects: [
      { type: 'SECOND_FINALE_IF_SURVIVE' },
      { type: 'AUTO_GENERATE_TRICKS', count: 2 }
    ],
    tags: ['演出', '传奇', '二次机会'],
    archetype: MagicianArchetype.GRAND_FINALE,
    flavor: '演出还没结束！'
  }
];

// ==================== 合并所有魔术师卡牌 ====================

const MAGICIAN_EXTENDED_CARDS = [
  ...ILLUSION_CARDS,
  ...PREDICTION_CARDS,
  ...TRICK_CHAIN_CARDS,
  ...MIRROR_CARDS,
  ...STAGE_CARDS,
  ...MENTAL_CARDS,
  ...FATE_TRICK_CARDS,
  ...GRAND_FINALE_CARDS
];

// ==================== 流派说明 ====================

const MAGICIAN_ARCHETYPE_DESCRIPTIONS = {
  [MagicianArchetype.ILLUSION]: {
    name: '幻术欺诈流',
    description: '让敌方看到错误信息，诱导错误出牌，通过心理战获胜。',
    coreMechanic: '制造假信息，误导敌方判断',
    buildDirection: '收集幻觉牌，让敌方永远不知道真相',
    finisher: '幻术大师',
    difficulty: '★★★★☆'
  },
  [MagicianArchetype.PREDICTION]: {
    name: '读心预知流',
    description: '提前得知敌方行动，根据信息精准克制敌方。',
    coreMechanic: '偷看敌方手牌和牌库，预判行动',
    buildDirection: '最大化信息获取，精准打击',
    finisher: '全知',
    difficulty: '★★★☆☆'
  },
  [MagicianArchetype.TRICK_CHAIN]: {
    name: '戏法连锁流',
    description: '小牌不断联动，连续触发效果，节奏极快。',
    coreMechanic: '戏法牌连锁，越连越强',
    buildDirection: '快速循环戏法牌，保持节奏',
    finisher: '无尽戏法',
    difficulty: '★★★★☆'
  },
  [MagicianArchetype.MIRROR]: {
    name: '镜像复制流',
    description: '使用敌方的力量，复制敌方牌，反制敌方套路。',
    coreMechanic: '复制敌方卡牌和效果',
    buildDirection: '以彼之道，还施彼身',
    finisher: '镜像维度',
    difficulty: '★★★☆☆'
  },
  [MagicianArchetype.STAGE]: {
    name: '舞台控制流',
    description: '改变整个赌局规则，操控双方出牌环境。',
    coreMechanic: '设置舞台状态，改变战斗规则',
    buildDirection: '控场，改变规则为己所用',
    finisher: '心灵剧场',
    difficulty: '★★★★★'
  },
  [MagicianArchetype.MENTAL]: {
    name: '心理崩溃流',
    description: '持续削弱敌方判断，让敌方信息混乱，制造错误决策。',
    coreMechanic: '施加心理崩溃层数，混乱敌方',
    buildDirection: '累积心理伤害，让敌方崩溃',
    finisher: '精神崩溃',
    difficulty: '★★★★☆'
  },
  [MagicianArchetype.FATE_TRICK]: {
    name: '命运戏法流',
    description: '修改Roll规则，修改概率，操控随机性。',
    coreMechanic: '篡改命运，操控概率',
    buildDirection: '修改Roll区间，重Roll',
    finisher: '命运主宰',
    difficulty: '★★★★☆'
  },
  [MagicianArchetype.GRAND_FINALE]: {
    name: '最终演出流',
    description: '前期隐藏布局，后期瞬间翻盘，爆发极强。',
    coreMechanic: '累积演出准备，发动超级终结',
    buildDirection: '隐藏布局，一击必杀',
    finisher: '安可',
    difficulty: '★★★★★'
  }
};

// ==================== 导出 ====================

module.exports = {
  MagicianArchetype,
  MagicianState,
  StageState,
  MAGICIAN_ARCHETYPE_DESCRIPTIONS,
  ILLUSION_CARDS,
  PREDICTION_CARDS,
  TRICK_CHAIN_CARDS,
  MIRROR_CARDS,
  STAGE_CARDS,
  MENTAL_CARDS,
  FATE_TRICK_CARDS,
  GRAND_FINALE_CARDS,
  MAGICIAN_EXTENDED_CARDS
};
