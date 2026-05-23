/**
 * 洞察系统管理器
 * 
 * 核心机制：
 * - 空过获得洞察点
 * - 洞察点用于揭示敌方卡牌信息
 * - 信息分层：部分可见 -> 消耗洞察 -> 完全揭示
 */

class InsightManager {
  constructor() {
    this._playerInsight = 0;      // 玩家洞察点
    this._enemyInsight = 0;       // 敌人洞察点
    this._revealedCards = new Map(); // 已揭示的卡牌信息
    this._insightHistory = [];    // 洞察使用历史
  }

  // ==================== 洞察点管理 ====================

  /**
   * 空过获得洞察点
   * @param {string} entityId - 实体ID
   * @param {number} amount - 获得数量（默认1）
   */
  gainInsightOnSkip(entityId, amount = 1) {
    if (entityId === 'player') {
      this._playerInsight += amount;
      console.log(`[InsightManager] 玩家空过，获得${amount}点洞察，当前：${this._playerInsight}`);
    } else {
      this._enemyInsight += amount;
      console.log(`[InsightManager] 敌人空过，获得${amount}点洞察，当前：${this._enemyInsight}`);
    }
    return amount;
  }

  /**
   * 使用洞察点
   * @param {string} entityId - 实体ID
   * @param {number} amount - 使用数量
   * @returns {boolean} 是否成功
   */
  spendInsight(entityId, amount) {
    const currentInsight = entityId === 'player' ? this._playerInsight : this._enemyInsight;
    
    if (currentInsight < amount) {
      console.log(`[InsightManager] 洞察点不足，需要${amount}，当前${currentInsight}`);
      return false;
    }

    if (entityId === 'player') {
      this._playerInsight -= amount;
    } else {
      this._enemyInsight -= amount;
    }

    console.log(`[InsightManager] ${entityId}消耗${amount}点洞察，剩余：${entityId === 'player' ? this._playerInsight : this._enemyInsight}`);
    return true;
  }

  /**
   * 获取当前洞察点
   */
  getInsight(entityId) {
    return entityId === 'player' ? this._playerInsight : this._enemyInsight;
  }

  // ==================== 信息揭示系统 ====================

  /**
   * 获取卡牌显示信息（考虑洞察）
   * @param {Object} card - 卡牌数据
   * @param {string} viewerId - 查看者ID
   * @param {number} viewerInsight - 查看者洞察点
   */
  getCardDisplayInfo(card, viewerId, viewerInsight) {
    // 基础信息总是可见
    const baseInfo = {
      instanceId: card.instanceId,
      name: card.name,
      type: card.type,
      rarity: card.rarity
    };

    // 如果卡牌没有信息隐藏机制，显示全部
    if (!card.infoVisibility) {
      return {
        ...baseInfo,
        rollRange: card.rollRange,
        speed: card.speed,
        effects: card.effects,
        riskLevel: card.riskLevel,
        tags: card.tags,
        isFullyRevealed: true
      };
    }

    const visibility = card.infoVisibility;
    const insightRequired = visibility.insightRequired || 0;
    const hasEnoughInsight = viewerInsight >= insightRequired;

    // 构建显示信息
    const displayInfo = { ...baseInfo };

    // 类型可见性
    if (visibility.type === true || hasEnoughInsight) {
      displayInfo.type = card.type;
    } else if (card.displayedInfo?.type) {
      displayInfo.type = card.displayedInfo.type;
      displayInfo.typeIsFake = true;
    } else {
      displayInfo.type = 'UNKNOWN';
    }

    // 风险等级可见性
    if (visibility.riskLevel === true || hasEnoughInsight) {
      displayInfo.riskLevel = card.riskLevel;
    } else if (visibility.riskLevel === 'partial') {
      displayInfo.riskLevel = this._getPartialRiskLevel(card.riskLevel);
    } else if (card.displayedInfo?.riskLevel) {
      displayInfo.riskLevel = card.displayedInfo.riskLevel;
      displayInfo.riskIsFake = true;
    } else {
      displayInfo.riskLevel = 'UNKNOWN';
    }

    // 速度可见性
    if (visibility.speedRange === 'exact' || hasEnoughInsight) {
      displayInfo.speed = card.speed;
      displayInfo.speedRange = this._getSpeedRangeText(card.speed);
    } else if (visibility.speedRange === 'fake' && card.displayedInfo) {
      displayInfo.speed = card.displayedInfo.displayedSpeed || card.speed;
      displayInfo.speedRange = card.displayedInfo.speedRange;
      displayInfo.speedIsFake = true;
    } else if (visibility.speedRange === 'hidden') {
      displayInfo.speed = '?';
      displayInfo.speedRange = 'unknown';
    } else {
      displayInfo.speedRange = visibility.speedRange || 'unknown';
    }

    // Roll范围可见性
    if (visibility.rollRange === true || hasEnoughInsight) {
      displayInfo.rollRange = card.rollRange;
      displayInfo.rollRangeText = `${card.rollRange.min}~${card.rollRange.max}`;
    } else if (visibility.rollRange === 'partial') {
      displayInfo.rollRange = this._getPartialRollRange(card.rollRange);
      displayInfo.rollRangeText = '??';
    } else if (card.displayedInfo?.rollRange) {
      displayInfo.rollRange = card.displayedInfo.rollRange;
      displayInfo.rollRangeIsFake = true;
      displayInfo.rollRangeText = `${card.displayedInfo.rollRange.min}~${card.displayedInfo.rollRange.max}`;
    } else {
      displayInfo.rollRange = { min: '?', max: '?' };
      displayInfo.rollRangeText = '???';
    }

    // 效果可见性
    if (visibility.effects === true || hasEnoughInsight) {
      displayInfo.effects = card.effects;
      displayInfo.description = card.description;
    } else if (card.displayedInfo?.fakeEffects) {
      displayInfo.effects = card.displayedInfo.fakeEffects;
      displayInfo.effectsAreFake = true;
      displayInfo.description = '???';
    } else {
      displayInfo.effects = [];
      displayInfo.description = card.displayedInfo?.hint || '某种神秘的效果...';
    }

    // 标签可见性
    displayInfo.tags = hasEnoughInsight ? card.tags : (card.tags || []).filter(tag => 
      ['稳定', '可靠', '快速', '防御'].includes(tag)
    );

    // 是否为终结牌（需要足够洞察）
    if (card.isFinisher && !hasEnoughInsight) {
      displayInfo.isFinisher = false;
      displayInfo.finisherHint = '???';
    } else if (card.isFinisher) {
      displayInfo.isFinisher = true;
      displayInfo.finisherHint = '【终结牌】';
    }

    // 标记是否完全揭示
    displayInfo.isFullyRevealed = hasEnoughInsight;
    displayInfo.insightRequired = insightRequired;
    displayInfo.currentInsight = viewerInsight;
    displayInfo.canReveal = viewerInsight >= insightRequired && !hasEnoughInsight;

    return displayInfo;
  }

