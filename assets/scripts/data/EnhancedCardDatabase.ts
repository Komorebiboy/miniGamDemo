/**
 * 增强版卡牌数据库
 * 
 * 新特性：
 * 1. Roll品质系统 - 不同Roll区间触发不同效果
 * 2. 反制系统 - 专门克制大Roll的牌
 * 3. 稳定�?vs 赌博�?- 卡牌明显分化
 * 4. 速度机制 - 速度差≥5时高速牌优先
 */

import {
    CardData,
    CardType,
    CardRarity,
    EffectType,
    EffectTrigger
} from '../types/GameTypes';

// ==================== Roll品质等级 ====================
export enum RollQuality {
    POOR = 'POOR',           // 极差 1-5
    LOW = 'LOW',             // 较低 6-10
    NORMAL = 'NORMAL',       // 普�?11-15
    HIGH = 'HIGH',           // 较高 16-20
    EXCELLENT = 'EXCELLENT', // 优秀 21-25
    LEGENDARY = 'LEGENDARY'  // 传说 26+
}

// ==================== 卡牌标签 ====================
export enum CardTag {
    STABLE = 'STABLE',           // 稳定�?- Roll范围�?
    GAMBLE = 'GAMBLE',           // 赌博�?- Roll范围�?
    COUNTER = 'COUNTER',         // 反制�?
    SPEED = 'SPEED',             // 高速牌
    HEAVY = 'HEAVY',             // 重型�?
    COMBO = 'COMBO',             // 连击�?
    BURST = 'BURST',             // 爆发�?
    CONTROL = 'CONTROL'          // 控制�?
}

// ==================== Roll品质效果接口 ====================
export interface RollQualityEffect {
    minRoll: number;
    maxRoll: number;
    quality: RollQuality;
    name: string;
    description: string;
    extraEffects?: {
        type: EffectType;
        value: number;
        duration: number;
    }[];
    damageMultiplier?: number;
    animationLevel: number; // 0-3，影响动画表�?
}

// ==================== 增强卡牌数据接口 ====================
export interface EnhancedCardData extends CardData {
    tags?: CardTag[];
    rollQualityEffects?: RollQualityEffect[];
    counterEffects?: {
        condition: 'enemyRollHigh' | 'enemyRollLow' | 'rollDiffSmall' | 'speedDiffHigh';
        threshold: number;
        effect: string;
        damageModifier?: number;
        extraDamage?: number;
    }[];
    speedPriority?: boolean; // 速度优先结算
}

// ==================== Roll品质效果定义 ====================
const FIREBALL_QUALITY_EFFECTS: RollQualityEffect[] = [
    {
        minRoll: 1, maxRoll: 5, quality: RollQuality.POOR,
        name: '微弱火苗',
        description: '伤害减半',
        damageMultiplier: 0.5,
        animationLevel: 0
    },
    {
        minRoll: 6, maxRoll: 10, quality: RollQuality.LOW,
        name: '普通火�?,
        description: '正常伤害',
        damageMultiplier: 1.0,
        animationLevel: 1
    },
    {
        minRoll: 11, maxRoll: 15, quality: RollQuality.NORMAL,
        name: '爆炎火球',
        description: '伤害+3，附加点�?,
        damageMultiplier: 1.0,
        extraEffects: [{ type: EffectType.BURNING, value: 2, duration: 2 }],
        animationLevel: 2
    },
    {
        minRoll: 16, maxRoll: 20, quality: RollQuality.HIGH,
        name: '超爆�?,
        description: '伤害+5，附加点燃和易伤',
        damageMultiplier: 1.2,
        extraEffects: [
            { type: EffectType.BURNING, value: 3, duration: 3 },
            { type: EffectType.VULNERABLE, value: 1, duration: 2 }
        ],
        animationLevel: 3
    },
    {
        minRoll: 21, maxRoll: 25, quality: RollQuality.EXCELLENT,
        name: '炼狱火球',
        description: '伤害+8，强力点燃和易伤',
        damageMultiplier: 1.5,
        extraEffects: [
            { type: EffectType.BURNING, value: 5, duration: 3 },
            { type: EffectType.VULNERABLE, value: 2, duration: 2 }
        ],
        animationLevel: 3
    }
];

