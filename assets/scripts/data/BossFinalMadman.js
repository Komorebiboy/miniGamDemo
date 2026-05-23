/**
 * Boss 4：终末狂徒（Final Madman）
 *
 * 核心机制：
 * 1. 疯狂污染 - 规则不断崩坏
 * 2. 三阶段系统 - 轻度疯狂 → 崩坏扩散 → 终末暴走
 * 3. 崩坏降临技能 - 随机触发污染规则
 * 4. 疯狂值系统 - 越疯狂越强大
 * 5. 12张专属卡牌
 */

const { AIType } = require('./EnemyAI');
const { EnemyFaction, DangerLevel } = require('./EnemyPhase1');

// ==================== Boss阶段定义 ====================

const MadmanPhase = {
  PHASE_1: 'PHASE_1',  // 轻度疯狂
  PHASE_2: 'PHASE_2',  // 崩坏扩散
  PHASE_3: 'PHASE_3'   // 终末暴走
};

// ==================== 污染规则类型 ====================

const CorruptionType = {
  ROLL_OFFSET: 'ROLL_OFFSET',               // Roll随机偏移
  RANDOM_DAMAGE: 'RANDOM_DAMAGE',           // 双方随机受伤
  EFFECT_REVERSE: 'EFFECT_REVERSE',         // 卡牌效果反转
  SPEED_RANDOM: 'SPEED_RANDOM',             // 速度随机变化
  SKIP_FAIL: 'SKIP_FAIL',                   // 空过失败
  EXTRA_ACTION: 'EXTRA_ACTION',             // 获胜后连续行动
  ROLL_INVERT: 'ROLL_INVERT',               // Roll上下限颠倒
  DOUBLE_CARD: 'DOUBLE_CARD',               // 双方同时出两张牌
  LOW_ROLL_WINS: 'LOW_ROLL_WINS',           // 低Roll反而获胜
  HAND_SWAP: 'HAND_SWAP',                   // 手牌随机交换
  DAMAGE_SHARE: 'DAMAGE_SHARE',             // 伤害共享
  CRIT_RANDOM: 'CRIT_RANDOM',               // 暴击随机触发
  HEAL_TO_DAMAGE: 'HEAL_TO_DAMAGE',         // 治疗变伤害
  SHIELD_TO_DEBT: 'SHIELD_TO_DEBT'          // 护盾变债务
};

// ==================== 污染规则配置 ====================

