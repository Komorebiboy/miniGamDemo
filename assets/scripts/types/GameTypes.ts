/**
 * 游戏核心类型定义文件
 * 定义了卡牌、实体、效果等所有核心数据结构
 */

import { _decorator } from 'cc';

// ==================== 卡牌相关类型 ====================

/**
 * 卡牌类型枚举
 * ATTACK: 攻击牌 - 造成伤害
 * DEFENSE: 防御牌 - 提供护盾
 * SKILL: 技能牌 - 特殊效果
 * POWER: 能力牌 - 被动增益
 */
export enum CardType {
    ATTACK = 'ATTACK',
    DEFENSE = 'DEFENSE',
    SKILL = 'SKILL',
    POWER = 'POWER'
}

/**
 * 卡牌稀有度枚举
 */
export enum CardRarity {
    COMMON = 'COMMON',      // 普通
    UNCOMMON = 'UNCOMMON',  // 稀有
    RARE = 'RARE',          // 史诗
    LEGENDARY = 'LEGENDARY' // 传说
}

/**
 * Roll范围接口
 * min: 最小值
 * max: 最大值
 */
export interface RollRange {
    min: number;
    max: number;
}

/**
 * 卡牌数据接口
 * 定义了一张卡牌的所有属性
 */
export interface CardData {
    id: string;                    // 唯一标识
    name: string;                  // 卡牌名称
    description: string;           // 卡牌描述
    type: CardType;                // 卡牌类型
    rarity: CardRarity;            // 稀有度
    baseValue: number;             // 基础值（伤害/护盾/治疗量等）
    rollRange: RollRange;          // Roll点范围
    energyCost: number;            // 能量消耗
    speed: number;                 // 速度值（决定出牌优先级）
    effects: EffectData[];         // 附加效果列表
    iconPath?: string;             // 图标路径（可选）
}

/**
 * 卡牌实例接口
 * 游戏中的实际卡牌对象，包含运行时状态
 */
export interface CardInstance {
    instanceId: string;            // 实例唯一ID
    data: CardData;                // 卡牌数据
    currentRoll: number;           // 当前Roll点结果
    isExhausted: boolean;          // 是否已耗尽
    isSelected: boolean;           // 是否被选中
}

// ==================== 实体相关类型 ====================

/**
 * 实体类型枚举
 */
export enum EntityType {
    PLAYER = 'PLAYER',
    ENEMY = 'ENEMY'
}

/**
 * 实体属性接口
 */
export interface EntityStats {
    maxHealth: number;             // 最大生命值
    currentHealth: number;         // 当前生命值
    maxEnergy: number;             // 最大能量
    currentEnergy: number;         // 当前能量
    shield: number;                // 护盾值
}

/**
 * 实体配置接口
 */
export interface EntityConfig {
    id: string;
    name: string;
    type: EntityType;
    baseStats: EntityStats;
    deck: CardData[];              // 初始牌组
    aiType?: string;               // AI类型（敌人专用）
}

// ==================== 效果相关类型 ====================

/**
 * 效果类型枚举
 */
export enum EffectType {
    // 伤害类
    DAMAGE = 'DAMAGE',             // 直接伤害
    BLEEDING = 'BLEEDING',         // 流血 - 回合结束造成伤害
    BURNING = 'BURNING',           // 点燃 - 持续伤害
    
    // 防御类
    SHIELD = 'SHIELD',             // 护盾
    HEAL = 'HEAL',                 // 治疗
    
    // 控制类
    FREEZE = 'FREEZE',             // 冻结 - 跳过回合
    STUN = 'STUN',                 // 眩晕
    
    // 增益类
    STRENGTH = 'STRENGTH',         // 力量 - 增加伤害
    DEXTERITY = 'DEXTERITY',       // 敏捷 - 增加防御
    
    // 减益类
    WEAK = 'WEAK',                 // 虚弱 - 减少伤害
    VULNERABLE = 'VULNERABLE',     // 易伤 - 增加受到伤害
    
    // 特殊
    DRAW = 'DRAW',                 // 抽牌
    ENERGY = 'ENERGY'              // 能量增减
}

/**
 * 效果触发时机枚举
 */
export enum EffectTrigger {
    IMMEDIATE = 'IMMEDIATE',       // 立即触发
    ON_TURN_START = 'ON_TURN_START', // 回合开始
    ON_TURN_END = 'ON_TURN_END',   // 回合结束
    ON_DAMAGE_TAKEN = 'ON_DAMAGE_TAKEN', // 受到伤害时
    ON_CARD_PLAYED = 'ON_CARD_PLAYED'    // 出牌时
}

/**
 * 效果数据接口
 */
export interface EffectData {
    type: EffectType;
    value: number;
    duration: number;              // 持续回合数，-1表示永久
    trigger: EffectTrigger;
    sourceId?: string;             // 效果来源ID
}

/**
 * 效果实例接口
 */
export interface EffectInstance extends EffectData {
    instanceId: string;
    remainingDuration: number;     // 剩余回合数
}

// ==================== 战斗相关类型 ====================

/**
 * 战斗阶段枚举
 */
export enum BattlePhase {
    INIT = 'INIT',                 // 初始化
    PLAYER_TURN = 'PLAYER_TURN',   // 玩家回合
    ENEMY_TURN = 'ENEMY_TURN',     // 敌人回合
    RESOLUTION = 'RESOLUTION',     // 结算阶段
    END = 'END'                    // 战斗结束
}

/**
 * 出牌结果接口
 */
export interface PlayCardResult {
    playerCard: CardInstance | null;
    enemyCard: CardInstance | null;
    winner: EntityType | null;     // null表示平局或都未出牌
    playerRoll: number;
    enemyRoll: number;
    playerFinalValue: number;
    enemyFinalValue: number;
}

/**
 * 战斗事件类型
 */
export enum BattleEventType {
    BATTLE_START = 'BATTLE_START',
    TURN_START = 'TURN_START',
    CARD_PLAYED = 'CARD_PLAYED',
    ROLL_STARTED = 'ROLL_STARTED',
    ROLL_COMPLETED = 'ROLL_COMPLETED',
    DAMAGE_DEALT = 'DAMAGE_DEALT',
    EFFECT_APPLIED = 'EFFECT_APPLIED',
    ENTITY_DIED = 'ENTITY_DIED',
    BATTLE_END = 'BATTLE_END'
}

/**
 * 战斗事件接口
 */
export interface BattleEvent {
    type: BattleEventType;
    data: any;
    timestamp: number;
}

// ==================== Roguelike相关类型 ====================

/**
 * 奖励类型枚举
 */
export enum RewardType {
    CARD = 'CARD',                 // 卡牌奖励
    GOLD = 'GOLD',                 // 金币
    RELIC = 'RELIC',               // 遗物
    HEAL = 'HEAL',                 // 治疗
    MAX_HEALTH = 'MAX_HEALTH'      // 最大生命提升
}

/**
 * 奖励接口
 */
export interface Reward {
    type: RewardType;
    value: any;
    rarity: CardRarity;
}

// ==================== 事件回调类型 ====================

/**
 * 战斗事件回调函数类型
 */
export type BattleEventCallback = (event: BattleEvent) => void;

/**
 * Roll完成回调函数类型
 */
export type RollCompleteCallback = (result: number) => void;