const SLASH_QUALITY_EFFECTS: RollQualityEffect[] = [
    {
        minRoll: 1, maxRoll: 5, quality: RollQuality.POOR,
        name: '失误斩击',
        description: '伤害减半',
        damageMultiplier: 0.5,
        animationLevel: 0
    },
    {
        minRoll: 6, maxRoll: 10, quality: RollQuality.LOW,
        name: '普通斩�?,
        description: '正常伤害',
        damageMultiplier: 1.0,
        animationLevel: 1
    },
    {
        minRoll: 11, maxRoll: 15, quality: RollQuality.NORMAL,
        name: '精准斩击',
        description: '伤害+2，附加流血',
        damageMultiplier: 1.0,
        extraEffects: [{ type: EffectType.BLEEDING, value: 2, duration: 2 }],
        animationLevel: 2
    },
    {
        minRoll: 16, maxRoll: 20, quality: RollQuality.HIGH,
        name: '致命斩击',
        description: '伤害+4，强力流血',
        damageMultiplier: 1.2,
        extraEffects: [{ type: EffectType.BLEEDING, value: 4, duration: 3 }],
        animationLevel: 3
    },
    {
        minRoll: 21, maxRoll: 25, quality: RollQuality.EXCELLENT,
        name: '斩首',
        description: '伤害+6，致命流血',
        damageMultiplier: 1.5,
        extraEffects: [{ type: EffectType.BLEEDING, value: 6, duration: 3 }],
        animationLevel: 3
    }
];

// ==================== 赌博流卡�?====================

/**
 * 赌徒之刃 - 赌博流代�?
 * Roll范围极大，上限极高但极不稳定
 */
export const GAMBLER_BLADE: EnhancedCardData = {
    id: 'gambler_blade',
    name: '赌徒之刃',
    description: '0~25的极端Roll范围，赌到高点就是神',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 25 },
    speed: 4,
    effects: [],
    tags: [CardTag.GAMBLE, CardTag.BURST],
    rollQualityEffects: [
        {
            minRoll: 0, maxRoll: 5, quality: RollQuality.POOR,
            name: '彻底失败',
            description: '只造成5点伤�?,
            damageMultiplier: 0,
            extraEffects: [{ type: EffectType.DAMAGE, value: 5, duration: 0 }],
            animationLevel: 0
        },
        {
            minRoll: 6, maxRoll: 10, quality: RollQuality.LOW,
            name: '平庸一�?,
            description: '正常伤害',
            damageMultiplier: 1.0,
            animationLevel: 1
        },
        {
            minRoll: 11, maxRoll: 15, quality: RollQuality.NORMAL,
            name: '不错的一�?,
            description: '伤害+3',
            damageMultiplier: 1.0,
            extraEffects: [{ type: EffectType.DAMAGE, value: 3, duration: 0 }],
            animationLevel: 2
        },
        {
            minRoll: 16, maxRoll: 20, quality: RollQuality.HIGH,
            name: '致命一�?,
            description: '伤害翻�?,
            damageMultiplier: 2.0,
            animationLevel: 3
        },
        {
            minRoll: 21, maxRoll: 25, quality: RollQuality.EXCELLENT,
            name: '神之一�?,
            description: '伤害三倍，附加眩晕',
            damageMultiplier: 3.0,
            extraEffects: [{ type: EffectType.STUN, value: 1, duration: 1 }],
            animationLevel: 3
        }
    ]
};

/**
 * 命运骰子 - 纯赌博牌
 */
export const FATE_DICE: EnhancedCardData = {
    id: 'fate_dice',
    name: '命运骰子',
    description: '1~20的完全随机伤�?,
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 1, max: 20 },

    speed: 6,
    effects: [],
    tags: [CardTag.GAMBLE]
};

// ==================== 稳定流卡�?====================

/**
 * 精准刺击 - 稳定流代�?
 * Roll范围小，稳定输出
 */