const CORRUPTION_RULES = [
  {
    type: CorruptionType.ROLL_OFFSET,
    name: 'Roll偏移',
    description: 'Roll结果随机±5',
    weight: 15,
    phase: [MadmanPhase.PHASE_1, MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.RANDOM_DAMAGE,
    name: '随机伤害',
    description: '双方各受到3-8点随机伤害',
    weight: 12,
    phase: [MadmanPhase.PHASE_1, MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.EFFECT_REVERSE,
    name: '效果反转',
    description: '卡牌效果完全反转',
    weight: 10,
    phase: [MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.SPEED_RANDOM,
    name: '速度混乱',
    description: '双方速度随机变为1-10',
    weight: 12,
    phase: [MadmanPhase.PHASE_1, MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.SKIP_FAIL,
    name: '空过失效',
    description: '空过会受到10点伤害',
    weight: 8,
    phase: [MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.EXTRA_ACTION,
    name: '连续行动',
    description: '获胜方可以再次行动',
    weight: 10,
    phase: [MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.ROLL_INVERT,
    name: 'Roll颠倒',
    description: 'Roll上下限互换',
    weight: 8,
    phase: [MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.DOUBLE_CARD,
    name: '双重出牌',
    description: '双方必须同时出两张牌',
    weight: 8,
    phase: [MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.LOW_ROLL_WINS,
    name: '低Roll胜利',
    description: '本回合Roll低者获胜',
    weight: 7,
    phase: [MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.HAND_SWAP,
    name: '手牌交换',
    description: '随机交换一张手牌',
    weight: 6,
    phase: [MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.DAMAGE_SHARE,
    name: '伤害共享',
    description: '造成伤害的50%会反弹给自己',
    weight: 8,
    phase: [MadmanPhase.PHASE_2, MadmanPhase.PHASE_3]
  },
  {
    type: CorruptionType.CRIT_RANDOM,
    name: '随机暴击',
    description: '暴击完全随机，无视概率',
    weight: 6,
    phase: [MadmanPhase.PHASE_3]
  }
];

// ==================== Boss专属卡牌（12张） ====================

const FINAL_MADMAN_CARDS = [
  // ===== 阶段1卡牌 =====
  {
    id: 'mad_slash',
    name: '疯狂连斩',
    description: '连续攻击2次',
    phase: MadmanPhase.PHASE_1,
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    rollRange: { min: 6, max: 12 },
    speed: 6,
    effects: [
      {
        type: 'MULTI_ATTACK',
        count: 2
      }
    ],
    madnessGain: 5
  },
  {
    id: 'corrupt_dice',
    name: '崩坏骰子',
    description: '随机改变本回合Roll规则',
    phase: MadmanPhase.PHASE_1,
    type: 'CORRUPTION',
    rarity: 'RARE',
    rollRange: { min: 5, max: 11 },
    speed: 5,
    effects: [
      {
        type: 'RANDOM_CORRUPTION',
        count: 1
      }
    ],
    madnessGain: 8
  },
  {
    id: 'blood_rampage',
    name: '血色暴走',
    description: '低血时伤害翻倍',
    phase: MadmanPhase.PHASE_1,
    type: 'RAMPAGE',
    rarity: 'UNCOMMON',
    rollRange: { min: 8, max: 14 },
    speed: 4,
    effects: [
      {
        type: 'LOW_HP_BOOST',
        threshold: 0.4,
        multiplier: 2
      }
    ],
    madnessGain: 6
  },
  {
    id: 'pollution_spread',
    name: '污染扩散',
    description: '污染玩家一张卡牌',
    phase: MadmanPhase.PHASE_1,
    type: 'CORRUPTION',
    rarity: 'RARE',
    rollRange: { min: 4, max: 10 },
    speed: 7,
    effects: [
      {
        type: 'CORRUPT_PLAYER_CARD',
        count: 1
      }
    ],
    madnessGain: 10
  },

  // ===== 阶段2卡牌 =====
  {
    id: 'final_laugh',
    name: '终末狂笑',
    description: '全场随机效果',
    phase: MadmanPhase.PHASE_2,
    type: 'CHAOS',
    rarity: 'RARE',
    rollRange: { min: 7, max: 13 },
    speed: 5,
    effects: [
      {
        type: 'RANDOM_EFFECT',
        possibleEffects: ['damage', 'heal', 'shield', 'corruption'],
        count: 3
      }
    ],
    madnessGain: 12
  },
  {
    id: 'chaos_theater',
    name: '混乱剧场',
    description: '双方规则完全随机化',
    phase: MadmanPhase.PHASE_2,
    type: 'CHAOS',
    rarity: 'LEGENDARY',
    rollRange: { min: 6, max: 14 },
    speed: 6,
    effects: [
      {
        type: 'COMPLETE_RANDOMIZATION',
        duration: 2
      }
    ],
    madnessGain: 15
  },
  {
    id: 'madness_infection',
    name: '疯狂传染',
    description: '给玩家添加疯狂层数',
    phase: MadmanPhase.PHASE_2,
    type: 'CORRUPTION',
    rarity: 'RARE',
    rollRange: { min: 5, max: 13 },
    speed: 8,
    effects: [
      {
        type: 'ADD_MADNESS_STACK',
        stacks: 2
      }
    ],
    madnessGain: 10
  },
  {
    id: 'self_destruct',
    name: '自毁攻击',
    description: '高伤害，但自己受到一半伤害',
    phase: MadmanPhase.PHASE_2,
    type: 'SUICIDE',
    rarity: 'UNCOMMON',
    rollRange: { min: 15, max: 25 },
    speed: 3,
    effects: [
      {
        type: 'SELF_DAMAGE',
        percentage: 0.5
      }
    ],
    madnessGain: 8
  },

  // ===== 阶段3卡牌 =====
  {
    id: 'apocalypse_trigger',
    name: '终焉触发',
    description: '触发所有已激活的污染规则',
    phase: MadmanPhase.PHASE_3,
    type: 'APOCALYPSE',
    rarity: 'LEGENDARY',
    rollRange: { min: 10, max: 20 },
    speed: 2,
    effects: [
      {
        type: 'TRIGGER_ALL_CORRUPTION',
        multiplier: 1.5
      }
    ],
    madnessGain: 20
  },
  {
    id: 'reality_break',
    name: '现实崩坏',
    description: '完全随机化本回合所有数值',
    phase: MadmanPhase.PHASE_3,
    type: 'REALITY_WARP',
    rarity: 'LEGENDARY',
    rollRange: { min: 1, max: 30 },
    speed: 5,
    effects: [
      {
        type: 'COMPLETE_RANDOM',
        randomizeAll: true
      }
    ],
    madnessGain: 25
  },
  {
    id: 'endless_rampage',
    name: '无尽暴走',
    description: '获胜后继续攻击直到失败',
    phase: MadmanPhase.PHASE_3,
    type: 'RAMPAGE',
    rarity: 'LEGENDARY',
    rollRange: { min: 12, max: 18 },
    speed: 4,
    effects: [
      {
        type: 'INFINITE_COMBO',
        maxHits: 5
      }
    ],
    madnessGain: 18
  },
  {
    id: 'final_madness',
    name: '最终疯狂',
    description: '消耗所有疯狂值造成巨额伤害',
    phase: MadmanPhase.PHASE_3,
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    rollRange: { min: 8, max: 16 },
    speed: 3,
    effects: [
      {
        type: 'CONSUME_MADNESS',
        damagePerMadness: 2
      }
    ],
    madnessGain: 0
  }
];

// ==================== Boss配置 ====================

const FINAL_MADMAN_CONFIG = {
  id: 'final_madman',
  name: '终末狂徒',
  title: '崩坏的化身',
  faction: EnemyFaction.MAD_CIRCUS,
  aiType: AIType.CHAOTIC,  // 主要AI类型
  secondaryAiType: AIType.AGGRESSIVE,  // 次要AI类型
  dangerLevel: DangerLevel.BOSS,
  isBoss: true,

  stats: {
    maxHp: 120,
    baseShield: 0
  },

  // 阶段血量阈值
  phaseThresholds: {
    [MadmanPhase.PHASE_1]: 1.0,   // 100% - 70%
    [MadmanPhase.PHASE_2]: 0.7,   // 70% - 40%
    [MadmanPhase.PHASE_3]: 0.4    // 40% - 0%
  },

  // 崩坏降临技能
  skill: {
    id: 'corruption_arrival',
    name: '崩坏降临',
    description: '随机触发3条污染规则，持续2回合',
    cooldown: 3,
    maxCooldown: 3,
    effects: {
      corruptionCount: 3,
      duration: 2,
      madnessThreshold: 50  // 疯狂值过高时追加AOE
    }
  },

  // 阶段特性
  phaseFeatures: {
    [MadmanPhase.PHASE_1]: {
      name: '轻度疯狂',
      description: '少量污染，偶尔规则变化',
      corruptionChance: 0.2,
      activeCorruptions: 1,
      madnessGainMultiplier: 1.0,
      aiChaos: 0.5
    },
    [MadmanPhase.PHASE_2]: {
      name: '崩坏扩散',
      description: '污染玩家卡组，添加疯狂牌',
      corruptionChance: 0.4,
      activeCorruptions: 2,
      madnessGainMultiplier: 1.5,
      aiChaos: 0.7,
      corruptPlayerDeck: true
    },
    [MadmanPhase.PHASE_3]: {
      name: '终末暴走',
      description: '完全失控，每回合随机修改核心规则',
      corruptionChance: 0.7,
      activeCorruptions: 3,
      madnessGainMultiplier: 2.0,
      aiChaos: 0.9,
      randomRuleChange: true,
      coreRuleModification: true
    }
  },

  description: '规则的崩坏者，疯狂的化身。在它面前，一切秩序都将瓦解，一切理性都将崩溃。',
  flavor: '「哈哈哈哈！规则？秩序？都给我崩坏吧！」',

  visual: {
    icon: '☠️',
    borderColor: '#8B0000',
    glowColor: '#FF0000',
    phaseTransitionEffects: {
      [MadmanPhase.PHASE_2]: {
        animation: 'corruption_spread',
        uiGlitch: true,
        bloodFilter: true,
        screenCrack: true
      },
      [MadmanPhase.PHASE_3]: {
        animation: 'apocalypse_mode',
        uiBreakdown: true,
        redFilter: true,
        screenShake: true,
        cardBurn: true,
        bgmDistortion: true
      }
    }
  }
};

// ==================== 终末狂徒Boss类 ====================

class FinalMadmanBoss {
  constructor(config = FINAL_MADMAN_CONFIG) {
    this.config = config;
    this.currentPhase = MadmanPhase.PHASE_1;
    this.madness = 0;
    this.maxMadness = 100;
    this.skillCooldown = 0;
    this.turnCount = 0;
    this.activeCorruptions = [];
    this.playerMadnessStacks = 0;
    this.consecutiveWins = 0;

    // 初始化Boss实体
    this.entity = {
      ...config,
      currentHp: config.stats.maxHp,
      maxHp: config.stats.maxHp,
      currentShield: config.stats.baseShield,
      instanceId: `boss_final_madman_${Date.now()}`
    };
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase() {
    const hpPercent = this.entity.currentHp / this.entity.maxHp;

    if (hpPercent <= this.config.phaseThresholds[MadmanPhase.PHASE_3]) {
      return MadmanPhase.PHASE_3;
    } else if (hpPercent <= this.config.phaseThresholds[MadmanPhase.PHASE_2]) {
      return MadmanPhase.PHASE_2;
    }
    return MadmanPhase.PHASE_1;
  }

  /**
   * 检查阶段切换
   */
  checkPhaseTransition() {
    const newPhase = this.getCurrentPhase();

    if (newPhase !== this.currentPhase) {
      const oldPhase = this.currentPhase;
      this.currentPhase = newPhase;

      console.log(`[FinalMadman] 阶段切换: ${oldPhase} -> ${newPhase}`);

      return {
        transitioned: true,
        oldPhase,
        newPhase,
        features: this.config.phaseFeatures[newPhase]
      };
    }

    return { transitioned: false };
  }

  /**
   * 回合开始处理
   */
  onTurnStart() {
    this.turnCount++;

    // 减少技能冷却
    if (this.skillCooldown > 0) {
      this.skillCooldown--;
    }

    // 检查阶段切换
    const phaseResult = this.checkPhaseTransition();

    // 获取当前阶段特性
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    // 随机触发污染规则
    const corruptionResult = this._triggerRandomCorruptions();

    // 阶段3：随机修改核心规则
    let coreRuleChange = null;
    if (this.currentPhase === MadmanPhase.PHASE_3 && phaseFeatures.coreRuleModification) {
      coreRuleChange = this._randomizeCoreRule();
    }

    return {
      phaseTransition: phaseResult,
      currentPhase: this.currentPhase,
      phaseFeatures: phaseFeatures,
      corruptions: corruptionResult,
      coreRuleChange: coreRuleChange,
      madness: this.madness
    };
  }

  /**
   * 触发随机污染规则
   */
  _triggerRandomCorruptions() {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
    const corruptionCount = phaseFeatures.activeCorruptions;
    const triggeredCorruptions = [];

    // 获取当前阶段可用的污染规则
    const availableRules = CORRUPTION_RULES.filter(rule =>
      rule.phase.includes(this.currentPhase)
    );

    for (let i = 0; i < corruptionCount; i++) {
      if (Math.random() < phaseFeatures.corruptionChance && availableRules.length > 0) {
        const totalWeight = availableRules.reduce((sum, r) => sum + r.weight, 0);
        let random = Math.random() * totalWeight;

        for (const rule of availableRules) {
          random -= rule.weight;
          if (random <= 0) {
            this.activeCorruptions.push(rule);
            triggeredCorruptions.push(rule);
            break;
          }
        }
      }
    }

    return triggeredCorruptions;
  }

  /**
   * 随机修改核心规则
   */
  _randomizeCoreRule() {
    const coreRules = [
      { name: 'high_roll_fail', description: '高Roll失败' },
      { name: 'low_speed_priority', description: '低速优先行动' },
      { name: 'force_all_in', description: '双方强制ALL IN' },
      { name: 'no_skip', description: '禁止空过' },
      { name: 'infinite_combo', description: '连击无限' },
      { name: 'random_card_change', description: '出牌后随机变牌' }
    ];

    return coreRules[Math.floor(Math.random() * coreRules.length)];
  }

  /**
   * 增加疯狂值
   */
  gainMadness(amount) {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
    const actualAmount = Math.floor(amount * phaseFeatures.madnessGainMultiplier);

    this.madness = Math.min(this.maxMadness, this.madness + actualAmount);

    // 检查是否触发终末暴走
    if (this.madness >= this.maxMadness) {
      return {
        madnessGained: actualAmount,
        totalMadness: this.madness,
        apocalypseTriggered: true
      };
    }

    return {
      madnessGained: actualAmount,
      totalMadness: this.madness,
      apocalypseTriggered: false
    };
  }

  /**
   * 使用崩坏降临技能
   */
  useCorruptionArrival() {
    if (this.skillCooldown > 0) {
      return { success: false, reason: '技能冷却中' };
    }

    const skill = this.config.skill;
    this.skillCooldown = skill.cooldown;

    // 触发3条污染规则
    const corruptions = [];
    const availableRules = CORRUPTION_RULES.filter(rule =>
      rule.phase.includes(this.currentPhase)
    );

    for (let i = 0; i < skill.effects.corruptionCount; i++) {
      const randomRule = availableRules[Math.floor(Math.random() * availableRules.length)];
      corruptions.push(randomRule);
      this.activeCorruptions.push(randomRule);
    }

    // 检查疯狂值是否过高，追加AOE
    let aoeDamage = 0;
    if (this.madness >= skill.effects.madnessThreshold) {
      aoeDamage = Math.floor(this.madness * 0.3);
    }

    return {
      success: true,
      skill: skill,
      corruptions: corruptions,
      aoeDamage: aoeDamage,
      duration: skill.effects.duration
    };
  }

  /**
   * 检查是否可以使用技能
   */
  canUseSkill() {
    return this.skillCooldown === 0;
  }

  /**
   * 选择卡牌
   */
  selectCard(hand, battleState) {
    const phaseCards = FINAL_MADMAN_CARDS.filter(card => card.phase === this.currentPhase);
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    // 根据AI混乱度选择
    const aiChaos = phaseFeatures.aiChaos;

    if (Math.random() < aiChaos && phaseCards.length > 0) {
      // 优先选择高风险/高疯狂值卡牌
      const riskyCards = phaseCards.filter(card =>
        card.madnessGain >= 10 || card.rarity === 'LEGENDARY'
      );
      if (riskyCards.length > 0) {
        const selectedCard = riskyCards[Math.floor(Math.random() * riskyCards.length)];
        this.gainMadness(selectedCard.madnessGain);
        return selectedCard;
      }
    }

    // 随机选择
    if (phaseCards.length > 0) {
      const selectedCard = phaseCards[Math.floor(Math.random() * phaseCards.length)];
      this.gainMadness(selectedCard.madnessGain);
      return selectedCard;
    }

    return hand[0] || null;
  }

  /**
   * 处理战斗结果
   */
  onBattleResult(won) {
    if (won) {
      this.consecutiveWins++;
      // 连胜增加疯狂值
      this.gainMadness(this.consecutiveWins * 3);
    } else {
      this.consecutiveWins = 0;
    }
  }

  /**
   * 给玩家添加疯狂层数
   */
  addPlayerMadnessStacks(stacks) {
    this.playerMadnessStacks += stacks;

    return {
      stacksAdded: stacks,
      totalStacks: this.playerMadnessStacks,
      effects: this._getMadnessEffects()
    };
  }

  /**
   * 获取疯狂层数效果
   */
  _getMadnessEffects() {
    const effects = [];

    if (this.playerMadnessStacks >= 3) {
      effects.push('更容易低Roll');
    }
    if (this.playerMadnessStacks >= 5) {
      effects.push('更容易被污染');
    }
    if (this.playerMadnessStacks >= 8) {
      effects.push('更容易触发负面效果');
    }

    return effects;
  }

  /**
   * 获取Boss状态
   */
  getStatus() {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    return {
      ...this.entity,
      currentPhase: this.currentPhase,
      madness: this.madness,
      maxMadness: this.maxMadness,
      skillCooldown: this.skillCooldown,
      canUseSkill: this.canUseSkill(),
      activeCorruptions: this.activeCorruptions,
      playerMadnessStacks: this.playerMadnessStacks,
      consecutiveWins: this.consecutiveWins,
      phaseFeatures: phaseFeatures
    };
  }

  /**
   * 受到伤害
   */
  takeDamage(damage) {
    // 先扣护盾
    if (this.entity.currentShield > 0) {
      const shieldDamage = Math.min(this.entity.currentShield, damage);
      this.entity.currentShield -= shieldDamage;
      damage -= shieldDamage;
    }

    // 再扣生命
    this.entity.currentHp = Math.max(0, this.entity.currentHp - damage);

    // 受伤增加疯狂值
    this.gainMadness(Math.floor(damage * 0.5));

    return {
      damageTaken: damage,
      currentHp: this.entity.currentHp,
      currentShield: this.entity.currentShield
    };
  }
}

// ==================== 终末狂徒生成器 ====================

class FinalMadmanGenerator {
  static generate(options = {}) {
    const level = options.level || 1;
    const hpMultiplier = 1 + (level - 1) * 0.3;

    const config = {
      ...FINAL_MADMAN_CONFIG,
      stats: {
        maxHp: Math.floor(FINAL_MADMAN_CONFIG.stats.maxHp * hpMultiplier),
        baseShield: FINAL_MADMAN_CONFIG.stats.baseShield
      }
    };

    return new FinalMadmanBoss(config);
  }
}

// ==================== 导出 ====================

module.exports = {
  MadmanPhase,
  CorruptionType,
  CORRUPTION_RULES,
  FINAL_MADMAN_CARDS,
  FINAL_MADMAN_CONFIG,
  FinalMadmanBoss,
  FinalMadmanGenerator
};
