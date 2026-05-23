/**
 * Boss 2：舞台主宰（Master of Stage）
 *
 * 核心机制：
 * 1. 真假舞台 - Boss显示的信息部分为假
 * 2. 三阶段系统 - 舞台戏法 → 镜像剧场 → 最终演出
 * 3. 偷天换日技能 - 本回合所有信息错误
 * 4. Boss学习机制 - 针对玩家习惯
 * 5. 舞台聚光灯 - 周期性强化某种行为
 * 6. 12张专属卡牌
 */

const { AIType } = require('./EnemyAI');
const { EnemyFaction, DangerLevel } = require('./EnemyPhase1');

// ==================== Boss阶段定义 ====================

const StagePhase = {
  PHASE_1: 'PHASE_1',  // 舞台戏法
  PHASE_2: 'PHASE_2',  // 镜像剧场
  PHASE_3: 'PHASE_3'   // 最终演出
};

// ==================== 可伪装的信息类型 ====================

const FakeInfoType = {
  ROLL_RANGE: 'ROLL_RANGE',       // Roll范围
  SPEED: 'SPEED',                 // 速度
  CARD_TYPE: 'CARD_TYPE',         // 卡牌类型
  RARITY: 'RARITY',               // 稀有度
  WILL_PLAY: 'WILL_PLAY',         // 是否会出牌
  CARD_EFFECT: 'CARD_EFFECT',     // 卡牌效果
  HP: 'HP',                       // 生命值
  SHIELD: 'SHIELD'                // 护盾值
};

// ==================== 玩家行为类型 ====================

const PlayerBehaviorType = {
  LIKES_SKIP: 'LIKES_SKIP',           // 喜欢空过
  LIKES_HIGH_ROLL: 'LIKES_HIGH_ROLL', // 喜欢高Roll牌
  LIKES_SPEED: 'LIKES_SPEED',         // 喜欢高速牌
  LIKES_ALL_IN: 'LIKES_ALL_IN',       // 喜欢ALL IN
  LIKES_DEFENSE: 'LIKES_DEFENSE',     // 偏向防御
  PREDICTABLE: 'PREDICTABLE'          // 行为可预测
};

// ==================== Boss专属卡牌（12张） ====================

