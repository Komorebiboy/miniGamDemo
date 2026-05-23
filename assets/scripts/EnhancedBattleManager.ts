/**
 * 增强版战斗管理器
 * 
 * 新特性：
 * 1. Roll品质系统 - 根据Roll值触发不同效果
 * 2. 不出牌机制 - 防御姿态+下回合加成
 * 3. 速度机制 - 速度差≥5时高速牌优先
 * 4. 反制系统 - 偏转、赌徒狂笑、失衡等
 * 5. 爆点机制 - 连续压制获得加成
 * 6. AI性格系统 - 狂战士、机械体、赌徒、法师
 */

import {
    BattlePhase,
    BattleEventType,
    EntityType,
    CardInstance,
    EffectType,
    EffectTrigger,
    CardType
} from './types/GameTypes';
import { Entity } from './entities/Entity';
import { getCardSystem } from './systems/CardSystem';
import { getRollSystem } from './systems/RollSystem';
import { getEffectSystem } from './systems/EffectSystem';
import { delay, generateId } from './utils/Utils';
import {
    EnhancedCardData,
    RollQualityEffect,
    getRollQuality,
    getRollQualityName,
    getRollQualityColor,
    RollQuality
} from './data/EnhancedCardDatabase';

// ==================== AI性格枚举 ====================
export enum AIType {
    BERSERKER = 'BERSERKER',   // 狂战士 - 高风险牌
    MACHINE = 'MACHINE',       // 机械体 - 稳定Roll
    GAMBLER = 'GAMBLER',       // 赌徒 - 赌博牌
    MAGE = 'MAGE'              // 法师 - 蓄力与状态
}

// ==================== 爆点状态 ====================
export interface BurstState {
    consecutiveWins: number;      // 连续胜利次数
    isBurstMode: boolean;         // 是否处于爆点状态
    burstBonus: number;           // 爆点加成
    rollMaxBonus: number;         // Roll上限加成
}

// ==================== 防御姿态 ====================
export interface DefenseStance {
    isInDefense: boolean;         // 是否处于防御姿态
    nextRollBonus: number;        // 下回合Roll加成
    shieldGained: number;         // 获得的护盾
}

// ==================== 战斗配置 ====================
export interface EnhancedBattleConfig {
    player: Entity;
    enemy: Entity;
    drawCountPerTurn: number;
    maxTurns: number;
    aiType?: AIType;
}

// ==================== 增强回合结果 ====================
export interface EnhancedTurnResult {
    turnNumber: number;
    playerCard: EnhancedCardData | null;
    enemyCard: EnhancedCardData | null;
    playerRoll: number;
    enemyRoll: number;
    playerFinalValue: number;
    enemyFinalValue: number;
    winner: EntityType | null;
    rollQualityEffect?: RollQualityEffect;
    counterTriggered?: string;
    isSpeedPriority?: boolean;
    isBurstTriggered?: boolean;
}

export class EnhancedBattleManager {
    private static _instance: EnhancedBattleManager | null = null;

    // 战斗状态
    private _phase: BattlePhase = BattlePhase.INIT;
    private _player: Entity | null = null;
    private _enemy: Entity | null = null;
    private _currentTurn: number = 0;
    private _maxTurns: number = 50;
    private _drawCountPerTurn: number = 5;

    // 当前回合数据
    private _playerSelectedCard: EnhancedCardData | null = null;
    private _enemySelectedCard: EnhancedCardData | null = null;
    private _playerConfirmed: boolean = false;
    private _enemyConfirmed: boolean = false;

    // 新系统状态
    private _playerDefenseStance: DefenseStance = { isInDefense: false, nextRollBonus: 0, shieldGained: 0 };
    private _enemyDefenseStance: DefenseStance = { isInDefense: false, nextRollBonus: 0, shieldGained: 0 };
    private _playerBurst: BurstState = { consecutiveWins: 0, isBurstMode: false, burstBonus: 0, rollMaxBonus: 0 };
    private _enemyBurst: BurstState = { consecutiveWins: 0, isBurstMode: false, burstBonus: 0, rollMaxBonus: 0 };

    // AI类型
    private _aiType: AIType = AIType.BERSERKER;

