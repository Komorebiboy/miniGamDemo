/**
 * 战斗动画控制器 - 整合动画系统到战斗流程
 * 
 * 核心功能：
 * - Roll动画播放
 * - 卡牌翻转动画
 * - 卡牌破碎效果
 * - 暴击演出
 * - 动态背景
 */

const { AnimationManager, AnimationType } = require('./AnimationSystem.js');

class BattleAnimationController {
  constructor(battlePage) {
    this.battlePage = battlePage;
    this.animManager = AnimationManager.getInstance();
    this.isAnimating = false;
    
    // 初始化动态背景
    this._initDynamicBackground();
  }

  // ==================== 初始化 ====================

  _initDynamicBackground() {
    // 启动霓虹呼吸动画
    const neonElements = document.querySelectorAll('.neon-effect');
    neonElements.forEach(el => {
      this.animManager.startNeonBreathe(el);
    });

    // 启动骰子阴影动画
    const diceShadows = document.querySelectorAll('.dice-shadow');
    diceShadows.forEach(el => {
      this.animManager.startDiceShadow(el);
    });

    // 启动漂浮粒子
    this._startFloatingParticles();
  }

  _startFloatingParticles() {
    // 创建漂浮粒子容器
    const container = document.querySelector('.battle-container') || document.body;
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: ${['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'][Math.floor(Math.random() * 4)]};
        border-radius: 50%;
        opacity: ${Math.random() * 0.5 + 0.2};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        pointer-events: none;
        animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
      `;
      container.appendChild(particle);
    }
  }

  // ==================== Roll动画 ====================

  /**
   * 播放Roll骰子动画序列
   * @param {Object} playerRollData - 玩家Roll数据 { value, element }
   * @param {Object} enemyRollData - 敌方Roll数据 { value, element }
   * @param {Function} onComplete - 完成回调
   */
  async playRollSequence(playerRollData, enemyRollData, onComplete) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const battleContainer = document.querySelector('.battle-container');

    // 1. 准备阶段 - 缩放效果
    await this._playPreRollAnimation(playerRollData.element, enemyRollData.element);

    // 2. 同时播放双方Roll动画
    const playerAnim = this.animManager.playRollDice(
      playerRollData.element,
      playerRollData.value
    );

    const enemyAnim = this.animManager.playRollDice(
      enemyRollData.element,
      enemyRollData.value
    );

    // 3. 等待动画完成
    await Promise.all([
      this._waitForAnimation(playerAnim),
      this._waitForAnimation(enemyAnim)
    ]);

    // 4. 显示最终结果
    this._showRollResult(playerRollData, enemyRollData);

    // 5. 判断是否需要暴击演出
    const maxRoll = Math.max(playerRollData.value, enemyRollData.value);
    if (maxRoll >= 15) {
      await this._playCriticalEffect(maxRoll, battleContainer);
    }

    this.isAnimating = false;

    if (onComplete) {
      onComplete();
    }
  }

  // Roll前准备动画
  _playPreRollAnimation(playerElement, enemyElement) {
    return new Promise(resolve => {
      // 缩放效果
      playerElement.style.transition = 'transform 0.3s ease';
      enemyElement.style.transition = 'transform 0.3s ease';
      
      playerElement.style.transform = 'scale(1.2)';
      enemyElement.style.transform = 'scale(1.2)';

      setTimeout(() => {
        resolve();
      }, 300);
    });
  }

  // 显示Roll结果
  _showRollResult(playerData, enemyData) {
    // 更新显示
    playerData.element.textContent = playerData.value;
    enemyData.element.textContent = enemyData.value;

    // 高Roll发光效果
    if (playerData.value >= 15) {
      playerData.element.classList.add('high-roll-glow');
      if (playerData.value >= 18) {
        playerData.element.classList.add('extreme-roll-red');
      }
    }

    if (enemyData.value >= 15) {
      enemyData.element.classList.add('high-roll-glow');
      if (enemyData.value >= 18) {
        enemyData.element.classList.add('extreme-roll-red');
      }
    }
  }

  // 暴击效果
  async _playCriticalEffect(rollValue, screenTarget) {
    // 创建暴击文字
    const criticalText = document.createElement('div');
    criticalText.className = 'critical-text';
    criticalText.textContent = rollValue >= 18 ? '极限!!!' : '暴击!!';
    criticalText.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 72px;
      font-weight: bold;
      color: ${rollValue >= 18 ? '#FF0000' : '#FFD700'};
      text-shadow: 0 0 30px ${rollValue >= 18 ? '#FF0000' : '#FFD700'};
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
    `;
    document.body.appendChild(criticalText);

    // 播放暴击动画
    await new Promise(resolve => {
      this.animManager.playCriticalHit(criticalText, screenTarget, () => {
        // 动画完成后移除元素
        setTimeout(() => {
          criticalText.remove();
          resolve();
        }, 500);
      });
    });
  }

  // ==================== 卡牌动画 ====================

