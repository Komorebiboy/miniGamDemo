/**
 * 职业主动技能系统
 * 
 * 核心功能：
 * 1. 每个职业拥有1个主动技能
 * 2. 技能不消耗能量，有冷却时间
 * 3. 技能能改变战局，与卡组联动
 * 4. 支持3阶升级
 */

// ==================== 技能类型定义 ====================

const SkillType = {
  ACTIVE: 'ACTIVE',       // 主动技能
  PASSIVE: 'PASSIVE',     // 被动技能
  ULTIMATE: 'ULTIMATE'    // 终极技能
};

const SkillTrigger = {
  MANUAL: 'MANUAL',           // 手动触发
  ON_BATTLE_START: 'ON_BATTLE_START',
  ON_TURN_START: 'ON_TURN_START',
  ON_TURN_END: 'ON_TURN_END',
  ON_ROLL: 'ON_ROLL',
  ON_WIN: 'ON_WIN',
  ON_LOSE: 'ON_LOSE'
};

// ==================== 职业技能定义 ====================

const CLASS_SKILLS = {
  // 赌徒 - 命运时刻
  GAMBLER: {
    id: 'fate_moment',
    name: '命运时刻',
    nameEn: 'Fate Moment',
    description: '本回合进行双重Roll，可选择取最高或最低值。若选择最低值，最终伤害×2且触发赌博类牌额外效果。',
    classType: 'GAMBLER',
    cooldown: 4,
    maxCooldown: 4,
    skillType: SkillType.ACTIVE,
    trigger: SkillTrigger.MANUAL,
    
    // 技能效果
    effects: {
      // 双重Roll
      doubleRoll: true,
      // 可选择取高/低
      canChooseHighOrLow: true,
      // 选低值时的加成
      lowRollBonus: {
        damageMultiplier: 2,
        critChanceBoost: 0.2,
        triggerGambleEffects: true
      },
      // 命运共鸣（双Roll相同）
      fateResonance: {
        invincible: true,
        extraAction: true,
        rainbowEffect: true
      }
    },
    
    // 升级配置
    upgrades: [
      {
        level: 1,
        name: '命运低语',
        description: '冷却时间降低至3回合',
        effect: { cooldownReduction: 1 }
      },
      {
        level: 2,
        name: '三重命运',
        description: '变为三重Roll',
        effect: { tripleRoll: true }
      },
      {
        level: 3,
        name: '命运主宰',
        description: '可锁定一个骰子结果',
        effect: { canLockOneDie: true }
      }
    ],
    
    // 演出配置
    visual: {
      icon: '🎲',
      color: '#FFD700',
      animation: 'dice_spin',
      screenShake: true,
      slowMotion: true,
      voiceLine: '命运，由我决定！'
    }
  },
  
  // 魔术师 - 偷天换日
  MAGICIAN: {
    id: 'grand_trick',
    name: '偷天换日',
    nameEn: 'Grand Trick',
    description: '本回合敌方看到的所有信息均为错误。同时你可查看敌方真实出牌、Roll范围和是否会空过。',
    classType: 'MAGICIAN',
    cooldown: 5,
    maxCooldown: 5,
    skillType: SkillType.ACTIVE,
    trigger: SkillTrigger.MANUAL,
    
    effects: {
      // 伪装信息
      disguise: {
        fakeRoll: true,
        fakeSpeed: true,
        fakeType: true,
        fakeRarity: true
      },
      // 查看真实信息
      reveal: {
        enemyCard: true,
        enemyRollRange: true,
        enemyWillSkip: true
      },
      // 完美骗局
      perfectTrick: {
        damageMultiplier: 2,
        confuseEnemy: true,
        extendDisguise: 1
      }
    },
    
    upgrades: [
      {
        level: 1,
        name: '幻术精通',
        description: '隐藏更多信息',
        effect: { hideMoreInfo: true }
      },
      {
        level: 2,
        name: '镜像复制',
        description: '可复制敌方上回合技能',
        effect: { copyEnemySkill: true }
      },
      {
        level: 3,
        name: '永恒幻觉',
        description: '错误信息持续整场战斗',
        effect: { permanentIllusion: true }
      }
    ],
    
    visual: {
      icon: '🎭',
      color: '#9B59B6',
      animation: 'card_shatter',
      mirrorEffect: true,
      voiceLine: '你看到的，只是我想让你看到的。'
    }
  },
  
  // 处刑者 - 最终裁决
  EXECUTIONER: {
    id: 'final_verdict',
    name: '最终裁决',
    nameEn: 'Final Verdict',
    description: '本回合若压制成功，追加一次无法闪避/反制/防御的处刑攻击。敌方生命≤20%时直接斩杀。',
    classType: 'EXECUTIONER',
    cooldown: 5,
    maxCooldown: 5,
    skillType: SkillType.ACTIVE,
    trigger: SkillTrigger.MANUAL,
    
    effects: {
      // 处刑攻击
      execution: {
        unblockable: true,
        uncounterable: true,
        undefendable: true,
        damageBonus: 0.5
      },
      // 斩杀阈值
      execute: {
        hpThreshold: 0.2,
        instantKill: true
      },
      // 公开处刑（Roll差≥10）
      publicExecution: {
        rollDiffThreshold: 10,
        trueDamage: 5,
        applyPressure: true,
        speedDebuff: 2
      }
    },
    
    upgrades: [
      {
        level: 1,
        name: '死刑宣告',
        description: '斩杀阈值提升至30%',
        effect: { executeThreshold: 0.3 }
      },
      {
        level: 2,
        name: '威压统治',
        description: '压制后敌方获得威压',
        effect: { applyPressureOnDominate: true }
      },
      {
        level: 3,
        name: '连环处刑',
        description: '击杀后可再次释放',
        effect: { chainExecution: true }
      }
    ],
    
    visual: {
      icon: '⚖️',
      color: '#C0392B',
      animation: 'guillotine_fall',
      monochrome: true,
      voiceLine: '有罪，当诛！'
    }
  },
  
  // 狂徒 - 暴走失控
  MANIAC: {
    id: 'rampage',
    name: '暴走失控',
    nameEn: 'Rampage',
    description: '进入暴走状态2回合：Roll范围+50%，速度+5，连击概率提升，获胜后追加攻击。但无法防御/空过，每回合损失生命。',
    classType: 'MANIAC',
    cooldown: 4,
    maxCooldown: 4,
    skillType: SkillType.ACTIVE,
    trigger: SkillTrigger.MANUAL,
    duration: 2,
    
    effects: {
      // 暴走状态
      rampage: {
        rollRangeBoost: 0.5,
        speedBonus: 5,
        comboChanceBoost: 0.3,
        followUpAttack: true
      },
      // 负面效果
      drawback: {
        cannotDefend: true,
        cannotSkip: true,
        hpLossPerTurn: 3
      },
      // 终末暴走（连续获胜3次）
      apocalypseRampage: {
        consecutiveWinsRequired: 3,
        gainMadness: true,
        randomCorruption: true,
        aoeAttacks: true
      }
    },
    
    upgrades: [
      {
        level: 1,
        name: '无尽狂怒',
        description: '暴走持续+1回合',
        effect: { durationBonus: 1 }
      },
      {
        level: 2,
        name: '血之渴望',
        description: '暴走期间吸血',
        effect: { lifeSteal: 0.2 }
      },
      {
        level: 3,
        name: '不死狂徒',
        description: '死亡后可继续行动1回合',
        effect: { postDeathAction: 1 }
      }
    ],
    
    visual: {
      icon: '🔥',
      color: '#E74C3C',
      animation: 'blood_rage',
      redFilter: true,
      screenCrack: true,
      voiceLine: '杀！杀！杀！'
    }
  }
};

