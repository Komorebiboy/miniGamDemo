/**
 * Boss 1：恶魔庄家（The Devil Dealer）
 * 
 * 核心机制：
 * 1. 债务赌局 - 玩家获得强化但积累债务
 * 2. 三阶段系统 - 普通赌局 → 作弊时刻 → 地狱豪赌
 * 3. 恶魔契约 - 巨大强化但债务暴涨
 * 4. 12张专属卡牌
 */

const { AIType } = require('./EnemyAI');
const { EnemyFaction, DangerLevel } = require('./EnemyPhase1');

// ==================== Boss阶段定义 ====================

const BossPhase = {
  PHASE_1: 'PHASE_1',  // 普通赌局
  PHASE_2: 'PHASE_2',  // 作弊时刻
  PHASE_3: 'PHASE_3'   // 地狱豪赌
};

// ==================== 债务类型 ====================

const DebtType = {
  ROLL_BOOST: 'ROLL_BOOST',           // Roll加成
  SPEED_BOOST: 'SPEED_BOOST',         // 速度加成
  CRIT_BOOST: 'CRIT_BOOST',           // 暴击加成
  HIGH_ROLL_CHANCE: 'HIGH_ROLL_CHANCE', // 高Roll概率
  DAMAGE_BOOST: 'DAMAGE_BOOST',       // 伤害加成
  SHIELD_BOOST: 'SHIELD_BOOST'        // 护盾加成
};

// ==================== 债务代价 ====================

const DEBT_COSTS = {
  LOW: {      // 债务 1-10
    hpLoss: 5,
    curseCards: 0,
    deleteCards: 0,
    nextBattleHpPenalty: 0
  },
  MEDIUM: {   // 债务 11-25
    hpLoss: 10,
    curseCards: 1,
    deleteCards: 0,
    nextBattleHpPenalty: 5
  },
  HIGH: {     // 债务 26-50
    hpLoss: 15,
    curseCards: 2,
    deleteCards: 1,
    nextBattleHpPenalty: 10
  },
  EXTREME: {  // 债务 50+
    hpLoss: 25,
    curseCards: 3,
    deleteCards: 2,
    nextBattleHpPenalty: 20
  }
};

// ==================== Boss专属卡牌（12张） ====================

