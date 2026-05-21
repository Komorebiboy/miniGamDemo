/**
 * BattleManager - 战斗管理器
 * 
 * 职责：
 * 1. 管理整个战斗流程
 * 2. 协调双方出牌、Roll点、结算
 * 3. 处理暴击、闪避、速度等战斗机制
 * 4. 触发战斗事件，通知UI更新
 * 
 * 战斗流程：
 * 1. 回合开始 -> 双方抽牌
 * 2. 选择阶段 -> 双方同时选牌
 * 3. 揭示阶段 -> 翻牌动画
 * 4. Roll点阶段 -> 数字跳动动画
 * 5. 结算阶段 -> 计算最终值，判定胜负
 * 6. 执行阶段 -> 生效卡牌效果
 */

import { BattleEvent, BattleEventType, BattlePhase, CardInstance, EntityType, EffectType, EffectTrigger } from '../types/GameTypes';
import { Entity } from '../entities/Entity';
import { getCardSystem } from '../systems/CardSystem';
import { getEffectSystem } from '../systems/EffectSystem';
import { getRollSystem } from '../systems/RollSystem';
import { delay, generateId } from '../utils/Utils';

/**
 * 战斗配置
 */
export interface BattleConfig {
  player: Entity;
  enemy: Entity;
  drawCountPerTurn: number;
  maxTurns: number;
}

/**
 * 出牌结果
 */
export interface PlayCardResult {
  playerCard: CardInstance | null;
  enemyCard: CardInstance | null;
  playerRoll: number;
  enemyRoll: number;
  playerFinalValue: number;
  enemyFinalValue: number;
  winner: EntityType | null;
  isCrit: { player: boolean; enemy: boolean };
  isDodge: { player: boolean; enemy: boolean };
  damageDealt: { player: number; enemy: number };
}

/**
 * 最终值计算结果
 */
export interface FinalValueResult {
  baseValue: number;
  rollValue: number;
  buffBonus: number;
  statusBonus: number;
  speedBonus: number;
  finalValue: number;
  isCrit: boolean;
}

export class BattleManager {
  private static _instance: BattleManager | null = null;

  // 战斗状态
  private _phase: BattlePhase = BattlePhase.INIT;
  private _player: Entity | null = null;
  private _enemy: Entity | null = null;
  private _currentTurn: number = 0;
  private _maxTurns: number = 50;
  private _drawCountPerTurn: number = 5;

  // 当前回合数据
  private _playerSelectedCard: CardInstance | null = null;
  private _enemySelectedCard: CardInstance | null = null;
  private _playerConfirmed: boolean = false;
  private _enemyConfirmed: boolean = false;

  // 事件监听
  private _eventListeners: Map<BattleEventType, Set<(event: BattleEvent) => void>> = new Map();

  // 战斗是否进行中
  private _isBattleActive: boolean = false;

  // 暴击和闪避配置
  private _critThreshold: number = 95; // Roll出95以上暴击
  private _dodgeThreshold: number = 5;  // Roll出5以下闪避
  private _critMultiplier: number = 1.5;
  private _speedBonusPerPoint: number = 2; // 每点速度提供2点最终值加成

  public static getInstance(): BattleManager {
    if (!BattleManager._instance) {
      BattleManager._instance = new BattleManager();
    }
    return BattleManager._instance;
  }

  private constructor() {
    console.log('[BattleManager] 初始化');
  }

  // ==================== 战斗生命周期 ====================

  /**
   * 开始战斗
   */
  public async startBattle(config: BattleConfig): Promise<void> {
    console.log('[BattleManager] ========== 战斗开始 ==========');

    this._player = config.player;
    this._enemy = config.enemy;
    this._drawCountPerTurn = config.drawCountPerTurn;
    this._maxTurns = config.maxTurns;
    this._currentTurn = 0;
    this._isBattleActive = true;

    // 初始化牌组
    getCardSystem().registerDeck(this._player.id, this._player.deck);
    getCardSystem().registerDeck(this._enemy.id, this._enemy.deck);

    // 触发战斗开始事件
    this._emitEvent(BattleEventType.BATTLE_START, {
      player: this._player.getStatus(),
      enemy: this._enemy.getStatus()
    });

    // 开始第一回合
    await this._startNewTurn();
  }

