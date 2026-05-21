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

// 数据
export * from './data/CardDatabase';

// 工具
export * from './utils/Utils';

// 游戏主入口
export { GameMain } from './GameMain';