  /**
   * 播放卡牌翻转动画（同时揭示）
   * @param {HTMLElement} playerCard - 玩家卡牌元素
   * @param {HTMLElement} enemyCard - 敌方卡牌元素
   * @param {Function} onComplete - 完成回调
   */
  async playCardReveal(playerCard, enemyCard, onComplete) {
    // 同时翻转两张卡牌
    const playerAnim = this.animManager.playCardFlip(playerCard);
    const enemyAnim = this.animManager.playCardFlip(enemyCard);

    // 添加发光效果
    playerCard.classList.add('card-reveal-glow');
    enemyCard.classList.add('card-reveal-glow');

    await Promise.all([
      this._waitForAnimation(playerAnim),
      this._waitForAnimation(enemyAnim)
    ]);

    // 移除发光
    playerCard.classList.remove('card-reveal-glow');
    enemyCard.classList.remove('card-reveal-glow');

    if (onComplete) {
      onComplete();
    }
  }

  /**
   * 播放卡牌破碎动画（被压制时）
   * @param {HTMLElement} cardElement - 卡牌元素
   * @param {boolean} isPlayer - 是否是玩家卡牌
   * @param {Function} onComplete - 完成回调
   */
  async playCardShatter(cardElement, isPlayer, onComplete) {
    // 添加破碎前效果
    cardElement.classList.add('card-cracking');

    // 等待裂纹动画
    await this._delay(300);

    // 播放破碎动画
    await new Promise(resolve => {
      this.animManager.playCardShatter(cardElement, () => {
        resolve();
      });
    });

    // 隐藏原卡牌
    cardElement.style.opacity = '0.3';
    cardElement.classList.add('card-shattered');

    if (onComplete) {
      onComplete();
    }
  }

