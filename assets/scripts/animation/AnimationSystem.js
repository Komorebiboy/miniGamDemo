/**
 * 序列帧动画系统 - 暗黑赌场Roguelike卡牌游戏
 * 
 * 核心功能：
 * - SpriteFrame序列帧动画管理
 * - 对象池复用
 * - 动画事件系统
 * - 性能优化
 */

// ==================== 动画类型 ====================

const AnimationType = {
  ROLL_DICE: 'ROLL_DICE',           // Roll骰子动画
  CARD_FLIP: 'CARD_FLIP',           // 卡牌翻转
  CARD_SHATTER: 'CARD_SHATTER',     // 卡牌破碎
  CRITICAL_HIT: 'CRITICAL_HIT',     // 暴击演出
  SCREEN_SHAKE: 'SCREEN_SHAKE',     // 屏幕震动
  FLASH_WHITE: 'FLASH_WHITE',       // 白色闪光
  EXPLOSION: 'EXPLOSION',           // 爆炸特效
  PARTICLE_FLOAT: 'PARTICLE_FLOAT', // 漂浮粒子
  NEON_BREATHE: 'NEON_BREATHE',     // 霓虹呼吸
  DICE_SHADOW: 'DICE_SHADOW'        // 骰子阴影
};

// ==================== 动画配置 ====================

const ANIMATION_CONFIG = {
  [AnimationType.ROLL_DICE]: {
    frameCount: 12,           // 12帧旋转
    frameRate: 12,            // 12fps
    loop: false,
    spritesheet: 'dice_roll',
    audio: 'dice_roll_sound'
  },
  [AnimationType.CARD_FLIP]: {
    frameCount: 8,
    frameRate: 16,
    loop: false,
    spritesheet: 'card_flip',
    scaleEffect: true,
    glowEffect: true
  },
  [AnimationType.CARD_SHATTER]: {
    frameCount: 10,
    frameRate: 20,
    loop: false,
    spritesheet: 'card_shatter',
    particleEffect: true
  },
  [AnimationType.CRITICAL_HIT]: {
    frameCount: 6,
    frameRate: 8,
    loop: false,
    spritesheet: 'critical_hit',
    screenEffects: ['shake', 'slowMotion', 'flash']
  },
  [AnimationType.SCREEN_SHAKE]: {
    duration: 500,            // 毫秒
    intensity: 10,
    frequency: 30
  },
  [AnimationType.FLASH_WHITE]: {
    duration: 200,
    fadeIn: 50,
    fadeOut: 150
  },
  [AnimationType.EXPLOSION]: {
    frameCount: 8,
    frameRate: 16,
    loop: false,
    scale: 1.5
  },
  [AnimationType.PARTICLE_FLOAT]: {
    particleCount: 20,
    speed: { min: 0.5, max: 2 },
    size: { min: 2, max: 6 },
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'],
    loop: true
  },
  [AnimationType.NEON_BREATHE]: {
    duration: 2000,
    minOpacity: 0.3,
    maxOpacity: 1.0,
    loop: true
  },
  [AnimationType.DICE_SHADOW]: {
    duration: 1000,
    scaleRange: { min: 0.8, max: 1.2 },
    opacityRange: { min: 0.3, max: 0.6 },
    loop: true
  }
};

// ==================== 对象池 ====================

class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = new Set();
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire() {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createFn();
    }
    this.active.add(obj);
    return obj;
  }

  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    this.active.forEach(obj => {
      this.resetFn(obj);
      this.pool.push(obj);
    });
    this.active.clear();
  }

  getActiveCount() {
    return this.active.size;
  }

  getPoolSize() {
    return this.pool.length;
  }
}

// ==================== 动画管理器 ====================

class AnimationManager {
  constructor() {
    this.activeAnimations = new Map();
    this.pools = new Map();
    this.frameCount = 0;
    this.isRunning = false;
    
    // 初始化对象池
    this._initPools();
    
    // 开始动画循环
    this._startLoop();
  }

  static getInstance() {
    if (!AnimationManager._instance) {
      AnimationManager._instance = new AnimationManager();
    }
    return AnimationManager._instance;
  }

  // 初始化对象池
  _initPools() {
    // 粒子对象池
    this.pools.set('particle', new ObjectPool(
      () => ({
        id: Math.random().toString(36).substr(2, 9),
        x: 0, y: 0,
        vx: 0, vy: 0,
        size: 0,
        color: '#FFF',
        opacity: 1,
        life: 0,
        maxLife: 0,
        element: null
      }),
      (particle) => {
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.opacity = 1;
        particle.life = 0;
        if (particle.element) {
          particle.element.style.display = 'none';
        }
      },
      50
    ));

    // 动画片段对象池
    this.pools.set('animation', new ObjectPool(
      () => ({
        id: Math.random().toString(36).substr(2, 9),
        type: null,
        target: null,
        config: null,
        currentFrame: 0,
        isPlaying: false,
        startTime: 0,
        onComplete: null,
        onFrame: null
      }),
      (anim) => {
        anim.type = null;
        anim.target = null;
        anim.config = null;
        anim.currentFrame = 0;
        anim.isPlaying = false;
        anim.startTime = 0;
        anim.onComplete = null;
        anim.onFrame = null;
      },
      20
    ));
  }

