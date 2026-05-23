/**
 * 第一阶段敌人配置
 * 
 * 包含：
 * - 8个普通敌人
 * - 2个Boss
 * - 敌人专属技能
 */

const { AIType } = require('./EnemyAI');

// ==================== 阵营定义 ====================

const EnemyFaction = {
  GAMBLER_GANG: 'GAMBLER_GANG',       // 赌徒帮派
  MAGIC_TROUPE: 'MAGIC_TROUPE',       // 魔术剧团
  IRON_TRIBUNAL: 'IRON_TRIBUNAL',     // 铁律审判庭
  MAD_CIRCUS: 'MAD_CIRCUS'            // 疯狂马戏团
};

// ==================== 危险等级 ====================

const DangerLevel = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  EXTREME: 4,
  BOSS: 5
};

// ==================== 敌人专属技能 ====================

const ENEMY_SKILLS = {
  // 小丑赌徒 - 疯狂骰子
  CRAZY_DICE: {
    id: 'crazy_dice',
    name: '疯狂骰子',
    description: '本回合Roll结果随机翻倍或减半',
    cooldown: 3,
    effect: {
      type: 'ROLL_MODIFIER',
      modifierType: 'random_double_or_half',
      chance: 0.5
    }
  },

  // 赌鬼 - 孤注一掷
  ALL_IN_BET: {
    id: 'all_in_bet',
    name: '孤注一掷',
    description: '失去5生命，本回合Roll最大值+10',
    cooldown: 4,
    effect: {
      type: 'SELF_DAMAGE_FOR_POWER',
      selfDamage: 5,
      rollMaxBonus: 10
    }
  },

  // 幻术演员 - 障眼法
  ILLUSION_TRAP: {
    id: 'illusion_trap',
    name: '障眼法',
    description: '隐藏真实Roll范围，显示虚假值',
    cooldown: 3,
    effect: {
      type: 'HIDE_ROLL',
      fakeRollRange: { min: 10, max: 20 }
    }
  },

  // 木偶师 - 模仿
  MIMICRY: {
    id: 'mimicry',
    name: '模仿',
    description: '复制玩家上回合的出牌',
    cooldown: 4,
    effect: {
      type: 'COPY_PLAYER_CARD'
    }
  },

  // 审判骑士 - 铁律压制
  IRON_SUPPRESSION: {
    id: 'iron_suppression',
    name: '铁律压制',
    description: '连胜后伤害提升50%',
    cooldown: 5,
    effect: {
      type: 'WIN_STREAK_BONUS',
      damageBonus: 0.5,
      requiredStreak: 2
    }
  },

  // 行刑官 - 处刑
  EXECUTION: {
    id: 'execution',
    name: '处刑',
    description: '敌方生命≤25%时直接斩杀',
    cooldown: 6,
    effect: {
      type: 'EXECUTE',
      hpThreshold: 0.25
    }
  },

  // 狂笑怪人 - 暴走
  MANIAC_RAMPAGE: {
    id: 'maniac_rampage',
    name: '暴走',
    description: '生命低于30%后连续行动2回合',
    cooldown: 5,
    effect: {
      type: 'LOW_HP_RAMPAGE',
      hpThreshold: 0.3,
      extraTurns: 1
    }
  },

  // 暴走实验体 - 连续攻击
  CHAIN_ATTACK: {
    id: 'chain_attack',
    name: '连续攻击',
    description: '获胜后立即追加一次攻击',
    cooldown: 4,
    effect: {
      type: 'FOLLOW_UP_ATTACK',
      damagePercent: 0.5
    }
  },

  // Boss - 恶魔庄家 - 赌局倍率
  BETTING_MULTIPLIER: {
    id: 'betting_multiplier',
    name: '赌局倍率',
    description: '每回合倍率提升，双方伤害增加',
    cooldown: 0, // 被动技能
    effect: {
      type: 'PASSIVE_MULTIPLIER',
      multiplierGrowth: 0.2,
      maxMultiplier: 3.0
    }
  },

  // Boss - 机械裁决者 - 绝对公平
  ABSOLUTE_FAIRNESS: {
    id: 'absolute_fairness',
    name: '绝对公平',
    description: '双方Roll区间强制相同',
    cooldown: 0, // 被动技能
    effect: {
      type: 'FORCE_SAME_ROLL_RANGE',
      rollRange: { min: 5, max: 15 }
    }
  }
};

// ==================== 普通敌人配置 ====================