  /**
   * 结束战斗
   */
  public endBattle(): { winner: EntityType | null; turns: number } {
    this._isBattleActive = false;
    this._phase = BattlePhase.END;

    let winner: EntityType | null = null;
    if (this._player?.isDead) {
      winner = EntityType.ENEMY;
    } else if (this._enemy?.isDead) {
      winner = EntityType.PLAYER;
    } else if (this._currentTurn >= this._maxTurns) {
      // 回合数耗尽，血量高者胜
      if (this._player && this._enemy) {
        const playerHpPercent = this._player.currentHealth / this._player.maxHealth;
        const enemyHpPercent = this._enemy.currentHealth / this._enemy.maxHealth;
        winner = playerHpPercent >= enemyHpPercent ? EntityType.PLAYER : EntityType.ENEMY;
      }
    }

    // 触发战斗结束事件
    this._emitEvent(BattleEventType.BATTLE_END, {
      winner,
      turns: this._currentTurn,
      player: this._player?.getStatus(),
      enemy: this._enemy?.getStatus()
    });

    console.log(`[BattleManager] 战斗结束，胜者: ${winner}`);

    // 清理
    this._cleanup();

    return { winner, turns: this._currentTurn };
  }

  /**
   * 清理战斗数据
   */
  private _cleanup(): void {
    if (this._player) {
      getCardSystem().unregisterDeck(this._player.id);
      getEffectSystem().clearAllEffects(this._player.id);
    }
    if (this._enemy) {
      getCardSystem().unregisterDeck(this._enemy.id);
      getEffectSystem().clearAllEffects(this._enemy.id);
    }

    this._playerSelectedCard = null;
    this._enemySelectedCard = null;
    this._playerConfirmed = false;
    this._enemyConfirmed = false;
  }

  // ==================== 回合管理 ====================

  /**
   * 开始新回合
   */
  private async _startNewTurn(): Promise<void> {
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

    // 触发回合开始时的效果
    await this._processTurnStartEffects(this._player);
    await this._processTurnStartEffects(this._enemy);

    // 抽牌
    getCardSystem().onTurnStart(this._player.id, this._drawCountPerTurn);
    getCardSystem().onTurnStart(this._enemy.id, this._drawCountPerTurn);

    // 触发回合开始事件
    this._emitEvent(BattleEventType.TURN_START, {
      turnNumber: this._currentTurn,
      player: this._player.getStatus(),
      enemy: this._enemy.getStatus()
    });

    // 检查冻结状态
    const playerFrozen = getEffectSystem().isFrozen(this._player.id);
    const enemyFrozen = getEffectSystem().isFrozen(this._enemy.id);

    if (playerFrozen) {
      console.log('[BattleManager] 玩家被冻结，跳过出牌');
      this._playerConfirmed = true;
    }

    if (enemyFrozen) {
      console.log('[BattleManager] 敌人被冻结，跳过出牌');
      this._enemyConfirmed = true;
    }

    // 敌人AI选择卡牌
    if (!enemyFrozen && this._enemy) {
      this._enemyAIPlayCard();
    }
  }

  /**
   * 处理回合开始效果
   */
  private async _processTurnStartEffects(entity: Entity): Promise<void> {
    const results = getEffectSystem().triggerEffectsByTiming(
      entity.id,
      EffectTrigger.ON_TURN_START
    );

    for (const result of results) {
      await this._applyEffectResult(entity, result.effect.type, result.value);
    }
  }

