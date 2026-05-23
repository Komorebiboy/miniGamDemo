/**
 * 敌人AI系统
 * 
 * 核心功能：
 * 1. 6种基础AI类型
 * 2. 敌人行为决策
 * 3. 技能释放逻辑
 */

// ==================== AI类型定义 ====================

const AIType = {
  AGGRESSIVE: 'AGGRESSIVE',   // 激进型
  DEFENSIVE: 'DEFENSIVE',     // 保守型
  DECEPTIVE: 'DECEPTIVE',     // 欺诈型
  DOMINATING: 'DOMINATING',   // 压制型
  CHAOTIC: 'CHAOTIC',         // 混乱型
  PRECOGNITIVE: 'PRECOGNITIVE' // 预知型
};

// ==================== AI行为权重配置 ====================

const AI_BEHAVIOR_WEIGHTS = {
  [AIType.AGGRESSIVE]: {
    highRollPreference: 0.8,      // 偏好高Roll牌
    allInPreference: 0.7,         // 偏好ALL IN
    skipChance: 0.05,             // 很少空过
    riskTolerance: 0.9,           // 高风险容忍
    description: '激进型AI：喜欢高Roll牌，即使低概率也会赌'
  },
  
  [AIType.DEFENSIVE]: {
    highRollPreference: 0.3,      // 不偏好高Roll
    allInPreference: 0.1,         // 很少ALL IN
    skipChance: 0.3,              // 经常空过
    riskTolerance: 0.2,           // 低风险容忍
    description: '保守型AI：稳定为主，只在高胜率时出牌'
  },
  
  [AIType.DECEPTIVE]: {
    highRollPreference: 0.5,
    allInPreference: 0.4,
    skipChance: 0.4,              // 喜欢空过骗人
    riskTolerance: 0.5,
    bluffChance: 0.6,             // 假动作概率
    description: '欺诈型AI：喜欢隐藏强牌，会故意空过骗人'
  },
  
  [AIType.DOMINATING]: {
    highRollPreference: 0.7,
    allInPreference: 0.5,
    skipChance: 0.1,
    riskTolerance: 0.6,
    winStreakBonus: 0.2,          // 连胜后更激进
    description: '压制型AI：喜欢连续进攻，获胜后更激进'
  },
  
  [AIType.CHAOTIC]: {
    highRollPreference: 0.5,
    allInPreference: 0.5,
    skipChance: 0.5,
    riskTolerance: 0.5,
    randomness: 0.9,              // 高度随机
    description: '混乱型AI：完全随机，无法预测'
  },
  
  [AIType.PRECOGNITIVE]: {
    highRollPreference: 0.6,
    allInPreference: 0.4,
    skipChance: 0.2,
    riskTolerance: 0.5,
    patternAnalysis: true,        // 分析玩家行为
    description: '预知型AI：会分析玩家行为，针对玩家套路'
  }
};

// ==================== 敌人AI决策器 ====================

class EnemyAIDecisionMaker {
  constructor(aiType, enemyConfig) {
    this.aiType = aiType;
    this.config = enemyConfig;
    this.weights = AI_BEHAVIOR_WEIGHTS[aiType];
    this.winStreak = 0;
    this.playerHistory = []; // 记录玩家出牌历史
  }

  /**
   * 选择卡牌
   * @param {Array} hand - 手牌
   * @param {Object} battleState - 战斗状态
   * @returns {Object} - 选择的卡牌或null（空过）
   */
  selectCard(hand, battleState) {
    if (hand.length === 0) return null;

    // 根据AI类型决策
    switch (this.aiType) {
      case AIType.AGGRESSIVE:
        return this._aggressiveSelect(hand, battleState);
      case AIType.DEFENSIVE:
        return this._defensiveSelect(hand, battleState);
      case AIType.DECEPTIVE:
        return this._deceptiveSelect(hand, battleState);
      case AIType.DOMINATING:
        return this._dominatingSelect(hand, battleState);
      case AIType.CHAOTIC:
        return this._chaoticSelect(hand, battleState);
      case AIType.PRECOGNITIVE:
        return this._precognitiveSelect(hand, battleState);
      default:
        return hand[0];
    }
  }

  /**
   * 激进型AI选择
   */
  _aggressiveSelect(hand, battleState) {
    // 很少空过
    if (Math.random() < this.weights.skipChance) {
      return null;
    }

    // 优先选择高Roll牌
    const sortedHand = [...hand].sort((a, b) => {
      const aMax = a.rollRange?.max || 0;
      const bMax = b.rollRange?.max || 0;
      return bMax - aMax;
    });

    // 80%概率选最高Roll，20%随机
    if (Math.random() < this.weights.highRollPreference) {
      return sortedHand[0];
    }
    
    return sortedHand[Math.floor(Math.random() * sortedHand.length)];
  }