    // 事件监听
    private _eventListeners: Map<BattleEventType, Set<(event: any) => void>> = new Map();

    // 战斗是否进行中
    private _isBattleActive: boolean = false;

    // 配置
    private _critThreshold: number = 95;
    private _dodgeThreshold: number = 3;
    private _critMultiplier: number = 1.5;
    private _speedBonusPerPoint: number = 2;
    private _speedPriorityThreshold: number = 5; // 速度差阈值
    private _burstThreshold: number = 3; // 爆点触发阈值

    public static getInstance(): EnhancedBattleManager {
        if (!EnhancedBattleManager._instance) {
            EnhancedBattleManager._instance = new EnhancedBattleManager();
        }
        return EnhancedBattleManager._instance;
    }

    private constructor() {
        console.log('[EnhancedBattleManager] 初始化');
    }

    // ==================== 战斗生命周期 ====================

    public async startBattle(config: EnhancedBattleConfig): Promise<void> {
        console.log('[EnhancedBattleManager] ========== 战斗开始 ==========');

        this._player = config.player;
        this._enemy = config.enemy;
        this._drawCountPerTurn = config.drawCountPerTurn;
        this._maxTurns = config.maxTurns;
        this._aiType = config.aiType || AIType.BERSERKER;
        this._currentTurn = 0;
        this._isBattleActive = true;

        // 重置状态
        this._resetBurstState();
        this._resetDefenseStance();

        // 初始化牌组
        getCardSystem().registerDeck(this._player.id, this._player.deck);
        getCardSystem().registerDeck(this._enemy.id, this._enemy.deck);

        this._emitEvent(BattleEventType.BATTLE_START, {
            player: this._player.getStatus(),
            enemy: this._enemy.getStatus(),
            aiType: this._aiType
        });

        await this._startNewTurn();
    }

    private _resetBurstState(): void {
        this._playerBurst = { consecutiveWins: 0, isBurstMode: false, burstBonus: 0, rollMaxBonus: 0 };
        this._enemyBurst = { consecutiveWins: 0, isBurstMode: false, burstBonus: 0, rollMaxBonus: 0 };
    }

    private _resetDefenseStance(): void {
        this._playerDefenseStance = { isInDefense: false, nextRollBonus: 0, shieldGained: 0 };
        this._enemyDefenseStance = { isInDefense: false, nextRollBonus: 0, shieldGained: 0 };
    }

    // ==================== 回合管理 ====================

    private async _startNewTurn(): Promise<void> {
        if (!this._isBattleActive || !this._player || !this._enemy) return;

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

        console.log(`[EnhancedBattleManager] ========== 回合 ${this._currentTurn} ==========`);

        // 应用防御姿态的Roll加成
        this._applyDefenseStanceBonus();

        // 回合开始处理
        this._player.onTurnStart();
        this._enemy.onTurnStart();

        await this._processTurnStartEffects(this._player);
        await this._processTurnStartEffects(this._enemy);

        // 抽牌
        getCardSystem().onTurnStart(this._player.id, this._drawCountPerTurn);
        getCardSystem().onTurnStart(this._enemy.id, this._drawCountPerTurn);

        this._emitEvent(BattleEventType.TURN_START, {
            turnNumber: this._currentTurn,
            player: this._player.getStatus(),
            enemy: this._enemy.getStatus(),
            playerBurst: this._playerBurst,
            enemyBurst: this._enemyBurst
        });

        // 检查冻结
        const playerFrozen = getEffectSystem().isFrozen(this._player.id);
        const enemyFrozen = getEffectSystem().isFrozen(this._enemy.id);

        if (playerFrozen) {
            console.log('[EnhancedBattleManager] 玩家被冻结，跳过出牌');
            this._playerConfirmed = true;
        }

        if (enemyFrozen) {
            console.log('[EnhancedBattleManager] 敌人被冻结，跳过出牌');
            this._enemyConfirmed = true;
        }

        // AI选牌
        if (!enemyFrozen && this._enemy) {
            this._enemyAIPlayCard();
        }
    }