const DEVIL_DEALER_CARDS = [
  // ===== 阶段1卡牌 =====
  {
    id: 'hell_roulette',
    name: '地狱轮盘',
    description: '超高Roll，失败自伤5点',
    phase: BossPhase.PHASE_1,
    type: 'ATTACK',
    rarity: 'RARE',
    rollRange: { min: 15, max: 25 },
    speed: 4,
    effects: [
      {
        type: 'SELF_DAMAGE_ON_FAIL',
        condition: 'roll_below_10',
        value: 5
      }
    ],
    riskLevel: 'HIGH'
  },
  {
    id: 'usury_loan',
    name: '高利贷',
    description: '给玩家Roll+3，但债务+5',
    phase: BossPhase.PHASE_1,
    type: 'SPECIAL',
    rarity: 'UNCOMMON',
    rollRange: { min: 8, max: 12 },
    speed: 6,
    effects: [
      {
        type: 'GIVE_PLAYER_BOOST',
        boostType: DebtType.ROLL_BOOST,
        value: 3,
        debtValue: 5
      }
    ],
    riskLevel: 'MODERATE'
  },
  {
    id: 'loaded_dice',
    name: '出千骰子',
    description: '显示假Roll范围（显示5-15，实际10-20）',
    phase: BossPhase.PHASE_1,
    type: 'DECEPTION',
    rarity: 'UNCOMMON',
    rollRange: { min: 10, max: 20 },
    displayRange: { min: 5, max: 15 },
    speed: 5,
    effects: [
      {
        type: 'FAKE_DISPLAY',
        fakeRange: { min: 5, max: 15 }
      }
    ],
    riskLevel: 'MODERATE'
  },
  {
    id: 'debt_trap',
    name: '债务陷阱',
    description: '玩家获得速度+2，债务+3',
    phase: BossPhase.PHASE_1,
    type: 'SPECIAL',
    rarity: 'COMMON',
    rollRange: { min: 6, max: 10 },
    speed: 7,
    effects: [
      {
        type: 'GIVE_PLAYER_BOOST',
        boostType: DebtType.SPEED_BOOST,
        value: 2,
        debtValue: 3
      }
    ],
    riskLevel: 'SAFE'
  },

  // ===== 阶段2卡牌 =====
  {
    id: 'cheating_hand',
    name: '作弊之手',
    description: '偷偷增加Roll结果+5（玩家看不到）',
    phase: BossPhase.PHASE_2,
    type: 'CHEAT',
    rarity: 'RARE',
    rollRange: { min: 8, max: 14 },
    speed: 5,
    effects: [
      {
        type: 'HIDDEN_ROLL_BONUS',
        value: 5
      }
    ],
    riskLevel: 'HIGH'
  },
  {
    id: 'multiplier_manipulation',
    name: '倍率操控',
    description: '修改倍率，本回合伤害×1.5',
    phase: BossPhase.PHASE_2,
    type: 'SPECIAL',
    rarity: 'UNCOMMON',
    rollRange: { min: 7, max: 13 },
    speed: 6,
    effects: [
      {
        type: 'DAMAGE_MULTIPLIER',
        value: 1.5
      }
    ],
    riskLevel: 'MODERATE'
  },
  {
    id: 'fake_weakness',
    name: '伪装弱势',
    description: '显示低Roll牌，实际高Roll',
    phase: BossPhase.PHASE_2,
    type: 'DECEPTION',
    rarity: 'RARE',
    rollRange: { min: 12, max: 18 },
    displayRange: { min: 3, max: 8 },
    speed: 4,
    effects: [
      {
        type: 'FAKE_DISPLAY',
        fakeRange: { min: 3, max: 8 }
      }
    ],
    riskLevel: 'HIGH'
  },
  {
    id: 'debt_collection',
    name: '债务催收',
    description: '根据玩家当前债务造成额外伤害',
    phase: BossPhase.PHASE_2,
    type: 'ATTACK',
    rarity: 'UNCOMMON',
    rollRange: { min: 6, max: 12 },
    speed: 5,
    effects: [
      {
        type: 'DAMAGE_PER_DEBT',
        multiplier: 0.5
      }
    ],
    riskLevel: 'MODERATE'
  },

  // ===== 阶段3卡牌 =====
  {
    id: 'all_in_bet',
    name: 'ALL IN',
    description: 'Roll翻倍，伤害翻倍，但失败自伤10',
    phase: BossPhase.PHASE_3,
    type: 'ALL_IN',
    rarity: 'LEGENDARY',
    rollRange: { min: 10, max: 20 },
    speed: 3,
    effects: [
      {
        type: 'DOUBLE_ROLL',
        doubleDamage: true,
        selfDamageOnFail: 10
      }
    ],
    riskLevel: 'EXTREME'
  },
  {
    id: 'hellfire_gamble',
    name: '地狱之火',
    description: '超高Roll，暴击率+50%',
    phase: BossPhase.PHASE_3,
    type: 'ATTACK',
    rarity: 'LEGENDARY',
    rollRange: { min: 18, max: 30 },
    speed: 2,
    effects: [
      {
        type: 'CRIT_CHANCE_BOOST',
        value: 0.5
      }
    ],
    riskLevel: 'EXTREME'
  },
  {
    id: 'soul_contract',
    name: '灵魂契约',
    description: '玩家获得Roll+8，但债务+10',
    phase: BossPhase.PHASE_3,
    type: 'SPECIAL',
    rarity: 'LEGENDARY',
    rollRange: { min: 5, max: 15 },
    speed: 6,
    effects: [
      {
        type: 'GIVE_PLAYER_BOOST',
        boostType: DebtType.ROLL_BOOST,
        value: 8,
        debtValue: 10
      }
    ],
    riskLevel: 'EXTREME'
  },
  {
    id: 'final_gamble',
    name: '最终豪赌',
    description: '超大Roll终结牌，Roll范围20-40',
    phase: BossPhase.PHASE_3,
    type: 'FINISHER',
    rarity: 'LEGENDARY',
    rollRange: { min: 20, max: 40 },
    speed: 1,
    effects: [
      {
        type: 'FINISHER_DAMAGE',
        ignoreShield: true
      }
    ],
    riskLevel: 'EXTREME'
  }
];

// ==================== Boss配置 ====================

