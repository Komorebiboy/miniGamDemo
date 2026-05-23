/**
 * 最终Boss：命运之主（Lord of Fate）
 *
 * 核心机制：
 * 1. 命运审判 - 观察玩家行为并修改概率
 * 2. 三阶段系统 - 命运观测 → 概率干涉 → 最终命运
 * 3. 命运改写技能 - 随机修改核心规则
 * 4. 命运值系统 - 成功预测获得强化
 * 5. 15张专属卡牌
 */

const { AIType } = require('./EnemyAI');
const { EnemyFaction, DangerLevel } = require('./EnemyPhase1');

// ==================== Boss阶段定义 ====================

const FatePhase = {
  PHASE_1: 'PHASE_1',  // 命运观测
  PHASE_2: 'PHASE_2',  // 概率干涉
  PHASE_3: 'PHASE_3'   // 最终命运
};

// ==================== 玩家行为类型 ====================

const PlayerBehavior = {
  LIKES_ALL_IN: 'LIKES_ALL_IN',
  LIKES_SKIP: 'LIKES_SKIP',
  LIKES_HIGH_SPEED: 'LIKES_HIGH_SPEED',
  LIKES_LOW_SPEED: 'LIKES_LOW_SPEED',
  LIKES_HIGH_ROLL: 'LIKES_HIGH_ROLL',
  LIKES_FINISHER: 'LIKES_FINISHER'
};

// ==================== 概率修改类型 ====================

const FateModification = {
  REDUCE_HIGH_ROLL: 'REDUCE_HIGH_ROLL',
  REDUCE_CRIT: 'REDUCE_CRIT',
  REDUCE_SPEED: 'REDUCE_SPEED',
  INCREASE_LOW_ROLL: 'INCREASE_LOW_ROLL',
  SWAP_ROLL_RANGE: 'SWAP_ROLL_RANGE',
  LOCK_CARD_TYPE: 'LOCK_CARD_TYPE'
};

// ==================== Boss专属卡牌（15张） ====================

