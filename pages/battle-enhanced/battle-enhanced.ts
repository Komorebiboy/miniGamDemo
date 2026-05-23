/**
 * 增强版战斗页面
 * 
 * 新特性：
 * 1. Roll品质显示
 * 2. 爆点状态显示
 * 3. 防御姿态
 * 4. 增强动画效果
 */

import {
  Entity,
  EntityType,
  BattleEventType,
  getEnhancedBattleManager,
  AIType,
  ENHANCED_STARTING_DECK,
  getRollQualityName,
  getRollQualityColor,
  RollQuality,
  CardTag
} from '../../assets/scripts/index';

Page({
  data: {
    // 回合信息
    turnNumber: 1,
    phaseText: '选择阶段',

    // 玩家信息
    playerName: '勇者',
    playerHp: 80,
    playerMaxHp: 80,
    playerHpPercent: 100,
    playerEnergy: 3,
    playerMaxEnergy: 3,
    playerShield: 0,
    playerEffects: [],

    // 敌人信息
    enemyName: '哥布林',
    enemyHp: 60,
    enemyMaxHp: 60,
    enemyHpPercent: 100,
    enemyEnergy: 3,
    enemyMaxEnergy: 3,
    enemyShield: 0,
    enemyEffects: [],

    // 爆点状态
    playerBurst: { consecutiveWins: 0, isBurstMode: false, burstBonus: 0, rollMaxBonus: 0 },
    enemyBurst: { consecutiveWins: 0, isBurstMode: false, burstBonus: 0, rollMaxBonus: 0 },

    // 手牌
    handCards: [],

    // 选中的卡牌
    playerSelectedCard: null,
    enemySelectedCard: null,

    // 显示控制
    showPlayerCard: false,
    showEnemyCard: false,
    showRollAnimation: false,
    showFinalValues: false,
    showResult: false,

    // Roll点动画
    displayPlayerRoll: '?',
    displayEnemyRoll: '?',
    playerRollClass: '',
    enemyRollClass: '',

    // Roll点结果
    playerRoll: 0,
    enemyRoll: 0,

    // Roll品质
    playerRollQuality: null,
    enemyRollQuality: null,

    // 最终值
    playerFinalValue: 0,
    enemyFinalValue: 0,

    // 胜负
    winner: null,
    resultText: '',
    resultClass: '',
    damageDealt: 0,

    // 速度优先
    isSpeedPriority: false,

    // 反制触发
    counterTriggered: '',

    // 按钮状态
    canConfirm: false,
    hasConfirmed: false,
    isDefenseStance: false,

    // 战斗日志
    battleLog: [],
    lastLogId: '',

    // 战斗结束弹窗
    showBattleEndModal: false,
    battleEndTitle: '',
    battleEndText: '',

    // AI类型
    aiType: AIType.BERSERKER
  },

  // 实体引用
  player: null as Entity | null,
  enemy: null as Entity | null,

  // 动画定时器
  rollAnimationTimer: null as any,

  onLoad() {
    console.log('[BattleEnhanced] 增强版战斗页面加载');
    this.initBattle();
  },

  onUnload() {
    console.log('[BattleEnhanced] 增强版战斗页面卸载');
    if (this.rollAnimationTimer) {
      clearInterval(this.rollAnimationTimer);
    }
    getEnhancedBattleManager().reset();
  },

  // 初始化战斗
  initBattle() {
    const { Entity, EntityType, getEnhancedBattleManager } = require('../../assets/scripts/index.js');

    // 创建玩家实体
    this.player = new Entity({
      id: 'player_' + Date.now(),
      name: '勇者',
      type: EntityType.PLAYER,
      baseStats: {
        maxHealth: 80,
        currentHealth: 80,
        maxEnergy: 3,
        currentEnergy: 3,
        shield: 0
      },
      deck: ENHANCED_STARTING_DECK
    });

    // 创建敌人实体
    this.enemy = new Entity({
      id: 'enemy_' + Date.now(),
      name: '狂战士',
      type: EntityType.ENEMY,
      baseStats: {
        maxHealth: 60,
        currentHealth: 60,
        maxEnergy: 3,
        currentEnergy: 3,
        shield: 0
      },
      deck: ENHANCED_STARTING_DECK
    });

    // 注册事件监听
    this.registerBattleEvents();

    // 开始战斗
    getEnhancedBattleManager().startBattle({
      player: this.player,
      enemy: this.enemy,
      drawCountPerTurn: 5,
      maxTurns: 50,
      aiType: AIType.BERSERKER
    });

    // 更新UI
    this.updateUI();
    this.updateHandCards();
    this.addBattleLog('战斗开始！Roll点就是伤害！', 'normal');
  },

  // 注册战斗事件
  registerBattleEvents() {
    const { BattleEventType, getEnhancedBattleManager, EntityType } = require('../../assets/scripts/index.js');
    const battleManager = getEnhancedBattleManager();

    // 回合开始
    battleManager.addEventListener(BattleEventType.TURN_START, (event: any) => {
      this.setData({
        turnNumber: event.data.turnNumber,
        phaseText: '选择阶段',
        showPlayerCard: false,
        showEnemyCard: false,
        showRollAnimation: false,
        showFinalValues: false,
        showResult: false,
        hasConfirmed: false,
        canConfirm: false,
        playerSelectedCard: null,
        enemySelectedCard: null,
        winner: null,
        playerRollQuality: null,
        enemyRollQuality: null,
        counterTriggered: '',
        isSpeedPriority: false,
        playerBurst: event.data.playerBurst,
        enemyBurst: event.data.enemyBurst
      });

      this.addBattleLog(`--- 回合 ${event.data.turnNumber} ---`, 'normal');

      // 显示爆点状态
      if (event.data.playerBurst.isBurstMode) {
        this.addBattleLog('🔥 玩家爆点状态！Roll+2，上限+3', 'effect');
      }
      if (event.data.enemyBurst.isBurstMode) {
        this.addBattleLog('🔥 敌人爆点状态！Roll+2，上限+3', 'damage');
      }

      this.updateUI();
      this.updateHandCards();
    });

    // 卡牌揭示
    battleManager.addEventListener(BattleEventType.CARD_REVEALED, (event: any) => {
      const { playerCard, enemyCard } = event.data;

      this.setData({
        showPlayerCard: true,
        showEnemyCard: true,
        phaseText: '揭示阶段',
        playerSelectedCard: playerCard,
        enemySelectedCard: enemyCard
      });

      if (enemyCard) {
        this.addBattleLog(`怪物出牌: ${enemyCard.name} (Roll ${enemyCard.rollRange.min}-${enemyCard.rollRange.max})`, 'effect');
      } else {
        this.addBattleLog('怪物进入防御姿态！护盾+5', 'normal');
      }
    });

    // Roll开始
    battleManager.addEventListener(BattleEventType.ROLL_STARTED, (event: any) => {
      this.setData({
        showRollAnimation: true,
        phaseText: 'Roll点阶段'
      });

      // 开始Roll点动画
      this.startRollAnimation(
        event.data.playerRollRange,
        event.data.enemyRollRange,
        event.data.playerRoll,
        event.data.enemyRoll
      );
    });

    // Roll完成
    battleManager.addEventListener(BattleEventType.ROLL_COMPLETED, (event: any) => {
      if (this.rollAnimationTimer) {
        clearInterval(this.rollAnimationTimer);
      }

      const { playerRoll, enemyRoll, playerFinalValue, enemyFinalValue, playerQuality, enemyQuality } = event.data;

      // 确定Roll品质样式
      let playerRollClass = '';
      let enemyRollClass = '';

      if (playerQuality) {
        playerRollClass = `quality-${playerQuality.quality.toLowerCase()}`;
      }
      if (enemyQuality) {
        enemyRollClass = `quality-${enemyQuality.quality.toLowerCase()}`;
      }

      this.setData({
        displayPlayerRoll: playerRoll.toString(),
        displayEnemyRoll: enemyRoll.toString(),
        playerRoll,
        enemyRoll,
        playerFinalValue,
        enemyFinalValue,
        playerRollQuality: playerQuality,
        enemyRollQuality: enemyQuality,
        playerRollClass,
        enemyRollClass,
        showRollAnimation: false,
        showFinalValues: true,
        phaseText: '结算阶段'
      });

      // 显示Roll品质
      if (playerQuality) {
        this.addBattleLog(`玩家 Roll ${playerRoll} - ${playerQuality.name}!`, 'effect');
      } else {
        this.addBattleLog(`玩家 Roll: ${playerRoll}`, 'normal');
      }

      if (enemyQuality) {
        this.addBattleLog(`敌人 Roll ${enemyRoll} - ${enemyQuality.name}!`, 'damage');
      } else {
        this.addBattleLog(`敌人 Roll: ${enemyRoll}`, 'normal');
      }
    });

    // 伤害造成
    battleManager.addEventListener(BattleEventType.DAMAGE_DEALT, (event: any) => {
      const { source, target, damage, isBurst } = event.data;

      this.setData({
        showResult: true,
        damageDealt: damage
      });

      if (source === EntityType.PLAYER) {
        this.setData({
          winner: 'PLAYER',
          resultText: isBurst ? '爆点压制！' : '你赢了！',
          resultClass: isBurst ? 'burst' : 'win'
        });
        this.addBattleLog(isBurst ? `🔥 爆点！造成 ${damage} 点伤害！` : `玩家获胜，造成 ${damage} 点伤害`, 'effect');
      } else {
        this.setData({
          winner: 'ENEMY',
          resultText: isBurst ? '被爆点压制！' : '你输了！',
          resultClass: isBurst ? 'burst-lose' : 'lose'
        });
        this.addBattleLog(isBurst ? `🔥 敌人爆点！受到 ${damage} 点伤害！` : `敌人获胜，受到 ${damage} 点伤害`, 'damage');
      }

      this.updateUI();
    });

    // 效果应用
    battleManager.addEventListener(BattleEventType.EFFECT_APPLIED, (event: any) => {
      const { effect } = event.data;
      this.addBattleLog(`效果: ${effect.type}`, 'effect');
      this.updateEffects();
    });

    // 实体死亡
    battleManager.addEventListener(BattleEventType.ENTITY_DIED, (event: any) => {
      const { entity } = event.data;
      this.addBattleLog(`${entity.name} 被击败！`, 'damage');
    });

    // 战斗结束
    battleManager.addEventListener(BattleEventType.BATTLE_END, (event: any) => {
      const { winner, turns } = event.data;

      let title = '';
      let text = '';

      if (winner === EntityType.PLAYER) {
        title = '胜利！';
        text = '恭喜你击败了敌人！';
        const victories = wx.getStorageSync('victories') || 0;
        wx.setStorageSync('victories', victories + 1);
      } else {
        title = '失败...';
        text = '不要气馁，再试一次吧！';
        const defeats = wx.getStorageSync('defeats') || 0;
        wx.setStorageSync('defeats', defeats + 1);
      }

      this.setData({
        showBattleEndModal: true,
        battleEndTitle: title,
        battleEndText: text
      });
    });
  },

  // Roll点动画
  startRollAnimation(playerRange: any, enemyRange: any, finalPlayerRoll: number, finalEnemyRoll: number) {
    let count = 0;
    const maxCount = 30; // 增加动画帧数

    this.rollAnimationTimer = setInterval(() => {
      count++;

      // 随机显示数字
      const playerDisplay = Math.floor(Math.random() * (playerRange.max - playerRange.min + 1)) + playerRange.min;
      const enemyDisplay = Math.floor(Math.random() * (enemyRange.max - enemyRange.min + 1)) + enemyRange.min;

      this.setData({
        displayPlayerRoll: playerDisplay.toString(),
        displayEnemyRoll: enemyDisplay.toString()
      });

      // 最后几帧减速
      if (count >= maxCount - 5) {
        clearInterval(this.rollAnimationTimer);
        this.rollAnimationTimer = setInterval(() => {
          count++;
          const playerDisplay = Math.floor(Math.random() * (playerRange.max - playerRange.min + 1)) + playerRange.min;
          const enemyDisplay = Math.floor(Math.random() * (enemyRange.max - enemyRange.min + 1)) + enemyRange.min;

          this.setData({
            displayPlayerRoll: playerDisplay.toString(),
            displayEnemyRoll: enemyDisplay.toString()
          });

          if (count >= maxCount) {
            clearInterval(this.rollAnimationTimer);
          }
        }, 150);
      }
    }, 50);
  },

  // 更新UI
  updateUI() {
    if (!this.player || !this.enemy) return;

    const playerStatus = this.player.getStatus();
    const enemyStatus = this.enemy.getStatus();

    this.setData({
      playerHp: playerStatus.health,
      playerMaxHp: playerStatus.maxHealth,
      playerHpPercent: (playerStatus.health / playerStatus.maxHealth) * 100,
      playerEnergy: playerStatus.energy,
      playerMaxEnergy: playerStatus.maxEnergy,
      playerShield: playerStatus.shield,

      enemyHp: enemyStatus.health,
      enemyMaxHp: enemyStatus.maxHealth,
      enemyHpPercent: (enemyStatus.health / enemyStatus.maxHealth) * 100,
      enemyEnergy: enemyStatus.energy,
      enemyMaxEnergy: enemyStatus.maxEnergy,
      enemyShield: enemyStatus.shield
    });

    this.updateEffects();
  },

  // 更新效果显示
  updateEffects() {
    if (!this.player || !this.enemy) return;

    const { getEffectSystem } = require('../../assets/scripts/index.js');
    const playerEffects = getEffectSystem().getEntityEffects(this.player.id);
    const enemyEffects = getEffectSystem().getEntityEffects(this.enemy.id);

    this.setData({
      playerEffects: playerEffects.map((e: any) => e.type),
      enemyEffects: enemyEffects.map((e: any) => e.type)
    });
  },

  // 更新手牌
  updateHandCards() {
    if (!this.player) return;

    const { getCardSystem, CardType } = require('../../assets/scripts/index.js');
    const hand = getCardSystem().getHand(this.player.id);
    const currentEnergy = this.player.currentEnergy;

    const cards = hand.map((card: any) => {
      const typeIcons: Record<string, string> = {
        [CardType.ATTACK]: '⚔️',
        [CardType.DEFENSE]: '🛡️',
        [CardType.SKILL]: '✨',
        [CardType.POWER]: '💪'
      };

      // 获取卡牌标签显示
      const tagLabels: Record<string, string> = {
        'STABLE': '稳定',
        'GAMBLE': '赌博',
        'COUNTER': '反制',
        'SPEED': '极速',
        'HEAVY': '重型',
        'COMBO': '连击',
        'BURST': '爆发',
        'CONTROL': '控制'
      };

      const tags = card.tags?.map((tag: string) => tagLabels[tag] || tag) || [];

      return {
        ...card,
        typeIcon: typeIcons[card.type] || '🃏',
        disabled: card.energyCost > currentEnergy,
        selected: this.data.playerSelectedCard?.instanceId === card.instanceId,
        rollRangeText: `${card.rollRange.min}-${card.rollRange.max}`,
        tags: tags,
        isStable: card.tags?.includes('STABLE'),
        isGamble: card.tags?.includes('GAMBLE')
      };
    });

    this.setData({
      handCards: cards
    });
  },

  // 卡牌点击
  onCardTap(e: any) {
    if (this.data.hasConfirmed) return;

    const { getEnhancedBattleManager } = require('../../assets/scripts/index.js');
    const card = e.currentTarget.dataset.card;
    if (card.disabled) {
      wx.showToast({
        title: '能量不足',
        icon: 'none'
      });
      return;
    }

    const success = getEnhancedBattleManager().playerSelectCard(card.instanceId);

    if (success) {
      this.setData({
        playerSelectedCard: card,
        canConfirm: true
      });
      this.updateHandCards();
    }
  },

  // 确认出牌
  onConfirmTap() {
    if (!this.data.canConfirm || this.data.hasConfirmed) return;

    const { getEnhancedBattleManager } = require('../../assets/scripts/index.js');
    getEnhancedBattleManager().playerConfirmCard();

    this.setData({
      hasConfirmed: true,
      canConfirm: false
    });

    this.addBattleLog('等待敌人...', 'normal');
  },

  // 进入防御姿态（不出牌）
  onDefenseTap() {
    if (this.data.hasConfirmed) return;

    const { getEnhancedBattleManager } = require('../../assets/scripts/index.js');
    getEnhancedBattleManager().playerSkipCard();

    this.setData({
      hasConfirmed: true,
      canConfirm: false,
      playerSelectedCard: null,
      isDefenseStance: true
    });

    this.addBattleLog('进入防御姿态！护盾+5，下回合Roll+3', 'effect');
  },

  // 添加战斗日志
  addBattleLog(text: string, type: string = 'normal') {
    const logId = 'log_' + Date.now();
    const time = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newLog = {
      id: logId,
      time,
      text,
      type
    };

    const logs = this.data.battleLog.slice(-19);
    logs.push(newLog);

    this.setData({
      battleLog: logs,
      lastLogId: logId
    });
  },

  // 返回主菜单
  onReturnToMenu() {
    wx.navigateBack();
  },

  // 重新开始
  onRestartBattle() {
    this.setData({
      showBattleEndModal: false,
      battleLog: []
    });

    if (this.player) {
      this.player.destroy();
    }
    if (this.enemy) {
      this.enemy.destroy();
    }

    const { getEnhancedBattleManager } = require('../../assets/scripts/index.js');
    getEnhancedBattleManager().reset();

    this.initBattle();
  }
});
