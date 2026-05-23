/**
 * 职业技能动画系统
 * 
 * 核心功能：
 * 1. 技能释放动画
 * 2. 全屏特效
 * 3. 屏幕震动
 * 4. 慢动作效果
 * 5. 技能台词显示
 */

// ==================== 动画类型定义 ====================

const SkillAnimationType = {
  // 赌徒 - 命运时刻
  DICE_SPIN: 'DICE_SPIN',
  FATE_RESONANCE: 'FATE_RESONANCE',
  JACKPOT: 'JACKPOT',
  
  // 魔术师 - 偷天换日
  CARD_SHATTER: 'CARD_SHATTER',
  MIRROR_BREAK: 'MIRROR_BREAK',
  PERFECT_TRICK: 'PERFECT_TRICK',
  
  // 处刑者 - 最终裁决
  GUILLOTINE_FALL: 'GUILLOTINE_FALL',
  EXECUTE: 'EXECUTE',
  PUBLIC_EXECUTION: 'PUBLIC_EXECUTION',
  
  // 狂徒 - 暴走失控
  BLOOD_RAGE: 'BLOOD_RAGE',
  APOCALYPSE_RAMPAGE: 'APOCALYPSE_RAMPAGE',
  SCREEN_CRACK: 'SCREEN_CRACK'
};

// ==================== 动画配置 ====================

const SKILL_ANIMATION_CONFIG = {
  // 赌徒 - 命运时刻
  [SkillAnimationType.DICE_SPIN]: {
    duration: 3000,
    stages: [
      { name: 'startup', duration: 500, effect: 'glow' },
      { name: 'spin', duration: 1500, effect: 'dice_rotation' },
      { name: 'slowdown', duration: 800, effect: 'slow_motion' },
      { name: 'reveal', duration: 200, effect: 'flash' }
    ],
    screenShake: { intensity: 0.3, duration: 2000 },
    particles: 'golden_sparkles',
    voiceLine: '命运，由我决定！',
    bgm: 'casino_intense'
  },
  
  [SkillAnimationType.FATE_RESONANCE]: {
    duration: 4000,
    stages: [
      { name: ' buildup', duration: 800, effect: 'rainbow_glow' },
      { name: 'explosion', duration: 1200, effect: 'color_burst' },
      { name: 'divine', duration: 2000, effect: 'holy_light' }
    ],
    screenShake: { intensity: 0.5, duration: 3000 },
    particles: 'rainbow_confetti',
    voiceLine: '命运共鸣！',
    bgm: 'divine_intervention',
    fullscreen: true
  },
  
  // 魔术师 - 偷天换日
  [SkillAnimationType.CARD_SHATTER]: {
    duration: 2500,
    stages: [
      { name: 'reveal', duration: 600, effect: 'card_fan' },
      { name: 'shatter', duration: 800, effect: 'glass_break' },
      { name: 'illusion', duration: 1100, effect: 'mirror_shine' }
    ],
    screenShake: { intensity: 0.2, duration: 800 },
    particles: 'card_fragments',
    voiceLine: '你看到的，只是我想让你看到的。',
    bgm: 'mysterious_magic'
  },
  
  [SkillAnimationType.PERFECT_TRICK]: {
    duration: 3000,
    stages: [
      { name: 'setup', duration: 500, effect: 'ui_glitch' },
      { name: 'reveal', duration: 1000, effect: 'enemy_confusion' },
      { name: 'triumph', duration: 1500, effect: 'victory_flash' }
    ],
    screenShake: { intensity: 0.4, duration: 1500 },
    particles: 'laughing_masks',
    voiceLine: '完美骗局！',
    bgm: 'triumphant_trick'
  },
  
  // 处刑者 - 最终裁决
  [SkillAnimationType.GUILLOTINE_FALL]: {
    duration: 3500,
    stages: [
      { name: 'judgement', duration: 1000, effect: 'bell_toll' },
      { name: 'rise', duration: 800, effect: 'guillotine_ascend' },
      { name: 'fall', duration: 700, effect: 'guillotine_drop' },
      { name: 'impact', duration: 1000, effect: 'blood_splash' }
    ],
    screenShake: { intensity: 0.6, duration: 2500 },
    particles: 'blood_drops',
    voiceLine: '有罪，当诛！',
    bgm: 'dark_judgement',
    monochrome: true
  },
  
  [SkillAnimationType.EXECUTE]: {
    duration: 2000,
    stages: [
      { name: 'charge', duration: 600, effect: 'red_charge' },
      { name: 'slash', duration: 400, effect: 'blade_flash' },
      { name: 'kill', duration: 1000, effect: 'time_stop' }
    ],
    screenShake: { intensity: 0.8, duration: 1500 },
    particles: 'crimson_slash',
    voiceLine: '处刑！',
    bgm: 'execution_theme',
    timeStop: 500
  },
  
  // 狂徒 - 暴走失控
  [SkillAnimationType.BLOOD_RAGE]: {
    duration: 3000,
    stages: [
      { name: 'awaken', duration: 800, effect: 'red_filter_on' },
      { name: 'rage', duration: 1200, effect: 'screen_shake_intense' },
      { name: 'burn', duration: 1000, effect: 'flame_particles' }
    ],
    screenShake: { intensity: 0.5, duration: 3000 },
    particles: 'fire_and_blood',
    voiceLine: '杀！杀！杀！',
    bgm: 'berserk_theme',
    redFilter: true
  },
  
  [SkillAnimationType.APOCALYPSE_RAMPAGE]: {
    duration: 5000,
    stages: [
      { name: 'breakdown', duration: 1000, effect: 'ui_corruption' },
      { name: 'madness', duration: 1500, effect: 'glitch_explosion' },
      { name: 'apocalypse', duration: 2500, effect: 'world_break' }
    ],
    screenShake: { intensity: 1.0, duration: 5000 },
    particles: 'chaos_fragments',
    voiceLine: '毁灭一切！',
    bgm: 'apocalypse_madness',
    redFilter: true,
    screenCrack: true,
    fullscreen: true
  }
};