// ==================== 技能状态管理器 ====================

class ClassSkillManager {
  constructor() {
    this._skillStates = new Map(); // entityId -> skillState
    this._activeEffects = new Map(); // entityId -> activeSkillEffects
  }

  static getInstance() {
    if (!ClassSkillManager._instance) {
      ClassSkillManager._instance = new ClassSkillManager();
    }
    return ClassSkillManager._instance;
  }

  /**
   * 初始化实体技能状态
   */
  initEntitySkill(entityId, classType) {
    const skillConfig = CLASS_SKILLS[classType];
    if (!skillConfig) {
      console.warn(`[ClassSkillManager] 未找到职业 ${classType} 的技能配置`);
      return;
    }

    this._skillStates.set(entityId, {
      entityId,
      classType,
      skillId: skillConfig.id,
      currentCooldown: 0,
      maxCooldown: skillConfig.cooldown,
      upgradeLevel: 0,
      isActive: false,
      activeDuration: 0,
      totalUses: 0,
      // 特殊计数器
      consecutiveWins: 0,      // 狂徒用
      fateResonanceTriggered: false,  // 赌徒用
      perfectTrickTriggered: false,   // 魔术师用
      publicExecutionTriggered: false // 处刑者用
    });

    this._activeEffects.set(entityId, {});
  }