    private _applyDefenseStanceBonus(): void {
        // 应用并清空防御姿态加成
        if (this._playerDefenseStance.nextRollBonus > 0) {
            console.log(`[EnhancedBattleManager] 玩家获得防御姿态Roll加成: +${this._playerDefenseStance.nextRollBonus}`);
            this._playerDefenseStance.nextRollBonus = 0;
        }
        if (this._enemyDefenseStance.nextRollBonus > 0) {
            console.log(`[EnhancedBattleManager] 敌人获得防御姿态Roll加成: +${this._enemyDefenseStance.nextRollBonus}`);
            this._enemyDefenseStance.nextRollBonus = 0;
        }
    }

    private async _processTurnStartEffects(entity: Entity): Promise<void> {
        const results = getEffectSystem().triggerEffectsByTiming(
            entity.id,
            EffectTrigger.ON_TURN_START
        );

        for (const result of results) {
            await this._applyEffectResult(entity, result.effect.type, result.value);
        }
    }

    // ==================== 出牌处理 ====================

    public playerSelectCard(cardInstanceId: string): boolean {
        if (!this._isBattleActive || !this._player || this._playerConfirmed) return false;

        const hand = getCardSystem().getHand(this._player.id);
        const card = hand.find(c => c.instanceId === cardInstanceId);

        if (!card) {
            console.warn('[EnhancedBattleManager] 选择的卡牌不在手牌中');
            return false;
        }

        this._playerSelectedCard = card as EnhancedCardData;

        this._emitEvent(BattleEventType.CARD_SELECTED, {
            entity: EntityType.PLAYER,
            card: this._playerSelectedCard
        });

        console.log(`[EnhancedBattleManager] 玩家选择卡牌: ${this._playerSelectedCard.name}`);
        return true;
    }

    public playerConfirmCard(): void {
        if (!this._playerSelectedCard || this._playerConfirmed) return;

        this._playerConfirmed = true;
        this._player.markCardPlayed();

        console.log('[EnhancedBattleManager] 玩家确认出牌');
        this._checkBothConfirmed();
    }

    /**
     * 不出牌 - 进入防御姿态
     */
    public playerSkipCard(): void {
        if (!this._player || this._playerConfirmed) return;

        this._playerSelectedCard = null;
        this._playerConfirmed = true;
        this._player.markCardPlayed();

        // 进入防御姿态
        this._enterDefenseStance(EntityType.PLAYER);

        console.log('[EnhancedBattleManager] 玩家进入防御姿态');
        this._checkBothConfirmed();
    }

    private _enterDefenseStance(entityType: EntityType): void {
        const stance = entityType === EntityType.PLAYER ? this._playerDefenseStance : this._enemyDefenseStance;
        const entity = entityType === EntityType.PLAYER ? this._player : this._enemy;

        stance.isInDefense = true;
        stance.shieldGained = 5;
        stance.nextRollBonus = 3;

        // 立即获得护盾
        if (entity) {
            entity.addShield(stance.shieldGained);
        }

        this._emitEvent(BattleEventType.SHIELD_CHANGED, {
            entity: entityType,
            shield: entity?.shield || 0,
            isDefenseStance: true
        });
    }

    // ==================== AI系统 ====================

    private _enemyAIPlayCard(): void {
        if (!this._enemy || this._enemyConfirmed) return;

        const hand = getCardSystem().getHand(this._enemy.id) as EnhancedCardData[];

        if (hand.length === 0) {
            console.log('[EnhancedBattleManager] 敌人无牌可出，进入防御姿态');
            this._enterDefenseStance(EntityType.ENEMY);
            this._enemyConfirmed = true;
            this._checkBothConfirmed();
            return;
        }

        // 所有手牌都可以出
        const playableCards = hand;

        // 根据AI类型选择卡牌
        let selectedCard: EnhancedCardData | null = null;

        switch (this._aiType) {
            case AIType.BERSERKER:
                selectedCard = this._berserkerAI(playableCards);
                break;
            case AIType.MACHINE:
                selectedCard = this._machineAI(playableCards);
                break;
            case AIType.GAMBLER:
                selectedCard = this._gamblerAI(playableCards);
                break;
            case AIType.MAGE:
                selectedCard = this._mageAI(playableCards);
                break;
            default:
                selectedCard = this._defaultAI(playableCards);
        }

        if (selectedCard) {
            this._enemySelectedCard = selectedCard;
            this._enemyConfirmed = true;
            this._enemy.markCardPlayed();
            console.log(`[EnhancedBattleManager] 敌人(${this._aiType})选择卡牌: ${selectedCard.name}`);
        } else {
            this._enterDefenseStance(EntityType.ENEMY);
            this._enemyConfirmed = true;
        }

        this._checkBothConfirmed();
    }

