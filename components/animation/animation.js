// 命运赌局 - 动画效果组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 动画类型
    animationType: {
      type: String,
      value: ''
    },
    // 是否激活
    active: {
      type: Boolean,
      value: false
    },
    // 伤害值
    damageValue: {
      type: Number,
      value: 0
    },
    // 伤害类型
    damageType: {
      type: String,
      value: 'damage'
    },
    // 治疗值
    healValue: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 各种动画的激活状态
    shakeActive: false,
    flashActive: false,
    shockwaveActive: false,
    particlesActive: false,
    lightningActive: false,
    damageFloatActive: false,
    critActive: false,
    dodgeActive: false,
    victoryActive: false,
    defeatActive: false,
    cardFlipActive: false,
    skillCastActive: false,
    healActive: false,
    stunActive: false
  },

  /**
   * 数据监听器
   */
  observers: {
    'active, animationType': function(active, animationType) {
      if (active && animationType) {
        this.playAnimation(animationType);
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 播放指定动画
    playAnimation(type) {
      // 重置所有动画状态
      this.resetAnimations();
      
      // 根据类型激活对应动画
      switch(type) {
        case 'shake':
          this.setData({ shakeActive: true });
          break;
        case 'flash':
          this.setData({ flashActive: true });
          break;
        case 'shockwave':
          this.setData({ shockwaveActive: true });
          break;
        case 'particles':
          this.setData({ particlesActive: true });
          break;
        case 'lightning':
          this.setData({ lightningActive: true });
          break;
        case 'damageFloat':
          this.setData({ damageFloatActive: true });
          break;
        case 'crit':
          this.setData({ critActive: true });
          break;
        case 'dodge':
          this.setData({ dodgeActive: true });
          break;
        case 'victory':
          this.setData({ victoryActive: true });
          break;
        case 'defeat':
          this.setData({ defeatActive: true });
          break;
        case 'cardFlip':
          this.setData({ cardFlipActive: true });
          break;
        case 'skillCast':
          this.setData({ skillCastActive: true });
          break;
        case 'heal':
          this.setData({ healActive: true });
          break;
        case 'stun':
          this.setData({ stunActive: true });
          break;
        default:
          console.warn('未知动画类型:', type);
          return;
      }

      // 动画结束后自动重置
      const animationDuration = this.getAnimationDuration(type);
      setTimeout(() => {
        this.resetAnimation(type);
      }, animationDuration);
    },

    // 获取动画持续时间
    getAnimationDuration(type) {
      const durations = {
        'shake': 500,
        'flash': 300,
        'shockwave': 1000,
        'particles': 3000,
        'lightning': 200,
        'damageFloat': 1000,
        'crit': 500,
        'dodge': 500,
        'victory': 2000,
        'defeat': 2000,
        'cardFlip': 500,
        'skillCast': 1000,
        'heal': 1000,
        'stun': 1000
      };
      return durations[type] || 1000;
    },

    // 重置指定动画
    resetAnimation(type) {
      const resetData = {};
      switch(type) {
        case 'shake':
          resetData.shakeActive = false;
          break;
        case 'flash':
          resetData.flashActive = false;
          break;
        case 'shockwave':
          resetData.shockwaveActive = false;
          break;
        case 'particles':
          resetData.particlesActive = false;
          break;
        case 'lightning':
          resetData.lightningActive = false;
          break;
        case 'damageFloat':
          resetData.damageFloatActive = false;
          break;
        case 'crit':
          resetData.critActive = false;
          break;
        case 'dodge':
          resetData.dodgeActive = false;
          break;
        case 'victory':
          resetData.victoryActive = false;
          break;
        case 'defeat':
          resetData.defeatActive = false;
          break;
        case 'cardFlip':
          resetData.cardFlipActive = false;
          break;
        case 'skillCast':
          resetData.skillCastActive = false;
          break;
        case 'heal':
          resetData.healActive = false;
          break;
        case 'stun':
          resetData.stunActive = false;
          break;
      }
      this.setData(resetData);
    },

    // 重置所有动画
    resetAnimations() {
      this.setData({
        shakeActive: false,
        flashActive: false,
        shockwaveActive: false,
        particlesActive: false,
        lightningActive: false,
        damageFloatActive: false,
        critActive: false,
        dodgeActive: false,
        victoryActive: false,
        defeatActive: false,
        cardFlipActive: false,
        skillCastActive: false,
        healActive: false,
        stunActive: false
      });
    },

    // 播放组合动画
    playComboAnimation(animations) {
      if (!Array.isArray(animations)) return;
      
      let delay = 0;
      animations.forEach((anim) => {
        setTimeout(() => {
          this.playAnimation(anim.type);
        }, delay);
        delay += anim.delay || 0;
      });
    }
  }
});
