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
    playerShield: 0,
    playerEffects: [],
    playerEnergy: 3,
    playerClassText: '赌徒',
    playerIcon: '🎲',

    // 敌人信息
    enemyName: '哥布林',
    enemyHp: 60,
    enemyMaxHp: 60,
    enemyHpPercent: 100,
    enemyShield: 0,
    enemyEffects: [],
    enemyIcon: '👹',
    isBoss: false,
    deckRemaining: 0,
    
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
    battleEndText: '',

    // 屏幕特效
    screenShake: false,
    flashWhite: false,
    showShockwave: false,
    showParticles: false,
    tensionPulse: false,
    showLightning: false,
    playerWins: false,
    rollAnimating: false,
    battleActive: false,  // 比拼阶段激活状态

    // 卡牌详情弹窗
    showCardDetailModal: false,
    selectedCardForDetail: null,
    cardDetailOwner: 'player',

    // 剩余牌数
    playerCardsRemaining: { deck: 0, discard: 0, hand: 0, total: 0 },
    enemyCardsRemaining: { deck: 0, discard: 0, hand: 0, total: 0 }
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
    const { Entity, EntityType, getStartingDeck, getEnemyDeck, getBattleManager, getCardSystem, getEffectSystem, BattleEventType, CardType, getClassConfig } = gameModule;

    // 从本地存储获取选择的职业
    const selectedClass = wx.getStorageSync('selectedClass') || 'GAMBLER';
    const classConfig = getClassConfig(selectedClass);
    
    console.log('[Battle] 选择的职业:', selectedClass, classConfig);

    // 获取职业牌组
    const playerDeck = getStartingDeck(selectedClass);
    console.log('[Battle] 玩家牌组:', playerDeck.length, '张牌', playerDeck.map(c => c.name));

    // 创建玩家实体
    this.player = new Entity({
      id: 'player_' + Date.now(),
      name: classConfig.name,
      type: EntityType.PLAYER,
      baseStats: {
        maxHealth: classConfig.startingHp,
        currentHealth: classConfig.startingHp,
        shield: 0
      },
      deck: playerDeck
    });

    // 获取敌人配置
    const enemyConfig = gameModule.getEnemyConfig('JOKER_GAMBLER');
    
    // 创建敌人实体
    this.enemy = new Entity({
      id: 'enemy_' + Date.now(),
      name: enemyConfig.name,
      type: EntityType.ENEMY,
      baseStats: {
        maxHealth: enemyConfig.maxHp,
        currentHealth: enemyConfig.maxHp,
        shield: 0
      },
      deck: getEnemyDeck()
    });

    // 设置UI数据
    this.setData({
      playerName: classConfig.name,
      playerClassText: this.getClassText(selectedClass),
      playerIcon: this.getClassIcon(selectedClass),
      enemyName: enemyConfig.name,
      enemyIcon: this.getEnemyIcon(enemyConfig.type),
      isBoss: enemyConfig.isBoss || false,
      deckRemaining: playerDeck.length
    });

    // 注册事件监听
    this.registerBattleEvents();

    // 开始战斗 - 初始抽10张牌（与牌库大小一致）
    getBattleManager().startBattle({
      player: this.player,
      enemy: this.enemy,
      drawCountPerTurn: 10,
      maxTurns: 50
    });

    // 更新UI
    this.updateUI();
    this.updateHandCards();
    this.addBattleLog('战斗开始！', 'normal');
  },

  // 获取职业文本
  getClassText(classType) {
    const classTexts = {
      'GAMBLER': '赌徒',
      'MAGICIAN': '魔术师',
      'EXECUTIONER': '处刑者',
      'MADMAN': '狂徒'
    };
    return classTexts[classType] || '赌徒';
  },

  // 获取职业图标
  getClassIcon(classType) {
    const classIcons = {
      'GAMBLER': '🎲',
      'MAGICIAN': '🎭',
      'EXECUTIONER': '⚖️',
      'MADMAN': '🔥'
    };
    return classIcons[classType] || '🎲';
  },

  // 获取敌人图标
  getEnemyIcon(enemyType) {
    const enemyIcons = {
      'JOKER_GAMBLER': '🤡',
      'DEMON_DEALER': '👿',
      'STAGE_MASTER': '🎭',
      'MACHINE_JUDGE': '🤖',
      'FINAL_MADMAN': '👹',
      'LORD_OF_FATE': '👁️'
    };
    return enemyIcons[enemyType] || '👹';
  },

  // 注册战斗事件
  registerBattleEvents() {
    const { EntityType, BattleEventType, getEffectSystem, getBattleManager } = gameModule;
    const battleManager = getBattleManager();

    // 卡牌选择事件监听
    battleManager.addEventListener(BattleEventType.CARD_SELECTED, (event) => {
      const { entity, card, canUse, reason } = event.data;
      
      if (entity === EntityType.PLAYER) {
        if (canUse === false) {
          // 卡牌无法使用，显示原因
          console.log('[Battle] 无法使用卡牌:', card.name, reason);
          wx.showToast({
            title: reason || '无法使用此卡牌',
            icon: 'none',
            duration: 2000
          });
          this.addBattleLog(`无法使用 ${card.name}: ${reason || '条件不满足'}`, 'warning');
        } else {
          console.log('[Battle] 玩家选择卡牌:', card.name);
        }
      }
    });

    // 回合开始
    battleManager.addEventListener(BattleEventType.TURN_START, (event) => {
      console.log('[Battle] TURN_START - 重置显示状态');

      // 获取剩余牌数信息
      const playerCardsRemaining = event.data.playerCardsRemaining || { deck: 0, discard: 0, hand: 0, total: 0 };
      const enemyCardsRemaining = event.data.enemyCardsRemaining || { deck: 0, discard: 0, hand: 0, total: 0 };

      this.setData({
        turnNumber: event.data.turnNumber,
        phaseText: '选择阶段 - 敌方已选牌',
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
        battleActive: false,  // 恢复画布正常大小
        playerCardsRemaining: playerCardsRemaining,
        enemyCardsRemaining: enemyCardsRemaining
      });

      this.addBattleLog(`--- 回合 ${event.data.turnNumber} ---`, 'normal');
      this.addBattleLog(`剩余牌数: 牌库${playerCardsRemaining.deck} 弃牌${playerCardsRemaining.discard} 手牌${playerCardsRemaining.hand}`, 'info');
      this.addBattleLog('敌方已选择卡牌！', 'effect');
      this.updateUI();
      this.updateHandCards();
    });

    // 出牌阶段显示敌方卡牌（回合开始时即显示）
    battleManager.addEventListener(BattleEventType.ENEMY_CARD_REVEALED, (event) => {
      const { enemyCard } = event.data;
      
      console.log('[Battle] ENEMY_CARD_REVEALED - enemyCard:', enemyCard);
      
      if (!enemyCard) return;
      
      // 确保卡牌数据包含完整信息
      const typeIcons = {
        'ATTACK': '⚔️',
        'DEFENSE': '🛡️',
        'SKILL': '✨',
        'POWER': '💪',
        'FINISHER': '💀'
      };

      const riskTexts = {
        'SAFE': '安全',
        'MODERATE': '中等',
        'HIGH': '高风险',
        'EXTREME': '极限'
      };
      
      const processedEnemyCard = {
        ...enemyCard,
        typeIcon: typeIcons[enemyCard.type] || '🃏',
        riskText: riskTexts[enemyCard.riskLevel] || enemyCard.riskLevel,
        effects: enemyCard.effects || [],
        tags: enemyCard.tags || [],
        displayEffects: (enemyCard.effects || []).map(effect => this.getEffectText(effect))
      };
      
      this.setData({
        enemySelectedCard: processedEnemyCard
      });
      
      this.addBattleLog(`敌方即将出牌: ${processedEnemyCard.name} (Roll ${processedEnemyCard.rollRange.min}-${processedEnemyCard.rollRange.max})`, 'effect');
    });

    // 卡牌揭示 - 显示双方出的牌（结算阶段）
    battleManager.addEventListener(BattleEventType.CARD_REVEALED, (event) => {
      const { playerCard, enemyCard } = event.data;

      console.log('[Battle] CARD_REVEALED - playerCard:', playerCard);
      console.log('[Battle] CARD_REVEALED - enemyCard:', enemyCard);

      // 确保卡牌数据包含完整信息（effects, tags, typeIcon等）
      const typeIcons = {
        'ATTACK': '⚔️',
        'DEFENSE': '🛡️',
        'SKILL': '✨',
        'POWER': '💪',
        'FINISHER': '💀'
      };

      const riskTexts = {
        'SAFE': '安全',
        'MODERATE': '中等',
        'HIGH': '高风险',
        'EXTREME': '极限'
      };

      // 处理玩家卡牌数据
      const processedPlayerCard = playerCard ? {
        ...playerCard,
        typeIcon: typeIcons[playerCard.type] || '🃏',
        riskText: riskTexts[playerCard.riskLevel] || playerCard.riskLevel,
        effects: playerCard.effects || [],
        tags: playerCard.tags || [],
        displayEffects: (playerCard.effects || []).map(effect => this.getEffectText(effect))
      } : null;

      // 处理敌人卡牌数据
      const processedEnemyCard = enemyCard ? {
        ...enemyCard,
        typeIcon: typeIcons[enemyCard.type] || '🃏',
        riskText: riskTexts[enemyCard.riskLevel] || enemyCard.riskLevel,
        effects: enemyCard.effects || [],
        tags: enemyCard.tags || [],
        displayEffects: (enemyCard.effects || []).map(effect => this.getEffectText(effect))
      } : null;

      this.setData({
        showPlayerCard: true,
        showEnemyCard: true,
        phaseText: '揭示阶段',
        playerSelectedCard: processedPlayerCard,
        enemySelectedCard: processedEnemyCard
      });

      // 添加战斗日志显示怪物出的牌
      if (processedEnemyCard) {
        this.addBattleLog(`怪物出牌: ${processedEnemyCard.name} (Roll ${processedEnemyCard.rollRange.min}-${processedEnemyCard.rollRange.max})`, 'effect');
      } else {
        this.addBattleLog('怪物跳过出牌', 'normal');
      }
    });

    // Roll开始
    battleManager.addEventListener(BattleEventType.ROLL_STARTED, (event) => {
      this.setData({
        showRollAnimation: true,
        phaseText: 'Roll点阶段',
        battleActive: true  // 激活比拼阶段，放大画布
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

      // 判断是否需要屏幕震动（大Roll或暴击）
      const isHighRoll = playerRoll >= 15 || enemyRoll >= 15;
      const isCrit = playerResult.isCrit || enemyResult.isCrit;
      const isClose = Math.abs(playerRoll - enemyRoll) <= 3;

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
        playerRollClass: playerResult.isCrit ? 'crit' : (playerRoll >= 15 ? 'high-roll' : ''),
        enemyRollClass: enemyResult.isCrit ? 'crit' : (enemyRoll >= 15 ? 'high-roll' : ''),
        showRollAnimation: false,
        showFinalValues: true,
        phaseText: '结算阶段',
        // 添加特效类
        screenShake: isHighRoll || isCrit,
        flashWhite: isCrit,
        tensionPulse: isClose
      });

      // 触发屏幕震动
      if (isHighRoll || isCrit) {
        wx.vibrateShort({ type: 'heavy' });
      }

      this.addBattleLog(`玩家 Roll: ${playerRoll} (最终值: ${playerResult.finalValue})`, 'normal');
      this.addBattleLog(`敌人 Roll: ${enemyRoll} (最终值: ${enemyResult.finalValue})`, 'normal');

      if (playerResult.isCrit) {
        this.addBattleLog('玩家触发暴击！', 'effect');
      }
      if (enemyResult.isCrit) {
        this.addBattleLog('敌人触发暴击！', 'effect');
      }

      // 清除特效类
      setTimeout(() => {
        this.setData({
          screenShake: false,
          flashWhite: false,
          tensionPulse: false
        });
      }, 500);
    });

    // 伤害造成
    battleManager.addEventListener(BattleEventType.DAMAGE_DEALT, (event) => {
      const { source, target, damage, isCrit } = event.data;

      // 立即更新血量显示
      this.updateUI();

      this.setData({
        showResult: true,
        damageDealt: damage,
        // 添加胜利特效
        showShockwave: true,
        screenShake: true
      });

      // 触发强烈震动
      wx.vibrateLong();

      if (source === EntityType.PLAYER) {
        this.setData({
          winner: 'PLAYER',
          resultText: '你赢了！',
          resultClass: 'win',
          playerWins: true
        });
        this.addBattleLog(`玩家获胜，造成 ${damage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'damage');
      } else {
        this.setData({
          winner: 'ENEMY',
          resultText: '你输了！',
          resultClass: 'lose',
          playerWins: false
        });
        this.addBattleLog(`敌人获胜，造成 ${damage} 点伤害${isCrit ? ' (暴击!)' : ''}`, 'damage');
      }

      // 清除冲击波
      setTimeout(() => {
        this.setData({ showShockwave: false, screenShake: false });
      }, 1000);
    });

    // 效果应用
    battleManager.addEventListener(BattleEventType.EFFECT_APPLIED, (event) => {
      const { source, cardName, effects } = event.data;
      
      // 显示卡牌效果执行结果
      if (effects && effects.length > 0) {
        effects.forEach(effect => {
          let effectText = this.formatEffectResult(effect);
          this.addBattleLog(`${source === EntityType.PLAYER ? '玩家' : '敌人'} [${cardName}] ${effectText}`, 'effect');
        });
      }
      
      this.updateEffects();
      this.updateUI(); // 更新血量等显示
    });

    // 效果触发（回合结束时的赌债、延迟伤害等）
    battleManager.addEventListener(BattleEventType.EFFECT_TRIGGERED, (event) => {
      const { entity, effect } = event.data;
      
      let effectText = '';
      switch (effect.type) {
        case 'debt_damage':
          effectText = `赌债到期，受到 ${effect.damage} 点伤害 (债务: ${effect.debt})`;
          break;
        case 'delayed_damage_trigger':
          effectText = `延迟伤害触发，受到 ${effect.damage} 点伤害`;
          break;
        default:
          effectText = `效果触发: ${effect.type}`;
      }
      
      this.addBattleLog(`${entity === EntityType.PLAYER ? '玩家' : '敌人'} ${effectText}`, 'damage');
      this.updateUI();
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
    const maxCount = 30; // 增加动画帧数，让Roll更久更爽

    // 播放Roll音效
    this.playRollSound();

    this.rollAnimationTimer = setInterval(() => {
      count++;

      // 随机显示数字，后期逐渐变慢
      const speed = count < 20 ? 1 : (count < 25 ? 2 : 3);
      const playerDisplay = Math.floor(Math.random() * (playerRange.max - playerRange.min + 1)) + playerRange.min;
      const enemyDisplay = Math.floor(Math.random() * (enemyRange.max - enemyRange.min + 1)) + enemyRange.min;

      this.setData({
        displayPlayerRoll: playerDisplay.toString(),
        displayEnemyRoll: enemyDisplay.toString(),
        // 添加跳动效果
        rollAnimating: true
      });

      // 轻微震动增加紧张感
      if (count % 5 === 0) {
        wx.vibrateShort({ type: 'light' });
      }

      if (count >= maxCount) {
        clearInterval(this.rollAnimationTimer);
        this.setData({ rollAnimating: false });
      }
    }, 60); // 稍微加快，让数字跳动更疯狂
  },

  // 播放Roll音效（临时用震动代替）
  playRollSound() {
    // 这里可以接入实际音效
    wx.vibrateShort({ type: 'medium' });
  },

  // 更新UI
  updateUI() {
    if (!this.player || !this.enemy) return;

    const playerStatus = this.player.getStatus();
    const enemyStatus = this.enemy.getStatus();

    this.setData({
      playerName: this.player.name,
      playerHp: playerStatus.health,
      playerMaxHp: playerStatus.maxHealth,
      playerHpPercent: (playerStatus.health / playerStatus.maxHealth) * 100,
      playerShield: playerStatus.shield,

      enemyName: this.enemy.name,
      enemyHp: enemyStatus.health,
      enemyMaxHp: enemyStatus.maxHealth,
      enemyHpPercent: (enemyStatus.health / enemyStatus.maxHealth) * 100,
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

  // 格式化效果执行结果
  formatEffectResult(effect) {
    const resultTypeMap = {
      'damage': (e) => `造成 ${e.value} 点伤害`,
      'damage_multiply': (e) => `造成 ${e.value} 点伤害 (x${e.multiplier})`,
      'damage_per_missing_hp': (e) => `造成 ${e.value} 点伤害 (残血加成 ${e.bonus})`,
      'self_damage': (e) => `自伤 ${e.value} 点`,
      'self_damage_half': (e) => `自伤 ${e.value} 点 (50%)`,
      'self_damage_percent': (e) => `自伤 ${e.value} 点 (${e.percent}%)`,
      'shield': (e) => `获得 ${e.value} 点护盾`,
      'heal': (e) => `恢复 ${e.value} 点生命`,
      'heal_on_low_hp': (e) => `低血触发，恢复 ${e.value} 点生命`,
      'gain_debt': (e) => `获得 ${e.amount} 层赌债 (${e.timer}回合后结算)`,
      'debt_payment': (e) => `偿还赌债 ${e.paid} 层，剩余 ${e.remaining} 层`,
      'delayed_damage': (e) => `延迟 ${e.turns} 回合后受到 ${e.damage} 点伤害`,
      'gain_luck': (e) => `获得 ${e.value} 点幸运 (总计: ${e.total})`,
      'add_luck_to_roll': (e) => `幸运加成 +${e.bonus} (消耗 ${e.luckUsed} 幸运)`,
      'gain_hot_hand': (e) => `获得热手，当前 ${e.stacks} 层`,
      'hot_hand_bonus': (e) => `热手加成 +${e.bonus} (${e.stacks} 层)`,
      'gain_bet_stack': (e) => `获得赌注 ${e.stacks} 层${e.ready ? ' [终焉就绪]' : ''}`,
      'damage_per_bet': (e) => `赌注伤害 ${e.damage} (${e.stacks} 层)`,
      'roll_min_boost': (e) => `Roll下限 +${e.value} (当前: ${e.newModifier})`,
      'roll_max_boost': (e) => `Roll上限 +${e.value} (当前: ${e.newModifier})`,
      'lock_roll_value': (e) => `锁定Roll值为 ${e.value}`,
      're_roll_once': (e) => `获得一次重Roll机会`,
      'double_roll': (e) => `下次Roll两次取高`,
      'gamble_double_success': (e) => `赌博成功！双倍伤害 ${e.value} (阈值: ${e.threshold})`,
      'gamble_double_fail': (e) => `赌博失败！自伤 ${e.selfDamage} 点`,
      'gamble_double_normal': (e) => `赌博普通伤害 ${e.value}`,
      'triple_gamble': (e) => `三倍赌博结果: ${e.result} (x${e.multiplier})`,
      'counter_attack': (e) => `获得 ${e.value} 点反击 (总计: ${e.total})`,
      'peek_enemy_hand': (e) => `偷看敌人 ${e.count} 张手牌`,
      'fake_display': (e) => `显示虚假信息`,
      'condition_met': (e) => `条件满足: ${e.condition}`,
      'unknown': (e) => `未知效果: ${e.effectType}`
    };
    
    const formatter = resultTypeMap[effect.type];
    if (formatter) {
      return formatter(effect);
    }
    
    return `效果: ${effect.type}`;
  },

  // 效果类型中文映射
  getEffectText(effect) {
    const effectTypeMap = {
      'GAMBLE_DOUBLE': '赌博双倍',
      'SELF_DAMAGE_HALF': '自伤减半',
      'SELF_DAMAGE': '自伤',
      'SELF_DAMAGE_PERCENT': '百分比自伤',
      'ROLL_MAX_BOOST': 'Roll上限提升',
      'TRIPLE_GAMBLE': '三倍赌博',
      'DAMAGE_PER_MISSING_HP': '残血增伤',
      'DAMAGE_MULTIPLY': '伤害倍增',
      'GAIN_LUCK': '获得幸运',
      'ADD_LUCK_TO_ROLL': '幸运加成Roll',
      'JACKPOT': '头奖',
      'BONUS_IF_LAST_CRIT': '暴击奖励',
      'LUCK_NO_DECAY': '幸运不消',
      'ROLL_BASED_ON_LUCK': '幸运Roll',
      'FAKE_DISPLAY': '假信息',
      'PEEK_AND_DISABLE': '偷看禁用',
      'HIDE_ALL_INFO': '隐藏信息',
      'COUNTER_ON_MISREAD': '误读反击',
      'CONTROL_ENEMY_AI': '控制AI',
      'FREE_FAKE_DISPLAY': '免费假信息',
      'MIND_READ_PASSIVE': '被动读心',
      'REQUIRE_LOW_HP': '低血需求',
      'ROLL_BONUS_PER_MISSING_HP': '残血Roll加成',
      'HEAL_ON_LOW_HP_TRIGGER': '低血治疗',
      'GAIN_DESPERATION': '获得绝望',
      'REQUIRE_CRITICAL_HP': '濒血需求',
      'GAIN_HOT_HAND': '获得热手',
      'BONUS_PER_HOT_HAND': '热手加成',
      'RESET_ON_LOSS': '失败重置',
      'CRIT_ON_HOT_HAND': '热手暴击',
      'GAIN_DEBT': '获得赌债',
      'DEBT_PAYMENT': '赌债偿还',
      'DELAYED_DAMAGE': '延迟伤害',
      'CONVERT_DEBT_TO_DAMAGE': '债务转伤害',
      'ROLL_MIN_BOOST': 'Roll下限提升',
      'LOCK_ROLL_VALUE': '锁定Roll值',
      'RE_ROLL_ONCE': '重Roll一次',
      'DOUBLE_ROLL_TAKE_HIGHER': '双重Roll取高',
      'GAIN_BET_STACK': '获得赌注',
      'APOCALYPSE_UNLOCK': '终焉解锁',
      'DAMAGE_PER_BET': '赌注增伤',
      'ILLUSION': '幻觉',
      'PEEK_ENEMY_HAND': '偷看手牌',
      'PEEK_ENEMY_DECK': '偷看牌库',
      'MIRROR_CARD': '镜像卡牌',
      'COPY_ENEMY_EFFECT': '复制效果',
      'STAGE_RULE_CHANGE': '舞台规则',
      'TRICK_CHAIN': '戏法连锁',
      'GAIN_ILLUSION': '获得幻象',
      'PREDICT_NEXT_CARD': '预测下牌',
      'MIND_READ': '读心术',
      'MENTAL_BREAK': '精神崩溃',
      'CONFUSION': '混乱',
      'FATE_MANIPULATION': '命运操控',
      'GRAND_FINALE': '最终演出',
      'DOMINATION': '压制',
      'CONSECUTIVE_WIN_BONUS': '连胜加成',
      'EXECUTE': '处刑',
      'COUNTER_ATTACK': '反击',
      'IRON_WILL': '钢铁意志',
      'JUDGEMENT': '审判',
      'RULE_ENFORCEMENT': '规则执行',
      'CHAIN_KILL': '连斩',
      'PRESSURE': '威压',
      'PRECISION': '精准',
      'FINAL_VERDICT': '最终审判',
      'BLOOD_RAGE': '血怒',
      'SELF_HARM_FOR_POWER': '自伤换力',
      'RAMPAGE': '暴走',
      'CORRUPTION': '污染',
      'MUTATION': '变异',
      'PAIN_LINK': '痛苦共鸣',
      'CHAOS': '混乱',
      'FINAL_RAMPAGE': '终末暴走',
      'DAMAGE': '伤害',
      'SHIELD': '护盾',
      'HEAL': '治疗',
      'DRAW': '抽牌',
      'ENERGY': '能量',
      'STRENGTH': '力量',
      'DEXTERITY': '敏捷',
      'WEAK': '虚弱',
      'VULNERABLE': '易伤',
      'BLEEDING': '流血',
      'BURNING': '燃烧',
      'FREEZE': '冰冻',
      'STUN': '眩晕'
    };
    
    const typeText = effectTypeMap[effect.type] || effect.type;
    
    if (effect.value !== undefined && effect.value !== null) {
      const valueText = effect.value > 0 ? `+${effect.value}` : effect.value;
      return `${typeText} ${valueText}`;
    }
    
    return typeText;
  },

  // 更新手牌
  updateHandCards() {
    if (!this.player) return;

    const { getCardSystem, CardType } = gameModule;
    const hand = getCardSystem().getHand(this.player.id);

    const cards = hand.map(card => {
      const typeIcons = {
        [CardType.ATTACK]: '⚔️',
        [CardType.DEFENSE]: '🛡️',
        [CardType.SKILL]: '✨',
        [CardType.POWER]: '💪',
        'FINISHER': '💀',
        'ATTACK': '⚔️',
        'DEFENSE': '🛡️',
        'SKILL': '✨',
        'POWER': '💪'
      };

      const riskTexts = {
        'SAFE': '安全',
        'MODERATE': '中等',
        'HIGH': '高风险',
        'EXTREME': '极限'
      };

      // 格式化效果显示
      const formattedEffects = (card.effects || []).map(effect => this.getEffectText(effect));

      return {
        ...card,
        typeIcon: typeIcons[card.type] || '🃏',
        selected: this.data.playerSelectedCard?.instanceId === card.instanceId,
        // 添加显示用的属性
        displayName: card.name,
        displayRollRange: `${card.rollRange.min}-${card.rollRange.max}`,
        displaySpeed: card.speed,
        // 添加风险等级文本
        riskText: riskTexts[card.riskLevel] || card.riskLevel,
        // 格式化效果显示
        displayEffects: formattedEffects,
        // 确保effects和tags存在
        effects: card.effects || [],
        tags: card.tags || []
      };
    });

    this.setData({
      handCards: cards
    });
  },

  // 卡牌点击
  onCardTap(e) {
    if (this.data.hasConfirmed) return;

    const { getBattleManager, getCardSystem } = gameModule;
    const cardData = e.currentTarget.dataset.card;

    // 选择卡牌
    const success = getBattleManager().playerSelectCard(cardData.instanceId);
    
    if (success) {
      // 从手牌中获取原始卡牌对象
      const hand = getCardSystem().getHand(this.player.id);
      const originalCard = hand.find(c => c.instanceId === cardData.instanceId);
      
      this.setData({
        playerSelectedCard: originalCard || cardData,
        canConfirm: true
      });
      this.updateHandCards();
    }
  },

  // 双击查看卡牌详情（使用tap时间戳实现）
  onCardDoubleTap(e) {
    const cardData = e.currentTarget.dataset.card;
    
    this.setData({
      showCardDetailModal: true,
      selectedCardForDetail: cardData,
      cardDetailOwner: 'player'
    });
  },

  // 处理手牌点击（区分单击选择和双击查看详情）
  onHandCardTap(e) {
    const currentTime = Date.now();
    const cardData = e.currentTarget.dataset.card;
    
    // 如果已经确认出牌，不处理
    if (this.data.hasConfirmed) return;
    
    // 检查是否是双击（300ms内再次点击）
    if (this.lastTapTime && currentTime - this.lastTapTime < 300) {
      // 双击 - 显示详情
      this.lastTapTime = 0;
      this.setData({
        showCardDetailModal: true,
        selectedCardForDetail: cardData,
        cardDetailOwner: 'player'
      });
    } else {
      // 单击 - 选择卡牌
      this.lastTapTime = currentTime;
      
      const { getBattleManager, getCardSystem } = gameModule;
      
      // 选择卡牌
      const success = getBattleManager().playerSelectCard(cardData.instanceId);
      
      if (success) {
        // 从手牌中获取原始卡牌对象
        const hand = getCardSystem().getHand(this.player.id);
        const originalCard = hand.find(c => c.instanceId === cardData.instanceId);
        
        this.setData({
          playerSelectedCard: originalCard || cardData,
          canConfirm: true
        });
        this.updateHandCards();
      }
    }
  },

  // 双击查看敌方卡牌详情
  onEnemyCardDoubleTap() {
    if (!this.data.enemySelectedCard) return;
    
    const currentTime = Date.now();
    
    // 检查是否是双击（300ms内再次点击）
    if (this.lastEnemyTapTime && currentTime - this.lastEnemyTapTime < 300) {
      // 双击 - 显示详情
      this.lastEnemyTapTime = 0;
      this.setData({
        showCardDetailModal: true,
        selectedCardForDetail: this.data.enemySelectedCard,
        cardDetailOwner: 'enemy'
      });
    } else {
      // 单击 - 记录时间
      this.lastEnemyTapTime = currentTime;
    }
  },

  // 关闭卡牌详情弹窗
  onCardDetailClose() {
    this.setData({
      showCardDetailModal: false,
      selectedCardForDetail: null
    });
  },

  // 消耗洞察揭示卡牌
  onCardReveal(e) {
    const { cardId, insightRemaining } = e.detail;
    this.addBattleLog(`消耗洞察揭示了卡牌！剩余洞察: ${insightRemaining}`, 'effect');
    
    // 刷新手牌显示
    this.updateHandCards();
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