  // 开始动画循环
  _startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    const loop = () => {
      if (!this.isRunning) return;
      
      this.frameCount++;
      this._updateAnimations();
      this._updateParticles();
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  // 停止动画循环
  stopLoop() {
    this.isRunning = false;
  }

  // 更新动画
  _updateAnimations() {
    const now = Date.now();
    
    this.activeAnimations.forEach((anim, id) => {
      if (!anim.isPlaying) return;
      
      const config = anim.config;
      const elapsed = now - anim.startTime;
      
      switch (anim.type) {
        case AnimationType.ROLL_DICE:
        case AnimationType.CARD_FLIP:
        case AnimationType.CARD_SHATTER:
        case AnimationType.CRITICAL_HIT:
        case AnimationType.EXPLOSION:
          this._updateFrameAnimation(anim, elapsed, config);
          break;
          
        case AnimationType.SCREEN_SHAKE:
          this._updateScreenShake(anim, elapsed, config);
          break;
          
        case AnimationType.FLASH_WHITE:
          this._updateFlashWhite(anim, elapsed, config);
          break;
          
        case AnimationType.NEON_BREATHE:
          this._updateNeonBreathe(anim, elapsed, config);
          break;
          
        case AnimationType.DICE_SHADOW:
          this._updateDiceShadow(anim, elapsed, config);
          break;
      }
    });
  }

  // 更新帧动画
  _updateFrameAnimation(anim, elapsed, config) {
    const frameDuration = 1000 / config.frameRate;
    const totalDuration = frameDuration * config.frameCount;
    
    // 计算当前帧
    const progress = Math.min(elapsed / totalDuration, 1);
    const frameIndex = Math.floor(progress * config.frameCount);
    
    // 更新帧
    if (frameIndex !== anim.currentFrame) {
      anim.currentFrame = frameIndex;
      
      // 调用帧回调
      if (anim.onFrame) {
        anim.onFrame(frameIndex, progress);
      }
      
      // 更新DOM显示
      this._updateFrameDisplay(anim, frameIndex);
    }
    
    // 检查是否完成
    if (progress >= 1) {
      if (config.loop) {
        anim.startTime = Date.now();
        anim.currentFrame = 0;
      } else {
        this._completeAnimation(anim);
      }
    }
  }

  // 更新帧显示
  _updateFrameDisplay(anim, frameIndex) {
    if (!anim.target) return;
    
    // 更新背景位置（假设使用spritesheet）
    const config = anim.config;
    const frameWidth = 100; // 假设每帧100px
    const offsetX = -(frameIndex * frameWidth);
    
    anim.target.style.backgroundPosition = `${offsetX}px 0`;
    
    // 缩放效果
    if (config.scaleEffect) {
      const scale = 1 + Math.sin(frameIndex / config.frameCount * Math.PI) * 0.1;
      anim.target.style.transform = `scale(${scale})`;
    }
    
    // 发光效果
    if (config.glowEffect && frameIndex > config.frameCount * 0.5) {
      const glowIntensity = (frameIndex - config.frameCount * 0.5) / (config.frameCount * 0.5);
      anim.target.style.boxShadow = `0 0 ${20 * glowIntensity}px rgba(255, 215, 0, ${glowIntensity})`;
    }
  }

  // 更新屏幕震动
  _updateScreenShake(anim, elapsed, config) {
    const progress = elapsed / config.duration;
    
    if (progress >= 1) {
      this._completeAnimation(anim);
      // 重置位置
      if (anim.target) {
        anim.target.style.transform = '';
      }
      return;
    }
    
    // 计算震动偏移
    const intensity = config.intensity * (1 - progress);
    const offsetX = (Math.random() - 0.5) * intensity * 2;
    const offsetY = (Math.random() - 0.5) * intensity * 2;
    
    if (anim.target) {
      anim.target.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
  }

  // 更新白色闪光
  _updateFlashWhite(anim, elapsed, config) {
    const progress = elapsed / config.duration;
    
    if (progress >= 1) {
      this._completeAnimation(anim);
      if (anim.target) {
        anim.target.style.opacity = '0';
      }
      return;
    }
    
    // 计算透明度
    let opacity = 1;
    if (elapsed < config.fadeIn) {
      opacity = elapsed / config.fadeIn;
    } else if (elapsed > config.duration - config.fadeOut) {
      opacity = (config.duration - elapsed) / config.fadeOut;
    }
    
    if (anim.target) {
      anim.target.style.opacity = opacity.toString();
    }
  }

  // 更新霓虹呼吸
  _updateNeonBreathe(anim, elapsed, config) {
    const progress = (elapsed % config.duration) / config.duration;
    const opacity = config.minOpacity + 
      (Math.sin(progress * Math.PI * 2) + 1) / 2 * (config.maxOpacity - config.minOpacity);
    
    if (anim.target) {
      anim.target.style.opacity = opacity.toString();
    }
  }

  // 更新骰子阴影
  _updateDiceShadow(anim, elapsed, config) {
    const progress = (elapsed % config.duration) / config.duration;
    const scale = config.scaleRange.min + 
      (Math.sin(progress * Math.PI * 2) + 1) / 2 * (config.scaleRange.max - config.scaleRange.min);
    const opacity = config.opacityRange.min + 
      (Math.sin(progress * Math.PI * 2) + 1) / 2 * (config.opacityRange.max - config.opacityRange.min);
    
    if (anim.target) {
      anim.target.style.transform = `scale(${scale})`;
      anim.target.style.opacity = opacity.toString();
    }
  }

  // 更新粒子
  _updateParticles() {
    const particlePool = this.pools.get('particle');
    if (!particlePool) return;
    
    particlePool.active.forEach(particle => {
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // 重力
      
      // 更新生命周期
      particle.life++;
      particle.opacity = 1 - (particle.life / particle.maxLife);
      
      // 更新DOM
      if (particle.element) {
        particle.element.style.left = `${particle.x}px`;
        particle.element.style.top = `${particle.y}px`;
        particle.element.style.opacity = particle.opacity.toString();
      }
      
      // 检查死亡
      if (particle.life >= particle.maxLife) {
        particlePool.release(particle);
      }
    });
  }

  // 完成动画
  _completeAnimation(anim) {
    anim.isPlaying = false;
    
    // 调用完成回调
    if (anim.onComplete) {
      anim.onComplete();
    }
    
    // 释放到对象池
    this.activeAnimations.delete(anim.id);
    const pool = this.pools.get('animation');
    if (pool) {
      pool.release(anim);
    }
  }

  // ==================== 公共API ====================

  /**
   * 播放Roll骰子动画
   * @param {HTMLElement} target - 目标元素
   * @param {number} finalValue - 最终Roll值
   * @param {Function} onComplete - 完成回调
   */
  playRollDice(target, finalValue, onComplete) {
    const config = { ...ANIMATION_CONFIG[AnimationType.ROLL_DICE] };
    
    // 根据Roll值调整动画
    if (finalValue >= 18) {
      // 极限Roll - 红色闪光
      config.glowColor = '#FF0000';
      config.flashIntensity = 1.0;
    } else if (finalValue >= 15) {
      // 高Roll - 金色发光
      config.glowColor = '#FFD700';
      config.flashIntensity = 0.7;
    }
    
    return this._playAnimation(AnimationType.ROLL_DICE, target, config, onComplete);
  }

  /**
   * 播放卡牌翻转动画
   * @param {HTMLElement} target - 目标元素
   * @param {Function} onComplete - 完成回调
   */
  playCardFlip(target, onComplete) {
    const config = ANIMATION_CONFIG[AnimationType.CARD_FLIP];
    return this._playAnimation(AnimationType.CARD_FLIP, target, config, onComplete);
  }

  /**
   * 播放卡牌破碎动画
   * @param {HTMLElement} target - 目标元素
   * @param {Function} onComplete - 完成回调
   */
  playCardShatter(target, onComplete) {
    const config = ANIMATION_CONFIG[AnimationType.CARD_SHATTER];
    
    // 创建破碎粒子
    this._createShatterParticles(target);
    
    return this._playAnimation(AnimationType.CARD_SHATTER, target, config, onComplete);
  }

  // 创建破碎粒子
  _createShatterParticles(target) {
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const particlePool = this.pools.get('particle');
    
    for (let i = 0; i < 20; i++) {
      const particle = particlePool.acquire();
      
      particle.x = centerX;
      particle.y = centerY;
      particle.vx = (Math.random() - 0.5) * 10;
      particle.vy = (Math.random() - 0.5) * 10 - 5;
      particle.size = Math.random() * 5 + 2;
      particle.color = '#888';
      particle.maxLife = 30 + Math.random() * 20;
      particle.life = 0;
      
      // 创建DOM元素
      if (!particle.element) {
        particle.element = document.createElement('div');
        particle.element.style.position = 'fixed';
        particle.element.style.borderRadius = '50%';
        particle.element.style.pointerEvents = 'none';
        particle.element.style.zIndex = '9999';
        document.body.appendChild(particle.element);
      }
      
      particle.element.style.display = 'block';
      particle.element.style.width = `${particle.size}px`;
      particle.element.style.height = `${particle.size}px`;
      particle.element.style.backgroundColor = particle.color;
      particle.element.style.left = `${particle.x}px`;
      particle.element.style.top = `${particle.y}px`;
    }
  }

  /**
   * 播放暴击演出
   * @param {HTMLElement} target - 目标元素
   * @param {HTMLElement} screenTarget - 屏幕元素（用于震动）
   * @param {Function} onComplete - 完成回调
   */
  playCriticalHit(target, screenTarget, onComplete) {
    // 播放暴击动画
    const config = ANIMATION_CONFIG[AnimationType.CRITICAL_HIT];
    const anim = this._playAnimation(AnimationType.CRITICAL_HIT, target, config);
    
    // 屏幕震动
    this.playScreenShake(screenTarget, 1000, 15);
    
    // 白色闪光
    this.playFlashWhite(screenTarget);
    
    // 慢动作效果
    this._applySlowMotion(200, 0.3);
    
    if (onComplete) {
      anim.onComplete = onComplete;
    }
    
    return anim;
  }

  /**
   * 播放屏幕震动
   * @param {HTMLElement} target - 目标元素
   * @param {number} duration - 持续时间
   * @param {number} intensity - 强度
   */
  playScreenShake(target, duration = 500, intensity = 10) {
    const config = { ...ANIMATION_CONFIG[AnimationType.SCREEN_SHAKE] };
    config.duration = duration;
    config.intensity = intensity;
    
    return this._playAnimation(AnimationType.SCREEN_SHAKE, target, config);
  }

  /**
   * 播放白色闪光
   * @param {HTMLElement} target - 目标元素
   */
  playFlashWhite(target) {
    const config = ANIMATION_CONFIG[AnimationType.FLASH_WHITE];
    
    // 创建闪光层
    let flashLayer = document.getElementById('flash-layer');
    if (!flashLayer) {
      flashLayer = document.createElement('div');
      flashLayer.id = 'flash-layer';
      flashLayer.style.position = 'fixed';
      flashLayer.style.top = '0';
      flashLayer.style.left = '0';
      flashLayer.style.width = '100%';
      flashLayer.style.height = '100%';
      flashLayer.style.backgroundColor = '#FFF';
      flashLayer.style.opacity = '0';
      flashLayer.style.pointerEvents = 'none';
      flashLayer.style.zIndex = '9998';
      document.body.appendChild(flashLayer);
    }
    
    return this._playAnimation(AnimationType.FLASH_WHITE, flashLayer, config, () => {
      flashLayer.style.opacity = '0';
    });
  }

  /**
   * 开始霓虹呼吸动画
   * @param {HTMLElement} target - 目标元素
   */
  startNeonBreathe(target) {
    const config = ANIMATION_CONFIG[AnimationType.NEON_BREATHE];
    return this._playAnimation(AnimationType.NEON_BREATHE, target, config);
  }

  /**
   * 开始骰子阴影动画
   * @param {HTMLElement} target - 目标元素
   */
  startDiceShadow(target) {
    const config = ANIMATION_CONFIG[AnimationType.DICE_SHADOW];
    return this._playAnimation(AnimationType.DICE_SHADOW, target, config);
  }

  // 播放动画基础方法
  _playAnimation(type, target, config, onComplete) {
    const pool = this.pools.get('animation');
    const anim = pool.acquire();
    
    anim.id = Math.random().toString(36).substr(2, 9);
    anim.type = type;
    anim.target = target;
    anim.config = config;
    anim.currentFrame = 0;
    anim.isPlaying = true;
    anim.startTime = Date.now();
    anim.onComplete = onComplete;
    
    this.activeAnimations.set(anim.id, anim);
    
    return anim;
  }

  // 应用慢动作
  _applySlowMotion(duration, timeScale) {
    // 在实际实现中，可以通过调整游戏时间缩放来实现
    console.log(`[Animation] 慢动作: ${duration}ms, 时间缩放: ${timeScale}`);
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations() {
    this.activeAnimations.forEach(anim => {
      anim.isPlaying = false;
    });
    this.activeAnimations.clear();
    
    // 释放所有粒子
    this.pools.get('particle')?.releaseAll();
  }

  /**
   * 获取性能统计
   */
  getStats() {
    return {
      activeAnimations: this.activeAnimations.size,
      activeParticles: this.pools.get('particle')?.getActiveCount() || 0,
      animationPoolSize: this.pools.get('animation')?.getPoolSize() || 0,
      particlePoolSize: this.pools.get('particle')?.getPoolSize() || 0,
      frameCount: this.frameCount
    };
  }
}

// ==================== 导出 ====================

module.exports = {
  AnimationType,
  ANIMATION_CONFIG,
  AnimationManager,
  ObjectPool
};
