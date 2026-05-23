/**
 * 游戏模块统一导出
 *
 * 使用方式：
 * import { getBattleManager, Entity, CardType } from './scripts';
 */

// 类型定义
export * from './types/GameTypes';

// 实体
export { Entity, DamageResult, HealResult } from './entities/Entity';

// 系统
export { RollSystem, getRollSystem } from './systems/RollSystem';
export { EffectSystem, getEffectSystem, EffectApplyResult, EffectTriggerResult } from './systems/EffectSystem';
export { CardSystem, getCardSystem, DrawResult, UseCardResult } from './systems/CardSystem';

// 管理器
export { BattleManager, getBattleManager, BattleConfig, TurnResult, BattleResult } from './managers/BattleManager';

// 增强版管理器
export {
    EnhancedBattleManager,
    getEnhancedBattleManager,
    EnhancedBattleConfig,
    EnhancedTurnResult,
    AIType,
    BurstState,
    DefenseStance
} from './EnhancedBattleManager';

// 数据
export * from './data/CardDatabase';

// 增强版卡牌数据
export {
    // 枚举
    RollQuality,
    CardTag,
    // 类型
    RollQualityEffect,
    EnhancedCardData,
    // 函数
    getRollQuality,
    getRollQualityName,
    getRollQualityColor,
    // 卡牌
    GAMBLER_BLADE,
    FATE_DICE,
    PRECISE_STAB,
    DOUBLE_SLASH,
    DEFLECT,
    GAMBLER_LAUGH,
    IMBALANCE_STRIKE,
    ANTICIPATION_BLOCK,
    WIND_SLASH,
    FLASH_STEP,
    HEAVY_BLOW,
    CHARGED_STRIKE,
    ENHANCED_FIREBALL,
    ENHANCED_SLASH,
    // 牌组
    ENHANCED_STARTING_DECK,
    GAMBLER_DECK,
    STABLE_DECK,
    ALL_ENHANCED_CARDS
} from './data/EnhancedCardDatabase';

// 工具
export * from './utils/Utils';

// 游戏主入口
export { GameMain } from './GameMain';
