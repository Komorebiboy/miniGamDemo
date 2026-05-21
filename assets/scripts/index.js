/**
 * 游戏模块导出文件 - JavaScript版本
 * 供微信小程序使用
 */

// ==================== 类型定义（JavaScript对象）====================

const EntityType = {
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY'
};

const CardType = {
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  SKILL: 'SKILL',
  POWER: 'POWER'
};

const CardRarity = {
  COMMON: 'COMMON',
  UNCOMMON: 'UNCOMMON',
  RARE: 'RARE',
  LEGENDARY: 'LEGENDARY'
};

const EffectType = {
  BLEEDING: 'BLEEDING',
  BURNING: 'BURNING',
  FREEZE: 'FREEZE',
  SHIELD: 'SHIELD',
  STRENGTH: 'STRENGTH',
  DEXTERITY: 'DEXTERITY',
  WEAK: 'WEAK',
  VULNERABLE: 'VULNERABLE',
  HEAL: 'HEAL',
  ENERGY: 'ENERGY',
  DRAW: 'DRAW',
  DAMAGE: 'DAMAGE',
  STUN: 'STUN'
};

const EffectTrigger = {
  IMMEDIATE: 'IMMEDIATE',
  ON_TURN_START: 'ON_TURN_START',
  ON_TURN_END: 'ON_TURN_END',
  ON_DAMAGE_DEALT: 'ON_DAMAGE_DEALT',
  ON_DAMAGE_TAKEN: 'ON_DAMAGE_TAKEN'
};

const BattlePhase = {
  INIT: 'INIT',
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN: 'ENEMY_TURN',
  RESOLUTION: 'RESOLUTION',
  END: 'END'
};

const BattleEventType = {
  BATTLE_START: 'BATTLE_START',
  BATTLE_END: 'BATTLE_END',
  TURN_START: 'TURN_START',
  TURN_END: 'TURN_END',
  CARD_SELECTED: 'CARD_SELECTED',
  CARD_REVEALED: 'CARD_REVEALED',
  ROLL_STARTED: 'ROLL_STARTED',
  ROLL_COMPLETED: 'ROLL_COMPLETED',
  RESOLUTION_COMPLETED: 'RESOLUTION_COMPLETED',
  DAMAGE_DEALT: 'DAMAGE_DEALT',
  DAMAGE_TAKEN: 'DAMAGE_TAKEN',
  HEAL_RECEIVED: 'HEAL_RECEIVED',
  EFFECT_APPLIED: 'EFFECT_APPLIED',
  EFFECT_TRIGGERED: 'EFFECT_TRIGGERED',
  EFFECT_EXPIRED: 'EFFECT_EXPIRED',
  ENTITY_DIED: 'ENTITY_DIED',
  ENERGY_CHANGED: 'ENERGY_CHANGED',
  SHIELD_CHANGED: 'SHIELD_CHANGED'
};

// ==================== 工具函数 ====================

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== RollSystem ====================

class RollSystem {
  constructor() {
    console.log('[RollSystem] 初始化');
  }

  static getInstance() {
    if (!RollSystem._instance) {
      RollSystem._instance = new RollSystem();
    }
    return RollSystem._instance;
  }

  roll(range) {
    const { min, max } = range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  rollSync(range) {
    return this.roll(range);
  }

  rollWithAnimation(range, duration = 1000, onUpdate) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = 50;
      
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const tempRoll = this.roll(range);
        
        if (onUpdate) {
          onUpdate(tempRoll);
        }
        
        if (elapsed >= duration) {
          clearInterval(timer);
          const finalRoll = this.roll(range);
          resolve(finalRoll);
        }
      }, interval);
    });
  }

  rollMultiple(count, range) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this.roll(range));
    }
    return results;
  }
}

// ==================== EffectSystem ====================

class EffectSystem {
  constructor() {
    this._effects = new Map();
    console.log('[EffectSystem] 初始化');
  }

  static getInstance() {
    if (!EffectSystem._instance) {
      EffectSystem._instance = new EffectSystem();
    }
    return EffectSystem._instance;
  }

  addEffect(entityId, effect, sourceId) {
    if (!this._effects.has(entityId)) {
      this._effects.set(entityId, []);
    }
    
    const effects = this._effects.get(entityId);
    
    // 检查是否已有相同类型的效果
    const existingIndex = effects.findIndex(e => e.type === effect.type);
    if (existingIndex !== -1) {
      // 叠加层数或刷新持续时间
      if (effect.type === EffectType.BLEEDING || effect.type === EffectType.BURNING) {
        effects[existingIndex].value += effect.value;
        effects[existingIndex].duration = Math.max(effects[existingIndex].duration, effect.duration);
      } else {
        effects[existingIndex] = {
          ...effect,
          sourceId,
          appliedAt: Date.now()
        };
      }
    } else {
      effects.push({
        ...effect,
        sourceId,
        appliedAt: Date.now()
      });
    }
  }

