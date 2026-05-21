/**
 * BattleManager 战斗管理器
 *
 * 职责：
 * 1. 管理整个战斗流程
 * 2. 协调各个系统（CardSystem、RollSystem、EffectSystem）
 * 3. 处理回合制逻辑
 * 4. 执行卡牌对比和结算
 * 5. 触发战斗事件
 *
 * 战斗流程：
 * 1. 初始化 -> 双方抽牌
 * 2. 玩家选择卡牌 -> 敌人AI选择卡牌
 * 3. 同时Roll点
 * 4. 比较最终值，大的一方生效
 * 5. 结算效果（伤害、治疗、状态等）
 * 6. 检查胜负 -> 进入下一回合
 */

import {
    BattlePhase,
    BattleEvent,
    BattleEventType,
    EntityType,
    CardInstance,
    PlayCardResult,
    EffectTrigger,
    EffectType,
    CardType
} from '../types/GameTypes';
import { Entity } from '../entities/Entity';
import { getCardSystem } from '../systems/CardSystem';
import { getRollSystem } from '../systems/RollSystem';
import { getEffectSystem } from '../systems/EffectSystem';
import { delay } from '../utils/Utils';

/**
 * 战斗配置
 */
export interface BattleConfig {
    player: Entity;
    enemy: Entity;
    drawCountPerTurn: number;        // 每回合抽牌数
    firstTurn: EntityType;           // 先手方
}

/**
 * 回合结果
 */
export interface TurnResult {
    turnNumber: number;
    playerCard: CardInstance | null;
    enemyCard: CardInstance | null;
    playerRoll: number;
    enemyRoll: number;
    winner: EntityType | null;
    damageDealt: { player: number; enemy: number };
    effectsApplied: string[];
}

/**
 * 战斗结果
 */
export interface BattleResult {
    winner: EntityType | null;
    turns: number;
    playerRemainingHealth: number;
    enemyRemainingHealth: number;
}

export class BattleManager {
    private static _instance: BattleManager | null = null;

    // 战斗状态
    private _phase: BattlePhase = BattlePhase.INIT;
    private _player: Entity | null = null;
    private _enemy: Entity | null = null;
    private _currentTurn: number = 0;
    private _drawCountPerTurn: number = 5;

    // 事件监听
    private _eventListeners: Map<BattleEventType, Set<(event: BattleEvent) => void>> = new Map();

    // 当前回合出牌
    private _playerSelectedCard: CardInstance | null = null;
    private _enemySelectedCard: CardInstance | null = null;

    // 战斗是否进行中
    private _isBattleActive: boolean = false;

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
     * @param config 战斗配置
     */
    public async startBattle(config: BattleConfig): Promise<void> {
        console.log('[BattleManager] ========== 战斗开始 ==========');

        this._player = config.player;
        this._enemy = config.enemy;
        this._drawCountPerTurn = config.drawCountPerTurn;
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
     * @returns 战斗结果
     */
    public endBattle(): BattleResult {
        this._isBattleActive = false;
        this._phase = BattlePhase.END;

        let winner: EntityType | null = null;
        if (this._player?.isDead) {
            winner = EntityType.ENEMY;
        } else if (this._enemy?.isDead) {
            winner = EntityType.PLAYER;
        }

        const result: BattleResult = {
            winner,
            turns: this._currentTurn,
            playerRemainingHealth: this._player?.currentHealth || 0,
            enemyRemainingHealth: this._enemy?.currentHealth || 0
        };

        // 触发战斗结束事件
        this._emitEvent(BattleEventType.BATTLE_END, result);

        console.log('[BattleManager] ========== 战斗结束 ==========');
        console.log(`[BattleManager] 胜者: ${winner}, 回合数: ${this._currentTurn}`);

        // 清理
        this._cleanup();

        return result;
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

        console.log(`[BattleManager] ========== 回合 ${this._currentTurn} ==========`);

        // 双方回合开始处理
        this._player.onTurnStart();
        this._enemy.onTurnStart();

        // 触发回合开始时的效果
        this._processTurnStartEffects(this._player);
        this._processTurnStartEffects(this._enemy);

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
            this._player.markCardPlayed();
        }

        if (enemyFrozen) {
            console.log('[BattleManager] 敌人被冻结，跳过出牌');
            this._enemy.markCardPlayed();
        }

        // 敌人AI选择卡牌
        if (!enemyFrozen && this._enemy) {
            this._enemyAIPlayCard();
        }
    }