  /**
   * 消耗洞察揭示卡牌
   * @param {string} cardInstanceId - 卡牌实例ID
   * @param {string} viewerId - 查看者ID
   * @param {Object} card - 卡牌数据
   */
  revealCard(cardInstanceId, viewerId, card) {
    const insightRequired = card.infoVisibility?.insightRequired || 1;
    
    if (!this.spendInsight(viewerId, insightRequired)) {
      return { success: false, reason: 'insufficient_insight' };
    }

    // 记录揭示
    this._revealedCards.set(cardInstanceId, {
      revealedBy: viewerId,
      revealedAt: Date.now(),
      cardId: card.id
    });

    this._insightHistory.push({
      action: 'reveal',
      cardId: card.id,
      cardInstanceId,
      viewerId,
      insightSpent: insightRequired,
      timestamp: Date.now()
    });

    console.log(`[InsightManager] ${viewerId}消耗${insightRequired}洞察揭示了${card.name}`);

    return {
      success: true,
      revealedInfo: card.revealedInfo || card,
      insightRemaining: this.getInsight(viewerId)
    };
  }

  /**
   * 检查卡牌是否已被揭示
   */
  isCardRevealed(cardInstanceId) {
    return this._revealedCards.has(cardInstanceId);
  }

  // ==================== 辅助方法 ====================

  _getPartialRiskLevel(realRisk) {
    const riskMap = {
      'SAFE': 'SAFE',
      'MODERATE': 'MODERATE',
      'HIGH': 'MODERATE',  // 高风险显示为中高风险
      'EXTREME': 'HIGH'    // 极限显示为高风险
    };
    return riskMap[realRisk] || 'UNKNOWN';
  }

  _getSpeedRangeText(speed) {
    if (speed <= 3) return 'slow';
    if (speed <= 6) return 'normal';
    if (speed <= 8) return 'fast';
    return 'very_fast';
  }

  _getPartialRollRange(realRange) {
    // 显示模糊的范围
    const avg = (realRange.min + realRange.max) / 2;
    return {
      min: Math.max(0, Math.floor(avg - 10)),
      max: Math.ceil(avg + 10)
    };
  }

  // ==================== 状态管理 ====================

  reset() {
    this._playerInsight = 0;
    this._enemyInsight = 0;
    this._revealedCards.clear();
    this._insightHistory = [];
    console.log('[InsightManager] 重置洞察系统');
  }

  getStatus() {
    return {
      playerInsight: this._playerInsight,
      enemyInsight: this._enemyInsight,
      revealedCardsCount: this._revealedCards.size,
      historyCount: this._insightHistory.length
    };
  }
}

// 导出单例
let instance = null;

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new InsightManager();
    }
    return instance;
  },
  InsightManager
};