    // 狂战士AI - 偏好高风险牌（大Roll范围）
    private _berserkerAI(cards: EnhancedCardData[]): EnhancedCardData | null {
        // 优先选择Roll范围大的牌
        const sorted = [...cards].sort((a, b) => {
            const rangeA = a.rollRange.max - a.rollRange.min;
            const rangeB = b.rollRange.max - b.rollRange.min;
            return rangeB - rangeA;
        });
        return sorted[0] || null;
    }

    // 机械体AI - 偏好稳定Roll
    private _machineAI(cards: EnhancedCardData[]): EnhancedCardData | null {
        // 优先选择Roll范围小的牌
        const sorted = [...cards].sort((a, b) => {
            const rangeA = a.rollRange.max - a.rollRange.min;
            const rangeB = b.rollRange.max - b.rollRange.min;
            return rangeA - rangeB;
        });
        return sorted[0] || null;
    }

    // 赌徒AI - 极高概率使用赌博牌
    private _gamblerAI(cards: EnhancedCardData[]): EnhancedCardData | null {
        // 优先选择有赌博标签的牌
        const gambleCards = cards.filter(c => c.tags?.includes('GAMBLE' as any));
        if (gambleCards.length > 0) {
            return gambleCards[Math.floor(Math.random() * gambleCards.length)];
        }
        // 否则选择Roll范围最大的
        return this._berserkerAI(cards);
    }

    // 法师AI - 喜欢蓄力与状态叠加
    private _mageAI(cards: EnhancedCardData[]): EnhancedCardData | null {
        // 优先选择有效果的牌（流血、点燃等）
        const effectCards = cards.filter(c => c.effects && c.effects.length > 0);
        if (effectCards.length > 0) {
            return effectCards[Math.floor(Math.random() * effectCards.length)];
        }
        // 其次选择重型牌
        const heavyCards = cards.filter(c => c.tags?.includes('HEAVY' as any));
        if (heavyCards.length > 0) {
            return heavyCards[Math.floor(Math.random() * heavyCards.length)];
        }
        return this._defaultAI(cards);
    }

    private _defaultAI(cards: EnhancedCardData[]): EnhancedCardData | null {
        // 默认：随机选择
        return cards[Math.floor(Math.random() * cards.length)] || null;
    }

    // ==================== 战斗结算 ====================

    private _checkBothConfirmed(): void {
        if (this._playerConfirmed && this._enemyConfirmed) {
            setTimeout(() => {
                this._resolveTurn();
            }, 500);
        }
    }