export const PRECISE_STAB: EnhancedCardData = {
    id: 'precise_stab',
    name: '精准刺击',
    description: '稳定�?~10伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 0,
    rollRange: { min: 7, max: 10 },

    speed: 7,
    effects: [],
    tags: [CardTag.STABLE]
};

/**
 * 双重斩击 - 稳定连击
 */
export const DOUBLE_SLASH: EnhancedCardData = {
    id: 'double_slash',
    name: '双重斩击',
    description: '两次5~7的攻�?,
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 5, max: 7 },

    speed: 6,
    effects: [
        { type: EffectType.DAMAGE, value: 0, duration: 0, trigger: EffectTrigger.IMMEDIATE } // 触发两次
    ],
    tags: [CardTag.STABLE, CardTag.COMBO]
};

// ==================== 反制卡牌 ====================

/**
 * 偏转 - 反制大Roll
 */
export const DEFLECT: EnhancedCardData = {
    id: 'deflect',
    name: '偏转',
    description: '若敌方Roll�?5，伤害减�?,
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 5, max: 10 },

    speed: 8,
    effects: [],
    tags: [CardTag.COUNTER, CardTag.DEFENSE],
    counterEffects: [
        {
            condition: 'enemyRollHigh',
            threshold: 15,
            effect: 'damage_halved',
            damageModifier: 0.5
        }
    ]
};

/**
 * 赌徒狂笑 - 反制接近Roll
 */
export const GAMBLER_LAUGH: EnhancedCardData = {
    id: 'gambler_laugh',
    name: '赌徒狂笑',
    description: '若双方Roll差值≤1，额外行动一�?,
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 8, max: 12 },

    speed: 7,
    effects: [],
    tags: [CardTag.COUNTER, CardTag.COMBO],
    counterEffects: [
        {
            condition: 'rollDiffSmall',
            threshold: 1,
            effect: 'extra_action'
        }
    ]
};

/**
 * 失衡打击 - 反制极高Roll
 */
export const IMBALANCE_STRIKE: EnhancedCardData = {
    id: 'imbalance_strike',
    name: '失衡打击',
    description: '若敌方Roll�?0，对方下回合Roll上限减半',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 6, max: 10 },

    speed: 5,
    effects: [],
    tags: [CardTag.COUNTER, CardTag.CONTROL],
    counterEffects: [
        {
            condition: 'enemyRollHigh',
            threshold: 20,
            effect: 'reduce_enemy_roll_max',
            extraDamage: 3
        }
    ]
};

/**
 * 预判格挡 - 速度反制
 */
export const ANTICIPATION_BLOCK: EnhancedCardData = {
    id: 'anticipation_block',
    name: '预判格挡',
    description: '若速度差≥5，完全格挡敌方攻�?,
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 8, max: 12 },

    speed: 10, // 极高�?
    effects: [
        { type: EffectType.SHIELD, value: 5, duration: 0, trigger: EffectTrigger.IMMEDIATE }
    ],
    tags: [CardTag.COUNTER, CardTag.SPEED],
    speedPriority: true,
    counterEffects: [
        {
            condition: 'speedDiffHigh',
            threshold: 5,
            effect: 'complete_block'
        }
    ]
};

// ==================== 高速卡�?====================

/**
 * 疾风�?- 极速攻�?
 */
export const WIND_SLASH: EnhancedCardData = {
    id: 'wind_slash',
    name: '疾风�?,
    description: '速度12的极速攻击，可打断慢速牌',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 5, max: 8 },

    speed: 12,
    effects: [],
    tags: [CardTag.SPEED, CardTag.CONTROL],
    speedPriority: true
};

/**
 * 瞬步 - 极速位�?
 */
export const FLASH_STEP: EnhancedCardData = {
    id: 'flash_step',
    name: '瞬步',
    description: '速度15，下回合Roll+3',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },

    speed: 15,
    effects: [
        { type: EffectType.ENERGY, value: 0, duration: 0, trigger: EffectTrigger.IMMEDIATE }
    ],
    tags: [CardTag.SPEED]
};

// ==================== 重型卡牌 ====================