const STAGE_MASTER_CARDS = [
  // ===== 阶段1卡牌 =====
  {
    id: 'mirror_lie',
    name: '镜像谎言',
    description: '显示假Roll范围（显示低实际高）',
    phase: StagePhase.PHASE_1,
    type: 'ILLUSION',
    rarity: 'UNCOMMON',
    rollRange: { min: 12, max: 18 },
    displayRange: { min: 5, max: 9 },
    speed: 5,
    effects: [
      {
        type: 'FAKE_DISPLAY',
        fakeRange: { min: 5, max: 9 }
      }
    ],
    deceptionLevel: 1
  },
  {
    id: 'false_curtain',
    name: '虚假谢幕',
    description: '假装空过，实际出牌',
    phase: StagePhase.PHASE_1,
    type: 'DECEPTION',
    rarity: 'RARE',
    rollRange: { min: 8, max: 14 },
    speed: 6,
    effects: [
      {
        type: 'FAKE_SKIP',
        actualPlay: true
      }
    ],
    deceptionLevel: 2
  },
  {
    id: 'illusion_assault',
    name: '幻觉突袭',
    description: '显示低速，实际高速',
    phase: StagePhase.PHASE_1,
    type: 'SURPRISE',
    rarity: 'UNCOMMON',
    rollRange: { min: 10, max: 16 },
    speed: 9,
    displaySpeed: 4,
    effects: [
      {
        type: 'FAKE_SPEED',
        fakeSpeed: 4
      }
    ],
    deceptionLevel: 1
  },
  {
    id: 'misdirection',
    name: '错误引导',
    description: '显示攻击牌，实际是防御牌',
    phase: StagePhase.PHASE_1,
    type: 'MISDIRECTION',
    rarity: 'COMMON',
    rollRange: { min: 6, max: 10 },
    speed: 5,
    displayType: 'ATTACK',
    actualType: 'DEFENSE',
    effects: [
      {
        type: 'FAKE_TYPE',
        fakeType: 'ATTACK'
      }
    ],
    deceptionLevel: 1
  },

  // ===== 阶段2卡牌 =====
  {
    id: 'deep_illusion',
    name: '深度幻觉',
    description: 'Roll、速度、类型全部错误显示',
    phase: StagePhase.PHASE_2,
    type: 'DEEP_FAKE',
    rarity: 'RARE',
    rollRange: { min: 15, max: 22 },
    displayRange: { min: 3, max: 7 },
    speed: 8,
    displaySpeed: 3,
    effects: [
      {
        type: 'FULL_FAKE',
        fakeRange: { min: 3, max: 7 },
        fakeSpeed: 3,
        fakeType: 'DEFENSE'
      }
    ],
    deceptionLevel: 3
  },
  {
    id: 'phantom_clone',
    name: '幻影分身',
    description: '显示两张牌，实际出第三张',
    phase: StagePhase.PHASE_2,
    type: 'CLONE',
    rarity: 'RARE',
    rollRange: { min: 11, max: 17 },
    speed: 6,
    effects: [
      {
        type: 'PHANTOM_DISPLAY',
        displayCount: 2,
        actualHidden: true
      }
    ],
    deceptionLevel: 3
  },
  {
    id: 'mind_read_trap',
    name: '读心陷阱',
    description: '根据玩家习惯选择反制牌',
    phase: StagePhase.PHASE_2,
    type: 'ADAPTIVE',
    rarity: 'UNCOMMON',
    rollRange: { min: 9, max: 15 },
    speed: 7,
    effects: [
      {
        type: 'COUNTER_PLAYER',
        adaptToBehavior: true
      }
    ],
    deceptionLevel: 2
  },
  {
    id: 'stage_swap',
    name: '舞台交换',
    description: '与玩家交换Roll范围（仅显示）',
    phase: StagePhase.PHASE_2,
    type: 'SWAP',
    rarity: 'RARE',
    rollRange: { min: 7, max: 13 },
    speed: 5,
    effects: [
      {
        type: 'FAKE_ROLL_SWAP',
        displayPlayerRange: true
      }
    ],
    deceptionLevel: 2
  },

  // ===== 阶段3卡牌 =====
  {
    id: 'reality_break',
    name: '现实崩坏',
    description: '完全隐藏真实信息',
    phase: StagePhase.PHASE_3,
    type: 'REALITY_WARP',
    rarity: 'LEGENDARY',
    rollRange: { min: 18, max: 28 },
    speed: 4,
    effects: [
      {
        type: 'COMPLETE_HIDE',
        hideAll: true
      }
    ],
    deceptionLevel: 4
  },
  {
    id: 'grand_finale',
    name: '盛大终幕',
    description: '随机真假混合，无法判断',
    phase: StagePhase.PHASE_3,
    type: 'CHAOS',
    rarity: 'LEGENDARY',
    rollRange: { min: 14, max: 26 },
    speed: 6,
    effects: [
      {
        type: 'RANDOM_FAKE',
        fakeChance: 0.7
      }
    ],
    deceptionLevel: 4
  },
  {
    id: 'mirror_dimension',
    name: '镜像次元',
    description: '复制玩家本回合的牌',
    phase: StagePhase.PHASE_3,
    type: 'MIRROR',
    rarity: 'LEGENDARY',
    rollRange: { min: 10, max: 20 },
    speed: 5,
    effects: [
      {
        type: 'COPY_PLAYER_CARD',
        copyStats: true
      }
    ],
    deceptionLevel: 3
  },
  {
    id: 'final_magic',
    name: '最终魔术',
    description: '显示完全不同的Boss（假Boss）',
    phase: StagePhase.PHASE_3,
    type: 'ULTIMATE_FAKE',
    rarity: 'LEGENDARY',
    rollRange: { min: 20, max: 35 },
    speed: 3,
    effects: [
      {
        type: 'FAKE_BOSS',
        fakeHp: 50,
        fakeShield: 0
      }
    ],
    deceptionLevel: 5
  }
];