const NORMAL_ENEMIES = {
  // 1. 小丑赌徒
  JOKER_GAMBLER: {
    id: 'joker_gambler',
    name: '小丑赌徒',
    title: '混乱的代言人',
    faction: EnemyFaction.GAMBLER_GANG,
    aiType: AIType.CHAOTIC,
    dangerLevel: DangerLevel.MEDIUM,
    isBoss: false,
    
    stats: {
      maxHp: 60,
      baseShield: 0
    },
    
    deck: {
      type: 'GAMBLER_BASIC',
      riskPreference: 'high'
    },
    
    skill: ENEMY_SKILLS.CRAZY_DICE,
    
    description: '一个疯狂的赌徒，他的骰子似乎有自己的意志。',
    flavor: '「哈哈！看看命运今天站在哪边！」'
  },

  // 2. 赌鬼
  GAMBLING_ADDICT: {
    id: 'gambling_addict',
    name: '赌鬼',
    title: '永不满足',
    faction: EnemyFaction.GAMBLER_GANG,
    aiType: AIType.AGGRESSIVE,
    dangerLevel: DangerLevel.HIGH,
    isBoss: false,
    
    stats: {
      maxHp: 50,
      baseShield: 0
    },
    
    deck: {
      type: 'GAMBLER_HIGH_RISK',
      riskPreference: 'extreme'
    },
    
    skill: ENEMY_SKILLS.ALL_IN_BET,
    
    description: '为了胜利不惜一切代价，包括自己的生命。',
    flavor: '「要么全赢，要么死！」'
  },

  // 3. 幻术演员
  ILLUSION_ACTOR: {
    id: 'illusion_actor',
    name: '幻术演员',
    title: '虚假的面具',
    faction: EnemyFaction.MAGIC_TROUPE,
    aiType: AIType.DECEPTIVE,
    dangerLevel: DangerLevel.MEDIUM,
    isBoss: false,
    
    stats: {
      maxHp: 55,
      baseShield: 5
    },
    
    deck: {
      type: 'MAGICIAN_BASIC',
      riskPreference: 'moderate'
    },
    
    skill: ENEMY_SKILLS.ILLUSION_TRAP,
    
    description: '擅长隐藏真实意图，让你猜不透他的牌。',
    flavor: '「你看到的，只是我想让你看到的。」'
  },

  // 4. 木偶师
  PUPPET_MASTER: {
    id: 'puppet_master',
    name: '木偶师',
    title: '操控者',
    faction: EnemyFaction.MAGIC_TROUPE,
    aiType: AIType.PRECOGNITIVE,
    dangerLevel: DangerLevel.HIGH,
    isBoss: false,
    
    stats: {
      maxHp: 65,
      baseShield: 0
    },
    
    deck: {
      type: 'MAGICIAN_ADAPTIVE',
      riskPreference: 'adaptive'
    },
    
    skill: ENEMY_SKILLS.MIMICRY,
    
    description: '观察你的每一个动作，然后完美复制。',
    flavor: '「你的套路，我已经看穿了。」'
  },

  // 5. 审判骑士
  JUDGMENT_KNIGHT: {
    id: 'judgment_knight',
    name: '审判骑士',
    title: '铁律执行者',
    faction: EnemyFaction.IRON_TRIBUNAL,
    aiType: AIType.DOMINATING,
    dangerLevel: DangerLevel.HIGH,
    isBoss: false,
    
    stats: {
      maxHp: 70,
      baseShield: 10
    },
    
    deck: {
      type: 'EXECUTIONER_DOMINATING',
      riskPreference: 'moderate'
    },
    
    skill: ENEMY_SKILLS.IRON_SUPPRESSION,
    
    description: '一旦开始压制，就会越来越强大。',
    flavor: '「正义需要力量，而我拥有力量。」'
  },

  // 6. 行刑官
  EXECUTIONER_NPC: {
    id: 'executioner_npc',
    name: '行刑官',
    title: '死亡使者',
    faction: EnemyFaction.IRON_TRIBUNAL,
    aiType: AIType.DEFENSIVE,
    dangerLevel: DangerLevel.EXTREME,
    isBoss: false,
    
    stats: {
      maxHp: 60,
      baseShield: 5
    },
    
    deck: {
      type: 'EXECUTIONER_PRECISE',
      riskPreference: 'low'
    },
    
    skill: ENEMY_SKILLS.EXECUTION,
    
    description: '耐心等待时机，一旦出手就是致命一击。',
    flavor: '「每个罪犯都有自己的末日。」'
  },

  // 7. 狂笑怪人
  MAD_LAUGHTER: {
    id: 'mad_laughter',
    name: '狂笑怪人',
    title: '疯狂的笑声',
    faction: EnemyFaction.MAD_CIRCUS,
    aiType: AIType.CHAOTIC,
    dangerLevel: DangerLevel.HIGH,
    isBoss: false,
    
    stats: {
      maxHp: 55,
      baseShield: 0
    },
    
    deck: {
      type: 'MANIAC_UNPREDICTABLE',
      riskPreference: 'random'
    },
    
    skill: ENEMY_SKILLS.MANIAC_RAMPAGE,
    
    description: '受伤越重，笑得越疯狂，也越危险。',
    flavor: '「哈哈哈！疼痛让我兴奋！」'
  },

  // 8. 暴走实验体
  RAMPAGE_SUBJECT: {
    id: 'rampage_subject',
    name: '暴走实验体',
    title: '失控的产物',
    faction: EnemyFaction.MAD_CIRCUS,
    aiType: AIType.AGGRESSIVE,
    dangerLevel: DangerLevel.EXTREME,
    isBoss: false,
    
    stats: {
      maxHp: 45,
      baseShield: 0
    },
    
    deck: {
      type: 'MANIAC_AGGRESSIVE',
      riskPreference: 'high'
    },
    
    skill: ENEMY_SKILLS.CHAIN_ATTACK,
    
    description: '不知疲倦，一旦开始攻击就停不下来。',
    flavor: '「杀...杀...杀...」'
  }
};

