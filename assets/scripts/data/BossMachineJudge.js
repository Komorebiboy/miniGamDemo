/**
 * Boss 3：机械裁决者（Machine Judge）
 *
 * 核心机制：
 * 1. 绝对公平 - 强制双方Roll区间、速度、暴击率相同
 * 2. 三阶段系统 - 规则建立 → 公平压制 → 绝对裁决
 * 3. 规则审判技能 - 违反规则者受到惩罚
 * 4. 精密计算 - Boss会根据数学期望最优选择
 * 5. 12张专属卡牌
 */

const { AIType } = require('./EnemyAI');
const { EnemyFaction, DangerLevel } = require('./EnemyPhase1');

// ==================== Boss阶段定义 ====================

const JudgePhase = {
  PHASE_1: 'PHASE_1',  // 规则建立
  PHASE_2: 'PHASE_2',  // 公平压制
  PHASE_3: 'PHASE_3'   // 绝对裁决
};

// ==================== 规则类型 ====================

const RuleType = {
  SAME_ROLL_RANGE: 'SAME_ROLL_RANGE',     // Roll区间相同
  SAME_SPEED: 'SAME_SPEED',               // 速度相同
  SAME_CRIT_RATE: 'SAME_CRIT_RATE',       // 暴击率相同
  NO_SKIP: 'NO_SKIP',                     // 禁止空过
  ALTERNATE_TYPES: 'ALTERNATE_TYPES',     // 必须交替出牌类型
  REVEAL_HAND: 'REVEAL_HAND',             // 必须展示手牌
  FIXED_ORDER: 'FIXED_ORDER'              // 固定出牌顺序
};

// ==================== 违反规则惩罚 ====================

const RULE_VIOLATION_PENALTIES = {
  DAMAGE: { type: 'DAMAGE', value: 10 },
  SHIELD_LOSS: { type: 'SHIELD_LOSS', value: 15 },
  ROLL_PENALTY: { type: 'ROLL_PENALTY', value: -3 },
  SPEED_PENALTY: { type: 'SPEED_PENALTY', value: -2 },
  EXTRA_DEBT: { type: 'EXTRA_DEBT', value: 5 }
};

// ==================== Boss专属卡牌（12张） ====================