    /**
     * 处理回合开始效果
     */
    private _processTurnStartEffects(entity: Entity): void {
        const results = getEffectSystem().triggerEffectsByTiming(
            entity.id,
            EffectTrigger.ON_TURN_START
        );

        for (const result of results) {
            this._applyEffectResult(entity, result.effect.type, result.value);
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

        // 开始下一回合
        await this._startNewTurn();
    }

    // ==================== 出牌处理 ====================

    /**
     * 玩家选择卡牌
     * @param cardInstanceId 卡牌实例ID
     * @returns 是否成功
     */
    public playerSelectCard(cardInstanceId: string): boolean {
        if (!this._isBattleActive || !this._player) return false;
        if (this._player.hasPlayedCard) return false;

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
        this._player.selectCard(cardInstanceId);

        console.log(`[BattleManager] 玩家选择卡牌: ${card.data.name}`);

        // 检查是否双方都已出牌
        this._checkBothCardsPlayed();

        return true;
    }

    /**
     * 玩家跳过出牌
     */
    public playerSkipCard(): void {
        if (!this._player || this._player.hasPlayedCard) return;

        this._playerSelectedCard = null;
        this._player.markCardPlayed();

        console.log('[BattleManager] 玩家跳过出牌');

        this._checkBothCardsPlayed();
    }

    /**
     * 敌人AI选择卡牌
     */
    private _enemyAIPlayCard(): void {
        if (!this._enemy) return;

        const hand = getCardSystem().getHand(this._enemy.id);

        // 简单AI：随机选择一张能用的牌
        const playableCards = hand.filter(card =>
            this._enemy!.canUseCard(card.data.energyCost)
        );

        if (playableCards.length > 0) {
            const randomIndex = Math.floor(Math.random() * playableCards.length);
            const selectedCard = playableCards[randomIndex];

            this._enemySelectedCard = selectedCard;
            this._enemy.selectCard(selectedCard.instanceId);

            console.log(`[BattleManager] 敌人选择卡牌: ${selectedCard.data.name}`);
        } else {
            console.log('[BattleManager] 敌人无牌可出');
            this._enemy.markCardPlayed();
        }

        this._checkBothCardsPlayed();
    }

    /**
     * 检查双方是否都已出牌
     */
    private _checkBothCardsPlayed(): void {
        if (!this._player || !this._enemy) return;

        const playerReady = this._player.hasPlayedCard || this._playerSelectedCard !== null;
        const enemyReady = this._enemy.hasPlayedCard || this._enemySelectedCard !== null;

        if (playerReady && enemyReady) {
            // 双方都已准备，执行结算
            this._resolveTurn();
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

        // 执行Roll点
        const playerRoll = this._playerSelectedCard
            ? getRollSystem().rollSync(this._playerSelectedCard.data.rollRange)
            : 0;
        const enemyRoll = this._enemySelectedCard
            ? getRollSystem().rollSync(this._enemySelectedCard.data.rollRange)
            : 0;

        // 计算最终值
        const playerBaseValue = this._playerSelectedCard?.data.baseValue || 0;
        const enemyBaseValue = this._enemySelectedCard?.data.baseValue || 0;

        // 效果系统计算伤害修正（攻击方）
        const playerFinalValue = this._playerSelectedCard
            ? getRollSystem().calculateFinalValue(playerBaseValue, playerRoll)
            : 0;
        const enemyFinalValue = this._enemySelectedCard
            ? getRollSystem().calculateFinalValue(enemyBaseValue, enemyRoll)
            : 0;

        // 触发Roll完成事件
        this._emitEvent(BattleEventType.ROLL_COMPLETED, {
            playerRoll,
            enemyRoll,
            playerFinalValue,
            enemyFinalValue
        });

        console.log(`[BattleManager] 玩家: ${playerBaseValue}+${playerRoll}=${playerFinalValue}`);
        console.log(`[BattleManager] 敌人: ${enemyBaseValue}+${enemyRoll}=${enemyFinalValue}`);

        // 比较并执行效果
        let winner: EntityType | null = null;

        if (this._playerSelectedCard && !this._enemySelectedCard) {
            // 只有玩家出牌
            winner = EntityType.PLAYER;
            await this._executeCardEffect(this._playerSelectedCard, this._player, this._enemy);
        } else if (!this._playerSelectedCard && this._enemySelectedCard) {
            // 只有敌人出牌
            winner = EntityType.ENEMY;
            await this._executeCardEffect(this._enemySelectedCard, this._enemy, this._player);
        } else if (this._playerSelectedCard && this._enemySelectedCard) {
            // 双方都出牌，比较最终值
            if (playerFinalValue > enemyFinalValue) {
                winner = EntityType.PLAYER;
                await this._executeCardEffect(this._playerSelectedCard, this._player, this._enemy);
                console.log('[BattleManager] 玩家获胜，卡牌生效');
            } else if (enemyFinalValue > playerFinalValue) {
                winner = EntityType.ENEMY;
                await this._executeCardEffect(this._enemySelectedCard, this._enemy, this._player);
                console.log('[BattleManager] 敌人获胜，卡牌生效');
            } else {
                // 平局，双方卡牌都失效
                winner = null;
                console.log('[BattleManager] 平局，双方卡牌失效');
            }

            // 消耗能量
            this._player.consumeEnergy(this._playerSelectedCard.data.energyCost);
            this._enemy.consumeEnergy(this._enemySelectedCard.data.energyCost);
        }

        // 标记已出牌
        if (this._playerSelectedCard) {
            getCardSystem().useCard(
                this._player.id,
                this._playerSelectedCard.instanceId,
                this._playerSelectedCard.data.energyCost
            );
        }
        if (this._enemySelectedCard) {
            getCardSystem().useCard(
                this._enemy.id,
                this._enemySelectedCard.instanceId,
                this._enemySelectedCard.data.energyCost
            );
        }

        this._player.markCardPlayed();
        this._enemy.markCardPlayed();

        // 回合结果
        const turnResult: TurnResult = {
            turnNumber: this._currentTurn,
            playerCard: this._playerSelectedCard,
            enemyCard: this._enemySelectedCard,
            playerRoll,
            enemyRoll,
            winner,
            damageDealt: { player: 0, enemy: 0 },
            effectsApplied: []
        };

        // 延迟后结束回合
        await delay(1000);
        await this._endTurn();
    }

    /**
     * 执行卡牌效果
     */
    private async _executeCardEffect(
        card: CardInstance,
        user: Entity,
        target: Entity
    ): Promise<void> {
        console.log(`[BattleManager] 执行卡牌效果: ${card.data.name}`);

        // 触发卡牌打出事件
        this._emitEvent(BattleEventType.CARD_PLAYED, {
            card: card.data,
            user: user.getStatus(),
            target: target.getStatus()
        });

        // 根据卡牌类型执行不同效果
        switch (card.data.type) {
            case CardType.ATTACK:
                await this._executeAttackEffect(card, user, target);
                break;
            case CardType.DEFENSE:
                await this._executeDefenseEffect(card, user);
                break;
            case CardType.SKILL:
                await this._executeSkillEffect(card, user, target);
                break;
            case CardType.POWER:
                await this._executePowerEffect(card, user);
                break;
        }

        // 执行附加效果
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
     * 执行攻击效果
     */
    private async _executeAttackEffect(
        card: CardInstance,
        attacker: Entity,
        target: Entity
    ): Promise<void> {
        // 计算基础伤害
        let damage = card.data.baseValue;

        // 效果系统计算伤害修正（攻击方）
        damage = getEffectSystem().calculateDamageModifier(attacker.id, damage, true);

        // 造成伤害
        const result = target.takeDamage(damage, attacker.id);

        this._emitEvent(BattleEventType.DAMAGE_DEALT, {
            damage: result.damageDealt,
            source: attacker.id,
            target: target.id,
            blocked: result.damageBlocked
        });

        if (result.targetDied) {
            this._emitEvent(BattleEventType.ENTITY_DIED, {
                entity: target.getStatus()
            });
        }
    }

    /**
     * 执行防御效果
     */
    private async _executeDefenseEffect(
        card: CardInstance,
        user: Entity
    ): Promise<void> {
        // 添加护盾
        user.addShield(card.data.baseValue);
    }

    /**
     * 执行技能效果
     */
    private async _executeSkillEffect(
        card: CardInstance,
        user: Entity,
        target: Entity
    ): Promise<void> {
        // 技能效果由附加效果处理
        console.log(`[BattleManager] 技能效果: ${card.data.name}`);
    }

    /**
     * 执行能力效果
     */
    private async _executePowerEffect(
        card: CardInstance,
        user: Entity
    ): Promise<void> {
        // 能力效果由附加效果处理（通常是永久效果）
        console.log(`[BattleManager] 能力效果: ${card.data.name}`);
    }

    /**
     * 应用效果结果
     */
    private _applyEffectResult(entity: Entity, effectType: EffectType, value: number): void {
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
        return this._player.isDead || this._enemy.isDead;
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