const LORD_OF_FATE_CARDS = [
  // ===== 阶段1卡牌 =====
  {
    id: 'probability_collapse',
    name: '概率崩塌',
    description: '降低玩家高Roll概率20%',
    phase: FatePhase.PHASE_1,
    type: 'FATE',
    rarity: 'RARE',
    rollRange: { min: 8, max: 14 },
    speed: 6,
    effects: [
      {
        type: 'REDUCE_HIGH_ROLL_CHANCE',
        value: 0.2,
        duration: 2
      }
    ],
    fateGain: 10
  },
  {
    id: 'fate_echo',
    name: '命运回响',
    description: '复制玩家上一回合的行为',
    phase: FatePhase.PHASE_1,
    type: 'MIRROR',
    rarity: 'UNCOMMON',
    rollRange: { min: 7, max: 13 },
    speed: 5,
    effects: [
      {
        type: 'COPY_PLAYER_LAST_ACTION'
      }
    ],
    fateGain: 8
  },
  {
    id: 'time_reset',
    name: '时间重置',
    description: '强制双方重新Roll',
    phase: FatePhase.PHASE_1,
    type: 'TIME',
    rarity: 'RARE',
    rollRange: { min: 6, max: 12 },
    speed: 7,
    effects: [
      {
        type: 'FORCE_REROLL'
      }
    ],
    fateGain: 12
  },
  {
    id: 'causal_reversal',
    name: '因果逆转',
    description: '交换双方本回合结果',
    phase: FatePhase.PHASE_1,
    type: 'CAUSAL',
    rarity: 'LEGENDARY',
    rollRange: { min: 5, max: 11 },
    speed: 4,
    effects: [
      {
        type: 'SWAP_RESULTS'
      }
    ],
    fateGain: 15
  },
  {
    id: 'fate_chain',
    name: '命运锁链',
    description: '封锁玩家最常用的套路一回合',
    phase: FatePhase.PHASE_1,
    type: 'FATE',
    rarity: 'UNCOMMON',
    rollRange: { min: 9, max: 15 },
    speed: 6,
    effects: [
      {
        type: 'BLOCK_PATTERN',
        duration: 1
      }
    ],
    fateGain: 10
  },

  // ===== 阶段2卡牌 =====
  {
    id: 'probability_weave',
    name: '概率编织',
    description: '修改双方暴击率为固定15%',
    phase: FatePhase.PHASE_2,
    type: 'FATE',
    rarity: 'RARE',
    rollRange: { min: 10, max: 16 },
    speed: 5,
    effects: [
      {
        type: 'FORCE_CRIT_RATE',
        value: 0.15,
        duration: 2
      }
    ],
    fateGain: 15
  },
  {
    id: 'destiny_thread',
    name: '命运之线',
    description: '查看玩家手牌并选择最优对策',
    phase: FatePhase.PHASE_2,
    type: 'PRECOG',
    rarity: 'LEGENDARY',
    rollRange: { min: 8, max: 14 },
    speed: 8,
    effects: [
      {
        type: 'REVEAL_AND_COUNTER'
      }
    ],
    fateGain: 20
  },
  {
    id: 'karma_balance',
    name: '因果平衡',
    description: '将双方生命调整到平均值',
    phase: FatePhase.PHASE_2,
    type: 'BALANCE',
    rarity: 'RARE',
    rollRange: { min: 6, max: 12 },
    speed: 3,
    effects: [
      {
        type: 'BALANCE_HP'
      }
    ],
    fateGain: 18
  },
  {
    id: 'fate_intervention',
    name: '命运干预',
    description: '强制改变玩家Roll结果±3',
    phase: FatePhase.PHASE_2,
    type: 'INTERVENTION',
    rarity: 'UNCOMMON',
    rollRange: { min: 7, max: 13 },
    speed: 6,
    effects: [
      {
        type: 'MODIFY_PLAYER_ROLL',
        range: [-3, 3]
      }
    ],
    fateGain: 12
  },
  {
    id: 'probability_lock',
    name: '概率锁定',
    description: '锁定玩家某种行为的成功率',
    phase: FatePhase.PHASE_2,
    type: 'LOCK',
    rarity: 'RARE',
    rollRange: { min: 9, max: 15 },
    speed: 5,
    effects: [
      {
        type: 'LOCK_SUCCESS_RATE',
        rate: 0.5,
        duration: 2
      }
    ],
    fateGain: 15
  },

  // ===== 阶段3卡牌 =====
  {
    id: 'final_judgment',
    name: '最终审判',
    description: '重写本回合核心规则',
    phase: FatePhase.PHASE_3,
    type: 'JUDGMENT',
    rarity: 'LEGENDARY',
    rollRange: { min: 12, max: 20 },
    speed: 2,
    effects: [
      {
        type: 'REWRITE_RULE',
        duration: 2
      }
    ],
    fateGain: 25
  },
  {
    id: 'fate_convergence',
    name: '命运汇聚',
    description: '双方Roll强制取相同值',
    phase: FatePhase.PHASE_3,
    type: 'CONVERGE',
    rarity: 'LEGENDARY',
    rollRange: { min: 10, max: 18 },
    speed: 4,
    effects: [
      {
        type: 'FORCE_SAME_ROLL'
      }
    ],
    fateGain: 20
  },
  {
    id: 'destiny_seal',
    name: '命运封印',
    description: '封印玩家技能一回合',
    phase: FatePhase.PHASE_3,
    type: 'SEAL',
    rarity: 'RARE',
    rollRange: { min: 8, max: 16 },
    speed: 7,
    effects: [
      {
        type: 'SEAL_SKILL',
        duration: 1
      }
    ],
    fateGain: 15
  },
  {
    id: 'probability_overwrite',
    name: '概率覆写',
    description: '完全控制本回合所有概率',
    phase: FatePhase.PHASE_3,
    type: 'OVERWRITE',
    rarity: 'LEGENDARY',
    rollRange: { min: 11, max: 19 },
    speed: 3,
    effects: [
      {
        type: 'CONTROL_ALL_PROBABILITY'
      }
    ],
    fateGain: 30
  },
  {
    id: 'eternal_fate',
    name: '永恒命运',
    description: '本回合结果将延续到下一回合',
    phase: FatePhase.PHASE_3,
    type: 'ETERNAL',
    rarity: 'LEGENDARY',
    rollRange: { min: 9, max: 17 },
    speed: 5,
    effects: [
      {
        type: 'CARRY_OVER_RESULT'
      }
    ],
    fateGain: 25
  }
];

// ==================== Boss配置 ====================