  /**
   * 获取实体技能状态
   */
  getSkillState(entityId) {
    return this._skillStates.get(entityId);
  }

  /**
   * 检查技能是否可用
   */
  canUseSkill(entityId) {
    const state = this._skillStates.get(entityId);
    if (!state) return false;
    return state.currentCooldown === 0 && !state.isActive;
  }

  /**
   * 使用技能
   */
  useSkill(entityId, battleState) {
    const state = this._skillStates.get(entityId);
    if (!state) {
      return { success: false, reason: '技能状态未初始化' };
    }

    if (state.currentCooldown > 0) {
      return { success: false, reason: `技能冷却中 (${state.currentCooldown}回合)` };
    }

    const skillConfig = CLASS_SKILLS[state.classType];
    if (!skillConfig) {
      return { success: false, reason: '技能配置不存在' };
    }

    // 应用升级效果
    const upgradedConfig = this._applyUpgrades(skillConfig, state.upgradeLevel);

    // 激活技能
    state.isActive = true;
    state.activeDuration = upgradedConfig.duration || 1;
    state.currentCooldown = upgradedConfig.cooldown;
    state.totalUses++;

    // 生成技能效果
    const effects = this._generateSkillEffects(upgradedConfig, state);

    // 存储活跃效果
    this._activeEffects.set(entityId, effects);

    console.log(`[ClassSkillManager] ${state.classType} 使用技能: ${skillConfig.name}`);

    return {
      success: true,
      skill: upgradedConfig,
      effects,
      state
    };
  }

  /**
   * 应用升级效果
   */
  _applyUpgrades(skillConfig, upgradeLevel) {
    const config = { ...skillConfig };
    
    for (let i = 0; i < upgradeLevel && i < skillConfig.upgrades.length; i++) {
      const upgrade = skillConfig.upgrades[i];
      
      // 应用升级效果
      if (upgrade.effect.cooldownReduction) {
        config.cooldown = Math.max(1, config.cooldown - upgrade.effect.cooldownReduction);
      }
      if (upgrade.effect.tripleRoll) {
        config.effects.tripleRoll = true;
      }
      if (upgrade.effect.canLockOneDie) {
        config.effects.canLockOneDie = true;
      }
      if (upgrade.effect.executeThreshold) {
        config.effects.execute.hpThreshold = upgrade.effect.executeThreshold;
      }
      if (upgrade.effect.durationBonus) {
        config.duration = (config.duration || 1) + upgrade.effect.durationBonus;
      }
    }

    return config;
  }