  removeEffect(entityId, effectType) {
    if (!this._effects.has(entityId)) return;
    
    const effects = this._effects.get(entityId);
    const index = effects.findIndex(e => e.type === effectType);
    if (index !== -1) {
      effects.splice(index, 1);
    }
  }

  getEntityEffects(entityId) {
    return this._effects.get(entityId) || [];
  }

  getEffectsByType(entityId, effectType) {
    const effects = this._effects.get(entityId) || [];
    return effects.filter(e => e.type === effectType);
  }

  hasEffect(entityId, effectType) {
    const effects = this._effects.get(entityId) || [];
    return effects.some(e => e.type === effectType);
  }

  isFrozen(entityId) {
    return this.hasEffect(entityId, EffectType.FREEZE);
  }

  onTurnEnd(entityId) {
    if (!this._effects.has(entityId)) return [];
    
    const effects = this._effects.get(entityId);
    const triggeredEffects = [];
    
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      
      // 触发回合结束效果
      if (effect.trigger === EffectTrigger.ON_TURN_END) {
        triggeredEffects.push({
          effect,
          value: effect.value
        });
      }
      
      // 减少持续时间
      if (effect.duration > 0) {
        effect.duration--;
        if (effect.duration === 0) {
          effects.splice(i, 1);
        }
      }
    }
    
    return triggeredEffects;
  }

  calculateDamageModifier(entityId, damage, isAttacker) {
    let modifiedDamage = damage;
    const effects = this._effects.get(entityId) || [];
    
    for (const effect of effects) {
      if (isAttacker) {
        // 攻击方修正
        if (effect.type === EffectType.STRENGTH) {
          modifiedDamage += effect.value;
        } else if (effect.type === EffectType.WEAK) {
          modifiedDamage = Math.floor(modifiedDamage * 0.75);
        }
      } else {
        // 防御方修正
        if (effect.type === EffectType.VULNERABLE) {
          modifiedDamage = Math.floor(modifiedDamage * 1.25);
        }
      }
    }
    
    return Math.max(0, modifiedDamage);
  }

  clearAllEffects(entityId) {
    this._effects.delete(entityId);
  }
}

// ==================== CardSystem ====================

class CardSystem {
  constructor() {
    this._decks = new Map();
    this._hands = new Map();
    this._discardPiles = new Map();
    this._exhaustPiles = new Map();
    this._cardsPlayedThisTurn = new Map();
    console.log('[CardSystem] 初始化');
  }

  static getInstance() {
    if (!CardSystem._instance) {
      CardSystem._instance = new CardSystem();
    }
    return CardSystem._instance;
  }

  registerDeck(entityId, cards) {
    // 创建卡牌实例
    const deck = cards.map(card => ({
      ...card,
      instanceId: generateId()
    }));
    
    // 洗牌
    this._decks.set(entityId, this._shuffle([...deck]));
    this._hands.set(entityId, []);
    this._discardPiles.set(entityId, []);
    this._exhaustPiles.set(entityId, []);
    this._cardsPlayedThisTurn.set(entityId, 0);
  }

  unregisterDeck(entityId) {
    this._decks.delete(entityId);
    this._hands.delete(entityId);
    this._discardPiles.delete(entityId);
    this._exhaustPiles.delete(entityId);
    this._cardsPlayedThisTurn.delete(entityId);
  }

  _shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  drawCards(entityId, count) {
    const deck = this._decks.get(entityId) || [];
    const hand = this._hands.get(entityId) || [];
    const discardPile = this._discardPiles.get(entityId) || [];
    
    const drawnCards = [];
    
    for (let i = 0; i < count; i++) {
      // 如果牌库空了，洗牌
      if (deck.length === 0) {
        if (discardPile.length === 0) break;
        deck.push(...this._shuffle(discardPile));
        discardPile.length = 0;
      }
      
      const card = deck.pop();
      hand.push(card);
      drawnCards.push(card);
    }
    
    return drawnCards;
  }

  getHand(entityId) {
    return this._hands.get(entityId) || [];
  }

  useCard(entityId, cardInstanceId, energyCost) {
    const hand = this._hands.get(entityId);
    const discardPile = this._discardPiles.get(entityId);
    
    if (!hand || !discardPile) return null;
    
    const cardIndex = hand.findIndex(c => c.instanceId === cardInstanceId);
    if (cardIndex === -1) return null;
    
    const card = hand.splice(cardIndex, 1)[0];
    discardPile.push(card);
    
    // 增加本回合出牌计数
    const currentCount = this._cardsPlayedThisTurn.get(entityId) || 0;
    this._cardsPlayedThisTurn.set(entityId, currentCount + 1);
    
    return card;
  }