  /**
   * 播放胜利卡牌动画
   * @param {HTMLElement} cardElement - 卡牌元素
   */
  playCardVictory(cardElement) {
    // 胜利缩放效果
    cardElement.style.transition = 'all 0.5s ease';
    cardElement.style.transform = 'scale(1.1)';
    cardElement.classList.add('card-victory-glow');

    // 创建胜利光环
    const halo = document.createElement('div');
    halo.className = 'victory-halo';
    halo.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 150%;
      height: 150%;
      transform: translate(-50%, -50%);
      border: 3px solid #FFD700;
      border-radius: 50%;
      opacity: 0;
      animation: halo-expand 0.8s ease-out forwards;
      pointer-events: none;
    `;
    cardElement.appendChild(halo);

    // 清理
    setTimeout(() => {
      halo.remove();
      cardElement.style.transform = '';
      cardElement.classList.remove('card-victory-glow');
    }, 1500);
  }

  // ==================== 伤害动画 ====================

  /**
   * 播放伤害数字动画
   * @param {HTMLElement} target - 目标元素
   * @param {number} damage - 伤害值
   * @param {boolean} isCritical - 是否暴击
   */
  playDamageNumber(target, damage, isCritical = false) {
    const damageText = document.createElement('div');
    damageText.className = 'damage-number';
    damageText.textContent = damage;
    damageText.style.cssText = `
      position: absolute;
      font-size: ${isCritical ? '48px' : '36px'};
      font-weight: bold;
      color: ${isCritical ? '#FF0000' : '#FF6B6B'};
      text-shadow: 0 0 10px ${isCritical ? '#FF0000' : '#FF6B6B'};
      pointer-events: none;
      z-index: 9999;
      animation: damage-float 1s ease-out forwards;
    `;

    // 定位到目标上方
    const rect = target.getBoundingClientRect();
    damageText.style.left = `${rect.left + rect.width / 2}px`;
    damageText.style.top = `${rect.top}px`;

    document.body.appendChild(damageText);

    // 清理
    setTimeout(() => {
      damageText.remove();
    }, 1000);
  }

  /**
   * 播放受击动画
   * @param {HTMLElement} target - 目标元素
   */
  playHitAnimation(target) {
    // 红色闪烁
    target.style.animation = 'none';
    target.offsetHeight; // 触发重排
    target.style.animation = 'hit-flash 0.3s ease';

    // 屏幕震动
    const battleContainer = document.querySelector('.battle-container');
    this.animManager.playScreenShake(battleContainer, 300, 8);
  }

  // ==================== 特效动画 ====================

  /**
   * 播放爆炸特效
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} color - 颜色
   */
  playExplosion(x, y, color = '#FFD700') {
    const explosion = document.createElement('div');
    explosion.className = 'explosion-effect';
    explosion.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 100px;
      height: 100px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9998;
    `;

    // 创建多层爆炸效果
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        border: 3px solid ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: explosion-ring 0.6s ease-out forwards;
        animation-delay: ${i * 0.1}s;
      `;
      explosion.appendChild(ring);
    }

    document.body.appendChild(explosion);

    setTimeout(() => {
      explosion.remove();
    }, 800);
  }

  /**
   * 播放连击动画
   * @param {number} combo - 连击数
   */
  playComboAnimation(combo) {
    const comboText = document.createElement('div');
    comboText.className = 'combo-text';
    comboText.textContent = `${combo} 连击!`;
    comboText.style.cssText = `
      position: fixed;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-size: 36px;
      font-weight: bold;
      color: #FFD700;
      text-shadow: 0 0 20px #FFD700;
      z-index: 10000;
      pointer-events: none;
      animation: combo-pop 0.5s ease-out forwards;
    `;

    document.body.appendChild(comboText);

    setTimeout(() => {
      comboText.style.animation = 'combo-fade 0.3s ease-out forwards';
      setTimeout(() => {
        comboText.remove();
      }, 300);
    }, 1000);
  }

  // ==================== 工具方法 ====================

  _waitForAnimation(anim) {
    return new Promise(resolve => {
      const originalOnComplete = anim.onComplete;
      anim.onComplete = () => {
        if (originalOnComplete) {
          originalOnComplete();
        }
        resolve();
      };
    });
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== 清理 ====================

  destroy() {
    this.animManager.stopAllAnimations();
    
    // 清理动态背景
    const particles = document.querySelectorAll('.floating-particle');
    particles.forEach(p => p.remove());
  }
}

// ==================== CSS动画样式 ====================

const BATTLE_ANIMATION_STYLES = `
/* 漂浮粒子动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0.3;
  }
  25% {
    transform: translateY(-20px) translateX(10px);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-10px) translateX(-10px);
    opacity: 0.4;
  }
  75% {
    transform: translateY(-30px) translateX(5px);
    opacity: 0.5;
  }
}

/* 高Roll发光 */
.high-roll-glow {
  animation: gold-glow 0.5s ease-in-out infinite alternate;
}

@keyframes gold-glow {
  from {
    text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700;
  }
  to {
    text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700, 0 0 60px #FFD700;
  }
}

/* 极限Roll红色闪光 */
.extreme-roll-red {
  animation: red-flash 0.3s ease-in-out infinite alternate;
  color: #FF0000 !important;
}

@keyframes red-flash {
  from {
    text-shadow: 0 0 10px #FF0000, 0 0 20px #FF0000;
  }
  to {
    text-shadow: 0 0 30px #FF0000, 0 0 60px #FF0000, 0 0 90px #FF0000;
  }
}

/* 卡牌揭示发光 */
.card-reveal-glow {
  animation: reveal-glow 0.8s ease-out;
}

@keyframes reveal-glow {
  0% {
    box-shadow: 0 0 0 rgba(255, 215, 0, 0);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }
}

/* 卡牌裂纹效果 */
.card-cracking {
  position: relative;
}

.card-cracking::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(45deg, transparent 48%, #000 49%, #000 51%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, #000 49%, #000 51%, transparent 52%);
  background-size: 20px 20px;
  opacity: 0;
  animation: crack-appear 0.3s ease-out forwards;
  pointer-events: none;
}

@keyframes crack-appear {
  to {
    opacity: 0.6;
  }
}

/* 卡牌破碎状态 */
.card-shattered {
  filter: grayscale(100%) brightness(0.5);
  transform: scale(0.95);
}

/* 胜利光环 */
@keyframes halo-expand {
  0% {
    width: 100%;
    height: 100%;
    opacity: 1;
  }
  100% {
    width: 200%;
    height: 200%;
    opacity: 0;
  }
}

/* 伤害数字浮动 */
@keyframes damage-float {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateY(-30px) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translateY(-60px) scale(0.8);
    opacity: 0;
  }
}

/* 受击闪烁 */
@keyframes hit-flash {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(2) sepia(1) hue-rotate(-50deg) saturate(5);
  }
}

/* 爆炸环 */
@keyframes explosion-ring {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
  }
  100% {
    width: 100px;
    height: 100px;
    opacity: 0;
  }
}

/* 连击弹出 */
@keyframes combo-pop {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(-10deg);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2) rotate(5deg);
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
}

@keyframes combo-fade {
  to {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* 霓虹呼吸 */
.neon-breathe {
  animation: neon-pulse 2s ease-in-out infinite;
}

@keyframes neon-pulse {
  0%, 100% {
    opacity: 0.3;
    filter: brightness(0.8);
  }
  50% {
    opacity: 1;
    filter: brightness(1.2);
  }
}

/* 骰子阴影 */
.dice-shadow-anim {
  animation: shadow-pulse 1s ease-in-out infinite;
}

@keyframes shadow-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
}
`;

// 注入样式
function injectBattleStyles() {
  if (!document.getElementById('battle-animation-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'battle-animation-styles';
    styleSheet.textContent = BATTLE_ANIMATION_STYLES;
    document.head.appendChild(styleSheet);
  }
}

// ==================== 导出 ====================

module.exports = {
  BattleAnimationController,
  injectBattleStyles,
  BATTLE_ANIMATION_STYLES
};
