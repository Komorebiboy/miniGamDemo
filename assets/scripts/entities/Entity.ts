/**
 * Entity 角色实体类
 *
 * 职责：
 * 1. 管理角色属性（生命、能量、护盾等）
 * 2. 处理伤害计算和承受
 * 3. 管理能量消耗和恢复
 * 4. 作为战斗中的参与者
 *
 * 属性说明：
 * - health: 生命值
 * - energy: 能量值（每回合恢复，用于出牌）
 * - shield: 护盾值（抵消伤害）
 */

import {
    EntityConfig,
    EntityStats,
    EntityType,
    CardData
} from '../types/GameTypes';
import { getEffectSystem } from '../systems/EffectSystem';

/**
 * 伤害结果
 */
export interface DamageResult {
    damageDealt: number;           // 实际造成的伤害
    damageBlocked: number;         // 被护盾阻挡的伤害
    isCritical: boolean;           // 是否暴击
    targetDied: boolean;           // 目标是否死亡
}

/**
 * 治疗结果
 */
export interface HealResult {
    healAmount: number;            // 实际治疗量
    overheal: number;              // 溢出治疗量
}

export class Entity {
    // 基础信息
    private _id: string;
    private _name: string;
    private _type: EntityType;

    // 属性
    private _stats: EntityStats;
    private _baseStats: EntityStats;

    // 牌组配置
    private _deck: CardData[];

    // 是否已死亡
    private _isDead: boolean = false;

    // 本回合是否已出牌
    private _hasPlayedCard: boolean = false;

    // 本回合选择的卡牌
    private _selectedCardId: string | null = null;

    constructor(config: EntityConfig) {
        this._id = config.id;
        this._name = config.name;
        this._type = config.type;
        this._baseStats = { ...config.baseStats };
        this._stats = { ...config.baseStats };
        this._deck = [...config.deck];

        // 注册到效果系统
        getEffectSystem().registerEntity(this._id);

        console.log(`[Entity] 创建实体: ${this._name} (${this._type}), HP:${this._stats.maxHealth}`);
    }

    // ==================== Getters ====================

    get id(): string { return this._id; }
    get name(): string { return this._name; }
    get type(): EntityType { return this._type; }
    get isDead(): boolean { return this._isDead; }
    get hasPlayedCard(): boolean { return this._hasPlayedCard; }
    get selectedCardId(): string | null { return this._selectedCardId; }
    get deck(): CardData[] { return [...this._deck]; }

    get currentHealth(): number { return this._stats.currentHealth; }
    get maxHealth(): number { return this._stats.maxHealth; }
    get currentEnergy(): number { return this._stats.currentEnergy; }
    get maxEnergy(): number { return this._stats.maxEnergy; }
    get shield(): number { return this._stats.shield; }

    /**
     * 获取当前属性（包含效果加成）
     */
    get stats(): EntityStats {
        // 从效果系统获取护盾值
        const effectShield = getEffectSystem().getShieldValue(this._id);
        return {
            ...this._stats,
            shield: this._stats.shield + effectShield
        };
    }

    // ==================== 生命值管理 ====================

    /**
     * 受到伤害
     *
     * 流程：
     * 1. 计算效果对伤害的修正（易伤等）
     * 2. 护盾抵消伤害
     * 3. 扣除生命值
     * 4. 检查死亡
     *
     * @param damage 基础伤害值
     * @param sourceId 伤害来源ID
     * @returns 伤害结果
     */
    public takeDamage(damage: number, sourceId: string): DamageResult {
        if (this._isDead) {
            return { damageDealt: 0, damageBlocked: 0, isCritical: false, targetDied: true };
        }

        // 效果系统计算伤害修正（受击方）
        let finalDamage = getEffectSystem().calculateDamageModifier(this._id, damage, false);

        // 护盾抵消
        const effectShield = getEffectSystem().getShieldValue(this._id);
        const totalShield = this._stats.shield + effectShield;
        let damageBlocked = 0;

        if (totalShield > 0) {
            // 优先使用效果护盾
            const effectBlocked = getEffectSystem().reduceShield(this._id, finalDamage);
            damageBlocked += effectBlocked;
            finalDamage -= effectBlocked;

            // 再使用基础护盾
            if (finalDamage > 0 && this._stats.shield > 0) {
                const baseBlocked = Math.min(this._stats.shield, finalDamage);
                this._stats.shield -= baseBlocked;
                damageBlocked += baseBlocked;
                finalDamage -= baseBlocked;
            }
        }

        // 扣除生命值
        const actualDamage = Math.floor(finalDamage);
        this._stats.currentHealth = Math.max(0, this._stats.currentHealth - actualDamage);

        // 检查死亡
        if (this._stats.currentHealth <= 0) {
            this._isDead = true;
        }

        console.log(`[Entity] ${this._name} 受到 ${actualDamage} 点伤害 (阻挡:${damageBlocked}), 剩余HP:${this._stats.currentHealth}`);

        return {
            damageDealt: actualDamage,
            damageBlocked,
            isCritical: false,
            targetDied: this._isDead
        };
    }

