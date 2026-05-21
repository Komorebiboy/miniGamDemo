/**
 * 100张卡牌数据库
 * 
 * 职业体系：战士、法师、赌徒、刺客
 * 流派：流血、火焰、冻结、高风险赌博
 * 
 * 数值平衡公式：
 * - 1能量 = 6-8点基础值
 * - 速度值范围：1-10
 * - Roll范围：1-12
 * 
 * 稀有度分布：
 * - COMMON: 60%
 * - UNCOMMON: 25%
 * - RARE: 10%
 * - LEGENDARY: 5%
 */

import { CardData, CardType, CardRarity, EffectType, EffectTrigger } from '../types/GameTypes';

// ==================== 战士职业（25张）====================
// 特点：高防御、稳定输出、流血流派

const WARRIOR_CARDS: CardData[] = [
  // 基础攻击牌（Common）
  {
    id: 'warrior_strike',
    name: '战士打击',
    description: '造成基础伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 6,
    rollRange: { min: 1, max: 6 },
    energyCost: 1,
    speed: 5,
    effects: []
  },
  {
    id: 'warrior_heavy_blow',
    name: '重击',
    description: '造成较高伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 10,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 4,
    effects: []
  },
  {
    id: 'warrior_slash',
    name: '斩击',
    description: '快速攻击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 7,
    effects: []
  },
  {
    id: 'warrior_cleave',
    name: '顺劈斩',
    description: '范围伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 8,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 5,
    effects: []
  },
  {
    id: 'warrior_thrust',
    name: '突刺',
    description: '精准打击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 7,
    rollRange: { min: 1, max: 7 },
    energyCost: 1,
    speed: 6,
    effects: []
  },

  // 流血流派（Bleeding）
  {
    id: 'warrior_bleed_strike',
    name: '放血打击',
    description: '造成伤害并使目标流血3回合',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 5 },
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
  },
  {
    id: 'warrior_deep_wound',
    name: '深度创伤',
    description: '造成流血和虚弱',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 6,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 4,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 4,
        duration: 3,
        trigger: EffectTrigger.ON_TURN_END
      },
      {
        type: EffectType.WEAK,
        value: 1,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'warrior_blood_rage',
    name: '血怒',
    description: '根据目标流血层数造成额外伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 2,
    speed: 6,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 5,
        duration: 2,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'warrior_serrated_blade',
    name: '锯齿刃',
    description: '高伤害流血',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 8,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 5,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 3,
        duration: 4,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'warrior_exsanguinate',
    name: '放血术',
    description: '立即结算所有流血伤害',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 8,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 10,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 防御牌
  {
    id: 'warrior_defend',
    name: '防御姿态',
    description: '获得护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 7,
    effects: []
  },
  {
    id: 'warrior_shield_block',
    name: '盾牌格挡',
    description: '大量护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 10,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 6,
    effects: []
  },
  {
    id: 'warrior_fortress',
    name: '铁壁',
    description: '巨额护盾但速度慢',
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    baseValue: 15,
    rollRange: { min: 3, max: 9 },
    energyCost: 3,
    speed: 2,
    effects: []
  },
  {
    id: 'warrior_counter_stance',
    name: '反击姿态',
    description: '获得护盾，下回合反击',
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    baseValue: 6,
    rollRange: { min: 1, max: 6 },
    energyCost: 2,
    speed: 5,
    effects: [
      {
        type: EffectType.STRENGTH,
        value: 2,
        duration: 1,
        trigger: EffectTrigger.ON_TURN_START
      }
    ]
  },
  {
    id: 'warrior_spiked_shield',
    name: '尖刺盾',
    description: '护盾+反伤',
    type: CardType.DEFENSE,
    rarity: CardRarity.RARE,
    baseValue: 8,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 5,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 2,
        duration: 2,
        trigger: EffectTrigger.ON_DAMAGE_TAKEN
      }
    ]
  },

  // 力量增益
  {
    id: 'warrior_flex',
    name: '肌肉展示',
    description: '获得力量',
    type: CardType.POWER,
    rarity: CardRarity.COMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 10,
    effects: [
      {
        type: EffectType.STRENGTH,
        value: 2,
        duration: -1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'warrior_bulk_up',
    name: '强化肌肉',
    description: '大量力量',
    type: CardType.POWER,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 10,
    effects: [
      {
        type: EffectType.STRENGTH,
        value: 4,
        duration: -1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'warrior_limit_break',
    name: '突破极限',
    description: '史诗级力量提升',
    type: CardType.POWER,
    rarity: CardRarity.LEGENDARY,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 3,
    speed: 10,
    effects: [
      {
        type: EffectType.STRENGTH,
        value: 8,
        duration: -1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 技能牌
  {
    id: 'warrior_second_wind',
    name: '第二 wind',
    description: '恢复生命',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 10,
    rollRange: { min: 2, max: 8 },
    energyCost: 1,
    speed: 8,
    effects: [
      {
        type: EffectType.HEAL,
        value: 0,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'warrior_battle_cry',
    name: '战吼',
    description: '抽牌+力量',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 9,
    effects: [
      {
        type: EffectType.DRAW,
        value: 2,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      },
      {
        type: EffectType.STRENGTH,
        value: 1,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'warrior_intimidate',
    name: '恐吓',
    description: '使敌人虚弱',
    type: CardType.SKILL,
    rarity: CardRarity.COMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 8,
    effects: [
      {
        type: EffectType.WEAK,
        value: 2,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 史诗级高风险牌
  {
    id: 'warrior_berserk',
    name: '狂战士之怒',
    description: '失去5生命，获得10力量和2能量',
    type: CardType.POWER,
    rarity: CardRarity.LEGENDARY,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 0,
    speed: 10,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 5,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      },
      {
        type: EffectType.STRENGTH,
        value: 10,
        duration: -1,
        trigger: EffectTrigger.IMMEDIATE
      },
      {
        type: EffectType.ENERGY,
        value: 2,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'warrior_last_stand',
    name: '背水一战',
    description: '生命低于20时伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.LEGENDARY,
    baseValue: 12,
    rollRange: { min: 3, max: 9 },
    energyCost: 3,
    speed: 3,
    effects: []
  },
  {
    id: 'warrior_execution',
    name: '处决',
    description: '目标生命低于30时直接击杀',
    type: CardType.ATTACK,
    rarity: CardRarity.LEGENDARY,
    baseValue: 8,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 4,
    effects: []
  },

  // Combo牌
  {
    id: 'warrior_combo_strike',
    name: '连击',
    description: '本回合每出过一张牌，伤害+3',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 6,
    effects: []
  },
  {
    id: 'warrior_finisher',
    name: '终结技',
    description: '目标有流血时伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 6,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 5,
    effects: []
  }
];

// ==================== 法师职业（25张）====================
// 特点：元素伤害、冻结控制、高爆发

const MAGE_CARDS: CardData[] = [
  // 火焰流派（Fire）
  {
    id: 'mage_fire_bolt',
    name: '火焰箭',
    description: '造成火焰伤害并点燃',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 6,
    effects: [
      {
        type: EffectType.BURNING,
        value: 2,
        duration: 3,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'mage_fireball',
    name: '火球术',
    description: '高伤害火焰攻击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 9,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 5,
    effects: [
      {
        type: EffectType.BURNING,
        value: 3,
        duration: 2,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'mage_inferno',
    name: '炼狱',
    description: '巨额火焰伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 14,
    rollRange: { min: 3, max: 9 },
    energyCost: 3,
    speed: 4,
    effects: [
      {
        type: EffectType.BURNING,
        value: 4,
        duration: 3,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'mage_combust',
    name: '燃烧',
    description: '立即结算所有点燃伤害',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 8,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 8,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_flame_ward',
    name: '火焰护盾',
    description: '护盾+点燃攻击者',
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    baseValue: 6,
    rollRange: { min: 1, max: 6 },
    energyCost: 1,
    speed: 6,
    effects: [
      {
        type: EffectType.BURNING,
        value: 2,
        duration: 2,
        trigger: EffectTrigger.ON_DAMAGE_TAKEN
      }
    ]
  },

  // 冻结流派（Freeze）
  {
    id: 'mage_ice_bolt',
    name: '寒冰箭',
    description: '造成伤害并减速',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 7,
    effects: [
      {
        type: EffectType.FREEZE,
        value: 1,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_frost_nova',
    name: '冰霜新星',
    description: '冻结目标',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 8,
    effects: [
      {
        type: EffectType.FREEZE,
        value: 1,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_blizzard',
    name: '暴风雪',
    description: '高伤害+冻结',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 8,
    rollRange: { min: 2, max: 8 },
    energyCost: 3,
    speed: 3,
    effects: [
      {
        type: EffectType.FREEZE,
        value: 1,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      },
      {
        type: EffectType.BURNING,
        value: 2,
        duration: 2,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'mage_deep_freeze',
    name: '深度冻结',
    description: '冻结2回合',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 3,
    speed: 7,
    effects: [
      {
        type: EffectType.FREEZE,
        value: 1,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_ice_armor',
    name: '冰霜护甲',
    description: '护盾+冻结攻击者',
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    baseValue: 8,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 5,
    effects: [
      {
        type: EffectType.FREEZE,
        value: 1,
        duration: 1,
        trigger: EffectTrigger.ON_DAMAGE_TAKEN
      }
    ]
  },

  // 基础法术
  {
    id: 'mage_arcane_missile',
    name: '奥术飞弹',
    description: '稳定魔法伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 6,
    rollRange: { min: 2, max: 6 },
    energyCost: 1,
    speed: 7,
    effects: []
  },
  {
    id: 'mage_arcane_blast',
    name: '奥术冲击',
    description: '高伤害法术',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 10,
    rollRange: { min: 3, max: 9 },
    energyCost: 2,
    speed: 6,
    effects: []
  },
  {
    id: 'mage_mana_shield',
    name: '法力护盾',
    description: '用能量代替生命承受伤害',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 8,
    rollRange: { min: 2, max: 6 },
    energyCost: 1,
    speed: 8,
    effects: []
  },
  {
    id: 'mage_arcane_intellect',
    name: '奥术智慧',
    description: '抽2张牌',
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
  },
  {
    id: 'mage_mana_surge',
    name: '法力涌动',
    description: '恢复能量',
    type: CardType.SKILL,
    rarity: CardRarity.COMMON,
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
  },

  // 元素Combo
  {
    id: 'mage_elemental_fusion',
    name: '元素融合',
    description: '火焰+冻结同时触发',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 7,
    rollRange: { min: 2, max: 7 },
    energyCost: 2,
    speed: 5,
    effects: [
      {
        type: EffectType.BURNING,
        value: 3,
        duration: 2,
        trigger: EffectTrigger.ON_TURN_END
      },
      {
        type: EffectType.FREEZE,
        value: 1,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_thermal_shock',
    name: '热震',
    description: '目标有冻结时火焰伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 6,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 6,
    effects: [
      {
        type: EffectType.BURNING,
        value: 4,
        duration: 2,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },

  // 控制技能
  {
    id: 'mage_polymorph',
    name: '变形术',
    description: '使敌人跳过下回合',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 7,
    effects: [
      {
        type: EffectType.STUN,
        value: 1,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_weakness',
    name: '虚弱诅咒',
    description: '大幅降低敌人伤害',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 8,
    effects: [
      {
        type: EffectType.WEAK,
        value: 3,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_vulnerability',
    name: '易伤诅咒',
    description: '使敌人受到更多伤害',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 8,
    effects: [
      {
        type: EffectType.VULNERABLE,
        value: 2,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 史诗级高风险牌
  {
    id: 'mage_pyroblast',
    name: '炎爆术',
    description: '消耗所有能量，每点能量造成5伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.LEGENDARY,
    baseValue: 5,
    rollRange: { min: 0, max: 0 },
    energyCost: 0,
    speed: 2,
    effects: []
  },
  {
    id: 'mage_time_warp',
    name: '时间扭曲',
    description: '获得额外回合但受到双倍伤害下回合',
    type: CardType.SKILL,
    rarity: CardRarity.LEGENDARY,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 3,
    speed: 10,
    effects: [
      {
        type: EffectType.VULNERABLE,
        value: 5,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'mage_meteor',
    name: '陨石术',
    description: '对自己和敌人各造成15伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.LEGENDARY,
    baseValue: 15,
    rollRange: { min: 5, max: 10 },
    energyCost: 3,
    speed: 1,
    effects: []
  },

  // 特殊Combo
  {
    id: 'mage_chain_reaction',
    name: '连锁反应',
    description: '目标有元素状态时伤害+50%',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 8,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 6,
    effects: []
  },
  {
    id: 'mage_overload',
    name: '法力超载',
    description: '下张法术牌伤害翻倍',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 9,
    effects: [
      {
        type: EffectType.STRENGTH,
        value: 5,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  }
];

// ==================== 赌徒职业（25张）====================
// 特点：高风险高回报、随机性、骰子机制

const GAMBLER_CARDS: CardData[] = [
  // 基础赌博牌
  {
    id: 'gambler_coin_toss',
    name: '抛硬币',
    description: '50%伤害翻倍，50%失效',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 6,
    rollRange: { min: 1, max: 12 },
    energyCost: 1,
    speed: 5,
    effects: []
  },
  {
    id: 'gambler_dice_roll',
    name: '掷骰子',
    description: 'Roll范围极大',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 3,
    rollRange: { min: 1, max: 12 },
    energyCost: 1,
    speed: 6,
    effects: []
  },
  {
    id: 'gambler_lucky_shot',
    name: '幸运一击',
    description: '高Roll上限',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 10 },
    energyCost: 1,
    speed: 7,
    effects: []
  },
  {
    id: 'gambler_risky_bet',
    name: '高风险赌注',
    description: '可能对自己造成伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 12,
    rollRange: { min: 1, max: 8 },
    energyCost: 2,
    speed: 5,
    effects: []
  },
  {
    id: 'gambler_all_in',
    name: '全押',
    description: '消耗所有能量，伤害随机',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 1, max: 20 },
    energyCost: 0,
    speed: 4,
    effects: []
  },

  // 高风险赌博流派
  {
    id: 'gambler_russian_roulette',
    name: '俄罗斯轮盘',
    description: '1/6概率即死敌人，5/6概率对自己造成10伤害',
    type: CardType.SKILL,
    rarity: CardRarity.LEGENDARY,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 3,
    effects: []
  },
  {
    id: 'gambler_double_or_nothing',
    name: '翻倍或归零',
    description: '50%获得4能量，50%失去所有能量',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 8,
    effects: [
      {
        type: EffectType.ENERGY,
        value: 4,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'gambler_jackpot',
    name: '头奖',
    description: 'Roll出12时伤害x3',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 5,
    rollRange: { min: 1, max: 12 },
    energyCost: 2,
    speed: 5,
    effects: []
  },
  {
    id: 'gambler_bad_luck',
    name: '厄运',
    description: 'Roll出1时对自己造成伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 10,
    rollRange: { min: 1, max: 8 },
    energyCost: 1,
    speed: 6,
    effects: []
  },
  {
    id: 'gambler_lucky_charm',
    name: '幸运符',
    description: '下3次Roll取最高值',
    type: CardType.POWER,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 10,
    effects: [
      {
        type: EffectType.DEXTERITY,
        value: 3,
        duration: 3,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 抽牌和能量
  {
    id: 'gambler_draw_luck',
    name: '幸运抽牌',
    description: '抽3张牌，弃掉1张',
    type: CardType.SKILL,
    rarity: CardRarity.COMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 9,
    effects: [
      {
        type: EffectType.DRAW,
        value: 3,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'gambler_energy_gamble',
    name: '能量赌博',
    description: '获得1-3随机能量',
    type: CardType.SKILL,
    rarity: CardRarity.COMMON,
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
  },
  {
    id: 'gambler_reload',
    name: '重新装填',
    description: '弃掉手牌，抽同等数量',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 9,
    effects: []
  },
  {
    id: 'gambler_second_chance',
    name: '第二次机会',
    description: '重新Roll本回合的骰子',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 10,
    effects: []
  },

  // 防御和闪避
  {
    id: 'gambler_dodge_roll',
    name: '闪避翻滚',
    description: '高Roll时获得大量护盾',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 3,
    rollRange: { min: 1, max: 10 },
    energyCost: 1,
    speed: 8,
    effects: []
  },
  {
    id: 'gambler_blind_bet',
    name: '盲注',
    description: '50%获得10护盾，50%获得0',
    type: CardType.DEFENSE,
    rarity: CardRarity.UNCOMMON,
    baseValue: 10,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 6,
    effects: []
  },
  {
    id: 'gambler_evasion',
    name: '闪避大师',
    description: '获得闪避率',
    type: CardType.POWER,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 10,
    effects: [
      {
        type: EffectType.DEXTERITY,
        value: 5,
        duration: -1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 特殊攻击
  {
    id: 'gambler_critical_gamble',
    name: '暴击赌博',
    description: '暴击率翻倍但基础伤害减半',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 8 },
    energyCost: 1,
    speed: 6,
    effects: []
  },
  {
    id: 'gambler_last_card',
    name: '最后一张牌',
    description: '手牌越少伤害越高',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 5,
    rollRange: { min: 1, max: 6 },
    energyCost: 2,
    speed: 5,
    effects: []
  },
  {
    id: 'gambler_desperate_strike',
    name: '绝望一击',
    description: '生命低于20时伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 6,
    rollRange: { min: 2, max: 6 },
    energyCost: 1,
    speed: 4,
    effects: []
  },

  // 史诗级高风险
  {
    id: 'gambler_devils_deal',
    name: '恶魔交易',
    description: '失去10生命，获得5能量和抽3张牌',
    type: CardType.SKILL,
    rarity: CardRarity.LEGENDARY,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 0,
    speed: 10,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 10,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      },
      {
        type: EffectType.ENERGY,
        value: 5,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      },
      {
        type: EffectType.DRAW,
        value: 3,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'gambler_jackpot_strike',
    name: '超级头奖',
    description: 'Roll出12时即死敌人',
    type: CardType.ATTACK,
    rarity: CardRarity.LEGENDARY,
    baseValue: 8,
    rollRange: { min: 1, max: 12 },
    energyCost: 3,
    speed: 3,
    effects: []
  },
  {
    id: 'gambler_chaos_theory',
    name: '混沌理论',
    description: '完全随机的效果',
    type: CardType.SKILL,
    rarity: CardRarity.LEGENDARY,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 5,
    effects: []
  },

  // Combo牌
  {
    id: 'gambler_combo_lucky',
    name: '幸运连击',
    description: '本回合每出一张牌，Roll上限+1',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 3,
    rollRange: { min: 1, max: 6 },
    energyCost: 1,
    speed: 7,
    effects: []
  },
  {
    id: 'gambler_high_roller',
    name: '豪赌客',
    description: '连续3次高Roll后伤害x3',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 6,
    rollRange: { min: 2, max: 8 },
    energyCost: 2,
    speed: 5,
    effects: []
  }
];

// ==================== 刺客职业（25张）====================
// 特点：高速度、连击、背刺、毒伤

const ASSASSIN_CARDS: CardData[] = [
  // 高速攻击
  {
    id: 'assassin_quick_stab',
    name: '快速刺击',
    description: '极快速度',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 4,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 9,
    effects: []
  },
  {
    id: 'assassin_dagger_throw',
    name: '飞刀',
    description: '远程快速攻击',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 6 },
    energyCost: 1,
    speed: 10,
    effects: []
  },
  {
    id: 'assassin_shadow_strike',
    name: '暗影打击',
    description: '高速度中等伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 7,
    rollRange: { min: 2, max: 7 },
    energyCost: 2,
    speed: 9,
    effects: []
  },
  {
    id: 'assassin_blitz',
    name: '闪电突袭',
    description: '最快速度',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 6,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 10,
    effects: []
  },
  {
    id: 'assassin_assassinate',
    name: '暗杀',
    description: '高伤害高速度',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 10,
    rollRange: { min: 3, max: 9 },
    energyCost: 3,
    speed: 9,
    effects: []
  },

  // 背刺和连击
  {
    id: 'assassin_backstab',
    name: '背刺',
    description: '目标无护盾时伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 5,
    rollRange: { min: 2, max: 6 },
    energyCost: 1,
    speed: 8,
    effects: []
  },
  {
    id: 'assassin_combo_strike',
    name: '连击',
    description: '本回合每出过一张牌+3伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 3,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 8,
    effects: []
  },
  {
    id: 'assassin_finishing_blow',
    name: '终结打击',
    description: '目标生命低于50%时伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 6,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 7,
    effects: []
  },
  {
    id: 'assassin_chain_attack',
    name: '连锁攻击',
    description: '速度极快，可连续出牌',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 4,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 10,
    effects: [
      {
        type: EffectType.ENERGY,
        value: 1,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'assassin_precision_strike',
    name: '精准打击',
    description: '无视护盾',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 7,
    rollRange: { min: 2, max: 7 },
    energyCost: 2,
    speed: 8,
    effects: []
  },

  // 毒伤流派
  {
    id: 'assassin_poison_blade',
    name: '毒刃',
    description: '造成伤害并使目标中毒',
    type: CardType.ATTACK,
    rarity: CardRarity.COMMON,
    baseValue: 3,
    rollRange: { min: 1, max: 4 },
    energyCost: 1,
    speed: 7,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 2,
        duration: 3,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'assassin_venom_strike',
    name: '剧毒打击',
    description: '高伤害+剧毒',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 5,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 7,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 4,
        duration: 3,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'assassin_deadly_poison',
    name: '致命毒药',
    description: '使目标中毒5回合',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 8,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 3,
        duration: 5,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  },
  {
    id: 'assassin_envenom',
    name: '涂毒',
    description: '下3次攻击附带中毒',
    type: CardType.POWER,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 10,
    effects: [
      {
        type: EffectType.STRENGTH,
        value: 2,
        duration: 3,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 隐身和闪避
  {
    id: 'assassin_stealth',
    name: '隐身',
    description: '下回合敌人无法选中你',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 10,
    effects: [
      {
        type: EffectType.DEXTERITY,
        value: 5,
        duration: 1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'assassin_smoke_bomb',
    name: '烟雾弹',
    description: '获得护盾和闪避',
    type: CardType.DEFENSE,
    rarity: CardRarity.COMMON,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 1,
    speed: 9,
    effects: []
  },
  {
    id: 'assassin_evasion_stance',
    name: '闪避姿态',
    description: '获得大量闪避率',
    type: CardType.POWER,
    rarity: CardRarity.RARE,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 2,
    speed: 10,
    effects: [
      {
        type: EffectType.DEXTERITY,
        value: 6,
        duration: -1,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 抽牌和能量
  {
    id: 'assassin_preparation',
    name: '准备',
    description: '抽2张牌，下张攻击牌伤害+3',
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
  },
  {
    id: 'assassin_adrenaline',
    name: '肾上腺素',
    description: '恢复能量',
    type: CardType.SKILL,
    rarity: CardRarity.COMMON,
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
  },
  {
    id: 'assassin_mark_target',
    name: '标记目标',
    description: '使目标易伤',
    type: CardType.SKILL,
    rarity: CardRarity.UNCOMMON,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 1,
    speed: 9,
    effects: [
      {
        type: EffectType.VULNERABLE,
        value: 2,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 特殊技能
  {
    id: 'assassin_crippling_strike',
    name: '致残打击',
    description: '造成伤害并使目标虚弱',
    type: CardType.ATTACK,
    rarity: CardRarity.UNCOMMON,
    baseValue: 5,
    rollRange: { min: 2, max: 6 },
    energyCost: 2,
    speed: 7,
    effects: [
      {
        type: EffectType.WEAK,
        value: 2,
        duration: 2,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'assassin_shadow_step',
    name: '暗影步',
    description: '获得能量和抽牌',
    type: CardType.SKILL,
    rarity: CardRarity.RARE,
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
      },
      {
        type: EffectType.DRAW,
        value: 1,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },

  // 史诗级高风险
  {
    id: 'assassin_death_lotus',
    name: '死亡莲华',
    description: '对所有敌人造成10伤害，但自己受到5伤害',
    type: CardType.ATTACK,
    rarity: CardRarity.LEGENDARY,
    baseValue: 10,
    rollRange: { min: 3, max: 9 },
    energyCost: 3,
    speed: 5,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: 5,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'assassin_shadow_dance',
    name: '暗影之舞',
    description: '本回合可以出3张牌',
    type: CardType.POWER,
    rarity: CardRarity.LEGENDARY,
    baseValue: 0,
    rollRange: { min: 0, max: 0 },
    energyCost: 3,
    speed: 10,
    effects: [
      {
        type: EffectType.ENERGY,
        value: 3,
        duration: 0,
        trigger: EffectTrigger.IMMEDIATE
      }
    ]
  },
  {
    id: 'assassin_instant_kill',
    name: '瞬杀',
    description: '目标生命低于15时直接击杀',
    type: CardType.ATTACK,
    rarity: CardRarity.LEGENDARY,
    baseValue: 5,
    rollRange: { min: 1, max: 5 },
    energyCost: 2,
    speed: 10,
    effects: []
  },

  // Combo牌
  {
    id: 'assassin_combo_master',
    name: '连击大师',
    description: '连击伤害翻倍',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 4,
    rollRange: { min: 1, max: 5 },
    energyCost: 2,
    speed: 8,
    effects: []
  },
  {
    id: 'assassin_perfect_execution',
    name: '完美执行',
    description: '背刺+连击+毒伤同时触发',
    type: CardType.ATTACK,
    rarity: CardRarity.RARE,
    baseValue: 8,
    rollRange: { min: 2, max: 8 },
    energyCost: 3,
    speed: 7,
    effects: [
      {
        type: EffectType.BLEEDING,
        value: 3,
        duration: 3,
        trigger: EffectTrigger.ON_TURN_END
      }
    ]
  }
];

// ==================== 合并所有卡牌 ====================

export const ALL_CARDS_100: CardData[] = [
  ...WARRIOR_CARDS,
  ...MAGE_CARDS,
  ...GAMBLER_CARDS,
  ...ASSASSIN_CARDS
];

// 按职业获取卡牌
export const getWarriorCards = (): CardData[] => WARRIOR_CARDS;
export const getMageCards = (): CardData[] => MAGE_CARDS;
export const getGamblerCards = (): CardData[] => GAMBLER_CARDS;
export const getAssassinCards = (): CardData[] => ASSASSIN_CARDS;

// 获取起始牌组（按职业）
export const getStartingDeckByClass = (className: 'warrior' | 'mage' | 'gambler' | 'assassin'): CardData[] => {
  switch (className) {
    case 'warrior':
      return [
        WARRIOR_CARDS[0], WARRIOR_CARDS[0], WARRIOR_CARDS[0], // 战士打击 x3
        WARRIOR_CARDS[5], WARRIOR_CARDS[5], // 放血打击 x2
        WARRIOR_CARDS[10], WARRIOR_CARDS[10], // 防御姿态 x2
        WARRIOR_CARDS[15], // 肌肉展示
        WARRIOR_CARDS[18], // 战吼
        WARRIOR_CARDS[1] // 重击
      ];
    case 'mage':
      return [
        MAGE_CARDS[0], MAGE_CARDS[0], MAGE_CARDS[0], // 火焰箭 x3
        MAGE_CARDS[5], MAGE_CARDS[5], // 寒冰箭 x2
        MAGE_CARDS[10], MAGE_CARDS[10], // 奥术飞弹 x2
        MAGE_CARDS[13], // 奥术智慧
        MAGE_CARDS[14], // 法力涌动
        MAGE_CARDS[1] // 火球术
      ];
    case 'gambler':
      return [
        GAMBLER_CARDS[0], GAMBLER_CARDS[0], GAMBLER_CARDS[0], // 抛硬币 x3
        GAMBLER_CARDS[1], GAMBLER_CARDS[1], // 掷骰子 x2
        GAMBLER_CARDS[10], GAMBLER_CARDS[10], // 幸运抽牌 x2
        GAMBLER_CARDS[11], // 能量赌博
        GAMBLER_CARDS[14], // 闪避翻滚
        GAMBLER_CARDS[3] // 高风险赌注
      ];
    case 'assassin':
      return [
        ASSASSIN_CARDS[0], ASSASSIN_CARDS[0], ASSASSIN_CARDS[0], // 快速刺击 x3
        ASSASSIN_CARDS[1], ASSASSIN_CARDS[1], // 飞刀 x2
        ASSASSIN_CARDS[5], ASSASSIN_CARDS[5], // 背刺 x2
        ASSASSIN_CARDS[10], // 毒刃
        ASSASSIN_CARDS[18], // 准备
        ASSASSIN_CARDS[2] // 暗影打击
      ];
    default:
      return WARRIOR_CARDS.slice(0, 10);
  }
};

// 按稀有度获取卡牌
export const getCardsByRarity = (rarity: CardRarity): CardData[] => {
  return ALL_CARDS_100.filter(card => card.rarity === rarity);
};

// 按类型获取卡牌
export const getCardsByType = (type: CardType): CardData[] => {
  return ALL_CARDS_100.filter(card => card.type === type);
};

// 随机获取卡牌
export const getRandomCards = (count: number, rarity?: CardRarity): CardData[] => {
  const pool = rarity ? getCardsByRarity(rarity) : ALL_CARDS_100;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// 导出统计数据
export const CARD_STATISTICS = {
  total: ALL_CARDS_100.length,
  byClass: {
    warrior: WARRIOR_CARDS.length,
    mage: MAGE_CARDS.length,
    gambler: GAMBLER_CARDS.length,
    assassin: ASSASSIN_CARDS.length
  },
  byRarity: {
    common: getCardsByRarity(CardRarity.COMMON).length,
    uncommon: getCardsByRarity(CardRarity.UNCOMMON).length,
    rare: getCardsByRarity(CardRarity.RARE).length,
    legendary: getCardsByRarity(CardRarity.LEGENDARY).length
  },
  byType: {
    attack: getCardsByType(CardType.ATTACK).length,
    defense: getCardsByType(CardType.DEFENSE).length,
    skill: getCardsByType(CardType.SKILL).length,
    power: getCardsByType(CardType.POWER).length
  }
};

console.log('[CardDatabase100] 100张卡牌加载完成', CARD_STATISTICS);