  /**
   * 保守型AI选择
   */
  _defensiveSelect(hand, battleState) {
    // 30%概率空过
    if (Math.random() < this.weights.skipChance) {
      return null;
    }

    // 选择最稳定的牌（Roll方差最小）
    const sortedHand = [...hand].sort((a, b) => {
      const aVariance = (a.rollRange?.max || 0) - (a.rollRange?.min || 0);
      const bVariance = (b.rollRange?.max || 0) - (b.rollRange?.min || 0);
      return aVariance - bVariance;
    });

    return sortedHand[0];
  }

  /**
   * 欺诈型AI选择
   */
  _deceptiveSelect(hand, battleState) {
    // 40%概率空过（假装弱）
    if (Math.random() < this.weights.skipChance) {
      return null;
    }

    // 有时会隐藏强牌，出中等牌
    const sortedHand = [...hand].sort((a, b) => {
      const aMax = a.rollRange?.max || 0;
      const bMax = b.rollRange?.max || 0;
      return bMax - aMax;
    });

    // 60%概率出中等牌（隐藏实力）
    if (Math.random() < this.weights.bluffChance && sortedHand.length > 1) {
      const midIndex = Math.floor(sortedHand.length / 2);
      return sortedHand[midIndex];
    }

    return sortedHand[0];
  }

  /**
   * 压制型AI选择
   */
  _dominatingSelect(hand, battleState) {
    // 很少空过
    if (Math.random() < this.weights.skipChance) {
      return null;
    }

    // 连胜后更激进
    const adjustedPreference = this.weights.highRollPreference + 
      (this.winStreak * this.weights.winStreakBonus);

    const sortedHand = [...hand].sort((a, b) => {
      const aMax = a.rollRange?.max || 0;
      const bMax = b.rollRange?.max || 0;
      return bMax - aMax;
    });

    if (Math.random() < adjustedPreference) {
      return sortedHand[0];
    }

    return sortedHand[Math.floor(Math.random() * sortedHand.length)];
  }

  /**
   * 混乱型AI选择
   */
  _chaoticSelect(hand, battleState) {
    // 完全随机
    if (Math.random() < this.weights.skipChance) {
      return null;
    }

    return hand[Math.floor(Math.random() * hand.length)];
  }

  /**
   * 预知型AI选择
   */
  _precognitiveSelect(hand, battleState) {
    // 分析玩家历史行为
    const playerPattern = this._analyzePlayerPattern();
    
    // 如果玩家经常出高Roll牌，我们也出高Roll
    if (playerPattern.highRollPreference > 0.6) {
      const sortedHand = [...hand].sort((a, b) => {
        const aMax = a.rollRange?.max || 0;
        const bMax = b.rollRange?.max || 0;
        return bMax - aMax;
      });
      return sortedHand[0];
    }

    // 否则选择中等策略
    const midIndex = Math.floor(hand.length / 2);
    return hand[midIndex] || hand[0];
  }

  /**
   * 分析玩家行为模式
   */
  _analyzePlayerPattern() {
    if (this.playerHistory.length === 0) {
      return { highRollPreference: 0.5 };
    }

    const highRollCount = this.playerHistory.filter(card => {
      const maxRoll = card?.rollRange?.max || 0;
      return maxRoll >= 15;
    }).length;

    return {
      highRollPreference: highRollCount / this.playerHistory.length
    };
  }

  /**
   * 记录玩家出牌
   */
  recordPlayerCard(card) {
    if (card) {
      this.playerHistory.push(card);
      // 只保留最近10张
      if (this.playerHistory.length > 10) {
        this.playerHistory.shift();
      }
    }
  }

  /**
   * 更新连胜计数
   */
  updateWinStreak(won) {
    if (won) {
      this.winStreak++;
    } else {
      this.winStreak = 0;
    }
  }

  /**
   * 检查是否使用技能
   */
  shouldUseSkill(battleState) {
    if (!this.config.skill) return false;
    
    const skill = this.config.skill;
    
    // 检查冷却
    if (skill.currentCooldown > 0) return false;

    // 根据AI类型决定使用时机
    switch (this.aiType) {
      case AIType.AGGRESSIVE:
        // 激进型：有技能就用
        return Math.random() < 0.7;
      case AIType.DEFENSIVE:
        // 保守型：血量低时用
        return battleState.enemyHpPercent < 0.5;
      case AIType.DOMINATING:
        // 压制型：连胜时用
        return this.winStreak >= 2;
      case AIType.CHAOTIC:
        // 混乱型：随机用
        return Math.random() < 0.5;
      default:
        return Math.random() < 0.3;
    }
  }
}

// ==================== 导出 ====================

module.exports = {
  AIType,
  AI_BEHAVIOR_WEIGHTS,
  EnemyAIDecisionMaker
};
