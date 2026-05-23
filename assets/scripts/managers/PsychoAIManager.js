/**
 * 心理博弈AI管理器
 * 
 * AI会根据以下因素做出决策：
 * 1. 可见的玩家卡牌信息
 * 2. 自己的洞察点数
 * 3. 当前血量状态
 * 4. 牌库剩余情况
 * 5. 心理战术（欺诈、误导）
 */

const InsightManager = require('./InsightManager.js');

class PsychoAIManager {
  constructor() {
    this._aiPersonality = 'calculator';  // AI性格
    this._aiMemory = [];                  // AI记忆（记录玩家行为）
    this._suspicionLevel = 0;             // 怀疑等级（玩家是否经常使用欺诈牌）
    this._lastPlayerAction = null;        // 玩家上回合动作
    this._consecutiveBluffs = 0;          // 玩家连续欺诈次数
  }

  /**
   * 设置AI性格
   */
  setPersonality(personality) {
    const validPersonalities = ['calculator', 'aggressive', 'paranoid', 'gambler'];
    if (validPersonalities.includes(personality)) {
      this._aiPersonality = personality;
    }
  }

  /**
   * AI选择卡牌
   * @param {Object} aiState - AI状态
   * @param {Array} hand - AI手牌
   * @param {Object} playerState - 玩家状态（可见信息）
   * @param {Object} gameContext - 游戏上下文
   */
  selectCard(aiState, hand, playerState, gameContext) {
    const insightManager = InsightManager.getInstance();
    const aiInsight = insightManager.getInsight('enemy');

    // 获取玩家可见卡牌信息
    const visiblePlayerCards = playerState.visibleCards || [];
    
    // 分析局势
    const situation = this._analyzeSituation(aiState, playerState, gameContext);
    
    // 根据性格选择策略
    let selectedCard = null;
    let reasoning = '';

    switch (this._aiPersonality) {
      case 'calculator':
        ({ card: selectedCard, reasoning } = this._calculatorStrategy(
          hand, visiblePlayerCards, situation, aiInsight
        ));
        break;
      case 'aggressive':
        ({ card: selectedCard, reasoning } = this._aggressiveStrategy(
          hand, visiblePlayerCards, situation, aiInsight
        ));
        break;
      case 'paranoid':
        ({ card: selectedCard, reasoning } = this._paranoidStrategy(
          hand, visiblePlayerCards, situation, aiInsight
        ));
        break;
      case 'gambler':
        ({ card: selectedCard, reasoning } = this._gamblerStrategy(
          hand, visiblePlayerCards, situation, aiInsight
        ));
        break;
    }

    console.log(`[PsychoAI] 选择卡牌: ${selectedCard?.name || '空过'}, 原因: ${reasoning}`);

    return {
      card: selectedCard,
      reasoning,
      confidence: this._calculateConfidence(selectedCard, situation)
    };
  }

  /**
   * 计算器型AI - 理性分析
   */
  _calculatorStrategy(hand, visiblePlayerCards, situation, aiInsight) {
    // 优先分析玩家可见卡牌
    if (visiblePlayerCards.length > 0) {
      const playerCard = visiblePlayerCards[0];
      
      // 如果玩家出的是可疑的"防御牌"，可能是欺诈
      if (playerCard.typeIsFake || playerCard.name.includes('防御')) {
        // 准备一张高Roll牌应对可能的欺诈
        const counterCard = hand.find(c => 
          c.rollRange.max >= 15 && c.speed >= 5
        );
        if (counterCard) {
          return { 
            card: counterCard, 
            reasoning: '怀疑玩家欺诈，准备高Roll反制' 
          };
        }
      }

      // 根据玩家Roll范围选择对策
      if (playerCard.rollRange) {
        const playerMaxRoll = typeof playerCard.rollRange.max === 'number' 
          ? playerCard.rollRange.max 
          : 15;
        
        // 玩家Roll上限高，选择速度压制
        if (playerMaxRoll >= 15) {
          const speedCard = hand.find(c => c.speed >= 8);
          if (speedCard) {
            return { 
              card: speedCard, 
              reasoning: '玩家威胁大，速度压制' 
            };
          }
        }
      }
    }

    // 血量危急时选择稳定牌
    if (situation.aiHealthPercent < 30) {
      const safeCard = hand.find(c => 
        c.riskLevel === 'SAFE' || c.rollRange.min >= 5
      );
      if (safeCard) {
        return { 
          card: safeCard, 
          reasoning: '血量危急，求稳' 
        };
      }
    }

    // 默认选择期望伤害最高的牌
    const bestCard = hand.reduce((best, card) => {
      const avgRoll = (card.rollRange.min + card.rollRange.max) / 2;
      const bestAvg = (best.rollRange.min + best.rollRange.max) / 2;
      return avgRoll > bestAvg ? card : best;
    });

    return { 
      card: bestCard, 
      reasoning: '理性选择期望伤害最高' 
    };
  }