/**
 * 重击 - 慢速高�?
 */
export const HEAVY_BLOW: EnhancedCardData = {
    id: 'heavy_blow',
    name: '重击',
    description: '速度2，但伤害12~16',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 0,
    rollRange: { min: 12, max: 16 },

    speed: 2,
    effects: [],
    tags: [CardTag.HEAVY, CardTag.BURST]
};

/**
 * 蓄力一�?- 极慢速但极高�?
 */
export const CHARGED_STRIKE: EnhancedCardData = {
    id: 'charged_strike',
    name: '蓄力一�?,
    description: '速度1，伤�?5~20，可被高速牌打断',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 15, max: 20 },

    speed: 1,
    effects: [],
    tags: [CardTag.HEAVY, CardTag.BURST]
};

// ==================== 带Roll品质的普通卡�?====================

/**
 * 火球�?- 带品质效�?
 */
export const ENHANCED_FIREBALL: EnhancedCardData = {
    id: 'enhanced_fireball',
    name: '火球�?,
    description: '根据Roll值触发不同品质效�?,
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 1, max: 25 },

    speed: 5,
    effects: [],
    tags: [CardTag.BURST],
    rollQualityEffects: FIREBALL_QUALITY_EFFECTS
};

/**
 * 斩击 - 带品质效�?
 */
export const ENHANCED_SLASH: EnhancedCardData = {
    id: 'enhanced_slash',
    name: '斩击',
    description: '根据Roll值触发不同品质效�?,
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 0,
    rollRange: { min: 1, max: 25 },

    speed: 5,
    effects: [],
    tags: [],
    rollQualityEffects: SLASH_QUALITY_EFFECTS
};

// ==================== 增强牌组 ====================

export const ENHANCED_STARTING_DECK: EnhancedCardData[] = [
    PRECISE_STAB, PRECISE_STAB,
    ENHANCED_SLASH,
    DEFLECT,
    WIND_SLASH,
    HEAVY_BLOW,
    ANTICIPATION_BLOCK
];

export const GAMBLER_DECK: EnhancedCardData[] = [
    GAMBLER_BLADE,
    FATE_DICE, FATE_DICE, FATE_DICE,
    GAMBLER_LAUGH,
    FLASH_STEP
];

export const STABLE_DECK: EnhancedCardData[] = [
    PRECISE_STAB, PRECISE_STAB, PRECISE_STAB, PRECISE_STAB,
    DOUBLE_SLASH, DOUBLE_SLASH,
    DEFLECT,
    ANTICIPATION_BLOCK
];

// ==================== 导出所有增强卡�?====================

export const ALL_ENHANCED_CARDS: EnhancedCardData[] = [
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
    ENHANCED_SLASH
];

/**
 * 获取Roll品质
 */
export function getRollQuality(roll: number, qualityEffects: RollQualityEffect[]): RollQualityEffect | null {
    for (const effect of qualityEffects) {
        if (roll >= effect.minRoll && roll <= effect.maxRoll) {
            return effect;
        }
    }
    return null;
}

/**
 * 获取Roll品质名称
 */
export function getRollQualityName(quality: RollQuality): string {
    const names: Record<RollQuality, string> = {
        [RollQuality.POOR]: '极差',
        [RollQuality.LOW]: '较低',
        [RollQuality.NORMAL]: '普�?,
        [RollQuality.HIGH]: '较高',
        [RollQuality.EXCELLENT]: '优秀',
        [RollQuality.LEGENDARY]: '传说'
    };
    return names[quality] || '未知';
}

/**
 * 获取Roll品质颜色
 */
export function getRollQualityColor(quality: RollQuality): string {
    const colors: Record<RollQuality, string> = {
        [RollQuality.POOR]: '#808080',
        [RollQuality.LOW]: '#8B4513',
        [RollQuality.NORMAL]: '#228B22',
        [RollQuality.HIGH]: '#4169E1',
        [RollQuality.EXCELLENT]: '#9932CC',
        [RollQuality.LEGENDARY]: '#FFD700'
    };
    return colors[quality] || '#FFFFFF';
}
