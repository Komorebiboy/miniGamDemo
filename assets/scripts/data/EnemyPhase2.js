/**
 * 第二阶段 - 精英敌人系统
 * 
 * 包含：
 * - 8个精英敌人（每个阵营2个）
 * - 精英特殊机制
 * - 强化版AI行为
 */

const { AIType } = require('./EnemyAI');
const { EnemyFaction, DangerLevel } = require('./EnemyPhase1');

// ==================== 精英敌人特殊能力类型 ====================

const EliteAbilityType = {
  // 信息压制
  HIDE_ROLL_RANGE: 'HIDE_ROLL_RANGE',       // 隐藏Roll范围
  HIDE_CARD_INFO: 'HIDE_CARD_INFO',         // 隐藏卡牌信息
  RANDOM_INFO_HIDE: 'RANDOM_INFO_HIDE',     // 随机隐藏信息
  
  // 规则改变
  NO_SKIP_ALLOWED: 'NO_SKIP_ALLOWED',       // 禁止空过
  DOUBLE_CARD: 'DOUBLE_CARD',               // 同时出两张牌
  EFFECT_DOUBLE: 'EFFECT_DOUBLE',           // 效果翻倍
  
  // 战斗节奏
  EXECUTE_THRESHOLD: 'EXECUTE_THRESHOLD',   // 斩杀阈值
  REDUCE_PLAYER_CARDS: 'REDUCE_PLAYER_CARDS', // 减少玩家出牌
  EXTRA_ACTION: 'EXTRA_ACTION',             // 额外行动
  
  // 随机/混乱
  RANDOM_RULE_CHANGE: 'RANDOM_RULE_CHANGE', // 随机改变规则
  ROLL_RANGE_BOOST: 'ROLL_RANGE_BOOST',     // Roll范围提升
  COMBO_CHANCE: 'COMBO_CHANCE'              // 连击概率
};

// ==================== 精英敌人配置 ====================