  /**
   * 激进型AI - 追求高伤害
   */
  _aggressiveStrategy(hand, visiblePlayerCards, situation, aiInsight) {
    // 优先选择高上限牌
    const highRollCards = hand.filter(c => c.rollRange.max >= 15);
    
    if (highRollCards.length > 0) {
      // 随机选择一张高Roll牌（赌徒心态）
      const randomIndex = Math.floor(Math.random() * highRollCards.length);
      return { 
        card: highRollCards[randomIndex], 
        reasoning: '激进策略，追求高伤害' 
      };
    }

    // 没有高Roll牌时选择最快的牌
    const fastestCard = hand.reduce((fastest, card) => 
      card.speed > fastest.speed ? card : fastest
    );

    return { 
      card: fastestCard, 
      reasoning: '没有高Roll牌，速度压制' 
    };
  }

  /**
   * 多疑型AI - 总是怀疑玩家
   */
  _paranoidStrategy(hand, visiblePlayerCards, situation, aiInsight) {
    // 增加怀疑等级
    if (situation.playerUsedBluffLastTurn) {
      this._consecutiveBluffs++;
    } else {
      this._consecutiveBluffs = Math.max(0, this._consecutiveBluffs - 1);
    }

    // 如果怀疑玩家在欺诈，使用洞察揭示
    if (visiblePlayerCards.length > 0 && aiInsight >= 2) {
      const suspiciousCard = visiblePlayerCards.find(c => 
        !c.isFullyRevealed || c.typeIsFake
      );
      
      if (suspiciousCard) {
        // 消耗洞察揭示
        const insightManager = InsightManager.getInstance();
        const result = insightManager.revealCard(
          suspiciousCard.instanceId,
          'enemy',
          suspiciousCard
        );
        
        if (result.success) {
          // 揭示后重新评估
          return this._reevaluateAfterReveal(hand, result.revealedInfo);
        }
      }
    }

    // 怀疑玩家时选择稳定牌
    if (this._consecutiveBluffs >= 2) {
      const safeCard = hand.find(c => c.riskLevel === 'SAFE');
      if (safeCard) {
        return { 
          card: safeCard, 
          reasoning: '怀疑玩家欺诈，选择安全牌' 
        };
      }
    }

    // 默认策略
    return this._calculatorStrategy(hand, visiblePlayerCards, situation, aiInsight);
  }

  /**
   * 赌徒型AI - 喜欢高风险
   */
  _gamblerStrategy(hand, visiblePlayerCards, situation, aiInsight) {
    // 寻找终结牌
    const finisherCard = hand.find(c => c.isFinisher);
    
    // 在以下情况使用终结牌：
    // 1. 牌库快空了（最后机会）
    // 2. 血量很低（背水一战）
    // 3. 随机决定（赌徒心态）
    if (finisherCard) {
      const shouldUseFinisher = 
        situation.deckSize <= 3 ||
        situation.aiHealthPercent < 20 ||
        Math.random() < 0.3;

      if (shouldUseFinisher) {
        return { 
          card: finisherCard, 
          reasoning: '赌徒本能，ALL IN！' 
        };
      }
    }

    // 选择Roll范围最大的牌
    const biggestGamble = hand.reduce((biggest, card) => {
      const range = card.rollRange.max - card.rollRange.min;
      const biggestRange = biggest.rollRange.max - biggest.rollRange.min;
      return range > biggestRange ? card : biggest;
    });

    return { 
      card: biggestGamble, 
      reasoning: '选择波动最大的牌，追求刺激' 
    };
  }