const MACHINE_JUDGE_CARDS = [
  // ===== 阶段1卡牌 =====
  {
    id: 'rule_establishment',
    name: '规则确立',
    description: '本回合双方Roll范围强制变为5-15',
    phase: JudgePhase.PHASE_1,
    type: 'RULE',
    rarity: 'UNCOMMON',
    rollRange: { min: 8, max: 12 },
    speed: 5,
    effects: [
      {
        type: 'FORCE_SAME_ROLL',
        rollRange: { min: 5, max: 15 },
        duration: 1
      }
    ],
    ruleLevel: 1
  },
  {
    id: 'equal_speed',
    name: '速度平衡',
    description: '本回合双方速度强制变为5',
    phase: JudgePhase.PHASE_1,
    type: 'RULE',
    rarity: 'COMMON',
    rollRange: { min: 6, max: 10 },
    speed: 5,
    effects: [
      {
        type: 'FORCE_SAME_SPEED',
        speed: 5,
        duration: 1
      }
    ],
    ruleLevel: 1
  },
  {
    id: 'fair_crit',
    name: '公平暴击',
    description: '本回合双方暴击率强制变为20%',
    phase: JudgePhase.PHASE_1,
    type: 'RULE',
    rarity: 'UNCOMMON',
    rollRange: { min: 7, max: 11 },
    speed: 6,
    effects: [
      {
        type: 'FORCE_SAME_CRIT',
        critRate: 0.2,
        duration: 1
      }
    ],
    ruleLevel: 1
  },
  {
    id: 'no_escape',
    name: '无处可逃',
    description: '禁止空过，违反者受到10点伤害',
    phase: JudgePhase.PHASE_1,
    type: 'RULE',
    rarity: 'RARE',
    rollRange: { min: 5, max: 9 },
    speed: 4,
    effects: [
      {
        type: 'ENFORCE_NO_SKIP',
        penalty: RULE_VIOLATION_PENALTIES.DAMAGE
      }
    ],
    ruleLevel: 2
  },

  // ===== 阶段2卡牌 =====
  {
    id: 'absolute_fairness',
    name: '绝对公平',
    description: '本回合所有属性强制相同',
    phase: JudgePhase.PHASE_2,
    type: 'RULE',
    rarity: 'RARE',
    rollRange: { min: 9, max: 13 },
    speed: 5,
    effects: [
      {
        type: 'FORCE_ALL_SAME',
        rollRange: { min: 6, max: 14 },
        speed: 5,
        critRate: 0.2,
        duration: 1
      }
    ],
    ruleLevel: 3
  },
  {
    id: 'type_alternation',
    name: '类型交替',
    description: '玩家必须交替出攻击/防御牌',
    phase: JudgePhase.PHASE_2,
    type: 'RULE',
    rarity: 'RARE',
    rollRange: { min: 8, max: 12 },
    speed: 6,
    effects: [
      {
        type: 'ENFORCE_ALTERNATE',
        penalty: RULE_VIOLATION_PENALTIES.SHIELD_LOSS
      }
    ],
    ruleLevel: 3
  },
  {
    id: 'hand_reveal',
    name: '手牌展示',
    description: '玩家必须展示手牌',
    phase: JudgePhase.PHASE_2,
    type: 'RULE',
    rarity: 'UNCOMMON',
    rollRange: { min: 7, max: 11 },
    speed: 7,
    effects: [
      {
        type: 'FORCE_REVEAL_HAND',
        penalty: RULE_VIOLATION_PENALTIES.ROLL_PENALTY
      }
    ],
    ruleLevel: 2
  },
  {
    id: 'mathematical_precision',
    name: '数学精密',
    description: 'Boss选择数学期望最高的牌',
    phase: JudgePhase.PHASE_2,
    type: 'CALCULATION',
    rarity: 'RARE',
    rollRange: { min: 10, max: 14 },
    speed: 5,
    effects: [
      {
        type: 'OPTIMAL_CHOICE',
        strategy: 'expected_value'
      }
    ],
    ruleLevel: 2
  },

  // ===== 阶段3卡牌 =====
  {
    id: 'final_judgment',
    name: '最终审判',
    description: '违反规则者立即受到25点伤害',
    phase: JudgePhase.PHASE_3,
    type: 'JUDGMENT',
    rarity: 'LEGENDARY',
    rollRange: { min: 12, max: 18 },
    speed: 3,
    effects: [
      {
        type: 'SEVERE_PENALTY',
        penalty: { type: 'DAMAGE', value: 25 }
      }
    ],
    ruleLevel: 4
  },
  {
    id: 'absolute_order',
    name: '绝对秩序',
    description: '强制固定出牌顺序，违反者失去所有护盾',
    phase: JudgePhase.PHASE_3,
    type: 'RULE',
    rarity: 'LEGENDARY',
    rollRange: { min: 11, max: 17 },
    speed: 4,
    effects: [
      {
        type: 'ENFORCE_FIXED_ORDER',
        order: ['ATTACK', 'DEFENSE', 'ATTACK'],
        penalty: { type: 'SHIELD_LOSS', value: 999 }
      }
    ],
    ruleLevel: 4
  },
  {
    id: 'mechanical_perfection',
    name: '机械完美',
    description: 'Boss Roll取中间值，玩家随机',
    phase: JudgePhase.PHASE_3,
    type: 'ADVANTAGE',
    rarity: 'LEGENDARY',
    rollRange: { min: 10, max: 16 },
    speed: 5,
    effects: [
      {
        type: 'BOSS_OPTIMAL_ROLL',
        playerRandom: true
      }
    ],
    ruleLevel: 3
  },
  {
    id: 'rule_supremacy',
    name: '规则至上',
    description: '本回合所有规则同时生效',
    phase: JudgePhase.PHASE_3,
    type: 'ULTIMATE_RULE',
    rarity: 'LEGENDARY',
    rollRange: { min: 13, max: 19 },
    speed: 2,
    effects: [
      {
        type: 'ALL_RULES_ACTIVE',
        rules: ['SAME_ROLL', 'SAME_SPEED', 'SAME_CRIT', 'NO_SKIP'],
        duration: 1
      }
    ],
    ruleLevel: 5
  }
];