// ==================== Boss配置 ====================

const BOSS_ENEMIES = {
  // Boss 1: 恶魔庄家
  DEMON_DEALER: {
    id: 'demon_dealer',
    name: '恶魔庄家',
    title: '赌局的掌控者',
    faction: EnemyFaction.GAMBLER_GANG,
    aiType: AIType.DOMINATING,
    dangerLevel: DangerLevel.BOSS,
    isBoss: true,
    
    stats: {
      maxHp: 120,
      baseShield: 15
    },
    
    deck: {
      type: 'BOSS_GAMBLER',
      riskPreference: 'adaptive'
    },
    
    skill: ENEMY_SKILLS.BETTING_MULTIPLIER,
    
    // Boss特殊机制
    bossMechanics: [
      {
        name: '赌局倍率',
        description: '每回合倍率提升20%，双方伤害增加。倍率最高可达300%。',
        warning: '战斗拖得越久越危险！'
      }
    ],
    
    description: '这个赌局的庄家，每一回合都在提高赌注。',
    flavor: '「欢迎来到我的赌桌，这里的规则由我制定。」',
    
    // 倍率追踪
    currentMultiplier: 1.0
  },

  // Boss 2: 机械裁决者
  MECHANICAL_JUDGE: {
    id: 'mechanical_judge',
    name: '机械裁决者',
    title: '绝对公平的执行者',
    faction: EnemyFaction.IRON_TRIBUNAL,
    aiType: AIType.DEFENSIVE,
    dangerLevel: DangerLevel.BOSS,
    isBoss: true,
    
    stats: {
      maxHp: 100,
      baseShield: 20
    },
    
    deck: {
      type: 'BOSS_EXECUTIONER',
      riskPreference: 'stable'
    },
    
    skill: ENEMY_SKILLS.ABSOLUTE_FAIRNESS,
    
    // Boss特殊机制
    bossMechanics: [
      {
        name: '绝对公平',
        description: '双方Roll范围强制变为5-15，纯粹比拼策略。',
        warning: '运气因素被消除，只能靠技术取胜！'
      }
    ],
    
    description: '冰冷的机械，执行着绝对的公平。',
    flavor: '「在绝对的公平面前，一切花招都毫无意义。」'
  }
};

// ==================== 敌人生成器 ====================

class EnemyGenerator {
  /**
   * 生成普通敌人
   */
  static generateNormalEnemy(enemyId, options = {}) {
    const template = NORMAL_ENEMIES[enemyId];
    if (!template) {
      console.warn(`[EnemyGenerator] 未找到普通敌人: ${enemyId}`);
      return null;
    }

    const level = options.level || 1;
    const hpMultiplier = 1 + (level - 1) * 0.2;

    return {
      ...template,
      instanceId: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentHp: Math.floor(template.stats.maxHp * hpMultiplier),
      maxHp: Math.floor(template.stats.maxHp * hpMultiplier),
      currentShield: template.stats.baseShield,
      skillCooldown: 0,
      winStreak: 0,
      // Boss倍率追踪（如果是Boss）
      currentMultiplier: template.currentMultiplier || 1.0
    };
  }

  /**
   * 生成Boss
   */
  static generateBoss(bossId, options = {}) {
    const template = BOSS_ENEMIES[bossId];
    if (!template) {
      console.warn(`[EnemyGenerator] 未找到Boss: ${bossId}`);
      return null;
    }

    const level = options.level || 1;
    const hpMultiplier = 1 + (level - 1) * 0.3;

    return {
      ...template,
      instanceId: `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentHp: Math.floor(template.stats.maxHp * hpMultiplier),
      maxHp: Math.floor(template.stats.maxHp * hpMultiplier),
      currentShield: template.stats.baseShield,
      skillCooldown: 0,
      winStreak: 0,
      currentMultiplier: template.currentMultiplier || 1.0
    };
  }

  /**
   * 随机生成敌人
   */
  static generateRandomEnemy(options = {}) {
    const enemyIds = Object.keys(NORMAL_ENEMIES);
    const randomId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
    return this.generateNormalEnemy(randomId, options);
  }

  /**
   * 按阵营获取敌人
   */
  static getEnemiesByFaction(faction) {
    return Object.values(NORMAL_ENEMIES).filter(enemy => enemy.faction === faction);
  }

  /**
   * 获取所有普通敌人
   */
  static getAllNormalEnemies() {
    return Object.values(NORMAL_ENEMIES);
  }

  /**
   * 获取所有Boss
   */
  static getAllBosses() {
    return Object.values(BOSS_ENEMIES);
  }
}

// ==================== 导出 ====================

module.exports = {
  EnemyFaction,
  DangerLevel,
  ENEMY_SKILLS,
  NORMAL_ENEMIES,
  BOSS_ENEMIES,
  EnemyGenerator
};
