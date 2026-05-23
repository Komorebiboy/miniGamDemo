// components/CardDetailModal/CardDetailModal.js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    card: {
      type: Object,
      value: null
    },
    cardOwner: {
      type: String,
      value: 'player'
    }
  },

  data: {
    formattedCard: null
  },

  observers: {
    'card': function(card) {
      if (card) {
        this.formatCardData(card);
      }
    }
  },

  methods: {
    formatCardData(card) {
      // 格式化类型文本
      const typeText = this.getTypeText(card.type);
      const typeIcon = this.getTypeIcon(card.type);

      // 格式化风险等级文本
      const riskText = this.getRiskText(card.riskLevel);

      // 格式化Roll范围文本
      const rollRangeText = `${card.rollRange.min}~${card.rollRange.max}`;

      // 确保effects和tags存在
      const effects = card.effects || [];
      const tags = card.tags || [];

      // 格式化效果显示（中文）
      const displayEffects = card.displayEffects || effects.map(effect => this.getEffectText(effect));

      this.setData({
        formattedCard: {
          ...card,
          typeText,
          typeIcon,
          riskText,
          rollRangeText,
          effects,
          tags,
          displayEffects,
          isFullyRevealed: true,
          description: card.description || '无特殊效果'
        }
      });
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

    getTypeText(type) {
      const typeMap = {
        'ATTACK': '攻击',
        'DEFENSE': '防御',
        'SKILL': '技能',
        'FINISHER': '终结',
        'POWER': '力量',
        'UNKNOWN': '未知'
      };
      return typeMap[type] || type;
    },

    getTypeIcon(type) {
      const iconMap = {
        'ATTACK': '⚔️',
        'DEFENSE': '🛡️',
        'SKILL': '✨',
        'FINISHER': '💀',
        'POWER': '💪',
        'UNKNOWN': '❓'
      };
      return iconMap[type] || '🃏';
    },

    getRiskText(riskLevel) {
      const riskMap = {
        'SAFE': '安全',
        'MODERATE': '中等',
        'HIGH': '高风险',
        'EXTREME': '极限',
        'UNKNOWN': '未知'
      };
      return riskMap[riskLevel] || riskLevel;
    },

    onMaskTap() {
      this.triggerEvent('close');
    },

    onContainerTap() {
      // catchtap 已阻止事件冒泡，无需手动调用 stopPropagation
    },

    onClose() {
      this.triggerEvent('close');
    }
  }
});