const LORD_OF_FATE_CONFIG = {
  id: 'lord_of_fate',
  name: '命运之主',
  title: '命运的编织者',
  faction: EnemyFaction.IRON_TRIBUNAL,
  aiType: AIType.PRECOGNITIVE,
  secondaryAiType: AIType.DEFENSIVE,
  dangerLevel: DangerLevel.BOSS,
  isBoss: true,
  isFinalBoss: true,

  stats: {
    maxHp: 180,
    baseShield: 30
  },

  phaseThresholds: {
    [FatePhase.PHASE_1]: 1.0,
    [FatePhase.PHASE_2]: 0.7,
    [FatePhase.PHASE_3]: 0.4
  },

  skill: {
    id: 'rewrite_fate',
    name: '命运改写',
    description: '随机修改一条核心规则，持续2回合',
    cooldown: 3,
    maxCooldown: 3,
    effects: {
      ruleChangeCount: 1,
      duration: 2
    }
  },

  phaseFeatures: {
    [FatePhase.PHASE_1]: {
      name: '命运观测',
      description: '记录玩家行为，暂时不强压制',
      observationStrength: 1.0,
      fateGainMultiplier: 1.0,
      predictionAccuracy: 0.3,
      aiLearning: true
    },
    [FatePhase.PHASE_2]: {
      name: '概率干涉',
      description: '开始修改概率',
      observationStrength: 1.5,
      fateGainMultiplier: 1.5,
      predictionAccuracy: 0.6,
      canModifyProbability: true,
      aiLearning: true
    },
    [FatePhase.PHASE_3]: {
      name: '最终命运',
      description: '重写规则，完全掌控',
      observationStrength: 2.0,
      fateGainMultiplier: 2.0,
      predictionAccuracy: 0.9,
      canModifyProbability: true,
      canRewriteRules: true,
      fateLockEnabled: true,
      aiLearning: true
    }
  },

  description: '它观察着一切，编织着命运的丝线。在它面前，你的每一个选择都已被预见。',
  flavor: '「你以为是你在做选择？不，那只是命运让你以为如此。」',

  visual: {
    icon: '🔮',
    borderColor: '#4A0080',
    glowColor: '#9D4EDD',
    phaseTransitionEffects: {
      [FatePhase.PHASE_2]: {
        animation: 'stars_awaken',
        constellationForm: true,
        purpleGlow: true
      },
      [FatePhase.PHASE_3]: {
        animation: 'fate_unleashed',
        timeStop: true,
        universeCrack: true,
        giantWheel: true,
        probabilityFlow: true,
        screenMonochrome: true
      }
    }
  }
};

// ==================== 命运之主Boss类 ====================

class LordOfFateBoss {
  constructor(config = LORD_OF_FATE_CONFIG) {
    this.config = config;
    this.currentPhase = FatePhase.PHASE_1;
    this.fate = 0;
    this.maxFate = 100;
    this.skillCooldown = 0;
    this.turnCount = 0;
    this.fateLockActive = false;

    // 玩家行为记录
    this.playerBehavior = {
      actions: [],
      patterns: {},
      preferences: {
        allIn: 0,
        skip: 0,
        highSpeed: 0,
        lowSpeed: 0,
        highRoll: 0,
        finisher: 0
      }
    };

    // 概率修改
    this.activeModifications = [];

    // 预测记录
    this.predictions = [];

    this.entity = {
      ...config,
      currentHp: config.stats.maxHp,
      maxHp: config.stats.maxHp,
      currentShield: config.stats.baseShield,
      instanceId: `boss_lord_of_fate_${Date.now()}`
    };
  }

  getCurrentPhase() {
    const hpPercent = this.entity.currentHp / this.entity.maxHp;
    if (hpPercent <= this.config.phaseThresholds[FatePhase.PHASE_3]) {
      return FatePhase.PHASE_3;
    } else if (hpPercent <= this.config.phaseThresholds[FatePhase.PHASE_2]) {
      return FatePhase.PHASE_2;
    }
    return FatePhase.PHASE_1;
  }

  checkPhaseTransition() {
    const newPhase = this.getCurrentPhase();
    if (newPhase !== this.currentPhase) {
      const oldPhase = this.currentPhase;
      this.currentPhase = newPhase;
      console.log(`[LordOfFate] 阶段切换: ${oldPhase} -> ${newPhase}`);
      return {
        transitioned: true,
        oldPhase,
        newPhase,
        features: this.config.phaseFeatures[newPhase]
      };
    }
    return { transitioned: false };
  }