    /**
     * 治疗
     * @param amount 治疗量
     * @returns 治疗结果
     */
    public heal(amount: number): HealResult {
        if (this._isDead) {
            return { healAmount: 0, overheal: 0 };
        }

        const oldHealth = this._stats.currentHealth;
        this._stats.currentHealth = Math.min(this._stats.maxHealth, this._stats.currentHealth + amount);
        const actualHeal = this._stats.currentHealth - oldHealth;
        const overheal = amount - actualHeal;

        console.log(`[Entity] ${this._name} 恢复 ${actualHeal} 点生命, 当前HP:${this._stats.currentHealth}`);

        return { healAmount: actualHeal, overheal };
    }

    /**
     * 直接设置生命值
     * @param value 生命值
     */
    public setHealth(value: number): void {
        this._stats.currentHealth = Math.max(0, Math.min(this._stats.maxHealth, value));
        if (this._stats.currentHealth <= 0) {
            this._isDead = true;
        }
    }

    /**
     * 增加最大生命值
     * @param amount 增加量
     */
    public increaseMaxHealth(amount: number): void {
        this._stats.maxHealth += amount;
        this._stats.currentHealth += amount;
        console.log(`[Entity] ${this._name} 最大生命增加 ${amount}, 当前:${this._stats.maxHealth}`);
    }

    // ==================== 护盾管理 ====================

    /**
     * 添加护盾
     * @param amount 护盾值
     */
    public addShield(amount: number): void {
        this._stats.shield += amount;
        console.log(`[Entity] ${this._name} 获得 ${amount} 点护盾, 当前:${this._stats.shield}`);
    }

    /**
     * 清除护盾
     */
    public clearShield(): void {
        this._stats.shield = 0;
    }

    // ==================== 能量管理 ====================

    /**
     * 消耗能量
     * @param amount 消耗量
     * @returns 是否成功
     */
    public consumeEnergy(amount: number): boolean {
        if (this._stats.currentEnergy < amount) {
            return false;
        }
        this._stats.currentEnergy -= amount;
        return true;
    }

    /**
     * 恢复能量
     * @param amount 恢复量
     */
    public restoreEnergy(amount: number): void {
        this._stats.currentEnergy = Math.min(this._stats.maxEnergy, this._stats.currentEnergy + amount);
    }

    /**
     * 回合开始 - 恢复能量
     */
    public onTurnStart(): void {
        this._stats.currentEnergy = this._stats.maxEnergy;
        this._hasPlayedCard = false;
        this._selectedCardId = null;
        console.log(`[Entity] ${this._name} 回合开始, 能量恢复至 ${this._stats.currentEnergy}`);
    }

    /**
     * 回合结束
     */
    public onTurnEnd(): void {
        this._hasPlayedCard = false;
        this._selectedCardId = null;
        console.log(`[Entity] ${this._name} 回合结束`);
    }

    // ==================== 出牌管理 ====================

    /**
     * 选择卡牌
     * @param cardId 卡牌实例ID
     */
    public selectCard(cardId: string): void {
        this._selectedCardId = cardId;
    }

    /**
     * 标记已出牌
     */
    public markCardPlayed(): void {
        this._hasPlayedCard = true;
    }

    /**
     * 取消出牌
     */
    public cancelCardSelection(): void {
        this._selectedCardId = null;
    }

    // ==================== 牌组管理 ====================

    /**
     * 添加卡牌到牌组
     * @param card 卡牌数据
     */
    public addCardToDeck(card: CardData): void {
        this._deck.push(card);
        console.log(`[Entity] ${this._name} 添加卡牌 ${card.name} 到牌组`);
    }

    /**
     * 从牌组移除卡牌
     * @param cardId 卡牌ID
     * @returns 是否成功
     */
    public removeCardFromDeck(cardId: string): boolean {
        const index = this._deck.findIndex(c => c.id === cardId);
        if (index !== -1) {
            this._deck.splice(index, 1);
            return true;
        }
        return false;
    }

    // ==================== 状态检查 ====================

    /**
     * 检查是否可以使用指定卡牌
     * @param energyCost 能量消耗
     * @returns 是否可以使用
     */
    public canUseCard(energyCost: number): boolean {
        return !this._isDead && this._stats.currentEnergy >= energyCost;
    }

    /**
     * 获取实体状态信息（用于UI显示）
     */
    public getStatus(): {
        id: string;
        name: string;
        type: EntityType;
        health: number;
        maxHealth: number;
        energy: number;
        maxEnergy: number;
        shield: number;
        isDead: boolean;
        hasPlayedCard: boolean;
    } {
        const stats = this.stats;
        return {
            id: this._id,
            name: this._name,
            type: this._type,
            health: this._stats.currentHealth,
            maxHealth: this._stats.maxHealth,
            energy: this._stats.currentEnergy,
            maxEnergy: this._stats.maxEnergy,
            shield: stats.shield,
            isDead: this._isDead,
            hasPlayedCard: this._hasPlayedCard
        };
    }

    /**
     * 重置实体状态
     */
    public reset(): void {
        this._stats = { ...this._baseStats };
        this._isDead = false;
        this._hasPlayedCard = false;
        this._selectedCardId = null;
        console.log(`[Entity] ${this._name} 已重置`);
    }

    /**
     * 销毁实体
     */
    public destroy(): void {
        getEffectSystem().unregisterEntity(this._id);
        console.log(`[Entity] ${this._name} 已销毁`);
    }
}