// ==================== Boss配置 ====================

const MACHINE_JUDGE_CONFIG = {
  id: 'machine_judge',
  name: '机械裁决者',
  title: '绝对公平的执行者',
  faction: EnemyFaction.IRON_TRIBUNAL,
  aiType: AIType.DEFENSIVE,  // 主要AI类型
  secondaryAiType: AIType.PRECOGNITIVE,  // 次要AI类型
  dangerLevel: DangerLevel.BOSS,
  isBoss: true,

  stats: {
    maxHp: 140,
    baseShield: 25
  },

  // 阶段血量阈值
  phaseThresholds: {
    [JudgePhase.PHASE_1]: 1.0,   // 100% - 70%
    [JudgePhase.PHASE_2]: 0.7,   // 70% - 40%
    [JudgePhase.PHASE_3]: 0.4    // 40% - 0%
  },

  // 规则审判技能
  skill: {
    id: 'rule_judgment',
    name: '规则审判',
    description: '检测玩家是否违反规则，违反者受到惩罚',
    cooldown: 3,
    maxCooldown: 3,
    effects: {
      checkRules: true,
      penalty: { type: 'DAMAGE', value: 15 },
      duration: 1
    }
  },

  // 阶段特性
  phaseFeatures: {
    [JudgePhase.PHASE_1]: {
      name: '规则建立',
      description: '建立基础公平规则',
      activeRules: [RuleType.SAME_ROLL_RANGE],
      ruleEnforcement: 0.5,
      aiPrecision: 0.7,
      fairRange: { min: 5, max: 15 }
    },
    [JudgePhase.PHASE_2]: {
      name: '公平压制',
      description: '强化规则，压制优势',
      activeRules: [RuleType.SAME_ROLL_RANGE, RuleType.SAME_SPEED, RuleType.SAME_CRIT_RATE],
      ruleEnforcement: 0.8,
      aiPrecision: 0.9,
      fairRange: { min: 6, max: 14 },
      fairSpeed: 5,
      fairCritRate: 0.2
    },
    [JudgePhase.PHASE_3]: {
      name: '绝对裁决',
      description: '绝对公平，违反者重罚',
      activeRules: [RuleType.SAME_ROLL_RANGE, RuleType.SAME_SPEED, RuleType.SAME_CRIT_RATE, RuleType.NO_SKIP],
      ruleEnforcement: 1.0,
      aiPrecision: 1.0,
      fairRange: { min: 7, max: 13 },
      fairSpeed: 5,
      fairCritRate: 0.2,
      severePenalty: true
    }
  },

  description: '冰冷的机械执行着绝对的公平，在它面前，一切优势都将被抹平，一切违规都将受到审判。',
  flavor: '「在绝对的公平面前，一切花招都毫无意义。遵守规则，或者接受审判。」',

  visual: {
    icon: '⚖️',
    borderColor: '#2C3E50',
    glowColor: '#3498DB',
    phaseTransitionEffects: {
      [JudgePhase.PHASE_2]: {
        animation: 'mechanical_awakening',
        gearRotation: true,
        blueLight: true,
        ruleDisplay: true
      },
      [JudgePhase.PHASE_3]: {
        animation: 'judgment_mode',
        redAlert: true,
        screenShake: true,
        judgmentSound: true
      }
    }
  }
};

// ==================== 机械裁决者Boss类 ====================