  onTurnStart() {
    this.turnCount++;
    if (this.skillCooldown > 0) {
      this.skillCooldown--;
    }

    const phaseResult = this.checkPhaseTransition();
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    // 生成预测
    const prediction = this._generatePrediction();

    return {
      phaseTransition: phaseResult,
      currentPhase: this.currentPhase,
      phaseFeatures: phaseFeatures,
      prediction: prediction,
      fate: this.fate
    };
  }

  _generatePrediction() {
    const behaviors = this._analyzeBehavior();
    if (behaviors.length === 0) return null;

    // 基于玩家习惯生成预测
    const mostLikely = behaviors[0];
    return {
      predictedAction: mostLikely,
      confidence: this.config.phaseFeatures[this.currentPhase].predictionAccuracy,
      message: `预测：玩家下一回合可能会${this._getBehaviorDescription(mostLikely)}`
    };
  }

  _getBehaviorDescription(behavior) {
    const descriptions = {
      [PlayerBehavior.LIKES_ALL_IN]: 'ALL IN',
      [PlayerBehavior.LIKES_SKIP]: '空过',
      [PlayerBehavior.LIKES_HIGH_SPEED]: '使用高速牌',
      [PlayerBehavior.LIKES_LOW_SPEED]: '使用低速反制',
      [PlayerBehavior.LIKES_HIGH_ROLL]: '使用高Roll牌',
      [PlayerBehavior.LIKES_FINISHER]: '使用终结技'
    };
    return descriptions[behavior] || '未知行为';
  }

  recordPlayerAction(action) {
    this.playerBehavior.actions.push({
      turn: this.turnCount,
      action: action
    });

    // 更新偏好统计
    if (action.allIn) this.playerBehavior.preferences.allIn++;
    if (action.skipped) this.playerBehavior.preferences.skip++;
    if (action.highSpeed) this.playerBehavior.preferences.highSpeed++;
    if (action.lowSpeed) this.playerBehavior.preferences.lowSpeed++;
    if (action.highRoll) this.playerBehavior.preferences.highRoll++;
    if (action.finisher) this.playerBehavior.preferences.finisher++;

    // 只保留最近10个回合
    if (this.playerBehavior.actions.length > 10) {
      this.playerBehavior.actions.shift();
    }
  }

  _analyzeBehavior() {
    const prefs = this.playerBehavior.preferences;
    const total = Object.values(prefs).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const behaviors = [];
    const threshold = total * 0.2;

    if (prefs.allIn > threshold) behaviors.push(PlayerBehavior.LIKES_ALL_IN);
    if (prefs.skip > threshold) behaviors.push(PlayerBehavior.LIKES_SKIP);
    if (prefs.highSpeed > threshold) behaviors.push(PlayerBehavior.LIKES_HIGH_SPEED);
    if (prefs.lowSpeed > threshold) behaviors.push(PlayerBehavior.LIKES_LOW_SPEED);
    if (prefs.highRoll > threshold) behaviors.push(PlayerBehavior.LIKES_HIGH_ROLL);
    if (prefs.finisher > threshold) behaviors.push(PlayerBehavior.LIKES_FINISHER);

    return behaviors;
  }

  checkPredictionCorrect(predicted, actual) {
    const isCorrect = this._matchBehavior(predicted, actual);
    if (isCorrect) {
      const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
      const gain = 10 * phaseFeatures.fateGainMultiplier;
      this.fate = Math.min(this.maxFate, this.fate + gain);

      // 检查是否触发命运锁定
      if (this.fate >= this.maxFate && this.currentPhase === FatePhase.PHASE_3) {
        this.fateLockActive = true;
        return { correct: true, fateGained: gain, fateLockTriggered: true };
      }

      return { correct: true, fateGained: gain };
    }
    return { correct: false };
  }

  _matchBehavior(predicted, actual) {
    switch (predicted) {
      case PlayerBehavior.LIKES_ALL_IN:
        return actual.allIn;
      case PlayerBehavior.LIKES_SKIP:
        return actual.skipped;
      case PlayerBehavior.LIKES_HIGH_SPEED:
        return actual.highSpeed;
      case PlayerBehavior.LIKES_LOW_SPEED:
        return actual.lowSpeed;
      case PlayerBehavior.LIKES_HIGH_ROLL:
        return actual.highRoll;
      case PlayerBehavior.LIKES_FINISHER:
        return actual.finisher;
      default:
        return false;
    }
  }