const ELITE_ENEMIES = {
  // ========== 赌徒帮派精英 ==========
  
  // 1. 无面荷官
  FACELESS_DEALER: {
    id: 'faceless_dealer',
    name: '无面荷官',
    title: '信息的主宰',
    faction: EnemyFaction.GAMBLER_GANG,
    aiType: AIType.DECEPTIVE,
    dangerLevel: DangerLevel.HIGH,
    isElite: true,
    isBoss: false,
    
    // 基础属性加成（比普通敌人高30%）
    statsMultiplier: 1.3,
    
    stats: {
      maxHp: 78,  // 60 * 1.3
      baseShield: 5
    },
    
    deck: {
      type: 'GAMBLER_ELITE',
      riskPreference: 'moderate'
    },
    
    // 精英特殊能力
    eliteAbilities: [
      {
        type: EliteAbilityType.HIDE_ROLL_RANGE,
        name: '信息压制',
        description: '玩家无法看到敌方真实Roll范围',
        effect: { hideRollRange: true }
      },
      {
        type: EliteAbilityType.ROLL_RANGE_BOOST,
        name: '荷官优势',
        description: '每回合出牌概率增加10%',
        effect: { rollChanceBoost: 0.1, cumulative: true }
      }
    ],
    
    description: '他掌控着赌桌上的所有信息，而你什么都看不见。',
    flavor: '「在赌桌上，信息就是一切。」',
    
    // 精英视觉标识
    visual: {
      borderColor: '#FFD700',
      glowEffect: true,
      eliteBadge: '★'
    }
  },
  
  // 2. 双生赌徒
  TWIN_GAMBLER: {
    id: 'twin_gambler',
    name: '双生赌徒',
    title: '双倍的疯狂',
    faction: EnemyFaction.GAMBLER_GANG,
    aiType: AIType.AGGRESSIVE,
    dangerLevel: DangerLevel.EXTREME,
    isElite: true,
    isBoss: false,
    
    statsMultiplier: 1.4,
    
    stats: {
      maxHp: 84,  // 60 * 1.4
      baseShield: 0
    },
    
    deck: {
      type: 'GAMBLER_HIGH_RISK',
      riskPreference: 'extreme'
    },
    
    eliteAbilities: [
      {
        type: EliteAbilityType.DOUBLE_CARD,
        name: '双重出牌',
        description: '每回合同时出两张牌，取较高Roll',
        effect: { cardCount: 2, takeHigher: true }
      },
      {
        type: EliteAbilityType.ROLL_RANGE_BOOST,
        name: '连胜强化',
        description: '连胜后增加自身Roll+2',
        effect: { winStreakBonus: 2, requiredStreak: 2 }
      }
    ],
    
    description: '两个灵魂，一个身体，双倍的赌注。',
    flavor: '「我们从不单独下注。」',
    
    visual: {
      borderColor: '#FF6B6B',
      glowEffect: true,
      eliteBadge: '★★'
    }
  },
  
  // ========== 魔术剧团精英 ==========
  
  // 3. 镜像大师
  MIRROR_MASTER: {
    id: 'mirror_master',
    name: '镜像大师',
    title: '完美的模仿者',
    faction: EnemyFaction.MAGIC_TROUPE,
    aiType: AIType.PRECOGNITIVE,
    dangerLevel: DangerLevel.HIGH,
    isElite: true,
    isBoss: false,
    
    statsMultiplier: 1.35,
    
    stats: {
      maxHp: 74,  // 55 * 1.35
      baseShield: 10
    },
    
    deck: {
      type: 'MAGICIAN_ADAPTIVE',
      riskPreference: 'adaptive'
    },
    
    eliteAbilities: [
      {
        type: 'COPY_PLAYER_LAST_CARD',
        name: '镜像复制',
        description: '复制玩家上一回合出的牌',
        effect: { copyLastCard: true }
      },
      {
        type: 'RANDOM_EFFECT_CHANGE',
        name: '效果扭曲',
        description: '随机更改部分牌效果',
        effect: { effectChangeChance: 0.3 }
      }
    ],
    
    description: '你看到的不是敌人，而是你自己。',
    flavor: '「最强的对手，永远是你自己。」',
    
    visual: {
      borderColor: '#9B59B6',
      glowEffect: true,
      eliteBadge: '★'
    }
  },
  
  // 4. 舞台导演
  STAGE_DIRECTOR: {
    id: 'stage_director',
    name: '舞台导演',
    title: '节奏的掌控者',
    faction: EnemyFaction.MAGIC_TROUPE,
    aiType: AIType.DECEPTIVE,
    dangerLevel: DangerLevel.HIGH,
    isElite: true,
    isBoss: false,
    
    statsMultiplier: 1.3,
    
    stats: {
      maxHp: 72,  // 55 * 1.3
      baseShield: 8
    },
    
    deck: {
      type: 'MAGICIAN_CONTROL',
      riskPreference: 'moderate'
    },
    
    eliteAbilities: [
      {
        type: EliteAbilityType.RANDOM_INFO_HIDE,
        name: '舞台迷雾',
        description: '随机隐藏敌方信息（Roll/速度/类型）',
        effect: { hideRandomInfo: true, hideCount: 1 }
      },
      {
        type: EliteAbilityType.EFFECT_DOUBLE,
        name: '效果放大',
        description: '本回合卡牌效果翻倍',
        effect: { effectMultiplier: 2, triggerChance: 0.4 }
      }
    ],
    
    description: '舞台上的每一幕，都由他导演。',
    flavor: '「按照我的剧本演出吧。」',
    
    visual: {
      borderColor: '#E74C3C',
      glowEffect: true,
      eliteBadge: '★'
    }
  },
  
  // ========== 铁律审判庭精英 ==========
  
  // 5. 冷酷处刑官
  COLD_EXECUTIONER: {
    id: 'cold_executioner',
    name: '冷酷处刑官',
    title: '无情的裁决',
    faction: EnemyFaction.IRON_TRIBUNAL,
    aiType: AIType.DEFENSIVE,
    dangerLevel: DangerLevel.EXTREME,
    isElite: true,
    isBoss: false,
    
    statsMultiplier: 1.4,
    
    stats: {
      maxHp: 84,  // 60 * 1.4
      baseShield: 10
    },
    
    deck: {
      type: 'EXECUTIONER_PRECISE',
      riskPreference: 'low'
    },
    
    eliteAbilities: [
      {
        type: EliteAbilityType.EXECUTE_THRESHOLD,
        name: '冷血处刑',
        description: '玩家生命≤30%，触发Execute',
        effect: { executeThreshold: 0.3, instantKill: true }
      },
      {
        type: EliteAbilityType.REDUCE_PLAYER_CARDS,
        name: '压制控制',
        description: '压制成功后减少玩家出牌次数1',
        effect: { reduceCardCount: 1, duration: 1 }
      }
    ],
    
    description: '他不会怜悯，不会犹豫，只会执行。',
    flavor: '「法律面前，没有例外。」',
    
    visual: {
      borderColor: '#2C3E50',
      glowEffect: true,
      eliteBadge: '★★'
    }
  },
  
  // 6. 铁律执法者
  LAW_ENFORCER: {
    id: 'law_enforcer',
    name: '铁律执法者',
    title: '规则的化身',
    faction: EnemyFaction.IRON_TRIBUNAL,
    aiType: AIType.DOMINATING,
    dangerLevel: DangerLevel.HIGH,
    isElite: true,
    isBoss: false,
    
    statsMultiplier: 1.35,
    
    stats: {
      maxHp: 81,  // 60 * 1.35
      baseShield: 15
    },
    
    deck: {
      type: 'EXECUTIONER_DOMINATING',
      riskPreference: 'moderate'
    },
    
    eliteAbilities: [
      {
        type: EliteAbilityType.NO_SKIP_ALLOWED,
        name: '禁止空过',
        description: '玩家无法空过，必须出牌',
        effect: { forcePlayCard: true }
      },
      {
        type: EliteAbilityType.ROLL_RANGE_BOOST,
        name: '连胜强化',
        description: '连续获胜后强化自己Roll',
        effect: { winStreakRollBonus: 3, requiredStreak: 2 }
      }
    ],
    
    description: '规则由他制定，也由他执行。',
    flavor: '「违反规则者，必须受罚。」',
    
    visual: {
      borderColor: '#34495E',
      glowEffect: true,
      eliteBadge: '★'
    }
  },
  
  // ========== 疯狂马戏团精英 ==========
  
  // 7. 崩坏观察者
  CHAOS_OBSERVER: {
    id: 'chaos_observer',
    name: '崩坏观察者',
    title: '混乱的见证',
    faction: EnemyFaction.MAD_CIRCUS,
    aiType: AIType.CHAOTIC,
    dangerLevel: DangerLevel.HIGH,
    isElite: true,
    isBoss: false,
    
    statsMultiplier: 1.3,
    
    stats: {
      maxHp: 72,  // 55 * 1.3
      baseShield: 0
    },
    
    deck: {
      type: 'MANIAC_UNPREDICTABLE',
      riskPreference: 'random'
    },
    
    eliteAbilities: [
      {
        type: EliteAbilityType.RANDOM_RULE_CHANGE,
        name: '规则崩坏',
        description: '每回合随机改变一条战斗规则',
        effect: { 
          ruleChangePerTurn: true,
          possibleChanges: ['speed_priority', 'crit_threshold', 'damage_multiplier']
        }
      },
      {
        type: EliteAbilityType.COMBO_CHANCE,
        name: '连击狂热',
        description: '高Roll后增加自身连击概率',
        effect: { comboChanceBoost: 0.2, rollThreshold: 15 }
      }
    ],
    
    description: '他观察着混乱，也制造着混乱。',
    flavor: '「混乱，才是世界的真相。」',
    
    visual: {
      borderColor: '#8E44AD',
      glowEffect: true,
      eliteBadge: '★'
    }
  },
  
  // 8. 终末实验体
  APOCALYPSE_SUBJECT: {
    id: 'apocalypse_subject',
    name: '终末实验体',
    title: '失控的终焉',
    faction: EnemyFaction.MAD_CIRCUS,
    aiType: AIType.AGGRESSIVE,
    dangerLevel: DangerLevel.EXTREME,
    isElite: true,
    isBoss: false,
    
    statsMultiplier: 1.5,
    
    stats: {
      maxHp: 68,  // 45 * 1.5
      baseShield: 0
    },
    
    deck: {
      type: 'MANIAC_AGGRESSIVE',
      riskPreference: 'extreme'
    },
    
    eliteAbilities: [
      {
        type: EliteAbilityType.EXTRA_ACTION,
        name: '终末暴走',
        description: '低血后连续行动',
        effect: { 
          extraActionThreshold: 0.4, 
          extraTurns: 1,
          rollRangeBoost: 0.3
        }
      },
      {
        type: EliteAbilityType.ROLL_RANGE_BOOST,
        name: '范围扩大',
        description: 'Roll范围扩大30%',
        effect: { rollRangeMultiplier: 1.3, permanent: true }
      }
    ],
    
    description: '实验的终点，也是毁灭的开始。',
    flavor: '「终末...来了...」',
    
    visual: {
      borderColor: '#C0392B',
      glowEffect: true,
      eliteBadge: '★★'
    }
  }
};

