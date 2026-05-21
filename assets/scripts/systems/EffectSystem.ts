/**
 * EffectSystem 效果系统
 * 
 * 职责：
 * 1. 管理所有状态效果（BUFF/DEBUFF）
 * 2. 处理效果的添加、移除、触发
 * 3. 计算效果对属性的影响
 * 4. 管理效果的持续时间
 * 
 * 支持的效果类型：
 * - 流血(BLEEDING)：回合结束造成伤害
 * - 点燃(BURNING)：持续伤害
 * - 冻结(FREEZE)：跳过回合
 * - 护盾(SHIELD)：提供护盾值
 * - 力量(STRENGTH)：增加伤害输出
 * - 虚弱(WEAK)：减少伤害输出
 * - 易伤(VULNERABLE)：增加受到伤害
 */

import { 
    EffectType, 
    EffectData, 
    EffectInstance, 
    EffectTrigger,
    EntityType 
} from '../types/GameTypes';
import { generateId } from '../utils/Utils';

/**
 * 效果应用结果
 */
export interface EffectApplyResult {
    success: boolean;
    effect: EffectInstance | null;
    replaced: boolean;           // 是否替换了已有效果
    stacked: boolean;            // 是否叠加到已有效果
}

/**
 * 效果触发结果
 */
export interface EffectTriggerResult {
    effect: EffectInstance;
    triggered: boolean;
    value: number;               // 触发的数值（如伤害值、治疗值）
    shouldRemove: boolean;       // 是否应该移除
}

/**
 * 实体效果容器
 */
interface EntityEffects {
    entityId: string;
    effects: Map<EffectType, EffectInstance[]>;
}

export class EffectSystem {
    private static _instance: EffectSystem | null = null;
    
    // 存储所有实体的效果
    private _entityEffects: Map<string, EntityEffects> = new Map();
    
    // 效果是否可以叠加的配置
    private _stackableEffects: Set<EffectType> = new Set([
        EffectType.BLEEDING,
        EffectType.BURNING,
        EffectType.SHIELD,
        EffectType.STRENGTH,
        EffectType.DEXTERITY
    ]);
    
    // 效果互斥配置（同一组内只能存在一个）
    private _exclusiveGroups: EffectType[][] = [
        [EffectType.STRENGTH, EffectType.WEAK],
        [EffectType.DEXTERITY, EffectType.VULNERABLE]
    ];

    public static getInstance(): EffectSystem {
        if (!EffectSystem._instance) {
            EffectSystem._instance = new EffectSystem();
        }
        return EffectSystem._instance;
    }

    private constructor() {
        console.log('[EffectSystem] 初始化');
    }

    /**
     * 注册实体到效果系统
     * @param entityId 实体ID
     */
    public registerEntity(entityId: string): void {
        if (!this._entityEffects.has(entityId)) {
            this._entityEffects.set(entityId, {
                entityId,
                effects: new Map()
            });
            console.log(`[EffectSystem] 注册实体: ${entityId}`);
        }
    }

    /**
     * 注销实体，清除所有效果
     * @param entityId 实体ID
     */
    public unregisterEntity(entityId: string): void {
        this._entityEffects.delete(entityId);
        console.log(`[EffectSystem] 注销实体: ${entityId}`);
    }

