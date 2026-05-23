/**
 * 游戏模块导出文件 - JavaScript版本
 * 供微信小程序使用
 */

// ==================== 提前导入职业系统 ====================
const ClassSystem = require('./data/ClassSystem.js');
const EnemySystem = require('./data/EnemySystem.js');
const { CardConditionChecker, CardEffectExecutor } = require('./CardEffectSystem.js');

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
  ENEMY_CARD_REVEALED: 'ENEMY_CARD_REVEALED', // 新增：出牌阶段显示敌方卡牌
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
  SHIELD_CHANGED: 'SHIELD_CHANGED',
  // 职业技能事件
  SKILL_USED: 'SKILL_USED',
  SKILL_READY: 'SKILL_READY',
  SKILL_ANIMATION_START: 'SKILL_ANIMATION_START',
  SKILL_ANIMATION_STAGE: 'SKILL_ANIMATION_STAGE',
  SKILL_EFFECT_TRIGGERED: 'SKILL_EFFECT_TRIGGERED'
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

  drawCards(entityId, count, options = {}) {
    const deck = this._decks.get(entityId) || [];
    const hand = this._hands.get(entityId) || [];
    const discardPile = this._discardPiles.get(entityId) || [];
    
    const drawnCards = [];
    
    for (let i = 0; i < count; i++) {
      // 如果牌库空了
      if (deck.length === 0) {
        // 硬核模式：牌库+弃牌堆都空了，就不能再抽牌
        if (options.hardcoreMode) {
          if (discardPile.length === 0) {
            // 牌彻底打完了
            console.log(`[CardSystem] ${entityId} 牌库耗尽！`);
            break;
          }
          // 硬核模式下也不自动洗牌，需要手动调用reshuffle
          break;
        }
        
        // 普通模式：弃牌堆洗回牌库
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
  
  // 检查是否还有牌可抽
  hasCardsLeft(entityId) {
    const deck = this._decks.get(entityId) || [];
    const discardPile = this._discardPiles.get(entityId) || [];
    const hand = this._hands.get(entityId) || [];
    
    // 牌库 + 弃牌堆 + 手牌 = 总牌数
    return deck.length > 0 || discardPile.length > 0 || hand.length > 0;
  }
  
  // 获取剩余牌数
  getRemainingCardsCount(entityId) {
    const deck = this._decks.get(entityId) || [];
    const discardPile = this._discardPiles.get(entityId) || [];
    const hand = this._hands.get(entityId) || [];
    
    return {
      deck: deck.length,
      discard: discardPile.length,
      hand: hand.length,
      total: deck.length + discardPile.length + hand.length
    };
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

  onTurnStart(entityId, drawCount, options = {}) {
    this._cardsPlayedThisTurn.set(entityId, 0);
    return this.drawCards(entityId, drawCount, options);
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
      shield: this.shield,
      isDead: this.isDead
    };
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
    this._drawCountPerTurn = 10; // 默认抽10张，与初始牌库大小一致
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
    
    // 卡牌效果执行器
    this._cardEffectExecutor = new CardEffectExecutor(this);
    
    // 职业技能管理器
    const { ClassSkillManager } = require('./data/ClassSkillSystem.js');
    this._skillManager = ClassSkillManager.getInstance();
    
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

    // 初始化卡牌效果执行器的实体状态
    this._cardEffectExecutor.initEntityState(this._player.id);
    this._cardEffectExecutor.initEntityState(this._enemy.id);

    // 初始化职业技能
    const playerClass = this._player.classType || 'GAMBLER';
    this._skillManager.initEntitySkill(this._player.id, playerClass);
    
    // 初始化敌人AI（如果敌人有AI配置）
    if (this._enemy.aiConfig) {
      const { EnemyAIDecisionMaker } = require('./data/EnemyAI.js');
      this._enemyAI = new EnemyAIDecisionMaker(
        this._enemy.aiConfig.aiType,
        this._enemy.aiConfig
      );
    } else {
      // 默认使用激进型AI
      const { EnemyAIDecisionMaker, AIType } = require('./data/EnemyAI.js');
      this._enemyAI = new EnemyAIDecisionMaker(AIType.AGGRESSIVE, {});
    }

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

    // 抽牌（硬核模式：牌用完不自动洗牌）
    const cardSystem = CardSystem.getInstance();
    const playerDrawn = cardSystem.onTurnStart(this._player.id, this._drawCountPerTurn, { hardcoreMode: true });
    const enemyDrawn = cardSystem.onTurnStart(this._enemy.id, this._drawCountPerTurn, { hardcoreMode: true });
    
    // 检查牌是否耗尽
    const playerCardsLeft = cardSystem.hasCardsLeft(this._player.id);
    const enemyCardsLeft = cardSystem.hasCardsLeft(this._enemy.id);
    
    if (!playerCardsLeft) {
      console.log('[BattleManager] 玩家牌库耗尽，游戏结束');
      this._emitEvent(BattleEventType.BATTLE_END, {
        winner: EntityType.ENEMY,
        reason: 'PLAYER_NO_CARDS'
      });
      this.endBattle();
      return;
    }
    
    if (!enemyCardsLeft) {
      console.log('[BattleManager] 敌人牌库耗尽，玩家胜利');
      this._emitEvent(BattleEventType.BATTLE_END, {
        winner: EntityType.PLAYER,
        reason: 'ENEMY_NO_CARDS'
      });
      this.endBattle();
      return;
    }

    // 处理职业技能回合开始（冷却减少等）
    const playerSkillTurnStart = this._skillManager.onTurnStart(this._player.id);
    if (playerSkillTurnStart && playerSkillTurnStart.length > 0) {
      playerSkillTurnStart.forEach(result => {
        if (result.type === 'skill_ready') {
          this._emitEvent(BattleEventType.SKILL_READY, {
            entity: EntityType.PLAYER,
            skillId: result.skillId
          });
        }
      });
    }

    // 触发回合开始事件
    this._emitEvent(BattleEventType.TURN_START, {
      turnNumber: this._currentTurn,
      player: this._player.getStatus(),
      enemy: this._enemy.getStatus(),
      playerCardsRemaining: cardSystem.getRemainingCardsCount(this._player.id),
      enemyCardsRemaining: cardSystem.getRemainingCardsCount(this._enemy.id),
      playerSkillState: this.getPlayerSkillState()
    });

    // 敌人AI选择卡牌
    this._enemyAIPlayCard();
  }

  _enemyAIPlayCard() {
    if (!this._enemy || this._enemyConfirmed) return;

    const cardSystem = CardSystem.getInstance();
    const hand = cardSystem.getHand(this._enemy.id);

    if (hand.length > 0) {
      // 使用新的AI决策系统
      let selectedCard = null;
      
      if (this._enemyAI) {
        // 构建战斗状态
        const battleState = {
          enemyHpPercent: this._enemy.currentHealth / this._enemy.maxHealth,
          playerHpPercent: this._player ? this._player.currentHealth / this._player.maxHealth : 1,
          currentTurn: this._currentTurn
        };
        
        // AI选择卡牌
        selectedCard = this._enemyAI.selectCard(hand, battleState);
        
        // 记录玩家出牌历史（用于预知型AI）
        if (this._playerSelectedCard) {
          this._enemyAI.recordPlayerCard(this._playerSelectedCard);
        }
        
        // 检查是否使用技能
        if (this._enemyAI.shouldUseSkill(battleState)) {
          console.log(`[BattleManager] 敌人使用技能: ${this._enemy.aiConfig?.skill?.name || '未知技能'}`);
          // 触发敌人技能使用事件
          this._emitEvent(BattleEventType.SKILL_USED, {
            entity: EntityType.ENEMY,
            skill: this._enemy.aiConfig?.skill
          });
        }
      } else {
        // 默认策略：优先选择高价值卡牌
        hand.sort((a, b) => b.baseValue - a.baseValue);
        selectedCard = hand[0];
      }

      this._enemySelectedCard = selectedCard;
      this._enemyConfirmed = true;
      this._enemy.markCardPlayed();

      if (selectedCard) {
        console.log(`[BattleManager] 敌人选择卡牌: ${selectedCard.name}`);
        
        // 立即触发事件，让玩家看到敌方要出的牌（出牌阶段可见）
        this._emitEvent(BattleEventType.ENEMY_CARD_REVEALED, {
          enemyCard: this._enemySelectedCard
        });
      } else {
        console.log('[BattleManager] 敌人选择空过');
      }
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

    // 检查卡牌使用条件
    const conditionChecker = new CardConditionChecker(this);
    const battleState = this._getCurrentBattleState();
    const canUse = conditionChecker.checkCanUseCard(this._player, card, battleState);
    
    if (!canUse.canUse) {
      console.log(`[BattleManager] 无法使用卡牌 ${card.name}: ${canUse.reason}`);
      // 触发卡牌无法使用事件，UI可以显示原因
      this._emitEvent(BattleEventType.CARD_SELECTED, {
        entity: EntityType.PLAYER,
        card: card,
        canUse: false,
        reason: canUse.reason
      });
      return false;
    }

    this._playerSelectedCard = card;

    // 触发卡牌选择事件
    this._emitEvent(BattleEventType.CARD_SELECTED, {
      entity: EntityType.PLAYER,
      card: card,
      canUse: true,
      reason: ''
    });

    console.log(`[BattleManager] 玩家选择卡牌: ${card.name}`);
    return true;
  }

  /**
   * 玩家使用职业技能
   */
  playerUseSkill() {
    if (!this._isBattleActive || !this._player) {
      return { success: false, reason: '战斗未进行' };
    }

    const result = this._skillManager.useSkill(this._player.id, this._getCurrentBattleState());
    
    if (result.success) {
      console.log(`[BattleManager] 玩家使用技能: ${result.skill.name}`);
      
      // 触发技能使用事件
      this._emitEvent(BattleEventType.SKILL_USED, {
        entity: EntityType.PLAYER,
        skill: result.skill,
        effects: result.effects,
        state: result.state
      });

      // 播放技能动画
      const { SkillAnimationManager } = require('./animation/SkillAnimationSystem.js');
      const animManager = SkillAnimationManager.getInstance();
      
      // 根据职业类型播放对应动画
      let animType;
      switch (result.skill.classType) {
        case 'GAMBLER':
          animType = 'DICE_SPIN';
          break;
        case 'MAGICIAN':
          animType = 'CARD_SHATTER';
          break;
        case 'EXECUTIONER':
          animType = 'GUILLOTINE_FALL';
          break;
        case 'MANIAC':
          animType = 'BLOOD_RAGE';
          break;
      }
      
      if (animType) {
        animManager.playAnimation(animType, {
          onStart: (data) => {
            this._emitEvent(BattleEventType.SKILL_ANIMATION_START, data);
          },
          onStageChange: (data) => {
            this._emitEvent(BattleEventType.SKILL_ANIMATION_STAGE, data);
          }
        });
      }
    } else {
      console.log(`[BattleManager] 无法使用技能: ${result.reason}`);
    }

    return result;
  }

  /**
   * 获取玩家技能状态
   */
  getPlayerSkillState() {
    if (!this._player) return null;
    return this._skillManager.getSkillState(this._player.id);
  }

  /**
   * 检查玩家技能是否可用
   */
  canPlayerUseSkill() {
    if (!this._player) return false;
    return this._skillManager.canUseSkill(this._player.id);
  }

  /**
   * 获取当前战斗状态
   */
  _getCurrentBattleState() {
    // 从CardEffectExecutor获取实体状态（如果有的话）
    let lastRollWasCrit = false;
    
    // 检查是否有CardEffectExecutor实例
    if (this._cardEffectExecutor) {
      const playerState = this._cardEffectExecutor.getEntityState(this._player?.id);
      if (playerState) {
        lastRollWasCrit = playerState.lastRollWasCrit || false;
      }
    }

    return {
      lastRollWasCrit: lastRollWasCrit,
      currentTurn: this._currentTurn,
      playerHealthPercent: this._player ? (this._player.currentHealth / this._player.maxHealth) : 1,
      enemyHealthPercent: this._enemy ? (this._enemy.currentHealth / this._enemy.maxHealth) : 1
    };
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
      // 延迟执行结算，让玩家感觉到"双方都已确认"
      setTimeout(() => {
        this._resolveTurn();
      }, 1000);
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

    // 使用卡牌（移入弃牌堆）
    if (this._playerSelectedCard) {
      cardSystem.useCard(
        this._player.id,
        this._playerSelectedCard.instanceId,
        0
      );
    }
    if (this._enemySelectedCard) {
      cardSystem.useCard(
        this._enemy.id,
        this._enemySelectedCard.instanceId,
        0
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

    // 游戏核心规则：Roll值本身就是伤害，不再加baseValue
    // baseValue只用于计算暴击加成
    const baseValue = card.baseValue || 0;
    const isCrit = rollValue >= this._critThreshold;
    const critBonus = isCrit ? Math.floor(rollValue * (this._critMultiplier - 1)) : 0;

    let buffBonus = 0;
    const effectSystem = EffectSystem.getInstance();
    const strengthEffects = effectSystem.getEffectsByType(entity.id, EffectType.STRENGTH);
    if (strengthEffects.length > 0) {
      buffBonus += strengthEffects.reduce((sum, e) => sum + e.value, 0);
    }

    const statusBonus = critBonus;
    const speedBonus = card.speed * this._speedBonusPerPoint;
    // 最终值 = Roll值 + 暴击加成 + Buff加成 + 速度加成
    const finalValue = rollValue + statusBonus + buffBonus + speedBonus;

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

    // 执行玩家卡牌的特殊效果（如果有）
    if (this._playerSelectedCard && this._playerSelectedCard.effects && this._playerSelectedCard.effects.length > 0) {
      console.log(`[BattleManager] 执行玩家卡牌 ${this._playerSelectedCard.name} 的特殊效果`);
      const playerCardEffects = this._cardEffectExecutor.executeCardEffects(
        this._player,
        this._enemy,
        this._playerSelectedCard,
        playerResult
      );
      console.log(`[BattleManager] 玩家卡牌效果执行结果:`, playerCardEffects);
      
      // 触发卡牌效果执行事件
      this._emitEvent(BattleEventType.EFFECT_APPLIED, {
        source: EntityType.PLAYER,
        cardName: this._playerSelectedCard.name,
        effects: playerCardEffects.effects
      });
    }

    // 执行敌人卡牌的特殊效果（如果有）
    if (this._enemySelectedCard && this._enemySelectedCard.effects && this._enemySelectedCard.effects.length > 0) {
      console.log(`[BattleManager] 执行敌人卡牌 ${this._enemySelectedCard.name} 的特殊效果`);
      const enemyCardEffects = this._cardEffectExecutor.executeCardEffects(
        this._enemy,
        this._player,
        this._enemySelectedCard,
        enemyResult
      );
      console.log(`[BattleManager] 敌人卡牌效果执行结果:`, enemyCardEffects);
      
      // 触发卡牌效果执行事件
      this._emitEvent(BattleEventType.EFFECT_APPLIED, {
        source: EntityType.ENEMY,
        cardName: this._enemySelectedCard.name,
        effects: enemyCardEffects.effects
      });
    }

    // 处理防御牌效果（给己方加护盾）- 基础防御效果
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

    // 执行卡牌效果执行器的回合结束处理（赌债结算、延迟伤害等）
    const playerEffectResults = this._cardEffectExecutor.onTurnEnd(this._player.id);
    const enemyEffectResults = this._cardEffectExecutor.onTurnEnd(this._enemy.id);

    // 触发赌债/延迟伤害事件
    if (playerEffectResults.length > 0) {
      console.log(`[BattleManager] 玩家回合结束效果:`, playerEffectResults);
      playerEffectResults.forEach(result => {
        this._emitEvent(BattleEventType.EFFECT_TRIGGERED, {
          entity: EntityType.PLAYER,
          effect: result
        });
      });
    }

    if (enemyEffectResults.length > 0) {
      console.log(`[BattleManager] 敌人回合结束效果:`, enemyEffectResults);
      enemyEffectResults.forEach(result => {
        this._emitEvent(BattleEventType.EFFECT_TRIGGERED, {
          entity: EntityType.ENEMY,
          effect: result
        });
      });
    }

    // 处理职业技能回合结束
    const playerSkillResults = this._skillManager.onTurnEnd(this._player.id, { winner: null });
    if (playerSkillResults) {
      this._emitEvent(BattleEventType.SKILL_EFFECT_TRIGGERED, {
        entity: EntityType.PLAYER,
        effect: playerSkillResults
      });
    }

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

    // 处理热手和连胜状态
    if (this._player && this._cardEffectExecutor) {
      if (winner === EntityType.PLAYER) {
        // 玩家胜利，增加连胜和热手
        const winResult = this._cardEffectExecutor.onBattleWin(this._player.id);
        console.log(`[BattleManager] 玩家胜利，连胜: ${winResult.consecutiveWins}, 热手: ${winResult.hotHandStacks}`);
      } else if (winner === EntityType.ENEMY) {
        // 玩家失败，重置热手
        const lossResult = this._cardEffectExecutor.onBattleLoss(this._player.id);
        console.log(`[BattleManager] 玩家失败，热手重置，失去层数: ${lossResult.lostStacks}`);
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

function getStartingDeck(playerClass = 'GAMBLER') {
  // 使用 ClassSystem 生成职业专属牌组
  return ClassSystem.getClassDeck(playerClass);
}

function getEnemyDeck() {
  // 使用 EnemySystem 生成敌人牌组
  return EnemySystem.getEnemyDeck('JOKER_GAMBLER');
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

// ==================== 职业系统导入（ClassSystem和EnemySystem已在文件开头导入）====================
const MapSystem = require('./data/MapSystem.js');
const RelicSystem = require('./data/RelicSystem.js');
const EventSystem = require('./data/EventSystem.js');
const ProgressionSystem = require('./data/ProgressionSystem.js');

// 导出职业系统
module.exports.PlayerClass = ClassSystem.PlayerClass;
module.exports.CLASS_CONFIG = ClassSystem.CLASS_CONFIG;
module.exports.getClassDeck = ClassSystem.getClassDeck;
module.exports.getClassConfig = ClassSystem.getClassConfig;
module.exports.GAMBLER_CARDS = ClassSystem.GAMBLER_CARDS;
module.exports.MAGICIAN_CARDS = ClassSystem.MAGICIAN_CARDS;
module.exports.EXECUTIONER_CARDS = ClassSystem.EXECUTIONER_CARDS;
module.exports.MANIAC_CARDS = ClassSystem.MANIAC_CARDS;

// 导出扩展卡牌（流派卡牌）
module.exports.GAMBLER_EXTENDED_CARDS = ClassSystem.GAMBLER_EXTENDED_CARDS;
module.exports.MAGICIAN_EXTENDED_CARDS = ClassSystem.MAGICIAN_EXTENDED_CARDS;
module.exports.EXECUTIONER_EXTENDED_CARDS = ClassSystem.EXECUTIONER_EXTENDED_CARDS;
module.exports.MANIAC_EXTENDED_CARDS = ClassSystem.MANIAC_EXTENDED_CARDS;

// 导出职业主动技能系统
const ClassSkillSystem = require('./data/ClassSkillSystem.js');
module.exports.CLASS_SKILLS = ClassSkillSystem.CLASS_SKILLS;
module.exports.ClassSkillManager = ClassSkillSystem.ClassSkillManager;

// 导出技能动画系统
const SkillAnimationSystem = require('./animation/SkillAnimationSystem.js');
module.exports.SkillAnimationType = SkillAnimationSystem.SkillAnimationType;
module.exports.SKILL_ANIMATION_CONFIG = SkillAnimationSystem.SKILL_ANIMATION_CONFIG;
module.exports.SkillAnimationManager = SkillAnimationSystem.SkillAnimationManager;

// 导出敌人AI系统
const EnemyAI = require('./data/EnemyAI.js');
module.exports.AIType = EnemyAI.AIType;
module.exports.AI_BEHAVIOR_WEIGHTS = EnemyAI.AI_BEHAVIOR_WEIGHTS;
module.exports.EnemyAIDecisionMaker = EnemyAI.EnemyAIDecisionMaker;

// 导出第一阶段敌人系统
const EnemyPhase1 = require('./data/EnemyPhase1.js');
module.exports.EnemyFaction = EnemyPhase1.EnemyFaction;
module.exports.DangerLevel = EnemyPhase1.DangerLevel;
module.exports.ENEMY_SKILLS = EnemyPhase1.ENEMY_SKILLS;
module.exports.NORMAL_ENEMIES = EnemyPhase1.NORMAL_ENEMIES;
module.exports.BOSS_ENEMIES = EnemyPhase1.BOSS_ENEMIES;
module.exports.EnemyGenerator = EnemyPhase1.EnemyGenerator;

// 导出第二阶段精英敌人系统
const EnemyPhase2 = require('./data/EnemyPhase2.js');
module.exports.EliteAbilityType = EnemyPhase2.EliteAbilityType;
module.exports.ELITE_ENEMIES = EnemyPhase2.ELITE_ENEMIES;
module.exports.EliteEnemyGenerator = EnemyPhase2.EliteEnemyGenerator;
module.exports.EliteAbilityProcessor = EnemyPhase2.EliteAbilityProcessor;

// 导出恶魔庄家Boss系统
const BossDevilDealer = require('./data/BossDevilDealer.js');
module.exports.BossPhase = BossDevilDealer.BossPhase;
module.exports.DebtType = BossDevilDealer.DebtType;
module.exports.DEBT_COSTS = BossDevilDealer.DEBT_COSTS;
module.exports.DEVIL_DEALER_CARDS = BossDevilDealer.DEVIL_DEALER_CARDS;
module.exports.DEVIL_DEALER_CONFIG = BossDevilDealer.DEVIL_DEALER_CONFIG;
module.exports.DevilDealerBoss = BossDevilDealer.DevilDealerBoss;
module.exports.DevilDealerGenerator = BossDevilDealer.DevilDealerGenerator;

// 导出舞台主宰Boss系统
const BossStageMaster = require('./data/BossStageMaster.js');
module.exports.StagePhase = BossStageMaster.StagePhase;
module.exports.FakeInfoType = BossStageMaster.FakeInfoType;
module.exports.PlayerBehaviorType = BossStageMaster.PlayerBehaviorType;
module.exports.SpotlightType = BossStageMaster.SpotlightType;
module.exports.STAGE_MASTER_CARDS = BossStageMaster.STAGE_MASTER_CARDS;
module.exports.STAGE_MASTER_CONFIG = BossStageMaster.STAGE_MASTER_CONFIG;
module.exports.StageMasterBoss = BossStageMaster.StageMasterBoss;
module.exports.StageMasterGenerator = BossStageMaster.StageMasterGenerator;

// 导出机械裁决者Boss系统
const BossMachineJudge = require('./data/BossMachineJudge.js');
module.exports.JudgePhase = BossMachineJudge.JudgePhase;
module.exports.RuleType = BossMachineJudge.RuleType;
module.exports.RULE_VIOLATION_PENALTIES = BossMachineJudge.RULE_VIOLATION_PENALTIES;
module.exports.MACHINE_JUDGE_CARDS = BossMachineJudge.MACHINE_JUDGE_CARDS;
module.exports.MACHINE_JUDGE_CONFIG = BossMachineJudge.MACHINE_JUDGE_CONFIG;
module.exports.MachineJudgeBoss = BossMachineJudge.MachineJudgeBoss;
module.exports.MachineJudgeGenerator = BossMachineJudge.MachineJudgeGenerator;

// 导出终末狂徒Boss系统
const BossFinalMadman = require('./data/BossFinalMadman.js');
module.exports.MadmanPhase = BossFinalMadman.MadmanPhase;
module.exports.CorruptionType = BossFinalMadman.CorruptionType;
module.exports.CORRUPTION_RULES = BossFinalMadman.CORRUPTION_RULES;
module.exports.FINAL_MADMAN_CARDS = BossFinalMadman.FINAL_MADMAN_CARDS;
module.exports.FINAL_MADMAN_CONFIG = BossFinalMadman.FINAL_MADMAN_CONFIG;
module.exports.FinalMadmanBoss = BossFinalMadman.FinalMadmanBoss;
module.exports.FinalMadmanGenerator = BossFinalMadman.FinalMadmanGenerator;

// 导出命运之主Boss系统
const BossLordOfFate = require('./data/BossLordOfFate.js');
module.exports.FatePhase = BossLordOfFate.FatePhase;
module.exports.PlayerBehavior = BossLordOfFate.PlayerBehavior;
module.exports.FateModification = BossLordOfFate.FateModification;
module.exports.LORD_OF_FATE_CARDS = BossLordOfFate.LORD_OF_FATE_CARDS;
module.exports.LORD_OF_FATE_CONFIG = BossLordOfFate.LORD_OF_FATE_CONFIG;
module.exports.LordOfFateBoss = BossLordOfFate.LordOfFateBoss;
module.exports.LordOfFateGenerator = BossLordOfFate.LordOfFateGenerator;

// 导出敌人系统
module.exports.EnemyType = EnemySystem.EnemyType;
module.exports.ENEMY_CONFIGS = EnemySystem.ENEMY_CONFIGS;
module.exports.getEnemyDeckByType = EnemySystem.getEnemyDeck;
module.exports.getEnemyConfig = EnemySystem.getEnemyConfig;
module.exports.STAGE_CONFIG = EnemySystem.STAGE_CONFIG;

// 导出地图系统
module.exports.NodeType = MapSystem.NodeType;
module.exports.AreaTheme = MapSystem.AreaTheme;
module.exports.MapGenerator = MapSystem.MapGenerator;
module.exports.NODE_ICONS = MapSystem.NODE_ICONS;
module.exports.NODE_COLORS = MapSystem.NODE_COLORS;

// 导出遗物系统
module.exports.RelicRarity = RelicSystem.RelicRarity;
module.exports.RelicType = RelicSystem.RelicType;
module.exports.RELICS = RelicSystem.RELICS;
module.exports.BUILD_CORES = RelicSystem.BUILD_CORES;
module.exports.RelicManager = RelicSystem.RelicManager;

// 导出事件系统
module.exports.EventType = EventSystem.EventType;
module.exports.EVENTS = EventSystem.EVENTS;
module.exports.EventManager = EventSystem.EventManager;

// 导出成长系统
module.exports.AchievementType = ProgressionSystem.AchievementType;
module.exports.ACHIEVEMENTS = ProgressionSystem.ACHIEVEMENTS;
module.exports.UNLOCKABLES = ProgressionSystem.UNLOCKABLES;
module.exports.ProgressionManager = ProgressionSystem.ProgressionManager;

// 导出Roguelike系统
const RoguelikeSystem = require('./data/RoguelikeSystem.js');
module.exports.RoguelikeManager = RoguelikeSystem.RoguelikeManager;

// 导出动画系统
const AnimationSystem = require('./animation/AnimationSystem.js');
const BattleAnimationController = require('./animation/BattleAnimationController.js');
module.exports.AnimationType = AnimationSystem.AnimationType;
module.exports.ANIMATION_CONFIG = AnimationSystem.ANIMATION_CONFIG;
module.exports.AnimationManager = AnimationSystem.AnimationManager;
module.exports.BattleAnimationController = BattleAnimationController.BattleAnimationController;
module.exports.injectBattleStyles = BattleAnimationController.injectBattleStyles;
