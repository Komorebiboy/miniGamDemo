/**
 * 卡牌效果系统 - 处理卡牌使用条件和效果执行
 * 
 * 核心功能：
 * 1. 检查卡牌使用条件
 * 2. 执行卡牌效果
 * 3. 处理特殊机制（赌债、热手、幸运等）
 */

// ==================== 效果类型定义 ====================

const EffectType = {
  // 伤害类
  DAMAGE: 'DAMAGE',
  DAMAGE_MULTIPLY: 'DAMAGE_MULTIPLY',
  DAMAGE_PER_MISSING_HP: 'DAMAGE_PER_MISSING_HP',
  
  // 自伤类
  SELF_DAMAGE: 'SELF_DAMAGE',
  SELF_DAMAGE_HALF: 'SELF_DAMAGE_HALF',
  SELF_DAMAGE_PERCENT: 'SELF_DAMAGE_PERCENT',
  
  // Roll值修改
  ROLL_MIN_BOOST: 'ROLL_MIN_BOOST',
  ROLL_MAX_BOOST: 'ROLL_MAX_BOOST',
  LOCK_ROLL_VALUE: 'LOCK_ROLL_VALUE',
  RE_ROLL_ONCE: 'RE_ROLL_ONCE',
  DOUBLE_ROLL_TAKE_HIGHER: 'DOUBLE_ROLL_TAKE_HIGHER',
  
  // 赌博类
  GAMBLE_DOUBLE: 'GAMBLE_DOUBLE',
  TRIPLE_GAMBLE: 'TRIPLE_GAMBLE',
  
  // 幸运类
  GAIN_LUCK: 'GAIN_LUCK',
  ADD_LUCK_TO_ROLL: 'ADD_LUCK_TO_ROLL',
  LUCK_NO_DECAY: 'LUCK_NO_DECAY',
  ROLL_BASED_ON_LUCK: 'ROLL_BASED_ON_LUCK',
  
  // 热手类
  GAIN_HOT_HAND: 'GAIN_HOT_HAND',
  BONUS_PER_HOT_HAND: 'BONUS_PER_HOT_HAND',
  RESET_ON_LOSS: 'RESET_ON_LOSS',
  CRIT_ON_HOT_HAND: 'CRIT_ON_HOT_HAND',
  
  // 赌债类
  GAIN_DEBT: 'GAIN_DEBT',
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  DELAYED_DAMAGE: 'DELAYED_DAMAGE',
  CONVERT_DEBT_TO_DAMAGE: 'CONVERT_DEBT_TO_DAMAGE',
  
  // 终焉类
  GAIN_BET_STACK: 'GAIN_BET_STACK',
  APOCALYPSE_UNLOCK: 'APOCALYPSE_UNLOCK',
  DAMAGE_PER_BET: 'DAMAGE_PER_BET',
  
  // 信息类
  FAKE_DISPLAY: 'FAKE_DISPLAY',
  PEEK_ENEMY_HAND: 'PEEK_ENEMY_HAND',
  PEEK_ENEMY_DECK: 'PEEK_ENEMY_DECK',
  HIDE_ALL_INFO: 'HIDE_ALL_INFO',
  
  // 防御类
  SHIELD: 'SHIELD',
  COUNTER_ATTACK: 'COUNTER_ATTACK',
  
  // 治疗类
  HEAL: 'HEAL',
  HEAL_ON_LOW_HP_TRIGGER: 'HEAL_ON_LOW_HP_TRIGGER',
  
  // 特殊条件
  REQUIRE_LOW_HP: 'REQUIRE_LOW_HP',
  REQUIRE_CRITICAL_HP: 'REQUIRE_CRITICAL_HP',
  BONUS_IF_LAST_CRIT: 'BONUS_IF_LAST_CRIT',
  
  // 其他
  JACKPOT: 'JACKPOT',
  GAIN_DESPERATION: 'GAIN_DESPERATION',
  ILLUSION: 'ILLUSION',
  MIRROR_CARD: 'MIRROR_CARD',
  CONTROL_ENEMY_AI: 'CONTROL_ENEMY_AI'
};

// ==================== 卡牌条件检查器 ====================

class CardConditionChecker {
  constructor(battleManager) {
    this._battleManager = battleManager;
  }