    /**
     * 添加效果到实体
     * 
     * @param entityId 目标实体ID
     * @param effectData 效果数据
     * @param sourceId 效果来源ID
     * @returns 效果应用结果
     */
    public addEffect(
        entityId: string, 
        effectData: EffectData, 
        sourceId: string
    ): EffectApplyResult {
        // 确保实体已注册
        this.registerEntity(entityId);
        
        const entityEffect = this._entityEffects.get(entityId)!;
        const effectType = effectData.type;
        
        // 检查互斥效果
        const exclusiveEffect = this._checkExclusiveEffects(entityId, effectType);
        if (exclusiveEffect) {
            // 移除互斥效果
            this.removeEffect(entityId, exclusiveEffect.instanceId);
            console.log(`[EffectSystem] 移除互斥效果: ${exclusiveEffect.type}`);
        }
        
        // 检查是否可以叠加
        if (this._stackableEffects.has(effectType)) {
            // 检查是否已有同类型效果
            const existingEffects = entityEffect.effects.get(effectType);
            if (existingEffects && existingEffects.length > 0) {
                // 叠加到第一个效果上
                const targetEffect = existingEffects[0];
                targetEffect.value += effectData.value;
                targetEffect.remainingDuration = Math.max(
                    targetEffect.remainingDuration, 
                    effectData.duration
                );
                
                console.log(`[EffectSystem] 叠加效果: ${effectType}, 新值: ${targetEffect.value}`);
                
                return {
                    success: true,
                    effect: targetEffect,
                    replaced: false,
                    stacked: true
                };
            }
        }
        
        // 创建新效果实例
        const newEffect: EffectInstance = {
            ...effectData,
            instanceId: generateId(),
            sourceId,
            remainingDuration: effectData.duration
        };
        
        // 添加到效果列表
        if (!entityEffect.effects.has(effectType)) {
            entityEffect.effects.set(effectType, []);
        }
        entityEffect.effects.get(effectType)!.push(newEffect);
        
        console.log(`[EffectSystem] 添加效果: ${effectType} 到 ${entityId}, 值: ${effectData.value}, 持续: ${effectData.duration}`);
        
        // 立即触发的效果
        if (effectData.trigger === EffectTrigger.IMMEDIATE) {
            this.triggerEffect(entityId, newEffect);
        }
        
        return {
            success: true,
            effect: newEffect,
            replaced: !!exclusiveEffect,
            stacked: false
        };
    }