  /**
   * 揭示后重新评估
   */
  _reevaluateAfterReveal(hand, revealedInfo) {
    // 根据揭示的信息选择对策
    if (revealedInfo.type === 'ATTACK' && revealedInfo.rollRange.max >= 15) {
      // 玩家出的是高伤害攻击，选择防御或速度压制
      const counterCard = hand.find(c => 
        c.type === 'DEFENSE' || c.speed > revealedInfo.speed
      );
      if (counterCard) {
        return { 
          card: counterCard, 
          reasoning: '揭示玩家高伤害攻击，针对性应对' 
        };
      }
    }

    // 默认选择
    return { 
      card: hand[0], 
      reasoning: '揭示信息后应对' 
    };
  }

  /**
   * 分析局势
   */
  _analyzeSituation(aiState, playerState, gameContext) {
    return {
      aiHealthPercent: (aiState.health / aiState.maxHealth) * 100,
      playerHealthPercent: (playerState.health / playerState.maxHealth) * 100,
      deckSize: gameContext.deckSize || 15,
      turnNumber: gameContext.turnNumber || 1,
      playerUsedBluffLastTurn: this._lastPlayerAction?.wasBluff || false,
      aiInsight: InsightManager.getInstance().getInsight('enemy')
    };
  }

  /**
   * 计算信心值
   */
  _calculateConfidence(selectedCard, situation) {
    if (!selectedCard) return 0;

    let confidence = 50;

    // 稳定牌增加信心
    if (selectedCard.riskLevel === 'SAFE') confidence += 20;
    if (selectedCard.riskLevel === 'EXTREME') confidence -= 30;

    // 血量影响
    if (situation.aiHealthPercent < 30) {
      confidence += selectedCard.riskLevel === 'SAFE' ? 20 : -20;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * 记录玩家行为
   */
  recordPlayerAction(action) {
    this._lastPlayerAction = action;
    this._aiMemory.push({
      ...action,
      timestamp: Date.now()
    });

    // 只保留最近10条记忆
    if (this._aiMemory.length > 10) {
      this._aiMemory.shift();
    }

    // 分析玩家是否经常使用欺诈
    const bluffCount = this._aiMemory.filter(m => m.wasBluff).length;
    this._suspicionLevel = bluffCount / this._aiMemory.length;
  }

  /**
   * AI决定是否空过
   */
  shouldSkip(aiState, situation) {
    // 计算器型：血量健康且没有好牌时空过
    if (this._aiPersonality === 'calculator') {
      const hasGoodCard = aiState.hand?.some(c => 
        c.rollRange.max >= 12 || c.riskLevel === 'SAFE'
      );
      if (!hasGoodCard && aiState.health > aiState.maxHealth * 0.5) {
        return { 
          shouldSkip: true, 
          reasoning: '没有好牌，空过获得洞察' 
        };
      }
    }

    // 多疑型：怀疑玩家欺诈时空过观察
    if (this._aiPersonality === 'paranoid' && this._consecutiveBluffs >= 2) {
      return { 
        shouldSkip: true, 
        reasoning: '怀疑玩家欺诈，空过观察' 
      };
    }

    return { shouldSkip: false };
  }

  /**
   * 重置AI状态
   */
  reset() {
    this._aiMemory = [];
    this._suspicionLevel = 0;
    this._lastPlayerAction = null;
    this._consecutiveBluffs = 0;
    this._aiPersonality = 'calculator';
  }

  /**
   * 获取AI状态报告
   */
  getStatus() {
    return {
      personality: this._aiPersonality,
      suspicionLevel: this._suspicionLevel,
      memoryCount: this._aiMemory.length,
      consecutiveBluffs: this._consecutiveBluffs
    };
  }
}

// 导出单例
let instance = null;

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new PsychoAIManager();
    }
    return instance;
  },
  PsychoAIManager
};