    private async _resolveTurn(): Promise<void> {
        if (!this._player || !this._enemy) return;

        this._phase = BattlePhase.RESOLUTION;
        console.log('[EnhancedBattleManager] ========== 开始结算 ==========');

        // 触发揭示事件
        this._emitEvent(BattleEventType.CARD_REVEALED, {
            playerCard: this._playerSelectedCard,
            enemyCard: this._enemySelectedCard
        });

        await delay(800);

        // 执行Roll点
        let playerRoll = this._playerSelectedCard
            ? this._rollWithBonus(this._playerSelectedCard, EntityType.PLAYER)
            : 0;
        let enemyRoll = this._enemySelectedCard
            ? this._rollWithBonus(this._enemySelectedCard, EntityType.ENEMY)
            : 0;

        // Roll点动画事件
        this._emitEvent(BattleEventType.ROLL_STARTED, {
            playerRollRange: this._playerSelectedCard?.rollRange || { min: 0, max: 0 },
            enemyRollRange: this._enemySelectedCard?.rollRange || { min: 0, max: 0 },
            playerRoll,
            enemyRoll
        });

        await delay(1500);

        // 检查Roll品质
        const playerQuality = this._playerSelectedCard?.rollQualityEffects
            ? getRollQuality(playerRoll, this._playerSelectedCard.rollQualityEffects)
            : null;
        const enemyQuality = this._enemySelectedCard?.rollQualityEffects
            ? getRollQuality(enemyRoll, this._enemySelectedCard.rollQualityEffects)
            : null;

        // 计算最终值（Roll结果就是伤害，没有基础攻击力）
        const playerFinalValue = playerRoll;
        const enemyFinalValue = enemyRoll;

        // 触发Roll完成事件
        this._emitEvent(BattleEventType.ROLL_COMPLETED, {
            playerRoll,
            enemyRoll,
            playerFinalValue,
            enemyFinalValue,
            playerQuality,
            enemyQuality
        });

        // 判定胜负
        let winner: EntityType | null = null;
        let isSpeedPriority = false;
        let counterTriggered: string | undefined;

        // 检查速度优先
        if (this._playerSelectedCard && this._enemySelectedCard) {
            const speedDiff = Math.abs(this._playerSelectedCard.speed - this._enemySelectedCard.speed);
            if (speedDiff >= this._speedPriorityThreshold) {
                isSpeedPriority = true;
                const faster = this._playerSelectedCard.speed > this._enemySelectedCard.speed
                    ? EntityType.PLAYER : EntityType.ENEMY;
                console.log(`[EnhancedBattleManager] 速度优先触发: ${faster}`);
            }
        }

        // 检查反制效果
        counterTriggered = this._checkCounterEffects(playerRoll, enemyRoll);

        // 判定胜负
        if (this._playerSelectedCard && !this._enemySelectedCard) {
            winner = EntityType.PLAYER;
        } else if (!this._playerSelectedCard && this._enemySelectedCard) {
            winner = EntityType.ENEMY;
        } else if (this._playerSelectedCard && this._enemySelectedCard) {
            // 双方都出牌，比较Roll值
            if (playerFinalValue > enemyFinalValue) {
                winner = EntityType.PLAYER;
            } else if (enemyFinalValue > playerFinalValue) {
                winner = EntityType.ENEMY;
            } else {
                // 平局，速度高者胜
                winner = this._playerSelectedCard.speed >= this._enemySelectedCard.speed
                    ? EntityType.PLAYER : EntityType.ENEMY;
            }
        }

        // 更新爆点状态
        this._updateBurstState(winner);

        // 执行效果
        const result: EnhancedTurnResult = {
            turnNumber: this._currentTurn,
            playerCard: this._playerSelectedCard,
            enemyCard: this._enemySelectedCard,
            playerRoll,
            enemyRoll,
            playerFinalValue,
            enemyFinalValue,
            winner,
            rollQualityEffect: playerQuality || enemyQuality || undefined,
            counterTriggered,
            isSpeedPriority,
            isBurstTriggered: this._playerBurst.isBurstMode || this._enemyBurst.isBurstMode
        };

        await this._executeBattleEffects(result, playerQuality, enemyQuality);

        // 使用卡牌（移入弃牌堆）
        if (this._playerSelectedCard) {
            getCardSystem().useCard(this._player.id, (this._playerSelectedCard as any).instanceId, 0);
        }
        if (this._enemySelectedCard) {
            getCardSystem().useCard(this._enemy.id, (this._enemySelectedCard as any).instanceId, 0);
        }

        this._emitEvent(BattleEventType.RESOLUTION_COMPLETED, result);

        await delay(1000);
        await this._endTurn();
    }

    /**
     * Roll点，包含爆点加成
     */
    private _rollWithBonus(card: EnhancedCardData, entityType: EntityType): number {
        const burst = entityType === EntityType.PLAYER ? this._playerBurst : this._enemyBurst;
        const defenseStance = entityType === EntityType.PLAYER ? this._playerDefenseStance : this._enemyDefenseStance;

        // 计算Roll范围加成
        let rollMax = card.rollRange.max;
        if (burst.rollMaxBonus > 0) {
            rollMax += burst.rollMaxBonus;
        }

        // 基础Roll
        let roll = Math.floor(Math.random() * (rollMax - card.rollRange.min + 1)) + card.rollRange.min;

        // 防御姿态加成
        if (defenseStance.nextRollBonus > 0) {
            roll += defenseStance.nextRollBonus;
        }

        // 爆点加成
        if (burst.burstBonus > 0) {
            roll += burst.burstBonus;
        }

        return Math.max(0, roll);
    }