const DEVIL_DEALER_CONFIG = {
  id: 'devil_dealer',
  name: '恶魔庄家',
  title: '赌局的掌控者',
  faction: EnemyFaction.GAMBLER_GANG,
  aiType: AIType.AGGRESSIVE,  // 主要AI类型
  secondaryAiType: AIType.DECEPTIVE,  // 次要AI类型
  dangerLevel: DangerLevel.BOSS,
  isBoss: true,
  
  stats: {
    maxHp: 150,
    baseShield: 20
  },
  
  // 阶段血量阈值
  phaseThresholds: {
    [BossPhase.PHASE_1]: 1.0,   // 100% - 70%
    [BossPhase.PHASE_2]: 0.7,   // 70% - 40%
    [BossPhase.PHASE_3]: 0.4    // 40% - 0%
  },
  
  // 恶魔契约技能
  skill: {
    id: 'demon_contract',
    name: '恶魔契约',
    description: '玩家立即获得巨大强化，但债务值暴涨',
    cooldown: 3,
    maxCooldown: 3,
    effects: {
      playerBoost: {
        rollBonus: 10,
        critChanceBonus: 0.3,
        duration: 2
      },
      debtIncrease: 15
    }
  },
  
  // 债务系统配置
  debtSystem: {
    // 每回合给玩家的随机强化
    turnStartBoosts: [
      { type: DebtType.ROLL_BOOST, value: 3, debt: 2, weight: 30 },
      { type: DebtType.SPEED_BOOST, value: 2, debt: 2, weight: 25 },
      { type: DebtType.CRIT_BOOST, value: 0.1, debt: 3, weight: 20 },
      { type: DebtType.HIGH_ROLL_CHANCE, value: 0.15, debt: 4, weight: 15 },
      { type: DebtType.DAMAGE_BOOST, value: 0.2, debt: 5, weight: 10 }
    ],
    // 债务代价
    debtCosts: DEBT_COSTS
  },
  
  // 阶段特性
  phaseFeatures: {
    [BossPhase.PHASE_1]: {
      name: '普通赌局',
      description: '正常的赌博，偶尔提高倍率',
      cheatChance: 0.1,
      debtMultiplier: 1.0,
      aiAggressiveness: 0.6
    },
    [BossPhase.PHASE_2]: {
      name: '作弊时刻',
      description: 'Boss开始出千，隐藏真实Roll',
      cheatChance: 0.4,
      debtMultiplier: 1.5,
      aiAggressiveness: 0.8,
      hiddenRollBonus: 5
    },
    [BossPhase.PHASE_3]: {
      name: '地狱豪赌',
      description: 'ALL IN状态，所有Roll和伤害翻倍',
      cheatChance: 0.2,
      debtMultiplier: 2.0,
      aiAggressiveness: 1.0,
      rollMultiplier: 2.0,
      damageMultiplier: 2.0
    }
  },
  
  description: '这个赌局的庄家，每一回合都在提高赌注。他给予的强化越多，你欠下的债务就越重。',
  flavor: '「欢迎来到我的赌桌，这里的规则由我制定。想要力量吗？签下这份契约吧。』',
  
  visual: {
    icon: '🎲',
    borderColor: '#8B0000',
    glowColor: '#FF4500',
    phaseTransitionEffects: {
      [BossPhase.PHASE_2]: {
        animation: 'table_burn',
        screenShake: true,
        colorShift: 'red'
      },
      [BossPhase.PHASE_3]: {
        animation: 'hellfire_inferno',
        screenShake: true,
        colorShift: 'dark_red',
        jackpotEffect: true
      }
    }
  }
};

// ==================== 恶魔庄家Boss类 ====================