// ==================== 精英敌人生成器 ====================

class EliteEnemyGenerator {
  /**
   * 生成精英敌人
   */
  static generateEliteEnemy(enemyId, options = {}) {
    const template = ELITE_ENEMIES[enemyId];
    if (!template) {
      console.warn(`[EliteEnemyGenerator] 未找到精英敌人: ${enemyId}`);
      return null;
    }

    const level = options.level || 1;
    const baseHp = template.stats.maxHp;
    const hpMultiplier = 1 + (level - 1) * 0.25;
    const finalHp = Math.floor(baseHp * hpMultiplier);

    return {
      ...template,
      instanceId: `elite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentHp: finalHp,
      maxHp: finalHp,
      currentShield: template.stats.baseShield,
      skillCooldown: 0,
      winStreak: 0,
      eliteCharge: 0,  // 精英能量（用于某些能力）
      // 精英状态追踪
      eliteState: {
        consecutiveWins: 0,
        rollChanceBoost: 0,
        currentRuleChange: null
      }
    };
  }

  /**
   * 按阵营获取精英敌人
   */
  static getElitesByFaction(faction) {
    return Object.values(ELITE_ENEMIES).filter(enemy => enemy.faction === faction);
  }

  /**
   * 获取所有精英敌人
   */
  static getAllEliteEnemies() {
    return Object.values(ELITE_ENEMIES);
  }

  /**
   * 随机生成精英敌人
   */
  static generateRandomElite(options = {}) {
    const eliteIds = Object.keys(ELITE_ENEMIES);
    const randomId = eliteIds[Math.floor(Math.random() * eliteIds.length)];
    return this.generateEliteEnemy(randomId, options);
  }

  /**
   * 生成混合敌人队伍（普通+精英）
   */
  static generateMixedEncounter(options = {}) {
    const { EnemyGenerator } = require('./EnemyPhase1');
    
    const encounter = {
      normal: [],
      elite: [],
      boss: null
    };

    // 根据难度决定敌人组成
    const difficulty = options.difficulty || 'medium';
    
    switch (difficulty) {
      case 'easy':
        encounter.normal.push(EnemyGenerator.generateRandomEnemy(options));
        break;
      case 'medium':
        encounter.normal.push(EnemyGenerator.generateRandomEnemy(options));
        encounter.elite.push(this.generateRandomElite(options));
        break;
      case 'hard':
        encounter.elite.push(this.generateRandomElite(options));
        encounter.elite.push(this.generateRandomElite(options));
        break;
      case 'boss':
        encounter.elite.push(this.generateRandomElite(options));
        encounter.boss = EnemyGenerator.generateBoss(options.bossId || 'DEMON_DEALER', options);
        break;
    }

    return encounter;
  }
}

// ==================== 精英能力处理器 ====================

class EliteAbilityProcessor {
  constructor() {
    this.activeEffects = new Map();
  }

  /**
   * 应用精英能力效果
   */
  applyEliteAbilities(enemy, battleState) {
    if (!enemy.eliteAbilities) return [];

    const effects = [];
    
    enemy.eliteAbilities.forEach(ability => {
      const effect = this._processAbility(ability, enemy, battleState);
      if (effect) {
        effects.push(effect);
      }
    });

    return effects;
  }

  /**
   * 处理单个能力
   */
  _processAbility(ability, enemy, battleState) {
    switch (ability.type) {
      case EliteAbilityType.HIDE_ROLL_RANGE:
        return {
          type: 'info_hide',
          target: 'enemy_roll_range',
          message: '敌方Roll范围被隐藏'
        };

      case EliteAbilityType.DOUBLE_CARD:
        return {
          type: 'double_card',
          cardCount: 2,
          takeHigher: true,
          message: '敌方同时出两张牌'
        };

      case EliteAbilityType.NO_SKIP_ALLOWED:
        return {
          type: 'restriction',
          restriction: 'no_skip',
          message: '禁止空过'
        };

      case EliteAbilityType.EXECUTE_THRESHOLD:
        const playerHpPercent = battleState.playerHpPercent || 1;
        if (playerHpPercent <= ability.effect.executeThreshold) {
          return {
            type: 'execute_ready',
            threshold: ability.effect.executeThreshold,
            message: '处刑准备就绪！'
          };
        }
        return null;

      case EliteAbilityType.RANDOM_RULE_CHANGE:
        const rules = ability.effect.possibleChanges;
        const randomRule = rules[Math.floor(Math.random() * rules.length)];
        return {
          type: 'rule_change',
          newRule: randomRule,
          message: `规则改变: ${randomRule}`
        };

      default:
        return null;
    }
  }

  /**
   * 回合开始处理
   */
  onTurnStart(enemy) {
    if (!enemy.eliteAbilities) return [];

    const effects = [];
    
    // 处理需要每回合触发的能力
    enemy.eliteAbilities.forEach(ability => {
      if (ability.type === EliteAbilityType.ROLL_RANGE_BOOST) {
        if (ability.effect.cumulative) {
          // 累积效果
          enemy.eliteState.rollChanceBoost += ability.effect.rollChanceBoost;
          effects.push({
            type: 'roll_boost_increase',
            currentBoost: enemy.eliteState.rollChanceBoost
          });
        }
      }
    });

    return effects;
  }

  /**
   * 战斗胜利处理
   */
  onBattleWin(enemy) {
    if (!enemy.eliteAbilities) return;

    enemy.eliteState.consecutiveWins++;

    // 检查连胜触发的能力
    enemy.eliteAbilities.forEach(ability => {
      if (ability.type === EliteAbilityType.ROLL_RANGE_BOOST && 
          ability.effect.winStreakBonus) {
        if (enemy.eliteState.consecutiveWins >= ability.effect.requiredStreak) {
          // 应用连胜加成
          console.log(`[EliteAbility] ${enemy.name} 连胜加成触发`);
        }
      }
    });
  }

  /**
   * 重置精英状态
   */
  resetEliteState(enemy) {
    if (enemy.eliteState) {
      enemy.eliteState.consecutiveWins = 0;
      enemy.eliteState.rollChanceBoost = 0;
      enemy.eliteState.currentRuleChange = null;
    }
  }
}

// ==================== 导出 ====================

module.exports = {
  EliteAbilityType,
  ELITE_ENEMIES,
  EliteEnemyGenerator,
  EliteAbilityProcessor
};