class MachineJudgeBoss {
  constructor(config = MACHINE_JUDGE_CONFIG) {
    this.config = config;
    this.currentPhase = JudgePhase.PHASE_1;
    this.skillCooldown = 0;
    this.turnCount = 0;
    this.activeRules = [];
    this.playerViolations = 0;
    this.lastPlayerCardType = null;

    // 规则执行记录
    this.ruleHistory = [];

    // 初始化Boss实体
    this.entity = {
      ...config,
      currentHp: config.stats.maxHp,
      maxHp: config.stats.maxHp,
      currentShield: config.stats.baseShield,
      instanceId: `boss_machine_judge_${Date.now()}`
    };
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase() {
    const hpPercent = this.entity.currentHp / this.entity.maxHp;

    if (hpPercent <= this.config.phaseThresholds[JudgePhase.PHASE_3]) {
      return JudgePhase.PHASE_3;
    } else if (hpPercent <= this.config.phaseThresholds[JudgePhase.PHASE_2]) {
      return JudgePhase.PHASE_2;
    }
    return JudgePhase.PHASE_1;
  }

  /**
   * 检查阶段切换
   */
  checkPhaseTransition() {
    const newPhase = this.getCurrentPhase();

    if (newPhase !== this.currentPhase) {
      const oldPhase = this.currentPhase;
      this.currentPhase = newPhase;

      // 更新活跃规则
      this.activeRules = this.config.phaseFeatures[newPhase].activeRules;

      console.log(`[MachineJudge] 阶段切换: ${oldPhase} -> ${newPhase}`);

      return {
        transitioned: true,
        oldPhase,
        newPhase,
        features: this.config.phaseFeatures[newPhase],
        activeRules: this.activeRules
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

    return {
      phaseTransition: phaseResult,
      currentPhase: this.currentPhase,
      phaseFeatures: phaseFeatures,
      activeRules: this.activeRules,
      fairValues: this._getFairValues()
    };
  }

  /**
   * 获取公平值
   */
  _getFairValues() {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    return {
      rollRange: phaseFeatures.fairRange,
      speed: phaseFeatures.fairSpeed,
      critRate: phaseFeatures.fairCritRate
    };
  }

  /**
   * 检查玩家是否违反规则
   */
  checkRuleViolation(playerAction, playerState) {
    const violations = [];
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    // 检查空过规则
    if (this.activeRules.includes(RuleType.NO_SKIP) && playerAction.skipped) {
      violations.push({
        rule: RuleType.NO_SKIP,
        penalty: phaseFeatures.severePenalty
          ? { type: 'DAMAGE', value: 25 }
          : RULE_VIOLATION_PENALTIES.DAMAGE
      });
    }

    // 检查类型交替规则
    if (this.activeRules.includes(RuleType.ALTERNATE_TYPES) && playerAction.card) {
      const currentType = playerAction.card.type;
      if (this.lastPlayerCardType && currentType === this.lastPlayerCardType) {
        violations.push({
          rule: RuleType.ALTERNATE_TYPES,
          penalty: RULE_VIOLATION_PENALTIES.SHIELD_LOSS
        });
      }
      this.lastPlayerCardType = currentType;
    }

    // 记录违规
    if (violations.length > 0) {
      this.playerViolations += violations.length;
      this.ruleHistory.push({
        turn: this.turnCount,
        violations: violations
      });
    }

    return violations;
  }

  /**
   * 使用规则审判技能
   */
  useRuleJudgment(playerAction, playerState) {
    if (this.skillCooldown > 0) {
      return { success: false, reason: '技能冷却中' };
    }

    const skill = this.config.skill;
    this.skillCooldown = skill.cooldown;

    // 检查违规
    const violations = this.checkRuleViolation(playerAction, playerState);

    if (violations.length > 0) {
      return {
        success: true,
        skill: skill,
        violations: violations,
        totalViolations: this.playerViolations,
        penaltyApplied: true
      };
    }

    return {
      success: true,
      skill: skill,
      violations: [],
      totalViolations: this.playerViolations,
      penaltyApplied: false,
      message: '玩家遵守规则，未受到惩罚'
    };
  }

  /**
   * 检查是否可以使用技能
   */
  canUseSkill() {
    return this.skillCooldown === 0;
  }

  /**
   * 选择卡牌（基于数学期望最优）
   */
  selectCard(hand, battleState) {
    const phaseCards = MACHINE_JUDGE_CARDS.filter(card => card.phase === this.currentPhase);
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    // 根据AI精度选择
    const aiPrecision = phaseFeatures.aiPrecision;

    if (Math.random() < aiPrecision && phaseCards.length > 0) {
      // 选择数学期望最高的牌
      const bestCard = this._calculateOptimalCard(phaseCards, battleState);
      if (bestCard) {
        return bestCard;
      }
    }

    // 随机选择
    if (phaseCards.length > 0) {
      return phaseCards[Math.floor(Math.random() * phaseCards.length)];
    }

    return hand[0] || null;
  }

  /**
   * 计算最优卡牌（数学期望）
   */
  _calculateOptimalCard(cards, battleState) {
    let bestCard = null;
    let bestExpectedValue = -Infinity;

    for (const card of cards) {
      const rollRange = card.rollRange;
      const averageRoll = (rollRange.min + rollRange.max) / 2;
      const speedBonus = card.speed * 0.5;

      // 计算期望伤害
      let expectedDamage = averageRoll + speedBonus;

      // 考虑规则效果
      if (card.effects) {
        for (const effect of card.effects) {
          if (effect.type === 'FORCE_SAME_ROLL' || effect.type === 'FORCE_ALL_SAME') {
            // 规则牌有额外价值
            expectedDamage += 5;
          }
          if (effect.type === 'ENFORCE_NO_SKIP') {
            // 限制玩家行动的牌有价值
            expectedDamage += 3;
          }
        }
      }

      if (expectedDamage > bestExpectedValue) {
        bestExpectedValue = expectedDamage;
        bestCard = card;
      }
    }

    return bestCard;
  }

  /**
   * 获取Boss Roll值（阶段3取中间值）
   */
  getBossRoll(baseRoll) {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    if (this.currentPhase === JudgePhase.PHASE_3 && phaseFeatures.fairRange) {
      // 阶段3取Roll范围的中间值
      const midRoll = (phaseFeatures.fairRange.min + phaseFeatures.fairRange.max) / 2;
      return Math.floor(midRoll);
    }

    return baseRoll;
  }

  /**
   * 应用公平规则到玩家
   */
  applyFairRules(playerState) {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
    const fairValues = this._getFairValues();

    const modifiedState = { ...playerState };

    // 强制Roll范围
    if (this.activeRules.includes(RuleType.SAME_ROLL_RANGE) && fairValues.rollRange) {
      modifiedState.forcedRollRange = fairValues.rollRange;
    }

    // 强制速度
    if (this.activeRules.includes(RuleType.SAME_SPEED) && fairValues.speed) {
      modifiedState.forcedSpeed = fairValues.speed;
    }

    // 强制暴击率
    if (this.activeRules.includes(RuleType.SAME_CRIT_RATE) && fairValues.critRate) {
      modifiedState.forcedCritRate = fairValues.critRate;
    }

    return modifiedState;
  }

  /**
   * 获取Boss状态
   */
  getStatus() {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    return {
      ...this.entity,
      currentPhase: this.currentPhase,
      skillCooldown: this.skillCooldown,
      canUseSkill: this.canUseSkill(),
      activeRules: this.activeRules,
      phaseFeatures: phaseFeatures,
      fairValues: this._getFairValues(),
      playerViolations: this.playerViolations,
      aiPrecision: phaseFeatures.aiPrecision
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

    return {
      damageTaken: damage,
      currentHp: this.entity.currentHp,
      currentShield: this.entity.currentShield
    };
  }
}

// ==================== 机械裁决者生成器 ====================

class MachineJudgeGenerator {
  static generate(options = {}) {
    const level = options.level || 1;
    const hpMultiplier = 1 + (level - 1) * 0.3;

    const config = {
      ...MACHINE_JUDGE_CONFIG,
      stats: {
        maxHp: Math.floor(MACHINE_JUDGE_CONFIG.stats.maxHp * hpMultiplier),
        baseShield: MACHINE_JUDGE_CONFIG.stats.baseShield
      }
    };

    return new MachineJudgeBoss(config);
  }
}

// ==================== 导出 ====================

module.exports = {
  JudgePhase,
  RuleType,
  RULE_VIOLATION_PENALTIES,
  MACHINE_JUDGE_CARDS,
  MACHINE_JUDGE_CONFIG,
  MachineJudgeBoss,
  MachineJudgeGenerator
};
