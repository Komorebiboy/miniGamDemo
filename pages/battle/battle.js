// 战斗页面逻辑
// 引入游戏模块
const gameModule = require('../../assets/scripts/index.js');

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
    
    // 最终值
    playerFinalValue: 0,
    enemyFinalValue: 0,
    playerBaseValue: 0,
    enemyBaseValue: 0,
    playerBuffBonus: 0,
    enemyBuffBonus: 0,
    playerSpeedBonus: 0,
    enemySpeedBonus: 0,
    
    // 暴击和闪避
    playerIsCrit: false,
    enemyIsCrit: false,
    playerIsDodge: false,
    enemyIsDodge: false,
    
    // 胜负
    winner: null,
    resultText: '',
    resultClass: '',
    damageDealt: 0,
    
    // 按钮状态
    canConfirm: false,
    hasConfirmed: false,
    
    // 战斗日志
    battleLog: [],
    lastLogId: '',
    
    // 战斗结束弹窗
    showBattleEndModal: false,
    battleEndTitle: '',
    battleEndText: ''
  },

  // 实体引用
  player: null,
  enemy: null,
  
  // 动画定时器
  rollAnimationTimer: null,

  onLoad() {
    console.log('[Battle] 战斗页面加载');
    this.initBattle();
  },

  onUnload() {
    console.log('[Battle] 战斗页面卸载');
    // 清理定时器
    if (this.rollAnimationTimer) {
      clearInterval(this.rollAnimationTimer);
    }
    // 重置战斗管理器
    gameModule.getBattleManager().reset();
  },

  // 初始化战斗
  initBattle() {
    const { Entity, EntityType, getStartingDeck, getEnemyDeck, getBattleManager, getCardSystem, getEffectSystem, BattleEventType, CardType } = gameModule;

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
      deck: getStartingDeck()
    });

    // 创建敌人实体
    this.enemy = new Entity({
      id: 'enemy_' + Date.now(),
      name: '哥布林',
      type: EntityType.ENEMY,
      baseStats: {
        maxHealth: 60,
        currentHealth: 60,
        maxEnergy: 3,
        currentEnergy: 3,
        shield: 0
      },
      deck: getEnemyDeck()
    });

    // 注册事件监听
    this.registerBattleEvents();

    // 开始战斗
    getBattleManager().startBattle({
      player: this.player,
      enemy: this.enemy,
      drawCountPerTurn: 5,
      maxTurns: 50
    });

    // 更新UI
    this.updateUI();
    this.updateHandCards();
    this.addBattleLog('战斗开始！', 'normal');
  },

  // 注册战斗事件
  registerBattleEvents() {
    const { EntityType, BattleEventType, getEffectSystem, getBattleManager } = gameModule;
    const battleManager = getBattleManager();

    // 回合开始
    battleManager.addEventListener(BattleEventType.TURN_START, (event) => {
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
        winner: null
      });
      
      this.addBattleLog(`--- 回合 ${event.data.turnNumber} ---`, 'normal');
      this.updateUI();
      this.updateHandCards();
    });

    // 卡牌揭示
    battleManager.addEventListener(BattleEventType.CARD_REVEALED, (event) => {
      this.setData({
        showPlayerCard: true,
        showEnemyCard: true,
        phaseText: '揭示阶段'
      });
    });

    // Roll开始
    battleManager.addEventListener(BattleEventType.ROLL_STARTED, (event) => {
      this.setData({
        showRollAnimation: true,
        phaseText: 'Roll点阶段'
      });
      
      // 开始Roll点动画
      this.startRollAnimation(event.data.playerRollRange, event.data.enemyRollRange);
    });

    // Roll完成
    battleManager.addEventListener(BattleEventType.ROLL_COMPLETED, (event) => {
      // 停止动画
      if (this.rollAnimationTimer) {
        clearInterval(this.rollAnimationTimer);
      }

      const { playerRoll, enemyRoll, playerResult, enemyResult } = event.data;

      this.setData({
        displayPlayerRoll: playerRoll.toString(),
        displayEnemyRoll: enemyRoll.toString(),
        playerRoll,
        enemyRoll,
        playerFinalValue: playerResult.finalValue,
        enemyFinalValue: enemyResult.finalValue,
        playerBaseValue: playerResult.baseValue,
        enemyBaseValue: enemyResult.baseValue,
        playerBuffBonus: playerResult.buffBonus,
        enemyBuffBonus: enemyResult.buffBonus,
        playerSpeedBonus: playerResult.speedBonus,
        enemySpeedBonus: enemyResult.speedBonus,
        playerIsCrit: playerResult.isCrit,
        enemyIsCrit: enemyResult.isCrit,
        playerRollClass: playerResult.isCrit ? 'crit' : (playerRoll <= 5 ? 'dodge' : ''),
        enemyRollClass: enemyResult.isCrit ? 'crit' : (enemyRoll <= 5 ? 'dodge' : ''),
        showRollAnimation: false,
        showFinalValues: true,
        phaseText: '结算阶段'
      });

      this.addBattleLog(`玩家 Roll: ${playerRoll} (最终值: ${playerResult.finalValue})`, 'normal');
      this.addBattleLog(`敌人 Roll: ${enemyRoll} (最终值: ${enemyResult.finalValue})`, 'normal');

      if (playerResult.isCrit) {
        this.addBattleLog('玩家触发暴击！', 'effect');
      }
      if (enemyResult.isCrit) {
        this.addBattleLog('敌人触发暴击！', 'effect');
      }
    });

    // 伤害造成
    battleManager.addEventListener(BattleEventType.DAMAGE_DEALT, (event) => {
      const { source, target, damage, isCrit } = event.data;
      
      this.setData({
        showResult: true,
        damageDealt: damage
      });

      if (source === EntityType.PLAYER) {
        this.setData({
          winner: 'PLAYER',
          resultText: '你赢了！',
          resultClass: 'win'
        });
        this.addBattleLog(`玩家获胜，造成 ${damage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'damage');
      } else {
        this.setData({
          winner: 'ENEMY',
          resultText: '你输了！',
          resultClass: 'lose'
        });
        this.addBattleLog(`敌人获胜，造成 ${damage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'damage');
      }

      this.updateUI();
    });

    // 效果应用
    battleManager.addEventListener(BattleEventType.EFFECT_APPLIED, (event) => {
      const { effect } = event.data;
      this.addBattleLog(`效果: ${effect.type}`, 'effect');
      this.updateEffects();
    });

    // 实体死亡
    battleManager.addEventListener(BattleEventType.ENTITY_DIED, (event) => {
      const { entity } = event.data;
      this.addBattleLog(`${entity.name} 被击败！`, 'damage');
    });

    // 战斗结束
    battleManager.addEventListener(BattleEventType.BATTLE_END, (event) => {
      const { winner, turns } = event.data;
      
      let title = '';
      let text = '';
      
      if (winner === EntityType.PLAYER) {
        title = '胜利！';
        text = '恭喜你击败了敌人！';
        // 保存胜利记录
        const victories = wx.getStorageSync('victories') || 0;
        wx.setStorageSync('victories', victories + 1);
      } else {
        title = '失败...';
        text = '不要气馁，再试一次吧！';
        // 保存失败记录
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
  startRollAnimation(playerRange, enemyRange) {
    let count = 0;
    const maxCount = 20; // 动画帧数
    
    this.rollAnimationTimer = setInterval(() => {
      count++;
      
      // 随机显示数字
      const playerDisplay = Math.floor(Math.random() * (playerRange.max - playerRange.min + 1)) + playerRange.min;
      const enemyDisplay = Math.floor(Math.random() * (enemyRange.max - enemyRange.min + 1)) + enemyRange.min;
      
      this.setData({
        displayPlayerRoll: playerDisplay.toString(),
        displayEnemyRoll: enemyDisplay.toString()
      });
      
      if (count >= maxCount) {
        clearInterval(this.rollAnimationTimer);
      }
    }, 80); // 每80ms更新一次
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

    const { getEffectSystem } = gameModule;
    const playerEffects = getEffectSystem().getEntityEffects(this.player.id);
    const enemyEffects = getEffectSystem().getEntityEffects(this.enemy.id);

    this.setData({
      playerEffects: playerEffects.map(e => e.type),
      enemyEffects: enemyEffects.map(e => e.type)
    });
  },

  // 更新手牌
  updateHandCards() {
    if (!this.player) return;

    const { getCardSystem, CardType } = gameModule;
    const hand = getCardSystem().getHand(this.player.id);
    const currentEnergy = this.player.currentEnergy;

    const cards = hand.map(card => {
      const typeIcons = {
        [CardType.ATTACK]: '⚔️',
        [CardType.DEFENSE]: '🛡️',
        [CardType.SKILL]: '✨',
        [CardType.POWER]: '💪'
      };

      return {
        ...card,
        typeIcon: typeIcons[card.type] || '🃏',
        disabled: card.energyCost > currentEnergy,
        selected: this.data.playerSelectedCard?.instanceId === card.instanceId
      };
    });

    this.setData({
      handCards: cards
    });
  },

  // 卡牌点击
  onCardTap(e) {
    if (this.data.hasConfirmed) return;

    const { getBattleManager } = gameModule;
    const card = e.currentTarget.dataset.card;
    if (card.disabled) {
      wx.showToast({
        title: '能量不足',
        icon: 'none'
      });
      return;
    }

    // 选择卡牌
    const success = getBattleManager().playerSelectCard(card.instanceId);
    
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

    const { getBattleManager } = gameModule;
    getBattleManager().playerConfirmCard();
    
    this.setData({
      hasConfirmed: true,
      canConfirm: false
    });

    this.addBattleLog('等待敌人出牌...', 'normal');
  },

  // 跳过回合
  onSkipTap() {
    if (this.data.hasConfirmed) return;

    const { getBattleManager } = gameModule;
    getBattleManager().playerSkipCard();
    
    this.setData({
      hasConfirmed: true,
      canConfirm: false,
      playerSelectedCard: null
    });

    this.addBattleLog('你跳过了出牌', 'normal');
  },

  // 添加战斗日志
  addBattleLog(text, type = 'normal') {
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

    const logs = this.data.battleLog.slice(-19); // 保留最近19条
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
    
    // 清理旧实体
    if (this.player) {
      this.player.destroy();
    }
    if (this.enemy) {
      this.enemy.destroy();
    }
    
    // 重置管理器
    gameModule.getBattleManager().reset();
    
    // 重新初始化
    this.initBattle();
  }
});