// ==================== 舞台聚光灯类型 ====================

const SpotlightType = {
  SPEED_BOOST: 'SPEED_BOOST',       // 高速牌强化
  DECEPTION_BOOST: 'DECEPTION_BOOST', // 欺骗牌强化
  ILLUSION_BOOST: 'ILLUSION_BOOST', // 幻觉牌强化
  COUNTER_BOOST: 'COUNTER_BOOST'    // 反制牌强化
};

// ==================== Boss配置 ====================

const STAGE_MASTER_CONFIG = {
  id: 'stage_master',
  name: '舞台主宰',
  title: '幻觉的编织者',
  faction: EnemyFaction.MAGIC_TROUPE,
  aiType: AIType.DECEPTIVE,  // 主要AI类型
  secondaryAiType: AIType.PRECOGNITIVE,  // 次要AI类型
  dangerLevel: DangerLevel.BOSS,
  isBoss: true,

  stats: {
    maxHp: 130,
    baseShield: 15
  },

  // 阶段血量阈值
  phaseThresholds: {
    [StagePhase.PHASE_1]: 1.0,   // 100% - 70%
    [StagePhase.PHASE_2]: 0.7,   // 70% - 40%
    [StagePhase.PHASE_3]: 0.4    // 40% - 0%
  },

  // 偷天换日技能
  skill: {
    id: 'grand_trick',
    name: '偷天换日',
    description: '本回合玩家看到的所有Boss信息全部错误，Boss查看玩家真实出牌',
    cooldown: 3,
    maxCooldown: 3,
    effects: {
      fullDeception: true,
      revealPlayerCard: true,
      duration: 1
    }
  },

  // 舞台聚光灯配置
  spotlight: {
    interval: 3,  // 每3回合触发
    types: [
      { type: SpotlightType.SPEED_BOOST, weight: 25, effect: { speedBonus: 3 } },
      { type: SpotlightType.DECEPTION_BOOST, weight: 25, effect: { deceptionLevelBonus: 1 } },
      { type: SpotlightType.ILLUSION_BOOST, weight: 25, effect: { illusionDuration: 2 } },
      { type: SpotlightType.COUNTER_BOOST, weight: 25, effect: { counterChance: 0.3 } }
    ]
  },

  // 阶段特性
  phaseFeatures: {
    [StagePhase.PHASE_1]: {
      name: '舞台戏法',
      description: '少量假信息，偶尔欺骗',
      fakeInfoChance: 0.3,
      fakeInfoCount: 1,
      learnPlayer: true,
      aiDeceptiveness: 0.5
    },
    [StagePhase.PHASE_2]: {
      name: '镜像剧场',
      description: '深度误导，显示假Roll、错误速度、假装空过',
      fakeInfoChance: 0.6,
      fakeInfoCount: 2,
      canFakeSkip: true,
      canFakeWeak: true,
      learnPlayer: true,
      aiDeceptiveness: 0.8
    },
    [StagePhase.PHASE_3]: {
      name: '最终演出',
      description: '幻觉暴走，大部分信息随机真假混合',
      fakeInfoChance: 0.8,
      fakeInfoCount: 3,
      randomFakeMix: true,
      completeHide: true,
      learnPlayer: true,
      aiDeceptiveness: 1.0
    }
  },

  description: '舞台上的每一幕都是精心编排的幻觉，而你，只是他戏法中的配角。',
  flavor: '「你看到的，只是我想让你看到的。现在，请欣赏这场盛大的演出吧。」',

  visual: {
    icon: '🎭',
    borderColor: '#9B59B6',
    glowColor: '#E74C3C',
    phaseTransitionEffects: {
      [StagePhase.PHASE_2]: {
        animation: 'mirror_shatter',
        screenShake: true,
        spotlightEffect: true,
        cardStorm: true
      },
      [StagePhase.PHASE_3]: {
        animation: 'reality_warp',
        screenMirror: true,
        uiGlitch: true,
        cardFlicker: true,
        jokerLaugh: true
      }
    }
  }
};