  /**
   * 结束当前回合
   */
  private async _endTurn(): Promise<void> {
    if (!this._player || !this._enemy) return;

    // 回合结束效果处理
    getEffectSystem().onTurnEnd(this._player.id);
    getEffectSystem().onTurnEnd(this._enemy.id);

    // 卡牌系统回合结束
    getCardSystem().onTurnEnd(this._player.id);
    getCardSystem().onTurnEnd(this._enemy.id);

    // 实体回合结束
    this._player.onTurnEnd();
    this._enemy.onTurnEnd();

    // 触发回合结束事件
    this._emitEvent(BattleEventType.TURN_END, {
      turnNumber: this._currentTurn,
      player: this._player.getStatus(),
      enemy: this._enemy.getStatus()
    });

    // 开始下一回合
    await this._startNewTurn();
  }

  // ==================== 出牌处理 ====================

  /**
   * 玩家选择卡牌
   */
  public playerSelectCard(cardInstanceId: string): boolean {
    if (!this._isBattleActive || !this._player || this._playerConfirmed) return false;

    const hand = getCardSystem().getHand(this._player.id);
    const card = hand.find(c => c.instanceId === cardInstanceId);

    if (!card) {
      console.warn('[BattleManager] 选择的卡牌不在手牌中');
      return false;
    }

    if (!this._player.canUseCard(card.data.energyCost)) {
      console.warn('[BattleManager] 能量不足');
      return false;
    }

    this._playerSelectedCard = card;

    // 触发卡牌选择事件
    this._emitEvent(BattleEventType.CARD_SELECTED, {
      entity: EntityType.PLAYER,
      card: card.data
    });

    console.log(`[BattleManager] 玩家选择卡牌: ${card.data.name}`);
    return true;
  }

  /**
   * 玩家确认出牌
   */
  public playerConfirmCard(): void {
    if (!this._playerSelectedCard || this._playerConfirmed) return;

    this._playerConfirmed = true;
    this._player.markCardPlayed();

    console.log('[BattleManager] 玩家确认出牌');

    // 检查是否双方都已确认
    this._checkBothConfirmed();
  }

  /**
   * 玩家跳过出牌
   */
  public playerSkipCard(): void {
    if (!this._player || this._playerConfirmed) return;

    this._playerSelectedCard = null;
    this._playerConfirmed = true;
    this._player.markCardPlayed();

    console.log('[BattleManager] 玩家跳过出牌');

    this._checkBothConfirmed();
  }

  /**
   * 敌人AI选择卡牌
   */
  private _enemyAIPlayCard(): void {
    if (!this._enemy || this._enemyConfirmed) return;

    const hand = getCardSystem().getHand(this._enemy.id);
    const playableCards = hand.filter(card =>
      this._enemy!.canUseCard(card.data.energyCost)
    );

    if (playableCards.length > 0) {
      // AI策略：优先选择高价值卡牌
      playableCards.sort((a, b) => b.data.baseValue - a.data.baseValue);
      const selectedCard = playableCards[0];

      this._enemySelectedCard = selectedCard;
      this._enemyConfirmed = true;
      this._enemy.markCardPlayed();

      console.log(`[BattleManager] 敌人选择卡牌: ${selectedCard.data.name}`);
    } else {
      console.log('[BattleManager] 敌人无牌可出');
      this._enemyConfirmed = true;
    }

    this._checkBothConfirmed();
  }

  /**
   * 检查双方是否都已确认
   */
  private _checkBothConfirmed(): void {
    if (this._playerConfirmed && this._enemyConfirmed) {
      // 延迟后开始结算，给UI反应时间
      setTimeout(() => {
        this._resolveTurn();
      }, 500);
    }
  }

  // ==================== 战斗结算 ====================