  /**
   * 检查卡牌是否可以使用
   * @param {Object} entity - 使用卡牌的角色
   * @param {Object} card - 要使用的卡牌
   * @param {Object} battleState - 当前战斗状态
   * @returns {Object} - { canUse: boolean, reason: string }
   */
  checkCanUseCard(entity, card, battleState) {
    if (!card || !card.effects) {
      return { canUse: true, reason: '' };
    }

    const effects = card.effects || [];
    
    // 检查每个效果的使用条件
    for (const effect of effects) {
      const conditionCheck = this._checkEffectCondition(entity, effect, battleState);
      if (!conditionCheck.canUse) {
        return conditionCheck;
      }
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 检查单个效果的使用条件
   */
  _checkEffectCondition(entity, effect, battleState) {
    const { type, condition, threshold, value } = effect;

    switch (type) {
      // 低血需求 - 需要生命低于阈值
      case EffectType.REQUIRE_LOW_HP:
        const hpPercent = entity.getHealthPercent ? entity.getHealthPercent() : 
                         (entity.baseStats.currentHealth / entity.baseStats.maxHealth);
        if (hpPercent > (threshold || 0.3)) {
          return { 
            canUse: false, 
            reason: `需要生命值低于${Math.floor((threshold || 0.3) * 100)}%` 
          };
        }
        break;

      // 濒血需求 - 需要生命极低
      case EffectType.REQUIRE_CRITICAL_HP:
        const criticalHpPercent = entity.getHealthPercent ? entity.getHealthPercent() : 
                                  (entity.baseStats.currentHealth / entity.baseStats.maxHealth);
        if (criticalHpPercent > (threshold || 0.1)) {
          return { 
            canUse: false, 
            reason: `需要生命值低于${Math.floor((threshold || 0.1) * 100)}%` 
          };
        }
        break;

      // 自伤类 - 检查是否会致死
      case EffectType.SELF_DAMAGE:
      case EffectType.SELF_DAMAGE_HALF:
        const selfDamage = type === EffectType.SELF_DAMAGE_HALF ? 
                          Math.floor(value / 2) : value;
        if (entity.baseStats.currentHealth <= selfDamage) {
          return { 
            canUse: false, 
            reason: '使用此牌会导致死亡' 
          };
        }
        break;

      case EffectType.SELF_DAMAGE_PERCENT:
        const percentDamage = Math.floor(entity.baseStats.maxHealth * value);
        if (entity.baseStats.currentHealth <= percentDamage) {
          return { 
            canUse: false, 
            reason: '使用此牌会导致死亡' 
          };
        }
        break;

      // 暴击奖励 - 需要上次暴击
      case EffectType.BONUS_IF_LAST_CRIT:
        // 检查是否刚才有暴击
        const lastRollWasCrit = battleState.lastRollWasCrit || false;
        if (!lastRollWasCrit) {
          return { 
            canUse: false, 
            reason: '需要上次Roll出暴击' 
          };
        }
        break;

      // 默认可以通过
      default:
        break;
    }

    return { canUse: true, reason: '' };
  }
}

// ==================== 卡牌效果执行器 ====================

class CardEffectExecutor {
  constructor(battleManager) {
    this._battleManager = battleManager;
    this._entityStates = new Map(); // 存储实体状态（赌债、热手、幸运等）
  }

  /**
   * 初始化实体状态
   */
  initEntityState(entityId) {
    this._entityStates.set(entityId, {
      // 赌债状态
      debt: 0,
      debtTimer: 0,
      
      // 热手状态
      hotHandStacks: 0,
      maxHotHandStacks: 10,
      
      // 连胜状态
      consecutiveWins: 0,
      
      // 幸运状态
      luckValue: 0,
      maxLuckValue: 100,
      
      // 赌注层数（终焉流）
      betStacks: 0,
      maxBetStacks: 20,
      
      // 绝望层数（濒死流）
      desperationStacks: 0,
      
      // Roll值修正
      rollMinModifier: 0,
      rollMaxModifier: 0,
      critChanceModifier: 0,
      
      // 锁定Roll值
      lockedRollValue: null,
      doubleRollNext: false,
      
      // 上次是否暴击
      lastRollWasCrit: false,
      
      // 终焉准备
      apocalypseReady: false,
      apocalypseStacks: 0
    });
  }

  /**
   * 获取实体状态
   */
  getEntityState(entityId) {
    if (!this._entityStates.has(entityId)) {
      this.initEntityState(entityId);
    }
    return this._entityStates.get(entityId);
  }

  /**
   * 执行卡牌效果
   * @param {Object} entity - 使用卡牌的角色
   * @param {Object} target - 目标角色
   * @param {Object} card - 使用的卡牌
   * @param {Object} rollResult - Roll点结果
   * @returns {Object} - 效果执行结果
   */
  executeCardEffects(entity, target, card, rollResult) {
    const results = [];
    const effects = card.effects || [];
    const state = this.getEntityState(entity.id);

    for (const effect of effects) {
      const result = this._executeEffect(entity, target, effect, rollResult, state);
      if (result) {
        results.push(result);
      }
    }

    return {
      cardName: card.name,
      rollValue: rollResult.value,
      effects: results,
      state: { ...state }
    };
  }

  /**
   * 执行单个效果
   */
  _executeEffect(entity, target, effect, rollResult, state) {
    const { type, value, condition, threshold, duration, multiplier, weights } = effect;

    switch (type) {
      // ========== 伤害类效果 ==========
      
      case EffectType.DAMAGE:
        const damage = value;
        target.takeDamage(damage);
        return { type: 'damage', value: damage, target: target.name };

      case EffectType.DAMAGE_MULTIPLY:
        const multipliedDamage = Math.floor(rollResult.value * value);
        target.takeDamage(multipliedDamage);
        return { type: 'damage_multiply', value: multipliedDamage, multiplier: value };

      case EffectType.DAMAGE_PER_MISSING_HP:
        const missingHp = entity.baseStats.maxHealth - entity.baseStats.currentHealth;
        const bonusDamage = Math.floor(missingHp / (threshold || 10)) * value;
        const totalDamage = rollResult.value + bonusDamage;
        target.takeDamage(totalDamage);
        return { type: 'damage_per_missing_hp', value: totalDamage, bonus: bonusDamage };

      // ========== 自伤类效果 ==========
      
      case EffectType.SELF_DAMAGE:
        entity.takeDamage(value);
        return { type: 'self_damage', value: value };

      case EffectType.SELF_DAMAGE_HALF:
        const halfDamage = Math.floor(rollResult.value * 0.5);
        entity.takeDamage(halfDamage);
        return { type: 'self_damage_half', value: halfDamage };

      case EffectType.SELF_DAMAGE_PERCENT:
        const percentDamage = Math.floor(entity.baseStats.maxHealth * value);
        entity.takeDamage(percentDamage);
        return { type: 'self_damage_percent', value: percentDamage, percent: value * 100 };

      // ========== Roll值修改 ==========
      
      case EffectType.ROLL_MIN_BOOST:
        state.rollMinModifier += value;
        return { type: 'roll_min_boost', value: value, newModifier: state.rollMinModifier };

      case EffectType.ROLL_MAX_BOOST:
        state.rollMaxModifier += value;
        return { type: 'roll_max_boost', value: value, newModifier: state.rollMaxModifier };

      case EffectType.LOCK_ROLL_VALUE:
        state.lockedRollValue = value;
        return { type: 'lock_roll_value', value: value };

      case EffectType.RE_ROLL_ONCE:
        // 标记可以重Roll
        state.canReRoll = true;
        return { type: 're_roll_once', available: true };

      case EffectType.DOUBLE_ROLL_TAKE_HIGHER:
        state.doubleRollNext = true;
        return { type: 'double_roll', active: true };

      // ========== 赌博类效果 ==========
      
      case EffectType.GAMBLE_DOUBLE:
        if (rollResult.value >= (threshold || 15)) {
          const doubleDamage = rollResult.value * 2;
          target.takeDamage(doubleDamage);
          return { type: 'gamble_double_success', value: doubleDamage, threshold: threshold || 15 };
        } else if (rollResult.value <= 5) {
          const selfDmg = Math.floor(rollResult.value * 0.5);
          entity.takeDamage(selfDmg);
          return { type: 'gamble_double_fail', selfDamage: selfDmg };
        }
        return { type: 'gamble_double_normal', value: rollResult.value };

      case EffectType.TRIPLE_GAMBLE:
        // 随机选择效果
        const rand = Math.random();
        let gambleResult;
        if (rand < (weights ? weights[0] : 0.33)) {
          gambleResult = { multiplier: 3, type: 'triple' };
        } else if (rand < (weights ? weights[0] + weights[1] : 0.66)) {
          gambleResult = { multiplier: 2, type: 'double' };
        } else {
          gambleResult = { multiplier: 0, type: 'zero' };
        }
        
        if (gambleResult.multiplier > 0) {
          const gambleDamage = rollResult.value * gambleResult.multiplier;
          target.takeDamage(gambleDamage);
        }
        return { type: 'triple_gamble', result: gambleResult.type, multiplier: gambleResult.multiplier };

      // ========== 幸运类效果 ==========
      
      case EffectType.GAIN_LUCK:
        state.luckValue = Math.min(state.luckValue + value, state.maxLuckValue);
        return { type: 'gain_luck', value: value, total: state.luckValue };

      case EffectType.ADD_LUCK_TO_ROLL:
        const luckBonus = Math.floor(state.luckValue * (multiplier || 0.1));
        return { type: 'add_luck_to_roll', bonus: luckBonus, luckUsed: state.luckValue };

      // ========== 热手类效果 ==========
      
      case EffectType.GAIN_HOT_HAND:
        state.hotHandStacks = Math.min(state.hotHandStacks + value, state.maxHotHandStacks);
        return { type: 'gain_hot_hand', stacks: state.hotHandStacks };

      case EffectType.BONUS_PER_HOT_HAND:
        const hotHandBonus = state.hotHandStacks * value;
        return { type: 'hot_hand_bonus', bonus: hotHandBonus, stacks: state.hotHandStacks };

      // ========== 赌债类效果 ==========
      
      case EffectType.GAIN_DEBT:
        state.debt += value;
        state.debtTimer = duration || 3;
        return { type: 'gain_debt', amount: value, timer: state.debtTimer };

      case EffectType.DEBT_PAYMENT:
        if (state.debt > 0) {
          const payment = Math.min(state.debt, value);
          state.debt -= payment;
          return { type: 'debt_payment', paid: payment, remaining: state.debt };
        }
        return null;

      case EffectType.DELAYED_DAMAGE:
        // 延迟伤害，记录到状态中
        if (!state.delayedDamages) state.delayedDamages = [];
        state.delayedDamages.push({
          damage: value,
          turns: duration || 2
        });
        return { type: 'delayed_damage', damage: value, turns: duration || 2 };

      // ========== 终焉类效果 ==========
      
      case EffectType.GAIN_BET_STACK:
        state.betStacks = Math.min(state.betStacks + value, state.maxBetStacks);
        if (state.betStacks >= state.maxBetStacks) {
          state.apocalypseReady = true;
        }
        return { type: 'gain_bet_stack', stacks: state.betStacks, ready: state.apocalypseReady };

      case EffectType.DAMAGE_PER_BET:
        const betDamage = state.betStacks * value;
        target.takeDamage(betDamage);
        return { type: 'damage_per_bet', damage: betDamage, stacks: state.betStacks };

      // ========== 防御类效果 ==========
      
      case EffectType.SHIELD:
        entity.addShield(value);
        return { type: 'shield', value: value };

      case EffectType.COUNTER_ATTACK:
        // 反击效果，在受到伤害时触发
        if (!state.counterAttack) state.counterAttack = 0;
        state.counterAttack += value;
        return { type: 'counter_attack', value: value, total: state.counterAttack };

      // ========== 治疗类效果 ==========
      
      case EffectType.HEAL:
        entity.heal(value);
        return { type: 'heal', value: value };

      case EffectType.HEAL_ON_LOW_HP_TRIGGER:
        const currentHpPercent = entity.baseStats.currentHealth / entity.baseStats.maxHealth;
        if (currentHpPercent <= (threshold || 0.2)) {
          entity.heal(value);
          return { type: 'heal_on_low_hp', value: value, threshold: threshold || 0.2 };
        }
        return null;

      // ========== 信息类效果 ==========
      
      case EffectType.PEEK_ENEMY_HAND:
        return { type: 'peek_enemy_hand', count: value || 1 };

      case EffectType.FAKE_DISPLAY:
        return { type: 'fake_display', fakeMin: effect.fakeMin, fakeMax: effect.fakeMax };

      // ========== 条件类效果（已经在条件检查中处理，这里只返回信息）==========
      
      case EffectType.REQUIRE_LOW_HP:
      case EffectType.REQUIRE_CRITICAL_HP:
      case EffectType.BONUS_IF_LAST_CRIT:
        return { type: 'condition_met', condition: type };

      // ========== 默认 ==========
      
      default:
        console.warn(`[CardEffectExecutor] 未知效果类型: ${type}`);
        return { type: 'unknown', effectType: type };
    }
  }

  /**
   * 回合结束处理（处理延迟效果、赌债结算等）
   */
  onTurnEnd(entityId) {
    const state = this.getEntityState(entityId);
    const results = [];

    // 处理赌债倒计时
    if (state.debtTimer > 0) {
      state.debtTimer--;
      if (state.debtTimer === 0 && state.debt > 0) {
        // 赌债到期，造成伤害
        const entity = this._battleManager._player.id === entityId ? 
                      this._battleManager._player : this._battleManager._enemy;
        if (entity) {
          const debtDamage = state.debt * 5; // 每层赌债5点伤害
          entity.takeDamage(debtDamage);
          results.push({ type: 'debt_damage', damage: debtDamage, debt: state.debt });
          state.debt = 0;
        }
      }
    }

    // 处理延迟伤害
    if (state.delayedDamages && state.delayedDamages.length > 0) {
      for (let i = state.delayedDamages.length - 1; i >= 0; i--) {
        const delayed = state.delayedDamages[i];
        delayed.turns--;
        if (delayed.turns <= 0) {
          const entity = this._battleManager._player.id === entityId ? 
                        this._battleManager._player : this._battleManager._enemy;
          if (entity) {
            entity.takeDamage(delayed.damage);
            results.push({ type: 'delayed_damage_trigger', damage: delayed.damage });
          }
          state.delayedDamages.splice(i, 1);
        }
      }
    }

    // 减少幸运值（自然衰减）
    if (state.luckValue > 0 && !state.luckNoDecay) {
      state.luckValue = Math.max(0, state.luckValue - 5);
    }

    return results;
  }

  /**
   * 战斗胜利处理（热手连胜等）
   */
  onBattleWin(entityId) {
    const state = this.getEntityState(entityId);
    
    // 增加连胜次数
    state.consecutiveWins++;
    
    // 热手层数增加
    if (state.hotHandStacks < state.maxHotHandStacks) {
      state.hotHandStacks++;
    }
    
    // 标记上次暴击
    state.lastRollWasCrit = true;
    
    return {
      consecutiveWins: state.consecutiveWins,
      hotHandStacks: state.hotHandStacks
    };
  }

  /**
   * 战斗失败处理（热手重置等）
   */
  onBattleLoss(entityId) {
    const state = this.getEntityState(entityId);
    
    // 重置连胜
    state.consecutiveWins = 0;
    
    // 热手重置
    const lostHotHand = state.hotHandStacks;
    state.hotHandStacks = 0;
    
    // 标记上次未暴击
    state.lastRollWasCrit = false;
    
    return {
      hotHandReset: true,
      lostStacks: lostHotHand
    };
  }

  /**
   * 获取Roll值修正
   */
  getRollModifiers(entityId) {
    const state = this.getEntityState(entityId);
    return {
      minModifier: state.rollMinModifier,
      maxModifier: state.rollMaxModifier,
      lockedValue: state.lockedRollValue,
      doubleRoll: state.doubleRollNext,
      luckValue: state.luckValue,
      hotHandStacks: state.hotHandStacks
    };
  }

  /**
   * 清除Roll锁定
   */
  clearLockedRoll(entityId) {
    const state = this.getEntityState(entityId);
    state.lockedRollValue = null;
    state.doubleRollNext = false;
  }
}

// ==================== 导出 ====================

module.exports = {
  EffectType,
  CardConditionChecker,
  CardEffectExecutor
};