// ==================== 舞台主宰Boss类 ====================

class StageMasterBoss {
  constructor(config = STAGE_MASTER_CONFIG) {
    this.config = config;
    this.currentPhase = StagePhase.PHASE_1;
    this.skillCooldown = 0;
    this.turnCount = 0;
    this.spotlightActive = false;
    this.currentSpotlight = null;
    this.skillActive = false;

    // 玩家行为学习
    this.playerBehavior = {
      skipCount: 0,
      highRollCount: 0,
      speedCount: 0,
      allInCount: 0,
      defenseCount: 0,
      totalTurns: 0,
      patterns: []
    };

    // 当前回合的伪装信息
    this.currentFakeInfo = {};

    // 初始化Boss实体
    this.entity = {
      ...config,
      currentHp: config.stats.maxHp,
      maxHp: config.stats.maxHp,
      currentShield: config.stats.baseShield,
      instanceId: `boss_stage_master_${Date.now()}`
    };
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase() {
    const hpPercent = this.entity.currentHp / this.entity.maxHp;

    if (hpPercent <= this.config.phaseThresholds[StagePhase.PHASE_3]) {
      return StagePhase.PHASE_3;
    } else if (hpPercent <= this.config.phaseThresholds[StagePhase.PHASE_2]) {
      return StagePhase.PHASE_2;
    }
    return StagePhase.PHASE_1;
  }

  /**
   * 检查阶段切换
   */
  checkPhaseTransition() {
    const newPhase = this.getCurrentPhase();

    if (newPhase !== this.currentPhase) {
      const oldPhase = this.currentPhase;
      this.currentPhase = newPhase;

      console.log(`[StageMaster] 阶段切换: ${oldPhase} -> ${newPhase}`);

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

    // 检查舞台聚光灯
    const spotlightResult = this._checkSpotlight();

    // 生成伪装信息
    this._generateFakeInfo();

    // 重置技能状态
    this.skillActive = false;

    return {
      phaseTransition: phaseResult,
      spotlight: spotlightResult,
      currentPhase: this.currentPhase,
      phaseFeatures: this.config.phaseFeatures[this.currentPhase],
      fakeInfo: this.currentFakeInfo
    };
  }

  /**
   * 检查舞台聚光灯
   */
  _checkSpotlight() {
    if (this.turnCount % this.config.spotlight.interval === 0) {
      const spotlights = this.config.spotlight.types;
      const totalWeight = spotlights.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;

      for (const spotlight of spotlights) {
        random -= spotlight.weight;
        if (random <= 0) {
          this.spotlightActive = true;
          this.currentSpotlight = spotlight;

          return {
            active: true,
            type: spotlight.type,
            effect: spotlight.effect
          };
        }
      }
    }

    this.spotlightActive = false;
    this.currentSpotlight = null;
    return { active: false };
  }

  /**
   * 生成伪装信息
   */
  _generateFakeInfo() {
    this.currentFakeInfo = {};

    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];

    // 如果技能激活，全部信息都伪装
    if (this.skillActive) {
      this.currentFakeInfo = {
        [FakeInfoType.ROLL_RANGE]: true,
        [FakeInfoType.SPEED]: true,
        [FakeInfoType.CARD_TYPE]: true,
        [FakeInfoType.RARITY]: true,
        [FakeInfoType.HP]: true,
        [FakeInfoType.SHIELD]: true
      };
      return;
    }

    // 根据阶段概率生成伪装信息
    if (Math.random() < phaseFeatures.fakeInfoChance) {
      const fakeTypes = Object.values(FakeInfoType);
      const fakeCount = phaseFeatures.fakeInfoCount;

      for (let i = 0; i < fakeCount; i++) {
        const randomType = fakeTypes[Math.floor(Math.random() * fakeTypes.length)];
        this.currentFakeInfo[randomType] = true;
      }
    }
  }

  /**
   * 学习玩家行为
   */
  learnPlayerBehavior(playerAction) {
    this.playerBehavior.totalTurns++;

    if (playerAction.skipped) {
      this.playerBehavior.skipCount++;
    }
    if (playerAction.highRoll) {
      this.playerBehavior.highRollCount++;
    }
    if (playerAction.highSpeed) {
      this.playerBehavior.speedCount++;
    }
    if (playerAction.allIn) {
      this.playerBehavior.allInCount++;
    }
    if (playerAction.defense) {
      this.playerBehavior.defenseCount++;
    }

    // 记录模式
    this.playerBehavior.patterns.push({
      turn: this.turnCount,
      action: playerAction
    });

    // 只保留最近10个回合
    if (this.playerBehavior.patterns.length > 10) {
      this.playerBehavior.patterns.shift();
    }
  }

  /**
   * 分析玩家行为
   */
  analyzePlayerBehavior() {
    const total = this.playerBehavior.totalTurns;
    if (total === 0) return null;

    const behaviors = [];

    if (this.playerBehavior.skipCount / total > 0.3) {
      behaviors.push(PlayerBehaviorType.LIKES_SKIP);
    }
    if (this.playerBehavior.highRollCount / total > 0.4) {
      behaviors.push(PlayerBehaviorType.LIKES_HIGH_ROLL);
    }
    if (this.playerBehavior.speedCount / total > 0.4) {
      behaviors.push(PlayerBehaviorType.LIKES_SPEED);
    }
    if (this.playerBehavior.allInCount / total > 0.3) {
      behaviors.push(PlayerBehaviorType.LIKES_ALL_IN);
    }
    if (this.playerBehavior.defenseCount / total > 0.4) {
      behaviors.push(PlayerBehaviorType.LIKES_DEFENSE);
    }

    // 检查是否可预测
    if (this.playerBehavior.patterns.length >= 3) {
      const recent = this.playerBehavior.patterns.slice(-3);
      const similar = recent.every(p =>
        p.action.highRoll === recent[0].action.highRoll
      );
      if (similar) {
        behaviors.push(PlayerBehaviorType.PREDICTABLE);
      }
    }

    return behaviors;
  }

  /**
   * 使用偷天换日技能
   */
  useGrandTrick() {
    if (this.skillCooldown > 0) {
      return { success: false, reason: '技能冷却中' };
    }

    const skill = this.config.skill;
    this.skillCooldown = skill.cooldown;
    this.skillActive = true;

    // 重新生成全部伪装信息
    this._generateFakeInfo();

    return {
      success: true,
      skill: skill,
      fullDeception: true,
      revealPlayerCard: skill.effects.revealPlayerCard
    };
  }

  /**
   * 检查是否可以使用技能
   */
  canUseSkill() {
    return this.skillCooldown === 0;
  }

  /**
   * 选择卡牌（根据当前阶段和玩家行为）
   */
  selectCard(hand, battleState) {
    const phaseCards = STAGE_MASTER_CARDS.filter(card => card.phase === this.currentPhase);

    // 分析玩家行为
    const playerBehaviors = this.analyzePlayerBehavior();

    // 根据玩家行为选择反制策略
    if (playerBehaviors && playerBehaviors.length > 0) {
      // 针对ALL IN玩家：伪装弱牌
      if (playerBehaviors.includes(PlayerBehaviorType.LIKES_ALL_IN)) {
        const weakCards = phaseCards.filter(card =>
          card.deceptionLevel >= 2 && card.effects.some(e => e.type === 'FAKE_DISPLAY')
        );
        if (weakCards.length > 0) {
          return weakCards[Math.floor(Math.random() * weakCards.length)];
        }
      }

      // 针对保守玩家：突然高速压制
      if (playerBehaviors.includes(PlayerBehaviorType.LIKES_DEFENSE)) {
        const fastCards = phaseCards.filter(card => card.speed >= 7);
        if (fastCards.length > 0) {
          return fastCards[Math.floor(Math.random() * fastCards.length)];
        }
      }

      // 针对喜欢空过的玩家：假装空过实际出牌
      if (playerBehaviors.includes(PlayerBehaviorType.LIKES_SKIP)) {
        const fakeSkipCards = phaseCards.filter(card =>
          card.effects.some(e => e.type === 'FAKE_SKIP')
        );
        if (fakeSkipCards.length > 0) {
          return fakeSkipCards[Math.floor(Math.random() * fakeSkipCards.length)];
        }
      }
    }

    // 根据AI欺骗度选择
    const aiDeceptiveness = this.config.phaseFeatures[this.currentPhase].aiDeceptiveness;

    if (Math.random() < aiDeceptiveness && phaseCards.length > 0) {
      const deceptionCards = phaseCards.filter(card => card.deceptionLevel >= 2);
      if (deceptionCards.length > 0) {
        return deceptionCards[Math.floor(Math.random() * deceptionCards.length)];
      }
    }

    // 随机选择
    if (phaseCards.length > 0) {
      return phaseCards[Math.floor(Math.random() * phaseCards.length)];
    }

    return hand[0] || null;
  }

  /**
   * 获取显示给玩家的信息（可能包含伪装）
   */
  getDisplayInfo(realInfo) {
    const displayInfo = { ...realInfo };

    // 应用伪装
    if (this.currentFakeInfo[FakeInfoType.ROLL_RANGE]) {
      displayInfo.rollRange = { min: 3, max: 8 };  // 显示低Roll
    }
    if (this.currentFakeInfo[FakeInfoType.SPEED]) {
      displayInfo.speed = Math.max(2, realInfo.speed - 4);  // 显示低速度
    }
    if (this.currentFakeInfo[FakeInfoType.CARD_TYPE]) {
      displayInfo.type = realInfo.type === 'ATTACK' ? 'DEFENSE' : 'ATTACK';  // 反转类型
    }
    if (this.currentFakeInfo[FakeInfoType.HP]) {
      displayInfo.currentHp = Math.floor(realInfo.currentHp * 0.7);  // 显示更少血量
    }

    return displayInfo;
  }

  /**
   * 获取Boss状态
   */
  getStatus() {
    return {
      ...this.entity,
      currentPhase: this.currentPhase,
      skillCooldown: this.skillCooldown,
      canUseSkill: this.canUseSkill(),
      spotlightActive: this.spotlightActive,
      currentSpotlight: this.currentSpotlight,
      phaseFeatures: this.config.phaseFeatures[this.currentPhase],
      fakeInfo: this.currentFakeInfo,
      learnedBehaviors: this.analyzePlayerBehavior()
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

// ==================== 舞台主宰生成器 ====================

class StageMasterGenerator {
  static generate(options = {}) {
    const level = options.level || 1;
    const hpMultiplier = 1 + (level - 1) * 0.3;

    const config = {
      ...STAGE_MASTER_CONFIG,
      stats: {
        maxHp: Math.floor(STAGE_MASTER_CONFIG.stats.maxHp * hpMultiplier),
        baseShield: STAGE_MASTER_CONFIG.stats.baseShield
      }
    };

    return new StageMasterBoss(config);
  }
}

// ==================== 导出 ====================

module.exports = {
  StagePhase,
  FakeInfoType,
  PlayerBehaviorType,
  SpotlightType,
  STAGE_MASTER_CARDS,
  STAGE_MASTER_CONFIG,
  StageMasterBoss,
  StageMasterGenerator
};
