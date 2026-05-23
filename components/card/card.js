// 命运赌局 - 卡牌组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 卡牌数据
    cardData: {
      type: Object,
      value: null
    },
    // 是否选中
    selected: {
      type: Boolean,
      value: false
    },
    // 是否翻转（显示背面）
    flipped: {
      type: Boolean,
      value: false
    },
    // 是否耗尽
    exhausted: {
      type: Boolean,
      value: false
    },
    // 宽度
    width: {
      type: Number,
      value: 140
    },
    // 高度
    height: {
      type: Number,
      value: 200
    },
    // 显示费用
    showCost: {
      type: Boolean,
      value: true
    },
    // 显示类型
    showType: {
      type: Boolean,
      value: false
    },
    // 显示风险
    showRisk: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 卡牌属性
    name: '',
    icon: '🃏',
    cost: 0,
    rarity: 'common',
    typeText: '',
    rollRange: '',
    speed: 0,
    effects: [],
    tags: [],
    riskLevel: '',
    riskText: ''
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateCardData();
    }
  },

  /**
   * 数据监听器
   */
  observers: {
    'cardData': function(cardData) {
      this.updateCardData();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 更新卡牌数据
    updateCardData() {
      const cardData = this.properties.cardData;
      if (!cardData) return;

      this.setData({
        name: cardData.name || '未知卡牌',
        icon: cardData.typeIcon || '🃏',
        cost: cardData.cost || 0,
        rarity: cardData.rarity || 'common',
        typeText: this.getTypeText(cardData.type),
        rollRange: cardData.rollRange ? `${cardData.rollRange.min}-${cardData.rollRange.max}` : '',
        speed: cardData.speed || 0,
        effects: cardData.displayEffects || [],
        tags: cardData.tags || [],
        riskLevel: cardData.riskLevel || '',
        riskText: cardData.riskText || ''
      });
    },

    // 获取类型文本
    getTypeText(type) {
      const typeTexts = {
        'ATTACK': '攻击',
        'DEFENSE': '防御',
        'SPECIAL': '特殊',
        'CURSE': '诅咒'
      };
      return typeTexts[type] || type;
    },

    // 卡牌点击事件
    onCardTap() {
      if (this.properties.exhausted) return;

      this.triggerEvent('tap', {
        cardData: this.properties.cardData,
        selected: this.properties.selected
      });
    }
  }
});