    /**
     * 检查反制效果
     */
    private _checkCounterEffects(playerRoll: number, enemyRoll: number): string | undefined {
        // 检查玩家反制
        if (this._playerSelectedCard?.counterEffects) {
            for (const counter of this._playerSelectedCard.counterEffects) {
                if (this._checkCounterCondition(counter.condition, counter.threshold, playerRoll, enemyRoll)) {
                    console.log(`[EnhancedBattleManager] 玩家反制触发: ${counter.effect}`);
                    return `player_${counter.effect}`;
                }
            }
        }

        // 检查敌人反制
        if (this._enemySelectedCard?.counterEffects) {
            for (const counter of this._enemySelectedCard.counterEffects) {
                if (this._checkCounterCondition(counter.condition, counter.threshold, enemyRoll, playerRoll)) {
                    console.log(`[EnhancedBattleManager] 敌人反制触发: ${counter.effect}`);
                    return `enemy_${counter.effect}`;
                }
            }
        }

        return undefined;
    }

    private _checkCounterCondition(
        condition: string,
        threshold: number,
        selfRoll: number,
        enemyRoll: number
    ): boolean {
        switch (condition) {
            case 'enemyRollHigh':
                return enemyRoll >= threshold;
            case 'enemyRollLow':
                return enemyRoll <= threshold;
            case 'rollDiffSmall':
                return Math.abs(selfRoll - enemyRoll) <= threshold;
            case 'speedDiffHigh':
                const selfSpeed = this._playerSelectedCard?.speed || 0;
                const enemySpeed = this._enemySelectedCard?.speed || 0;
                return Math.abs(selfSpeed - enemySpeed) >= threshold;
            default:
                return false;
        }
    }

    /**
     * 更新爆点状态
     */
    private _updateBurstState(winner: EntityType | null): void {
        if (winner === EntityType.PLAYER) {
            this._playerBurst.consecutiveWins++;
            this._enemyBurst.consecutiveWins = 0;

            if (this._playerBurst.consecutiveWins >= this._burstThreshold) {
                this._playerBurst.isBurstMode = true;
                this._playerBurst.burstBonus = 2;
                this._playerBurst.rollMaxBonus = 3;
                console.log('[EnhancedBattleManager] 玩家进入爆点状态！');
            }
        } else if (winner === EntityType.ENEMY) {
            this._enemyBurst.consecutiveWins++;
            this._playerBurst.consecutiveWins = 0;

            if (this._enemyBurst.consecutiveWins >= this._burstThreshold) {
                this._enemyBurst.isBurstMode = true;
                this._enemyBurst.burstBonus = 2;
                this._enemyBurst.rollMaxBonus = 3;
                console.log('[EnhancedBattleManager] 敌人进入爆点状态！');
            }
        } else {
            // 平局，重置
            this._playerBurst.consecutiveWins = 0;
            this._enemyBurst.consecutiveWins = 0;
            this._playerBurst.isBurstMode = false;
            this._enemyBurst.isBurstMode = false;
        }
    }

    /**
     * 执行战斗效果
     */
    private async _executeBattleEffects(
        result: EnhancedTurnResult,
        playerQuality: RollQualityEffect | null,
        enemyQuality: RollQualityEffect | null
    ): Promise<void> {
        const { winner } = result;

        // 处理Roll品质效果
        if (winner === EntityType.PLAYER && playerQuality) {
            await this._applyRollQualityEffect(playerQuality, this._player!, this._enemy!);
        } else if (winner === EntityType.ENEMY && enemyQuality) {
            await this._applyRollQualityEffect(enemyQuality, this._enemy!, this._player!);
        }

        // 处理基础伤害（Roll结果就是伤害）
        if (winner === EntityType.PLAYER && this._playerSelectedCard && this._player && this._enemy) {
            let damage = result.playerFinalValue;

            // 应用品质伤害倍率
            if (playerQuality?.damageMultiplier) {
                damage = Math.floor(damage * playerQuality.damageMultiplier);
            }

            const damageResult = this._enemy.takeDamage(damage, this._player.id);

            this._emitEvent(BattleEventType.DAMAGE_DEALT, {
                source: EntityType.PLAYER,
                target: EntityType.ENEMY,
                damage: damageResult.damageDealt,
                isBurst: this._playerBurst.isBurstMode
            });
        } else if (winner === EntityType.ENEMY && this._enemySelectedCard && this._player && this._enemy) {
            let damage = result.enemyFinalValue;

            if (enemyQuality?.damageMultiplier) {
                damage = Math.floor(damage * enemyQuality.damageMultiplier);
            }

            const damageResult = this._player.takeDamage(damage, this._enemy.id);

            this._emitEvent(BattleEventType.DAMAGE_DEALT, {
                source: EntityType.ENEMY,
                target: EntityType.PLAYER,
                damage: damageResult.damageDealt,
                isBurst: this._enemyBurst.isBurstMode
            });
        }

        // 检查死亡
        if (this._player?.isDead) {
            this._emitEvent(BattleEventType.ENTITY_DIED, { entity: this._player.getStatus() });
        }
        if (this._enemy?.isDead) {
            this._emitEvent(BattleEventType.ENTITY_DIED, { entity: this._enemy.getStatus() });
        }
    }