  discardCard(entityId, cardInstanceId) {
    const hand = this._hands.get(entityId);
    const discardPile = this._discardPiles.get(entityId);
    
    if (!hand || !discardPile) return null;
    
    const cardIndex = hand.findIndex(c => c.instanceId === cardInstanceId);
    if (cardIndex === -1) return null;
    
    const card = hand.splice(cardIndex, 1)[0];
    discardPile.push(card);
    
    return card;
  }

  onTurnStart(entityId, drawCount) {
    this._cardsPlayedThisTurn.set(entityId, 0);
    return this.drawCards(entityId, drawCount);
  }

  onTurnEnd(entityId) {
    // 可以在这里处理回合结束时的手牌限制
  }

  getCardsPlayedThisTurn(entityId) {
    return this._cardsPlayedThisTurn.get(entityId) || 0;
  }
}

// ==================== Entity ====================

class Entity {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    
    this.maxHealth = config.baseStats.maxHealth;
    this.currentHealth = config.baseStats.currentHealth;
    this.maxEnergy = config.baseStats.maxEnergy;
    this.currentEnergy = config.baseStats.currentEnergy;
    this.shield = config.baseStats.shield || 0;
    
    this.deck = config.deck || [];
    this.cardsPlayedThisTurn = 0;
    
    console.log(`[Entity] 创建实体: ${this.name}`);
  }

  get isDead() {
    return this.currentHealth <= 0;
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      health: this.currentHealth,
      maxHealth: this.maxHealth,
      energy: this.currentEnergy,
      maxEnergy: this.maxEnergy,
      shield: this.shield,
      isDead: this.isDead
    };
  }

  canUseCard(energyCost) {
    return this.currentEnergy >= energyCost;
  }

  consumeEnergy(amount) {
    this.currentEnergy = Math.max(0, this.currentEnergy - amount);
  }

  restoreEnergy(amount) {
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);
  }

  takeDamage(damage, sourceId) {
    let remainingDamage = damage;
    
    // 先扣护盾
    if (this.shield > 0) {
      if (this.shield >= remainingDamage) {
        this.shield -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= this.shield;
        this.shield = 0;
      }
    }
    
    // 扣生命值
    const actualDamage = Math.min(remainingDamage, this.currentHealth);
    this.currentHealth -= actualDamage;
    
    return {
      damageDealt: actualDamage,
      isDead: this.isDead
    };
  }

  heal(amount) {
    const actualHeal = Math.min(amount, this.maxHealth - this.currentHealth);
    this.currentHealth += actualHeal;
    return actualHeal;
  }

  addShield(amount) {
    this.shield += amount;
  }

  onTurnStart() {
    this.cardsPlayedThisTurn = 0;
    this.restoreEnergy(this.maxEnergy);
  }

  onTurnEnd() {
    // 回合结束处理
  }

  markCardPlayed() {
    this.cardsPlayedThisTurn++;
  }

  destroy() {
    console.log(`[Entity] 销毁实体: ${this.name}`);
  }
}

// ==================== BattleManager ====================

class BattleManager {
  constructor() {
    this._phase = BattlePhase.INIT;
    this._player = null;
    this._enemy = null;
    this._currentTurn = 0;
    this._maxTurns = 50;
    this._drawCountPerTurn = 5;
    this._playerSelectedCard = null;
    this._enemySelectedCard = null;
    this._playerConfirmed = false;
    this._enemyConfirmed = false;
    this._isBattleActive = false;
    this._eventListeners = new Map();
    
    // 暴击和闪避配置
    this._critThreshold = 95;
    this._dodgeThreshold = 5;
    this._critMultiplier = 1.5;
    this._speedBonusPerPoint = 2;
    
    console.log('[BattleManager] 初始化');
  }

  static getInstance() {
    if (!BattleManager._instance) {
      BattleManager._instance = new BattleManager();
    }
    return BattleManager._instance;
  }