class DevilDealerBoss {
  constructor(config = DEVIL_DEALER_CONFIG) {
    this.config = config;
    this.currentPhase = BossPhase.PHASE_1;
    this.playerDebt = 0;
    this.activeBoosts = [];
    this.skillCooldown = 0;
    this.turnCount = 0;
    this.cheatMode = false;
    this.hiddenRollBonus = 0;
    
    // 初始化Boss实体
    this.entity = {
      ...config,
      currentHp: config.stats.maxHp,
      maxHp: config.stats.maxHp,
      currentShield: config.stats.baseShield,
      instanceId: `boss_devil_dealer_${Date.now()}`
    };
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase() {
    const hpPercent = this.entity.currentHp / this.entity.maxHp;
    
    if (hpPercent <= this.config.phaseThresholds[BossPhase.PHASE_3]) {
      return BossPhase.PHASE_3;
    } else if (hpPercent <= this.config.phaseThresholds[BossPhase.PHASE_2]) {
      return BossPhase.PHASE_2;
    }
    return BossPhase.PHASE_1;
  }

  /**
   * 检查阶段切换
   */
  checkPhaseTransition() {
    const newPhase = this.getCurrentPhase();
    
    if (newPhase !== this.currentPhase) {
      const oldPhase = this.currentPhase;
      this.currentPhase = newPhase;
      
      console.log(`[DevilDealer] 阶段切换: ${oldPhase} -> ${newPhase}`);
      
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
    
    // 给玩家随机强化（并增加债务）
    const boostResult = this._grantRandomBoost();
    
    // 根据阶段设置作弊模式
    const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
    this.cheatMode = Math.random() < phaseFeatures.cheatChance;
    this.hiddenRollBonus = phaseFeatures.hiddenRollBonus || 0;
    
    return {
      phaseTransition: phaseResult,
      boost: boostResult,
      currentPhase: this.currentPhase,
      phaseFeatures
    };
  }

  /**
   * 给予玩家随机强化
   */
  _grantRandomBoost() {
    const boosts = this.config.debtSystem.turnStartBoosts;
    const totalWeight = boosts.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const boost of boosts) {
      random -= boost.weight;
      if (random <= 0) {
        // 应用阶段债务倍率
        const phaseFeatures = this.config.phaseFeatures[this.currentPhase];
        const actualDebt = Math.floor(boost.debt * phaseFeatures.debtMultiplier);
        
        this.playerDebt += actualDebt;
        
        const boostEffect = {
          type: boost.type,
          value: boost.value,
          debt: actualDebt,
          duration: 1
        };
        
        this.activeBoosts.push(boostEffect);
        
        return boostEffect;
      }
    }
    
    return null;
  }

  /**
   * 使用恶魔契约技能
   */
  useDemonContract() {
    if (this.skillCooldown > 0) {
      return { success: false, reason: '技能冷却中' };
    }
    
    const skill = this.config.skill;
    this.skillCooldown = skill.cooldown;
    
    // 增加债务
    this.playerDebt += skill.effects.debtIncrease;
    
    return {
      success: true,
      skill: skill,
      playerBoost: skill.effects.playerBoost,
      debtIncrease: skill.effects.debtIncrease,
      totalDebt: this.playerDebt
    };
  }

  /**
   * 检查是否可以使用技能
   */
  canUseSkill() {
    return this.skillCooldown === 0;
  }

  /**
   * 选择卡牌（根据当前阶段）
   */
  selectCard(hand, battleState) {
    const phaseCards = DEVIL_DEALER_CARDS.filter(card => card.phase === this.currentPhase);
    
    // 根据AI类型选择
    const aiAggressiveness = this.config.phaseFeatures[this.currentPhase].aiAggressiveness;
    
    // 优先选择高风险牌
    if (Math.random() < aiAggressiveness && phaseCards.length > 0) {
      const riskyCards = phaseCards.filter(card => 
        card.riskLevel === 'HIGH' || card.riskLevel === 'EXTREME'
      );
      if (riskyCards.length > 0) {
        return riskyCards[Math.floor(Math.random() * riskyCards.length)];
      }
    }
    
    // 随机选择
    if (phaseCards.length > 0) {
      return phaseCards[Math.floor(Math.random() * phaseCards.length)];
    }
    
    return hand[0] || null;
  }

  /**
   * 获取作弊Roll（隐藏加成）
   */
  getCheatRoll(baseRoll) {
    if (this.cheatMode && this.hiddenRollBonus > 0) {
      return baseRoll + this.hiddenRollBonus;
    }
    return baseRoll;
  }

  /**
   * 计算债务代价
   */
  calculateDebtCost() {
    let costLevel = 'LOW';
    
    if (this.playerDebt >= 50) {
      costLevel = 'EXTREME';
    } else if (this.playerDebt >= 26) {
      costLevel = 'HIGH';
    } else if (this.playerDebt >= 11) {
      costLevel = 'MEDIUM';
    }
    
    return {
      debtLevel: costLevel,
      debtAmount: this.playerDebt,
      costs: DEBT_COSTS[costLevel]
    };
  }

  /**
   * 获取Boss状态
   */
  getStatus() {
    return {
      ...this.entity,
      currentPhase: this.currentPhase,
      playerDebt: this.playerDebt,
      skillCooldown: this.skillCooldown,
      canUseSkill: this.canUseSkill(),
      phaseFeatures: this.config.phaseFeatures[this.currentPhase],
      cheatMode: this.cheatMode
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

// ==================== 恶魔庄家生成器 ====================

class DevilDealerGenerator {
  static generate(options = {}) {
    const level = options.level || 1;
    const hpMultiplier = 1 + (level - 1) * 0.3;
    
    const config = {
      ...DEVIL_DEALER_CONFIG,
      stats: {
        maxHp: Math.floor(DEVIL_DEALER_CONFIG.stats.maxHp * hpMultiplier),
        baseShield: DEVIL_DEALER_CONFIG.stats.baseShield
      }
    };
    
    return new DevilDealerBoss(config);
  }
}

// ==================== 导出 ====================

module.exports = {
  BossPhase,
  DebtType,
  DEBT_COSTS,
  DEVIL_DEALER_CARDS,
  DEVIL_DEALER_CONFIG,
  DevilDealerBoss,
  DevilDealerGenerator
};