    private async _applyRollQualityEffect(
        quality: RollQualityEffect,
        user: Entity,
        target: Entity
    ): Promise<void> {
        if (quality.extraEffects) {
            for (const effect of quality.extraEffects) {
                getEffectSystem().addEffect(target.id, {
                    type: effect.type,
                    value: effect.value,
                    duration: effect.duration,
                    trigger: EffectTrigger.IMMEDIATE
                }, user.id);
            }
        }
    }

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
        }
    }

    private async _endTurn(): Promise<void> {
        if (!this._player || !this._enemy) return;

        getEffectSystem().onTurnEnd(this._player.id);
        getEffectSystem().onTurnEnd(this._enemy.id);

        getCardSystem().onTurnEnd(this._player.id);
        getCardSystem().onTurnEnd(this._enemy.id);

        this._player.onTurnEnd();
        this._enemy.onTurnEnd();

        this._emitEvent(BattleEventType.TURN_END, {
            turnNumber: this._currentTurn,
            player: this._player.getStatus(),
            enemy: this._enemy.getStatus()
        });

        await this._startNewTurn();
    }

    private _checkBattleEnd(): boolean {
        if (!this._player || !this._enemy) return true;
        return this._player.isDead || this._enemy.isDead || this._currentTurn >= this._maxTurns;
    }

    public endBattle(): { winner: EntityType | null; turns: number } {
        this._isBattleActive = false;
        this._phase = BattlePhase.END;

        let winner: EntityType | null = null;
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

        this._cleanup();
        return { winner, turns: this._currentTurn };
    }

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
        this._resetBurstState();
        this._resetDefenseStance();
    }

    // ==================== 事件系统 ====================

    public addEventListener(eventType: BattleEventType, callback: (event: any) => void): void {
        if (!this._eventListeners.has(eventType)) {
            this._eventListeners.set(eventType, new Set());
        }
        this._eventListeners.get(eventType)!.add(callback);
    }

    public removeEventListener(eventType: BattleEventType, callback: (event: any) => void): void {
        const listeners = this._eventListeners.get(eventType);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    private _emitEvent(type: BattleEventType, data: any): void {
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
                    console.error(`[EnhancedBattleManager] 事件回调错误: ${type}`, error);
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
    get playerBurst(): BurstState { return this._playerBurst; }
    get enemyBurst(): BurstState { return this._enemyBurst; }
    get aiType(): AIType { return this._aiType; }

    public reset(): void {
        this._cleanup();
        this._phase = BattlePhase.INIT;
        this._currentTurn = 0;
        this._isBattleActive = false;
        this._player = null;
        this._enemy = null;
        this._aiType = AIType.BERSERKER;
        this._eventListeners.clear();
        console.log('[EnhancedBattleManager] 已重置');
    }

    public static destroy(): void {
        if (EnhancedBattleManager._instance) {
            EnhancedBattleManager._instance.reset();
            EnhancedBattleManager._instance = null;
            console.log('[EnhancedBattleManager] 单例已销毁');
        }
    }
}

// 导出便捷获取函数
export const getEnhancedBattleManager = (): EnhancedBattleManager => EnhancedBattleManager.getInstance();