  /**
   * 生成技能效果
   */
  _generateSkillEffects(skillConfig, state) {
    const effects = {
      type: skillConfig.classType,
      duration: skillConfig.duration || 1,
      modifiers: {}
    };

    switch (skillConfig.classType) {
      case 'GAMBLER':
        effects.modifiers.doubleRoll = true;
        effects.modifiers.canChooseHighOrLow = true;
        effects.modifiers.lowRollBonus = skillConfig.effects.lowRollBonus;
        break;

      case 'MAGICIAN':
        effects.modifiers.disguise = skillConfig.effects.disguise;
        effects.modifiers.reveal = skillConfig.effects.reveal;
        break;

      case 'EXECUTIONER':
        effects.modifiers.execution = skillConfig.effects.execution;
        effects.modifiers.execute = skillConfig.effects.execute;
        break;

      case 'MANIAC':
        effects.modifiers.rampage = skillConfig.effects.rampage;
        effects.modifiers.drawback = skillConfig.effects.drawback;
        break;
    }

    return effects;
  }

  /**
   * 回合开始处理
   */
  onTurnStart(entityId) {
    const state = this._skillStates.get(entityId);
    if (!state) return null;

    const results = [];

    // 减少冷却
    if (state.currentCooldown > 0) {
      state.currentCooldown--;
      if (state.currentCooldown === 0) {
        results.push({ type: 'skill_ready', skillId: state.skillId });
      }
    }

    // 减少活跃持续时间
    if (state.isActive && state.activeDuration > 0) {
      state.activeDuration--;
      
      // 狂徒每回合损失生命
      const skillConfig = CLASS_SKILLS[state.classType];
      if (state.classType === 'MANIAC' && skillConfig.effects.drawback.hpLossPerTurn) {
        results.push({
          type: 'rampage_hp_loss',
          amount: skillConfig.effects.drawback.hpLossPerTurn
        });
      }
      
      if (state.activeDuration === 0) {
        state.isActive = false;
        this._activeEffects.delete(entityId);
        results.push({ type: 'skill_end', skillId: state.skillId });
      }
    }

    return results;
  }

  /**
   * 回合结束处理
   */
  onTurnEnd(entityId, battleResult) {
    const state = this._skillStates.get(entityId);
    if (!state) return null;

    // 更新连胜计数（狂徒）
    if (state.classType === 'MANIAC') {
      if (battleResult.winner === entityId) {
        state.consecutiveWins++;
        
        // 检查终末暴走
        const skillConfig = CLASS_SKILLS.MANIAC;
        if (state.consecutiveWins >= skillConfig.effects.apocalypseRampage.consecutiveWinsRequired) {
          return { type: 'apocalypse_rampage_triggered' };
        }
      } else {
        state.consecutiveWins = 0;
      }
    }

    return null;
  }

  /**
   * 获取活跃效果
   */
  getActiveEffects(entityId) {
    return this._activeEffects.get(entityId) || {};
  }

  /**
   * 检查技能是否激活
   */
  isSkillActive(entityId) {
    const state = this._skillStates.get(entityId);
    return state ? state.isActive : false;
  }

  /**
   * 升级技能
   */
  upgradeSkill(entityId) {
    const state = this._skillStates.get(entityId);
    if (!state) return { success: false, reason: '技能状态未初始化' };
    
    const skillConfig = CLASS_SKILLS[state.classType];
    if (state.upgradeLevel >= skillConfig.upgrades.length) {
      return { success: false, reason: '技能已达到最大等级' };
    }

    state.upgradeLevel++;
    const upgrade = skillConfig.upgrades[state.upgradeLevel - 1];

    return {
      success: true,
      level: state.upgradeLevel,
      upgrade
    };
  }

  /**
   * 重置技能状态
   */
  resetEntitySkill(entityId) {
    this._skillStates.delete(entityId);
    this._activeEffects.delete(entityId);
  }

  /**
   * 获取技能配置
   */
  getSkillConfig(classType) {
    return CLASS_SKILLS[classType];
  }
}

// ==================== 导出 ====================

module.exports = {
  SkillType,
  SkillTrigger,
  CLASS_SKILLS,
  ClassSkillManager
};