  /**
   * 执行回合结算
   */
  private async _resolveTurn(): Promise<void> {
    if (!this._player || !this._enemy) return;

    this._phase = BattlePhase.RESOLUTION;

    console.log('[BattleManager] ========== 开始结算 ==========');

    // 触发揭示阶段事件
    this._emitEvent(BattleEventType.CARD_REVEALED, {
      playerCard: this._playerSelectedCard?.data || null,
      enemyCard: this._enemySelectedCard?.data || null
    });

    // 延迟等待翻牌动画
    await delay(800);

    // 执行Roll点
    const playerRoll = this._playerSelectedCard
      ? getRollSystem().rollSync(this._playerSelectedCard.data.rollRange)
      : 0;
    const enemyRoll = this._enemySelectedCard
      ? getRollSystem().rollSync(this._enemySelectedCard.data.rollRange)
      : 0;

    // 触发Roll开始事件
    this._emitEvent(BattleEventType.ROLL_STARTED, {
      playerRollRange: this._playerSelectedCard?.data.rollRange || { min: 0, max: 0 },
      enemyRollRange: this._enemySelectedCard?.data.rollRange || { min: 0, max: 0 }
    });

    // 延迟等待Roll动画
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

    // 触发Roll完成事件
    this._emitEvent(BattleEventType.ROLL_COMPLETED, {
      playerRoll,
      enemyRoll,
      playerResult,
      enemyResult
    });

    console.log(`[BattleManager] 玩家最终值: ${playerResult.finalValue} (基础${playerResult.baseValue} + Roll${playerResult.rollValue} + Buff${playerResult.buffBonus} + 状态${playerResult.statusBonus} + 速度${playerResult.speedBonus})`);
    console.log(`[BattleManager] 敌人最终值: ${enemyResult.finalValue} (基础${enemyResult.baseValue} + Roll${enemyResult.rollValue} + Buff${enemyResult.buffBonus} + 状态${enemyResult.statusBonus} + 速度${enemyResult.speedBonus})`);

    // 判定胜负
    let winner: EntityType | null = null;
    let isPlayerDodge = false;
    let isEnemyDodge = false;

    // 检查闪避
    if (playerRoll <= this._dodgeThreshold && this._playerSelectedCard) {
      isPlayerDodge = true;
      console.log('[BattleManager] 玩家触发闪避！');
    }
    if (enemyRoll <= this._dodgeThreshold && this._enemySelectedCard) {
      isEnemyDodge = true;
      console.log('[BattleManager] 敌人触发闪避！');
    }

    // 比较最终值
    if (this._playerSelectedCard && !this._enemySelectedCard) {
      // 只有玩家出牌
      if (!isPlayerDodge) {
        winner = EntityType.PLAYER;
      }
    } else if (!this._playerSelectedCard && this._enemySelectedCard) {
      // 只有敌人出牌
      if (!isEnemyDodge) {
        winner = EntityType.ENEMY;
      }
    } else if (this._playerSelectedCard && this._enemySelectedCard) {
      // 双方都出牌
      if (isPlayerDodge && isEnemyDodge) {
        winner = null; // 双方都闪避
      } else if (isPlayerDodge) {
        winner = EntityType.ENEMY;
      } else if (isEnemyDodge) {
        winner = EntityType.PLAYER;
      } else {
        // 正常比较
        if (playerResult.finalValue > enemyResult.finalValue) {
          winner = EntityType.PLAYER;
        } else if (enemyResult.finalValue > playerResult.finalValue) {
          winner = EntityType.ENEMY;
        } else {
          // 平局，速度高者胜
          const playerSpeed = this._playerSelectedCard?.data.speed || 0;
          const enemySpeed = this._enemySelectedCard?.data.speed || 0;
          if (playerSpeed > enemySpeed) {
            winner = EntityType.PLAYER;
            console.log('[BattleManager] 平局，玩家速度优势获胜');
          } else if (enemySpeed > playerSpeed) {
            winner = EntityType.ENEMY;
            console.log('[BattleManager] 平局，敌人速度优势获胜');
          } else {
            winner = null; // 完全平局
            console.log('[BattleManager] 完全平局，双方卡牌失效');
          }
        }
      }
    }

    // 执行效果
    const result: PlayCardResult = {
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

    // 执行战斗效果
    await this._executeBattleEffects(result, playerResult, enemyResult);

    // 消耗能量
    if (this._playerSelectedCard) {
      this._player.consumeEnergy(this._playerSelectedCard.data.energyCost);
      getCardSystem().useCard(
        this._player.id,
        this._playerSelectedCard.instanceId,
        this._playerSelectedCard.data.energyCost
      );
    }
    if (this._enemySelectedCard) {
      this._enemy.consumeEnergy(this._enemySelectedCard.data.energyCost);
      getCardSystem().useCard(
        this._enemy.id,
        this._enemySelectedCard.instanceId,
        this._enemySelectedCard.data.energyCost
      );
    }

    // 触发结算完成事件
    this._emitEvent(BattleEventType.RESOLUTION_COMPLETED, result);

    // 延迟后结束回合
    await delay(1000);
    await this._endTurn();
  }

  /**
   * 计算最终值
   * 
   * 公式：
   * 最终值 = 基础值 + Roll值 + Buff加成 + 状态加成 + 速度加成
   */
  private _calculateFinalValue(
    card: CardInstance | null,
    entity: Entity,
    rollValue: number
  ): FinalValueResult {
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

    const baseValue = card.data.baseValue;

    // 检查暴击
    const isCrit = rollValue >= this._critThreshold;
    const critBonus = isCrit ? Math.floor(baseValue * (this._critMultiplier - 1)) : 0;

    // Buff加成（力量/敏捷等）
    let buffBonus = 0;
    const strengthEffects = getEffectSystem().getEffectsByType(entity.id, EffectType.STRENGTH);
    if (strengthEffects.length > 0) {
      buffBonus += strengthEffects.reduce((sum, e) => sum + e.value, 0);
    }

    // 状态加成（易伤等）
    let statusBonus = critBonus; // 暴击也算作状态加成

    // 速度加成
    const speedBonus = card.data.speed * this._speedBonusPerPoint;

    // 计算最终值
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

  /**
   * 执行战斗效果
   */
  private async _executeBattleEffects(
    result: PlayCardResult,
    playerResult: FinalValueResult,
    enemyResult: FinalValueResult
  ): Promise<void> {
    const { winner, isCrit, isDodge } = result;

    if (winner === EntityType.PLAYER && this._playerSelectedCard && this._player && this._enemy) {
      // 玩家获胜
      let damage = this._calculateDamage(
        this._playerSelectedCard,
        playerResult,
        this._player,
        this._enemy
      );

      // 应用暴击
      if (isCrit.player) {
        damage = Math.floor(damage * this._critMultiplier);
        console.log(`[BattleManager] 玩家暴击！伤害: ${damage}`);
      }

      // 造成伤害
      const damageResult = this._enemy.takeDamage(damage, this._player.id);
      result.damageDealt.enemy = damageResult.damageDealt;

      // 触发伤害事件
      this._emitEvent(BattleEventType.DAMAGE_DEALT, {
        source: EntityType.PLAYER,
        target: EntityType.ENEMY,
        damage: damageResult.damageDealt,
        isCrit: isCrit.player,
        isDodge: false
      });

      // 应用卡牌附加效果
      await this._applyCardEffects(this._playerSelectedCard, this._player, this._enemy);

    } else if (winner === EntityType.ENEMY && this._enemySelectedCard && this._player && this._enemy) {
      // 敌人获胜
      let damage = this._calculateDamage(
        this._enemySelectedCard,
        enemyResult,
        this._enemy,
        this._player
      );

      // 应用暴击
      if (isCrit.enemy) {
        damage = Math.floor(damage * this._critMultiplier);
        console.log(`[BattleManager] 敌人暴击！伤害: ${damage}`);
      }

      // 造成伤害
      const damageResult = this._player.takeDamage(damage, this._enemy.id);
      result.damageDealt.player = damageResult.damageDealt;

      // 触发伤害事件
      this._emitEvent(BattleEventType.DAMAGE_DEALT, {
        source: EntityType.ENEMY,
        target: EntityType.PLAYER,
        damage: damageResult.damageDealt,
        isCrit: isCrit.enemy,
        isDodge: false
      });

      // 应用卡牌附加效果
      await this._applyCardEffects(this._enemySelectedCard, this._enemy, this._player);
    }

    // 检查死亡
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

  /**
   * 计算伤害
   */
  private _calculateDamage(
    card: CardInstance,
    result: FinalValueResult,
    attacker: Entity,
    defender: Entity
  ): number {
    // 基础伤害使用最终值
    let damage = result.finalValue;

    // 效果系统计算伤害修正（攻击方）
    damage = getEffectSystem().calculateDamageModifier(attacker.id, damage, true);

    // 效果系统计算伤害修正（防御方）
    damage = getEffectSystem().calculateDamageModifier(defender.id, damage, false);

    return Math.max(0, Math.floor(damage));
  }

  /**
   * 应用卡牌效果
   */
  private async _applyCardEffects(
    card: CardInstance,
    user: Entity,
    target: Entity
  ): Promise<void> {
    for (const effect of card.data.effects) {
      const targetId = effect.type === EffectType.SHIELD ||
        effect.type === EffectType.HEAL ||
        effect.type === EffectType.STRENGTH ||
        effect.type === EffectType.DEXTERITY
        ? user.id
        : target.id;

      getEffectSystem().addEffect(targetId, effect, user.id);

      this._emitEvent(BattleEventType.EFFECT_APPLIED, {
        effect,
        target: targetId,
        source: user.id
      });
    }
  }

  /**
   * 应用效果结果
   */
  private async _applyEffectResult(entity: Entity, effectType: EffectType, value: number): Promise<void> {
    switch (effectType) {
      case EffectType.BLEEDING:
      case EffectType.BURNING:
      case EffectType.DAMAGE:
        entity.takeDamage(value, 'effect');
        break;
      case EffectType.HEAL:
        entity.heal(value);
        break;
      case EffectType.ENERGY:
        entity.restoreEnergy(value);
        break;
    }
  }

  // ==================== 战斗检查 ====================

  /**
   * 检查战斗是否结束
   */
  private _checkBattleEnd(): boolean {
    if (!this._player || !this._enemy) return true;
    return this._player.isDead || this._enemy.isDead || this._currentTurn >= this._maxTurns;
  }

  // ==================== 事件系统 ====================

  /**
   * 添加事件监听
   */
  public addEventListener(eventType: BattleEventType, callback: (event: BattleEvent) => void): void {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, new Set());
    }
    this._eventListeners.get(eventType)!.add(callback);
  }

  /**
   * 移除事件监听
   */
  public removeEventListener(eventType: BattleEventType, callback: (event: BattleEvent) => void): void {
    const listeners = this._eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private _emitEvent(type: BattleEventType, data: any): void {
    const event: BattleEvent = {
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

  // ==================== Getters ====================

  get phase(): BattlePhase { return this._phase; }
  get currentTurn(): number { return this._currentTurn; }
  get isBattleActive(): boolean { return this._isBattleActive; }
  get player(): Entity | null { return this._player; }
  get enemy(): Entity | null { return this._enemy; }
  get playerSelectedCard(): CardInstance | null { return this._playerSelectedCard; }
  get enemySelectedCard(): CardInstance | null { return this._enemySelectedCard; }
  get playerConfirmed(): boolean { return this._playerConfirmed; }
  get enemyConfirmed(): boolean { return this._enemyConfirmed; }

  /**
   * 重置管理器
   */
  public reset(): void {
    this._cleanup();
    this._phase = BattlePhase.INIT;
    this._currentTurn = 0;
    this._isBattleActive = false;
    this._player = null;
    this._enemy = null;
    this._eventListeners.clear();
    console.log('[BattleManager] 已重置');
  }

  /**
   * 销毁单例
   */
  public static destroy(): void {
    if (BattleManager._instance) {
      BattleManager._instance.reset();
      BattleManager._instance = null;
      console.log('[BattleManager] 单例已销毁');
    }
  }
}

// 导出便捷获取函数
export const getBattleManager = (): BattleManager => BattleManager.getInstance();
