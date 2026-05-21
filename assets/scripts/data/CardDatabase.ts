/**
 * CardDatabase 卡牌数据库
 *
 * 预定义所有可用的卡牌数据
 * 包括攻击牌、防御牌、技能牌、能力牌
 */

import {
    CardData,
    CardType,
    CardRarity,
    EffectType,
    EffectTrigger
} from '../types/GameTypes';

/**
 * 基础攻击牌
 */
export const BASIC_ATTACK: CardData = {
    id: 'basic_attack',
    name: '基础攻击',
    description: '造成基础伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 6,
    rollRange: { min: 1, max: 6 },
    energyCost: 1,
    speed: 5,
    effects: []
};

/**
 * 强力攻击
 */
export const POWER_ATTACK: CardData = {
    id: 'power_attack',
    name: '强力攻击',
    description: '造成大量伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 10,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 4,
    effects: []
};

/**
 * 流血攻击
 */
export const BLEED_ATTACK: CardData = {
    id: 'bleed_attack',
    name: '割伤',
    description: '造成伤害并使目标流血',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 4 },
    energyCost: 1,
    speed: 5,
    effects: [
        {
            type: EffectType.BLEEDING,
            value: 3,
            duration: 3,
            trigger: EffectTrigger.ON_TURN_END
        }
    ]
};

/**
 * 火焰攻击
 */
export const FIRE_ATTACK: CardData = {
    id: 'fire_attack',
    name: '火焰斩',
    description: '造成伤害并点燃目标',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 5,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 5,
    effects: [
        {
            type: EffectType.BURNING,
            value: 2,
            duration: 3,
            trigger: EffectTrigger.ON_TURN_END
        }
    ]
};

/**
 * 基础防御
 */
export const BASIC_DEFEND: CardData = {
    id: 'basic_defend',
    name: '基础防御',
    description: '获得护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 7,
    effects: []
};

/**
 * 强力防御
 */
export const POWER_DEFEND: CardData = {
    id: 'power_defend',
    name: '铁壁',
    description: '获得大量护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    baseValue: 10,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 6,
    effects: []
};

/**
 * 治疗技能
 */
export const HEAL_SKILL: CardData = {
    id: 'heal_skill',
    name: '治疗术',
    description: '恢复生命值',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 8,
    rollRange: { min: 2, max: 6 },
    energyCost: 1,
    speed: 8,
    effects: [
        {
            type: EffectType.HEAL,
            value: 0, // 使用baseValue
            duration: 0,
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 冰冻技能
 */
export const FREEZE_SKILL: CardData = {
    id: 'freeze_skill',
    name: '冰冻术',
    description: '冻结目标，使其跳过下一回合',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 1, max: 3 },
    energyCost: 2,
    speed: 9,
    effects: [
        {
            type: EffectType.FREEZE,
            value: 1,
            duration: 1,
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 力量能力
 */
export const STRENGTH_POWER: CardData = {
    id: 'strength_power',
    name: '力量强化',
    description: '获得力量，增加伤害输出',
    type: CardType.POWER,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 10,
    effects: [
        {
            type: EffectType.STRENGTH,
            value: 2,
            duration: -1, // 永久
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 敏捷能力
 */
export const DEXTERITY_POWER: CardData = {
    id: 'dexterity_power',
    name: '敏捷强化',
    description: '获得敏捷，增加防御',
    type: CardType.POWER,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 10,
    effects: [
        {
            type: EffectType.DEXTERITY,
            value: 2,
            duration: -1, // 永久
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 抽牌技能
 */
export const DRAW_SKILL: CardData = {
    id: 'draw_skill',
    name: '快速抽牌',
    description: '抽取额外卡牌',
    type: CardType.SKILL,
    rarity: CardRarity.COMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 10,
    effects: [
        {
            type: EffectType.DRAW,
            value: 2,
            duration: 0,
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 能量技能
 */
export const ENERGY_SKILL: CardData = {
    id: 'energy_skill',
    name: '能量爆发',
    description: '恢复能量',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 0,
    speed: 10,
    effects: [
        {
            type: EffectType.ENERGY,
            value: 2,
            duration: 0,
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 虚弱攻击
 */
export const WEAK_ATTACK: CardData = {
    id: 'weak_attack',
    name: '虚弱打击',
    description: '造成伤害并使目标虚弱',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 4 },
    energyCost: 1,
    speed: 5,
    effects: [
        {
            type: EffectType.WEAK,
            value: 1,
            duration: 2,
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 易伤攻击
 */
export const VULNERABLE_ATTACK: CardData = {
    id: 'vulnerable_attack',
    name: '破甲击',
    description: '造成伤害并使目标易伤',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 2,
    speed: 5,
    effects: [
        {
            type: EffectType.VULNERABLE,
            value: 1,
            duration: 2,
            trigger: EffectTrigger.IMMEDIATE
        }
    ]
};

/**
 * 所有卡牌列表
 */
export const ALL_CARDS: CardData[] = [
    BASIC_ATTACK,
    POWER_ATTACK,
    BLEED_ATTACK,
    FIRE_ATTACK,
    BASIC_DEFEND,
    POWER_DEFEND,
    HEAL_SKILL,
    FREEZE_SKILL,
    STRENGTH_POWER,
    DEXTERITY_POWER,
    DRAW_SKILL,
    ENERGY_SKILL,
    WEAK_ATTACK,
    VULNERABLE_ATTACK
];

/**
 * 获取初始牌组
 * @returns 基础牌组
 */
export function getStartingDeck(): CardData[] {
    return [
        BASIC_ATTACK, BASIC_ATTACK, BASIC_ATTACK, BASIC_ATTACK,
        BASIC_DEFEND, BASIC_DEFEND, BASIC_DEFEND, BASIC_DEFEND,
        BLEED_ATTACK,
        HEAL_SKILL
    ];
}

/**
 * 获取敌人牌组
 * @returns 敌人牌组
 */
export function getEnemyDeck(): CardData[] {
    return [
        BASIC_ATTACK, BASIC_ATTACK, BASIC_ATTACK, BASIC_ATTACK, BASIC_ATTACK,
        BASIC_DEFEND, BASIC_DEFEND, BASIC_DEFEND,
        POWER_ATTACK,
        WEAK_ATTACK
    ];
}

/**
 * 通过ID获取卡牌
 * @param id 卡牌ID
 * @returns 卡牌数据或undefined
 */
export function getCardById(id: string): CardData | undefined {
    return ALL_CARDS.find(card => card.id === id);
}

/**
 * 获取随机卡牌
 * @param rarity 稀有度筛选（可选）
 * @returns 随机卡牌
 */
export function getRandomCard(rarity?: CardRarity): CardData {
    let cards = ALL_CARDS;
    if (rarity) {
        cards = ALL_CARDS.filter(card => card.rarity === rarity);
    }
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
}