    /**
     * 移除指定效果
     * @param entityId 实体ID
     * @param effectInstanceId 效果实例ID
     * @returns 是否成功移除
     */
    public removeEffect(entityId: string, effectInstanceId: string): boolean {
        const entityEffect = this._entityEffects.get(entityId);
        if (!entityEffect) return false;
        
        for (const [effectType, effects] of entityEffect.effects) {
            const index = effects.findIndex(e => e.instanceId === effectInstanceId);
            if (index !== -1) {
                effects.splice(index, 1);
                if (effects.length === 0) {
                    entityEffect.effects.delete(effectType);
                }
                console.log(`[EffectSystem] 移除效果: ${effectInstanceId}`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * 移除指定类型的所有效果
     * @param entityId 实体ID
     * @param effectType 效果类型
     * @returns 移除的数量
     */
    public removeEffectsByType(entityId: string, effectType: EffectType): number {
        const entityEffect = this._entityEffects.get(entityId);
        if (!entityEffect) return 0;
        
        const effects = entityEffect.effects.get(effectType);
        if (!effects) return 0;
        
        const count = effects.length;
        entityEffect.effects.delete(effectType);
        
        console.log(`[EffectSystem] 移除类型 ${effectType} 的所有效果: ${count}个`);
        return count;
    }

    /**
     * 触发指定时机的效果
     * 
     * @param entityId 实体ID
     * @param trigger 触发时机
     * @returns 所有触发的效果结果
     */
    public triggerEffectsByTiming(
        entityId: string, 
        trigger: EffectTrigger
    ): EffectTriggerResult[] {
        const entityEffect = this._entityEffects.get(entityId);
        if (!entityEffect) return [];
        
        const results: EffectTriggerResult[] = [];
        const effectsToRemove: string[] = [];
        
        for (const [effectType, effects] of entityEffect.effects) {
            for (const effect of effects) {
                if (effect.trigger === trigger) {
                    const result = this._executeEffect(entityId, effect);
                    results.push(result);
                    
                    // 减少持续时间
                    if (effect.duration > 0) {
                        effect.remainingDuration--;
                        if (effect.remainingDuration <= 0) {
                            effectsToRemove.push(effect.instanceId);
                        }
                    }
                }
            }
        }
        
        // 移除到期的效果
        effectsToRemove.forEach(id => this.removeEffect(entityId, id));
        
        return results;
    }

    /**
     * 触发单个效果
     * @param entityId 实体ID
     * @param effect 效果实例
     * @returns 触发结果
     */
    public triggerEffect(entityId: string, effect: EffectInstance): EffectTriggerResult {
        return this._executeEffect(entityId, effect);
    }

    /**
     * 获取实体所有效果
     * @param entityId 实体ID
     * @returns 效果列表
     */
    public getEntityEffects(entityId: string): EffectInstance[] {
        const entityEffect = this._entityEffects.get(entityId);
        if (!entityEffect) return [];
        
        const allEffects: EffectInstance[] = [];
        for (const effects of entityEffect.effects.values()) {
            allEffects.push(...effects);
        }
        return allEffects;
    }

    /**
     * 获取指定类型的效果
     * @param entityId 实体ID
     * @param effectType 效果类型
     * @returns 效果列表
     */
    public getEffectsByType(entityId: string, effectType: EffectType): EffectInstance[] {
        const entityEffect = this._entityEffects.get(entityId);
        if (!entityEffect) return [];
        
        return entityEffect.effects.get(effectType) || [];
    }

    /**
     * 检查实体是否有指定效果
     * @param entityId 实体ID
     * @param effectType 效果类型
     * @returns 是否有该效果
     */
    public hasEffect(entityId: string, effectType: EffectType): boolean {
        const entityEffect = this._entityEffects.get(entityId);
        if (!entityEffect) return false;
        
        const effects = entityEffect.effects.get(effectType);
        return !!effects && effects.length > 0;
    }

    /**
     * 计算效果对伤害的修正
     * 
     * @param entityId 实体ID
     * @param baseDamage 基础伤害
     * @param isDealing 是否为造成伤害（true: 攻击方, false: 受击方）
     * @returns 修正后的伤害
     */
    public calculateDamageModifier(
        entityId: string, 
        baseDamage: number, 
        isDealing: boolean
    ): number {
        let modifiedDamage = baseDamage;
        
        if (isDealing) {
            // 攻击方修正
            const strengthEffects = this.getEffectsByType(entityId, EffectType.STRENGTH);
            const strengthBonus = strengthEffects.reduce((sum, e) => sum + e.value, 0);
            modifiedDamage += strengthBonus;
            
            const weakEffects = this.getEffectsByType(entityId, EffectType.WEAK);
            if (weakEffects.length > 0) {
                modifiedDamage = Math.floor(modifiedDamage * 0.75); // 虚弱减少25%伤害
            }
        } else {
            // 受击方修正
            const vulnerableEffects = this.getEffectsByType(entityId, EffectType.VULNERABLE);
            if (vulnerableEffects.length > 0) {
                modifiedDamage = Math.floor(modifiedDamage * 1.5); // 易伤增加50%伤害
            }
        }
        
        return Math.max(0, modifiedDamage);
    }

    /**
     * 检查实体是否被冻结（跳过回合）
     * @param entityId 实体ID
     * @returns 是否被冻结
     */
    public isFrozen(entityId: string): boolean {
        return this.hasEffect(entityId, EffectType.FREEZE);
    }

    /**
     * 获取护盾值
     * @param entityId 实体ID
     * @returns 总护盾值
     */
    public getShieldValue(entityId: string): number {
        const shieldEffects = this.getEffectsByType(entityId, EffectType.SHIELD);
        return shieldEffects.reduce((sum, e) => sum + e.value, 0);
    }

    /**
     * 减少护盾值
     * @param entityId 实体ID
     * @param amount 减少量
     * @returns 实际减少的值
     */
    public reduceShield(entityId: string, amount: number): number {
        const shieldEffects = this.getEffectsByType(entityId, EffectType.SHIELD);
        let remaining = amount;
        let totalReduced = 0;
        
        for (const effect of shieldEffects) {
            if (remaining <= 0) break;
            
            const reduce = Math.min(effect.value, remaining);
            effect.value -= reduce;
            remaining -= reduce;
            totalReduced += reduce;
            
            if (effect.value <= 0) {
                this.removeEffect(entityId, effect.instanceId);
            }
        }
        
        console.log(`[EffectSystem] 减少护盾: ${entityId} 减少${totalReduced}, 剩余${this.getShieldValue(entityId)}`);
        return totalReduced;
    }

    /**
     * 回合结束处理 - 减少所有效果持续时间
     * @param entityId 实体ID
     */
    public onTurnEnd(entityId: string): void {
        const entityEffect = this._entityEffects.get(entityId);
        if (!entityEffect) return;
        
        const effectsToRemove: string[] = [];
        
        for (const [effectType, effects] of entityEffect.effects) {
            for (const effect of effects) {
                if (effect.duration > 0) {
                    effect.remainingDuration--;
                    if (effect.remainingDuration <= 0) {
                        effectsToRemove.push(effect.instanceId);
                    }
                }
            }
        }
        
        effectsToRemove.forEach(id => this.removeEffect(entityId, id));
        console.log(`[EffectSystem] 回合结束处理: ${entityId}, 移除${effectsToRemove.length}个到期效果`);
    }

    /**
     * 清除实体所有效果
     * @param entityId 实体ID
     */
    public clearAllEffects(entityId: string): void {
        const entityEffect = this._entityEffects.get(entityId);
        if (entityEffect) {
            entityEffect.effects.clear();
            console.log(`[EffectSystem] 清除 ${entityId} 的所有效果`);
        }
    }

    /**
     * 重置系统
     */
    public reset(): void {
        this._entityEffects.clear();
        console.log('[EffectSystem] 已重置');
    }

    /**
     * 执行效果（内部方法）
     * @param entityId 目标实体ID
     * @param effect 效果实例
     * @returns 执行结果
     */
    private _executeEffect(entityId: string, effect: EffectInstance): EffectTriggerResult {
        let value = 0;
        let shouldRemove = false;
        
        switch (effect.type) {
            case EffectType.BLEEDING:
            case EffectType.BURNING:
            case EffectType.DAMAGE:
                value = effect.value;
                break;
                
            case EffectType.HEAL:
                value = effect.value;
                break;
                
            case EffectType.FREEZE:
            case EffectType.STUN:
                value = effect.value;
                shouldRemove = true; // 控制效果触发后移除
                break;
                
            case EffectType.DRAW:
                value = effect.value;
                break;
                
            case EffectType.ENERGY:
                value = effect.value;
                break;
                
            default:
                value = effect.value;
        }
        
        return {
            effect,
            triggered: true,
            value,
            shouldRemove
        };
    }

    /**
     * 检查互斥效果（内部方法）
     * @param entityId 实体ID
     * @param newEffectType 新效果类型
     * @returns 需要移除的互斥效果，如果没有则返回null
     */
    private _checkExclusiveEffects(
        entityId: string, 
        newEffectType: EffectType
    ): EffectInstance | null {
        for (const group of this._exclusiveGroups) {
            if (group.includes(newEffectType)) {
                // 检查组内其他效果是否存在
                for (const exclusiveType of group) {
                    if (exclusiveType !== newEffectType) {
                        const existingEffects = this.getEffectsByType(entityId, exclusiveType);
                        if (existingEffects.length > 0) {
                            return existingEffects[0];
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * 销毁单例
     */
    public static destroy(): void {
        if (EffectSystem._instance) {
            EffectSystem._instance.reset();
            EffectSystem._instance = null;
            console.log('[EffectSystem] 单例已销毁');
        }
    }
}

// 导出便捷获取函数
export const getEffectSystem = (): EffectSystem => EffectSystem.getInstance();