  addEventListener(eventType, callback) {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, new Set());
    }
    this._eventListeners.get(eventType).add(callback);
  }

  removeEventListener(eventType, callback) {
    const listeners = this._eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  _emitEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: Date.now()
    };

    const listeners = this._eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[BattleManager] 事件回调错误: ${type}`, error);
        }
      });
    }
  }

  async startBattle(config) {
    console.log('[BattleManager] ========== 战斗开始 ==========');

    this._player = config.player;
    this._enemy = config.enemy;
    this._drawCountPerTurn = config.drawCountPerTurn;
    this._maxTurns = config.maxTurns;
    this._currentTurn = 0;
    this._isBattleActive = true;

    // 确保所有系统已初始化
    const rollSystem = RollSystem.getInstance();
    const cardSystem = CardSystem.getInstance();
    const effectSystem = EffectSystem.getInstance();

    console.log('[BattleManager] 系统初始化完成');

    // 初始化牌组
    cardSystem.registerDeck(this._player.id, this._player.deck);
    cardSystem.registerDeck(this._enemy.id, this._enemy.deck);

    // 触发战斗开始事件
    this._emitEvent(BattleEventType.BATTLE_START, {
      player: this._player.getStatus(),
      enemy: this._enemy.getStatus()
    });

    // 开始第一回合
    await this._startNewTurn();
  }

  async _startNewTurn() {
    if (!this._isBattleActive || !this._player || !this._enemy) return;

    // 检查战斗是否结束
    if (this._checkBattleEnd()) {
      this.endBattle();
      return;
    }

    this._currentTurn++;
    this._phase = BattlePhase.PLAYER_TURN;
    this._playerSelectedCard = null;
    this._enemySelectedCard = null;
    this._playerConfirmed = false;
    this._enemyConfirmed = false;

    console.log(`[BattleManager] ========== 回合 ${this._currentTurn} ==========`);

    // 双方回合开始处理
    this._player.onTurnStart();
    this._enemy.onTurnStart();

    // 抽牌
    const cardSystem = CardSystem.getInstance();
    cardSystem.onTurnStart(this._player.id, this._drawCountPerTurn);
    cardSystem.onTurnStart(this._enemy.id, this._drawCountPerTurn);

    // 触发回合开始事件
    this._emitEvent(BattleEventType.TURN_START, {
      turnNumber: this._currentTurn,
      player: this._player.getStatus(),
      enemy: this._enemy.getStatus()
    });

    // 敌人AI选择卡牌
    this._enemyAIPlayCard();
  }

  _enemyAIPlayCard() {
    if (!this._enemy || this._enemyConfirmed) return;

    const cardSystem = CardSystem.getInstance();
    const hand = cardSystem.getHand(this._enemy.id);
    const playableCards = hand.filter(card =>
      this._enemy.canUseCard(card.energyCost)
    );

    if (playableCards.length > 0) {
      // AI策略：优先选择高价值卡牌
      playableCards.sort((a, b) => b.baseValue - a.baseValue);
      const selectedCard = playableCards[0];

      this._enemySelectedCard = selectedCard;
      this._enemyConfirmed = true;
      this._enemy.markCardPlayed();

      console.log(`[BattleManager] 敌人选择卡牌: ${selectedCard.name}`);
    } else {
      console.log('[BattleManager] 敌人无牌可出');
      this._enemyConfirmed = true;
    }

    this._checkBothConfirmed();
  }

  playerSelectCard(cardInstanceId) {
    if (!this._isBattleActive || !this._player || this._playerConfirmed) return false;

    const cardSystem = CardSystem.getInstance();
    const hand = cardSystem.getHand(this._player.id);
    const card = hand.find(c => c.instanceId === cardInstanceId);

    if (!card) {
      console.warn('[BattleManager] 选择的卡牌不在手牌中');
      return false;
    }

    if (!this._player.canUseCard(card.energyCost)) {
      console.warn('[BattleManager] 能量不足');
      return false;
    }

    this._playerSelectedCard = card;

    // 触发卡牌选择事件
    this._emitEvent(BattleEventType.CARD_SELECTED, {
      entity: EntityType.PLAYER,
      card: card
    });

    console.log(`[BattleManager] 玩家选择卡牌: ${card.name}`);
    return true;
  }

  playerConfirmCard() {
    if (!this._playerSelectedCard || this._playerConfirmed) return;

    this._playerConfirmed = true;
    this._player.markCardPlayed();

    console.log('[BattleManager] 玩家确认出牌');

    this._checkBothConfirmed();
  }

  playerSkipCard() {
    if (!this._player || this._playerConfirmed) return;

    this._playerSelectedCard = null;
    this._playerConfirmed = true;
    this._player.markCardPlayed();

    console.log('[BattleManager] 玩家跳过出牌');

    this._checkBothConfirmed();
  }

  _checkBothConfirmed() {
    if (this._playerConfirmed && this._enemyConfirmed) {
      setTimeout(() => {
        this._resolveTurn();
      }, 500);
    }
  }

  async _resolveTurn() {
    if (!this._player || !this._enemy) return;

    this._phase = BattlePhase.RESOLUTION;

    console.log('[BattleManager] ========== 开始结算 ==========');

    // 获取系统实例
    const rollSystem = RollSystem.getInstance();
    const cardSystem = CardSystem.getInstance();

    // 触发揭示阶段事件
    this._emitEvent(BattleEventType.CARD_REVEALED, {
      playerCard: this._playerSelectedCard || null,
      enemyCard: this._enemySelectedCard || null
    });

    await delay(800);

    // 执行Roll点
    const playerRoll = this._playerSelectedCard
      ? rollSystem.rollSync(this._playerSelectedCard.rollRange)
      : 0;
    const enemyRoll = this._enemySelectedCard
      ? rollSystem.rollSync(this._enemySelectedCard.rollRange)
      : 0;

    // 触发Roll开始事件
    this._emitEvent(BattleEventType.ROLL_STARTED, {
      playerRollRange: this._playerSelectedCard?.rollRange || { min: 0, max: 0 },
      enemyRollRange: this._enemySelectedCard?.rollRange || { min: 0, max: 0 }
    });

    await delay(1500);

    // 计算最终值
    const playerResult = this._calculateFinalValue(
      this._playerSelectedCard,
      this._player,
      playerRoll
    );
    const enemyResult = this._calculateFinalValue(
      this._enemySelectedCard,
      this._enemy,
      enemyRoll
    );

    // 输出详细计算信息
    console.log(`[BattleManager] 玩家卡牌: ${this._playerSelectedCard?.name}, 基础值: ${this._playerSelectedCard?.baseValue}, Roll: ${playerRoll}, 最终值: ${playerResult.finalValue}`);
    console.log(`[BattleManager] 敌人卡牌: ${this._enemySelectedCard?.name}, 基础值: ${this._enemySelectedCard?.baseValue}, Roll: ${enemyRoll}, 最终值: ${enemyResult.finalValue}`);

    // 触发Roll完成事件
    this._emitEvent(BattleEventType.ROLL_COMPLETED, {
      playerRoll,
      enemyRoll,
      playerResult,
      enemyResult
    });

    // 判定胜负
    let winner = null;
    let isPlayerDodge = false;
    let isEnemyDodge = false;

    // 检查闪避 - Roll出极小值时触发（1-5范围）
    // 注意：这里的逻辑是Roll越小越容易闪避，但应该是极小概率事件
    // 修改：只有Roll <= 3 才算闪避（约25%概率）
    const actualDodgeThreshold = 3;
    if (playerRoll <= actualDodgeThreshold && this._playerSelectedCard) {
      isPlayerDodge = true;
      console.log(`[BattleManager] 玩家触发闪避 (Roll: ${playerRoll})`);
    }
    if (enemyRoll <= actualDodgeThreshold && this._enemySelectedCard) {
      isEnemyDodge = true;
      console.log(`[BattleManager] 敌人触发闪避 (Roll: ${enemyRoll})`);
    }

    // 判断卡牌类型
    const isPlayerAttack = this._playerSelectedCard?.type === CardType.ATTACK;
    const isEnemyAttack = this._enemySelectedCard?.type === CardType.ATTACK;
    const isPlayerDefense = this._playerSelectedCard?.type === CardType.DEFENSE;
    const isEnemyDefense = this._enemySelectedCard?.type === CardType.DEFENSE;

    console.log(`[BattleManager] 卡牌类型 - 玩家: ${this._playerSelectedCard?.type}, 敌人: ${this._enemySelectedCard?.type}`);

    // 比较最终值（只有攻击牌之间才比较）
    if (this._playerSelectedCard && !this._enemySelectedCard) {
      // 只有玩家出牌
      if (!isPlayerDodge && isPlayerAttack) {
        winner = EntityType.PLAYER;
        console.log('[BattleManager] 只有玩家出攻击牌，玩家获胜');
      }
    } else if (!this._playerSelectedCard && this._enemySelectedCard) {
      // 只有敌人出牌
      if (!isEnemyDodge && isEnemyAttack) {
        winner = EntityType.ENEMY;
        console.log('[BattleManager] 只有敌人出攻击牌，敌人获胜');
      }
    } else if (this._playerSelectedCard && this._enemySelectedCard) {
      // 双方都出牌
      if (isPlayerDodge && isEnemyDodge) {
        winner = null;
        console.log('[BattleManager] 双方都闪避');
      } else if (isPlayerDodge) {
        // 玩家闪避，如果敌人出攻击牌则敌人获胜
        if (isEnemyAttack) {
          winner = EntityType.ENEMY;
          console.log('[BattleManager] 玩家闪避，敌人出攻击牌，敌人获胜');
        }
      } else if (isEnemyDodge) {
        // 敌人闪避，如果玩家出攻击牌则玩家获胜
        if (isPlayerAttack) {
          winner = EntityType.PLAYER;
          console.log('[BattleManager] 敌人闪避，玩家出攻击牌，玩家获胜');
        }
      } else {
        // 双方都没有闪避
        console.log(`[BattleManager] 比较最终值: 玩家${playerResult.finalValue} vs 敌人${enemyResult.finalValue}`);
        
        // 根据卡牌类型决定胜负
        if (isPlayerAttack && isEnemyAttack) {
          // 双方都出攻击牌，比较最终值
          if (playerResult.finalValue > enemyResult.finalValue) {
            winner = EntityType.PLAYER;
            console.log('[BattleManager] 玩家最终值大，玩家获胜');
          } else if (enemyResult.finalValue > playerResult.finalValue) {
            winner = EntityType.ENEMY;
            console.log('[BattleManager] 敌人最终值大，敌人获胜');
          } else {
            // 平局，速度高者胜
            const playerSpeed = this._playerSelectedCard?.speed || 0;
            const enemySpeed = this._enemySelectedCard?.speed || 0;
            console.log(`[BattleManager] 平局，比较速度: 玩家${playerSpeed} vs 敌人${enemySpeed}`);
            if (playerSpeed > enemySpeed) {
              winner = EntityType.PLAYER;
              console.log('[BattleManager] 玩家速度快，玩家获胜');
            } else if (enemySpeed > playerSpeed) {
              winner = EntityType.ENEMY;
              console.log('[BattleManager] 敌人速度快，敌人获胜');
            } else {
              winner = null;
              console.log('[BattleManager] 速度相同，无胜者');
            }
          }
        } else if (isPlayerAttack && !isEnemyAttack) {
          // 玩家出攻击牌，敌人出非攻击牌，玩家获胜
          winner = EntityType.PLAYER;
          console.log('[BattleManager] 玩家出攻击牌，敌人出非攻击牌，玩家获胜');
        } else if (!isPlayerAttack && isEnemyAttack) {
          // 玩家出非攻击牌，敌人出攻击牌，敌人获胜
          winner = EntityType.ENEMY;
          console.log('[BattleManager] 玩家出非攻击牌，敌人出攻击牌，敌人获胜');
        } else {
          // 双方都出非攻击牌，无伤害
          winner = null;
          console.log('[BattleManager] 双方都出非攻击牌，无伤害');
        }
      }
    }

    // 执行效果
    const result = {
      playerCard: this._playerSelectedCard,
      enemyCard: this._enemySelectedCard,
      playerRoll,
      enemyRoll,
      playerFinalValue: playerResult.finalValue,
      enemyFinalValue: enemyResult.finalValue,
      winner,
      isCrit: { player: playerResult.isCrit, enemy: enemyResult.isCrit },
      isDodge: { player: isPlayerDodge, enemy: isEnemyDodge },
      damageDealt: { player: 0, enemy: 0 }
    };

    await this._executeBattleEffects(result, playerResult, enemyResult);

    // 消耗能量
    if (this._playerSelectedCard) {
      this._player.consumeEnergy(this._playerSelectedCard.energyCost);
      cardSystem.useCard(
        this._player.id,
        this._playerSelectedCard.instanceId,
        this._playerSelectedCard.energyCost
      );
    }
    if (this._enemySelectedCard) {
      this._enemy.consumeEnergy(this._enemySelectedCard.energyCost);
      cardSystem.useCard(
        this._enemy.id,
        this._enemySelectedCard.instanceId,
        this._enemySelectedCard.energyCost
      );
    }

    // 触发结算完成事件
    this._emitEvent(BattleEventType.RESOLUTION_COMPLETED, result);

    await delay(1000);
    await this._endTurn();
  }

  _calculateFinalValue(card, entity, rollValue) {
    if (!card) {
      return {
        baseValue: 0,
        rollValue: 0,
        buffBonus: 0,
        statusBonus: 0,
        speedBonus: 0,
        finalValue: 0,
        isCrit: false
      };
    }

    const baseValue = card.baseValue;
    const isCrit = rollValue >= this._critThreshold;
    const critBonus = isCrit ? Math.floor(baseValue * (this._critMultiplier - 1)) : 0;

    let buffBonus = 0;
    const effectSystem = EffectSystem.getInstance();
    const strengthEffects = effectSystem.getEffectsByType(entity.id, EffectType.STRENGTH);
    if (strengthEffects.length > 0) {
      buffBonus += strengthEffects.reduce((sum, e) => sum + e.value, 0);
    }

    let statusBonus = critBonus;
    const speedBonus = card.speed * this._speedBonusPerPoint;
    const finalValue = baseValue + rollValue + buffBonus + statusBonus + speedBonus;

    return {
      baseValue,
      rollValue,
      buffBonus,
      statusBonus,
      speedBonus,
      finalValue,
      isCrit
    };
  }

  async _executeBattleEffects(result, playerResult, enemyResult) {
    const { winner, isCrit } = result;
    const effectSystem = EffectSystem.getInstance();

    console.log(`[BattleManager] 执行战斗效果，胜者: ${winner}`);

    // 处理防御牌效果（给己方加护盾）
    if (this._playerSelectedCard?.type === CardType.DEFENSE && this._player) {
      const shieldAmount = playerResult.finalValue;
      this._player.addShield(shieldAmount);
      console.log(`[BattleManager] 玩家获得 ${shieldAmount} 点护盾`);
      this._emitEvent(BattleEventType.SHIELD_CHANGED, {
        entity: EntityType.PLAYER,
        shield: this._player.shield
      });
    }
    
    if (this._enemySelectedCard?.type === CardType.DEFENSE && this._enemy) {
      const shieldAmount = enemyResult.finalValue;
      this._enemy.addShield(shieldAmount);
      console.log(`[BattleManager] 敌人获得 ${shieldAmount} 点护盾`);
      this._emitEvent(BattleEventType.SHIELD_CHANGED, {
        entity: EntityType.ENEMY,
        shield: this._enemy.shield
      });
    }

    // 处理攻击伤害
    if (winner === EntityType.PLAYER && this._playerSelectedCard && this._player && this._enemy) {
      let damage = playerResult.finalValue;
      console.log(`[BattleManager] 玩家造成伤害，基础伤害: ${damage}`);

      if (isCrit.player) {
        damage = Math.floor(damage * this._critMultiplier);
        console.log(`[BattleManager] 玩家暴击，伤害: ${damage}`);
      }

      damage = effectSystem.calculateDamageModifier(this._player.id, damage, true);
      damage = effectSystem.calculateDamageModifier(this._enemy.id, damage, false);

      console.log(`[BattleManager] 最终伤害: ${damage}`);
      const damageResult = this._enemy.takeDamage(damage, this._player.id);
      result.damageDealt.enemy = damageResult.damageDealt;
      console.log(`[BattleManager] 敌人受到伤害: ${damageResult.damageDealt}, 剩余生命: ${this._enemy.currentHealth}`);

      this._emitEvent(BattleEventType.DAMAGE_DEALT, {
        source: EntityType.PLAYER,
        target: EntityType.ENEMY,
        damage: damageResult.damageDealt,
        isCrit: isCrit.player,
        isDodge: false
      });

    } else if (winner === EntityType.ENEMY && this._enemySelectedCard && this._player && this._enemy) {
      let damage = enemyResult.finalValue;
      console.log(`[BattleManager] 敌人造成伤害，基础伤害: ${damage}`);

      if (isCrit.enemy) {
        damage = Math.floor(damage * this._critMultiplier);
        console.log(`[BattleManager] 敌人暴击，伤害: ${damage}`);
      }

      damage = effectSystem.calculateDamageModifier(this._enemy.id, damage, true);
      damage = effectSystem.calculateDamageModifier(this._player.id, damage, false);

      console.log(`[BattleManager] 最终伤害: ${damage}`);
      const damageResult = this._player.takeDamage(damage, this._enemy.id);
      result.damageDealt.player = damageResult.damageDealt;
      console.log(`[BattleManager] 玩家受到伤害: ${damageResult.damageDealt}, 剩余生命: ${this._player.currentHealth}`);

      this._emitEvent(BattleEventType.DAMAGE_DEALT, {
        source: EntityType.ENEMY,
        target: EntityType.PLAYER,
        damage: damageResult.damageDealt,
        isCrit: isCrit.enemy,
        isDodge: false
      });
    } else {
      console.log(`[BattleManager] 无伤害，胜者: ${winner}, 玩家卡牌: ${this._playerSelectedCard?.name}, 敌人卡牌: ${this._enemySelectedCard?.name}`);
    }

    if (this._player?.isDead) {
      this._emitEvent(BattleEventType.ENTITY_DIED, {
        entity: this._player.getStatus()
      });
    }
    if (this._enemy?.isDead) {
      this._emitEvent(BattleEventType.ENTITY_DIED, {
        entity: this._enemy.getStatus()
      });
    }
  }

  async _endTurn() {
    if (!this._player || !this._enemy) return;

    const effectSystem = EffectSystem.getInstance();
    const cardSystem = CardSystem.getInstance();

    effectSystem.onTurnEnd(this._player.id);
    effectSystem.onTurnEnd(this._enemy.id);

    cardSystem.onTurnEnd(this._player.id);
    cardSystem.onTurnEnd(this._enemy.id);

    this._player.onTurnEnd();
    this._enemy.onTurnEnd();

    this._emitEvent(BattleEventType.TURN_END, {
      turnNumber: this._currentTurn,
      player: this._player.getStatus(),
      enemy: this._enemy.getStatus()
    });

    await this._startNewTurn();
  }

  _checkBattleEnd() {
    if (!this._player || !this._enemy) return true;
    return this._player.isDead || this._enemy.isDead || this._currentTurn >= this._maxTurns;
  }

  endBattle() {
    this._isBattleActive = false;
    this._phase = BattlePhase.END;

    let winner = null;
    if (this._player?.isDead) {
      winner = EntityType.ENEMY;
    } else if (this._enemy?.isDead) {
      winner = EntityType.PLAYER;
    } else if (this._currentTurn >= this._maxTurns) {
      if (this._player && this._enemy) {
        const playerHpPercent = this._player.currentHealth / this._player.maxHealth;
        const enemyHpPercent = this._enemy.currentHealth / this._enemy.maxHealth;
        winner = playerHpPercent >= enemyHpPercent ? EntityType.PLAYER : EntityType.ENEMY;
      }
    }

    this._emitEvent(BattleEventType.BATTLE_END, {
      winner,
      turns: this._currentTurn,
      player: this._player?.getStatus(),
      enemy: this._enemy?.getStatus()
    });

    console.log(`[BattleManager] 战斗结束，胜者: ${winner}`);

    this._cleanup();

    return { winner, turns: this._currentTurn };
  }

  _cleanup() {
    const cardSystem = CardSystem.getInstance();
    const effectSystem = EffectSystem.getInstance();

    if (this._player) {
      cardSystem.unregisterDeck(this._player.id);
      effectSystem.clearAllEffects(this._player.id);
    }
    if (this._enemy) {
      cardSystem.unregisterDeck(this._enemy.id);
      effectSystem.clearAllEffects(this._enemy.id);
    }

    this._playerSelectedCard = null;
    this._enemySelectedCard = null;
    this._playerConfirmed = false;
    this._enemyConfirmed = false;
  }

  reset() {
    this._cleanup();
    this._phase = BattlePhase.INIT;
    this._currentTurn = 0;
    this._isBattleActive = false;
    this._player = null;
    this._enemy = null;
    this._eventListeners.clear();
    console.log('[BattleManager] 已重置');
  }

  get phase() { return this._phase; }
  get currentTurn() { return this._currentTurn; }
  get isBattleActive() { return this._isBattleActive; }
  get player() { return this._player; }
  get enemy() { return this._enemy; }
  get playerSelectedCard() { return this._playerSelectedCard; }
  get enemySelectedCard() { return this._enemySelectedCard; }
  get playerConfirmed() { return this._playerConfirmed; }
  get enemyConfirmed() { return this._enemyConfirmed; }
}

// ==================== 卡牌数据库 ====================

const STARTING_DECK = [
  {
    id: 'strike',
    name: '打击',
    description: '造成基础伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 6,
    rollRange: { min: 1, max: 6 },
    energyCost: 1,
    speed: 5,
    effects: []
  },
  {
    id: 'defend',
    name: '防御',
    description: '获得护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 7,
    effects: []
  },
  {
    id: 'heavy_blow',
    name: '重击',
    description: '造成较高伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 10,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 4,
    effects: []
  },
  {
    id: 'shield_block',
    name: '盾牌格挡',
    description: '大量护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 10,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 6,
    effects: []
  },
  {
    id: 'quick_strike',
    name: '快速打击',
    description: '快速攻击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 8,
    effects: []
  }
];

const ENEMY_DECK = [
  {
    id: 'enemy_strike',
    name: '攻击',
    description: '敌人攻击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 5,
    effects: []
  },
  {
    id: 'enemy_heavy',
    name: '重击',
    description: '敌人重击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 8,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 4,
    effects: []
  },
  {
    id: 'enemy_defend',
    name: '防御',
    description: '敌人防御',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 6,
    rollRange: { min: 1, max: 6 },
    energyCost: 1,
    speed: 6,
    effects: []
  }
];

function getStartingDeck() {
  return STARTING_DECK;
}

function getEnemyDeck() {
  return ENEMY_DECK;
}

// ==================== 导出 ====================

module.exports = {
  // 类型
  EntityType,
  CardType,
  CardRarity,
  EffectType,
  EffectTrigger,
  BattlePhase,
  BattleEventType,
  
  // 系统
  getRollSystem: RollSystem.getInstance.bind(RollSystem),
  getEffectSystem: EffectSystem.getInstance.bind(EffectSystem),
  getCardSystem: CardSystem.getInstance.bind(CardSystem),
  getBattleManager: BattleManager.getInstance.bind(BattleManager),
  
  // 类
  Entity,
  BattleManager,
  
  // 数据
  getStartingDeck,
  getEnemyDeck,
  
  // 工具
  generateId,
  delay
};
