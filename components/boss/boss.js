// 命运赌局 - Boss组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // Boss数据
    bossData: {
      type: Object,
      value: null
    },
    // 当前阶段
    phase: {
      type: Number,
      value: 1
    },
    // 是否激怒
    isEnraged: {
      type: Boolean,
      value: false
    },
    // 显示技能提示
    showSkillHint: {
      type: Boolean,
      value: false
    },
    // 显示阶段转换
    showPhaseTransition: {
      type: Boolean,
      value: false
    },
    // 显示台词
    showDialogue: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // Boss属性
    name: '',
    title: '',
    icon: '👹',
    hp: 100,
    maxHp: 100,
    hpPercent: 100,
    shield: 0,
    effects: [],
    // 技能提示
    skillName: '',
    skillDesc: '',
    // 阶段描述
    phaseDesc: '',
    // 台词
    dialogueText: ''
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateBossData();
    }
  },

  /**
   * 数据监听器
   */
  observers: {
    'bossData': function(bossData) {
      this.updateBossData();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 更新Boss数据
    updateBossData() {
      const bossData = this.properties.bossData;
      if (!bossData) return;

      const hpPercent = bossData.maxHp > 0 ? (bossData.hp / bossData.maxHp) * 100 : 0;

      this.setData({
        name: bossData.name || '未知Boss',
        title: bossData.title || '',
        icon: bossData.icon || '👹',
        hp: bossData.hp || 0,
        maxHp: bossData.maxHp || 100,
        hpPercent: hpPercent,
        shield: bossData.shield || 0,
        effects: bossData.effects || [],
        skillName: bossData.skillName || '',
        skillDesc: bossData.skillDesc || '',
        phaseDesc: bossData.phaseDesc || '',
        dialogueText: bossData.dialogueText || ''
      });
    },

    // 显示技能提示
    showSkillHintAnimation() {
      this.setData({ showSkillHint: true });
      setTimeout(() => {
        this.setData({ showSkillHint: false });
      }, 3000);
    },

    // 显示阶段转换
    showPhaseTransitionAnimation() {
      this.setData({ showPhaseTransition: true });
      setTimeout(() => {
        this.setData({ showPhaseTransition: false });
      }, 3000);
    },

    // 显示台词
    showDialogueAnimation(text) {
      this.setData({ 
        showDialogue: true,
        dialogueText: text || this.data.dialogueText
      });
      setTimeout(() => {
        this.setData({ showDialogue: false });
      }, 4000);
    }
  }
});