// ==================== 技能动画管理器 ====================

class SkillAnimationManager {
  constructor() {
    this._activeAnimations = new Map();
    this._animationCallbacks = new Map();
  }

  static getInstance() {
    if (!SkillAnimationManager._instance) {
      SkillAnimationManager._instance = new SkillAnimationManager();
    }
    return SkillAnimationManager._instance;
  }

  /**
   * 播放技能动画
   */
  playAnimation(animationType, options = {}) {
    const config = SKILL_ANIMATION_CONFIG[animationType];
    if (!config) {
      console.warn(`[SkillAnimationManager] 未找到动画配置: ${animationType}`);
      return Promise.resolve();
    }

    const animationId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve) => {
      this._activeAnimations.set(animationId, {
        type: animationType,
        config,
        startTime: Date.now(),
        currentStage: 0,
        resolve
      });

      // 开始播放动画
      this._startAnimation(animationId, options);
    });
  }

  /**
   * 开始动画播放
   */
  _startAnimation(animationId, options) {
    const animation = this._activeAnimations.get(animationId);
    if (!animation) return;

    const { config } = animation;
    
    // 触发开始回调
    if (options.onStart) {
      options.onStart({
        type: animation.type,
        voiceLine: config.voiceLine,
        duration: config.duration
      });
    }

    // 播放各阶段
    let accumulatedTime = 0;
    config.stages.forEach((stage, index) => {
      setTimeout(() => {
        this._playStage(animationId, stage, index, options);
      }, accumulatedTime);
      accumulatedTime += stage.duration;
    });

    // 动画结束
    setTimeout(() => {
      this._endAnimation(animationId);
    }, config.duration);
  }

  /**
   * 播放单个阶段
   */
  _playStage(animationId, stage, stageIndex, options) {
    const animation = this._activeAnimations.get(animationId);
    if (!animation) return;

    animation.currentStage = stageIndex;

    // 触发阶段回调
    if (options.onStageChange) {
      options.onStageChange({
        stage: stage.name,
        effect: stage.effect,
        progress: (stageIndex + 1) / animation.config.stages.length
      });
    }

    // 应用特效
    this._applyEffect(stage.effect, animation.config);
  }

  /**
   * 应用特效
   */
  _applyEffect(effectType, config) {
    switch (effectType) {
      case 'screen_shake_intense':
        this._triggerScreenShake(config.screenShake);
        break;
      case 'red_filter_on':
        this._applyRedFilter(true);
        break;
      case 'flash':
        this._triggerFlash();
        break;
      case 'time_stop':
        this._triggerTimeStop(config.timeStop || 500);
        break;
      // 其他特效...
    }
  }

  /**
   * 触发屏幕震动
   */
  _triggerScreenShake(shakeConfig) {
    if (!shakeConfig) return;
    
    // 调用微信震动API
    if (wx && wx.vibrateLong) {
      wx.vibrateLong();
    }

    // 触发屏幕震动事件
    this._emitEvent('screen_shake', shakeConfig);
  }

  /**
   * 应用红色滤镜
   */
  _applyRedFilter(enable) {
    this._emitEvent('red_filter', { enable });
  }

  /**
   * 触发闪光
   */
  _triggerFlash() {
    this._emitEvent('flash', { duration: 200 });
  }

  /**
   * 触发时间停止
   */
  _triggerTimeStop(duration) {
    this._emitEvent('time_stop', { duration });
  }

  /**
   * 结束动画
   */
  _endAnimation(animationId) {
    const animation = this._activeAnimations.get(animationId);
    if (!animation) return;

    // 清理特效
    this._cleanupEffects(animation.config);

    // 触发完成回调
    animation.resolve({
      type: animation.type,
      completed: true
    });

    // 移除动画
    this._activeAnimations.delete(animationId);
  }

  /**
   * 清理特效
   */
  _cleanupEffects(config) {
    if (config.redFilter) {
      this._applyRedFilter(false);
    }
  }

  /**
   * 发射事件
   */
  _emitEvent(eventType, data) {
    const callbacks = this._animationCallbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * 订阅动画事件
   */
  on(eventType, callback) {
    if (!this._animationCallbacks.has(eventType)) {
      this._animationCallbacks.set(eventType, []);
    }
    this._animationCallbacks.get(eventType).push(callback);
  }

  /**
   * 取消订阅
   */
  off(eventType, callback) {
    const callbacks = this._animationCallbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 获取动画配置
   */
  getAnimationConfig(animationType) {
    return SKILL_ANIMATION_CONFIG[animationType];
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations() {
    this._activeAnimations.forEach((animation, id) => {
      this._endAnimation(id);
    });
  }
}

// ==================== 导出 ====================

module.exports = {
  SkillAnimationType,
  SKILL_ANIMATION_CONFIG,
  SkillAnimationManager
};
