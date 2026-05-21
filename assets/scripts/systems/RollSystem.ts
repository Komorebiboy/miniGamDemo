/**
 * RollSystem 掷骰系统
 * 
 * 职责：
 * 1. 管理卡牌Roll点的随机数生成
 * 2. 计算最终值（基础值 + Roll值）
 * 3. 提供同步和异步两种Roll点方式
 * 4. 支持Roll点动画效果
 * 
 * 设计思路：
 * - 完全独立，不依赖其他系统
 * - 使用回调函数通知Roll点结果
 * - 支持可配置的动画时长
 */

import { RollRange, RollCompleteCallback } from '../types/GameTypes';
import { randomInt, delay } from '../utils/Utils';

export class RollSystem {
    // 单例模式
    private static _instance: RollSystem | null = null;
    
    // Roll点动画默认时长（毫秒）
    private _defaultAnimationDuration: number = 1000;
    
    // 动画步数（Roll点数字变化的次数）
    private _animationSteps: number = 10;
    
    // 是否正在动画中
    private _isRolling: boolean = false;

    /**
     * 获取单例实例
     */
    public static getInstance(): RollSystem {
        if (!RollSystem._instance) {
            RollSystem._instance = new RollSystem();
        }
        return RollSystem._instance;
    }

    /**
     * 私有构造函数，防止外部实例化
     */
    private constructor() {
        console.log('[RollSystem] 初始化');
    }

    /**
     * 同步Roll点 - 立即返回结果
     * 
     * @param range Roll范围
     * @returns Roll结果
     * 
     * 使用场景：
     * - 不需要动画效果时
     * - AI计算时
     * - 测试时
     */
    public rollSync(range: RollRange): number {
        const result = randomInt(range.min, range.max);
        console.log(`[RollSystem] 同步Roll点: ${range.min}-${range.max} = ${result}`);
        return result;
    }

    /**
     * 异步Roll点 - 带动画效果
     * 
     * @param range Roll范围
     * @param onProgress 进度回调，用于更新UI显示
     * @param onComplete 完成回调
     * @param duration 动画时长（可选，默认1000ms）
     * 
     * 使用场景：
     * - 玩家可见的Roll点
     * - 需要营造紧张感时
     */
    public async rollAsync(
        range: RollRange,
        onProgress: (currentValue: number) => void,
        onComplete: RollCompleteCallback,
        duration?: number
    ): Promise<void> {
        if (this._isRolling) {
            console.warn('[RollSystem] 已有Roll点在进行中');
            return;
        }

        this._isRolling = true;
        const animDuration = duration || this._defaultAnimationDuration;
        const stepDuration = animDuration / this._animationSteps;
        
        console.log(`[RollSystem] 开始异步Roll点: ${range.min}-${range.max}`);

        // 动画阶段：快速显示随机数字
        for (let i = 0; i < this._animationSteps; i++) {
            const tempValue = randomInt(range.min, range.max);
            onProgress(tempValue);
            await delay(stepDuration);
        }

        // 最终结果
        const finalResult = this.rollSync(range);
        onProgress(finalResult);
        
        this._isRolling = false;
        onComplete(finalResult);
        
        console.log(`[RollSystem] Roll点完成: ${finalResult}`);
    }

    /**
     * 计算卡牌最终值
     * 
     * 公式：最终值 = 基础值 + Roll值
     * 
     * @param baseValue 基础值
     * @param rollValue Roll值
     * @returns 最终值
     */
    public calculateFinalValue(baseValue: number, rollValue: number): number {
        const finalValue = baseValue + rollValue;
        console.log(`[RollSystem] 计算最终值: ${baseValue} + ${rollValue} = ${finalValue}`);
        return finalValue;
    }

    /**
     * 批量Roll点 - 同时为多张卡牌Roll点
     * 
     * @param ranges Roll范围数组
     * @returns Roll结果数组
     */
    public rollBatch(ranges: RollRange[]): number[] {
        const results = ranges.map(range => this.rollSync(range));
        console.log(`[RollSystem] 批量Roll点: ${results}`);
        return results;
    }

    /**
     * 比较两个Roll结果
     * 
     * @param value1 第一个值
     * @param value2 第二个值
     * @returns 1: value1大, -1: value2大, 0: 相等
     */
    public compareValues(value1: number, value2: number): number {
        if (value1 > value2) return 1;
        if (value1 < value2) return -1;
        return 0;
    }

    /**
     * 设置动画时长
     * @param duration 时长（毫秒）
     */
    public setAnimationDuration(duration: number): void {
        this._defaultAnimationDuration = duration;
        console.log(`[RollSystem] 设置动画时长: ${duration}ms`);
    }

    /**
     * 设置动画步数
     * @param steps 步数
     */
    public setAnimationSteps(steps: number): void {
        this._animationSteps = steps;
        console.log(`[RollSystem] 设置动画步数: ${steps}`);
    }

    /**
     * 检查是否正在Roll点
     */
    public get isRolling(): boolean {
        return this._isRolling;
    }

    /**
     * 重置系统状态
     */
    public reset(): void {
        this._isRolling = false;
        console.log('[RollSystem] 已重置');
    }

    /**
     * 销毁单例
     */
    public static destroy(): void {
        if (RollSystem._instance) {
            RollSystem._instance.reset();
            RollSystem._instance = null;
            console.log('[RollSystem] 单例已销毁');
        }
    }
}

// 导出便捷获取函数
export const getRollSystem = (): RollSystem => RollSystem.getInstance();