  useRewriteFate() {
    if (this.skillCooldown > 0) {
      return { success: false, reason: '技能冷却中' };
    }

    const skill = this.config.skill;
    this.skillCooldown = skill.cooldown;

    // 随机选择规则修改
    const ruleChanges = [
      { name: 'high_roll_half_damage', description: '高Roll伤害减半' },
      { name: 'low_speed_priority', description: '低速优先行动' },
      { name: 'no_consecutive', description: '禁止连续行动' },
      { name: 'skip_penalty', description: '空过受到惩罚' },
      { name: 'high_speed_invalid', description: '高速牌失效' },
      { name: 'roll_swap', description: '双方Roll互换' }
    ];

    const selectedRule = ruleChanges[Math.floor(Math.random() * ruleChanges.length)];

    return {
      success: true,
      skill: skill,
      ruleChange: selectedRule,
      duration: skill.effects.duration
    };
  }

  canUseSkill() {
    return this.skillCooldown === 0;
  }

  selectCard(hand, battleState) {
    const phaseCards = LORD_OF_FATE_CARDS.filter(card => card.phase === this.currentPhase);
    const behaviors = this._analyzeBehavior();

    // 针对玩家习惯选择卡牌
    if (behaviors.length > 0 && phaseCards.length > 0) {
      const counterCards = phaseCards.filter(card => {
        // 针对ALL IN玩家：选择概率崩塌
        if (behaviors.includes(PlayerBehavior.LIKES_ALL_IN) && 
            card.effects.some(e => e.type === 'REDUCE_HIGH_ROLL_CHANCE')) {
          return true;
        }
        // 针对喜欢空过的玩家：选择命运锁链
        if (behaviors.includes(PlayerBehavior.LIKES_SKIP) && 
            card.effects.some(e => e.type === 'BLOCK_PATTERN')) {
          return true;
        }
        return false;
      });

      if (counterCards.length > 0) {
        const selected = counterCards[Math.floor(Math.random() * counterCards.length)];
        this._gainFate(selected.fateGain);
        return selected;
      }
    }

    if (phaseCards.length > 0) {
      const selected = phaseCards[Math.floor(Math.random() * phaseCards.length)];
      this._gainFate(selected.fateGain);
      return selected;
    }

    return hand[0] || null;
  }

  _gainFate(amount) {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
    const actualAmount = Math.floor(amount * phaseFeatures.fateGainMultiplier);
    this.fate = Math.min(this.maxFate, this.fate + actualAmount);
  }

  getStatus() {
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
    return {
      ...this.entity,
      currentPhase: this.currentPhase,
      fate: this.fate,
      maxFate: this.maxFate,
      skillCooldown: this.skillCooldown,
      canUseSkill: this.canUseSkill(),
      fateLockActive: this.fateLockActive,
      learnedBehaviors: this._analyzeBehavior(),
      predictionAccuracy: phaseFeatures.predictionAccuracy,
      phaseFeatures: phaseFeatures
    };
  }

  takeDamage(damage) {
    if (this.entity.currentShield > 0) {
      const shieldDamage = Math.min(this.entity.currentShield, damage);
      this.entity.currentShield -= shieldDamage;
      damage -= shieldDamage;
    }
    this.entity.currentHp = Math.max(0, this.entity.currentHp - damage);
    return {
      damageTaken: damage,
      currentHp: this.entity.currentHp,
      currentShield: this.entity.currentShield
    };
  }
}

// ==================== 命运之主生成器 ====================

class LordOfFateGenerator {
  static generate(options = {}) {
    const level = options.level || 1;
    const hpMultiplier = 1 + (level - 1) * 0.3;

    const config = {
      ...LORD_OF_FATE_CONFIG,
      stats: {
        maxHp: Math.floor(LORD_OF_FATE_CONFIG.stats.maxHp * hpMultiplier),
        baseShield: LORD_OF_FATE_CONFIG.stats.baseShield
      }
    };

    return new LordOfFateBoss(config);
  }
}

// ==================== 导出 ====================

module.exports = {
  FatePhase,
  PlayerBehavior,
  FateModification,
  LORD_OF_FATE_CARDS,
  LORD_OF_FATE_CONFIG,
  LordOfFateBoss,
  LordOfFateGenerator
};
