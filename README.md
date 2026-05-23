# 命运赌局 (Fate Gamble) - 微信小游戏

## 项目概述

《命运赌局》是一款基于微信小程序平台开发的 Roguelike 卡牌 RPG 游戏。游戏以黑金赌场为视觉主题，融合了策略卡牌、Roguelike 元素和独特的 Roll 点战斗机制，为玩家带来紧张刺激的赌局体验。

## 核心特色

### 🎲 独特的 Roll 点战斗系统
- 双方同时出牌，通过 Roll 点决定胜负
- 速度属性影响出牌优先级
- 暴击和闪避机制增加战斗变数

### 🃏 四大职业体系
1. **赌徒 (Gambler)** 🎲
   - 高风险高回报，擅长概率操控
   - 特色机制：赌债系统、幸运值
   
2. **魔术师 (Magician)** 🎭
   - 欺骗与策略，擅长信息操控
   - 特色机制：假信息、手牌操控
   
3. **处刑者 (Executioner)** ⚖️
   - 公平与制裁，擅长规则利用
   - 特色机制：绝对公平、审判系统
   
4. **狂徒 (Maniac)** 🔥
   - 疯狂与力量，擅长极限输出
   - 特色机制：疯狂值、自伤强化

### 👹 丰富的敌人系统
- **普通敌人**：8种基础敌人，各具特色
- **精英敌人**：8种精英敌人，拥有特殊能力
- **Boss 系统**：5个独特 Boss，每个都有三阶段机制
  - 恶魔庄家：债务赌局
  - 舞台主宰：真假舞台
  - 机械裁决者：绝对公平
  - 终末狂徒：疯狂污染
  - 命运之主：命运审判

### 🎨 黑金赌场视觉风格
- 深色背景 + 金色高光的赌场美学
- 霓虹光效和动态粒子效果
- 丰富的动画和视觉反馈

## 功能模块

### 主菜单系统
- 职业选择界面
- 浮动扑克牌装饰
- 霓虹标题动画

### 战斗系统
- 回合制同时出牌机制
- Roll 点动画和特效
- 伤害数字浮动显示
- 屏幕震动和闪白效果

### 卡牌系统
- 100+ 张独特卡牌
- 稀有度系统：普通、稀有、史诗、传说、终结
- 风险等级：安全、中等、高风险、极限
- 多种流派构建

### 百科系统
- 职业卡牌查看
- 敌人图鉴
- Boss 档案
- 遗物收藏

### 动画效果系统
- 屏幕震动
- 闪白效果
- 冲击波
- 粒子特效
- 闪电效果
- 伤害数字浮动
- 暴击/闪避特效
- 胜利/失败动画

## 技术架构

### 技术栈
- **前端框架**：微信小程序原生框架
- **样式语言**：WXSS (CSS 扩展)
- **脚本语言**：JavaScript
- **组件化**：微信小程序自定义组件

### 项目结构
```
miniGamDemo/
├── app.js                    # 应用入口
├── app.json                  # 应用配置
├── app.wxss                  # 全局样式
├── README.md                 # 项目说明
├── card_rpg_visual_style_bible_cn.md  # 视觉设计规范
│
├── pages/                    # 页面目录
│   ├── main/                 # 主菜单页面
│   │   ├── main.wxml
│   │   ├── main.wxss
│   │   ├── main.js
│   │   └── main.json
│   ├── battle/               # 战斗页面
│   │   ├── battle.wxml
│   │   ├── battle.wxss
│   │   ├── battle.js
│   │   └── battle.json
│   ├── encyclopedia/         # 卡牌百科页面
│   │   ├── encyclopedia.wxml
│   │   ├── encyclopedia.wxss
│   │   ├── encyclopedia.js
│   │   └── encyclopedia.json
│   └── settings/             # 设置页面
│       ├── settings.wxml
│       ├── settings.wxss
│       ├── settings.js
│       └── settings.json
│
├── components/               # 组件目录
│   ├── card/                 # 卡牌组件
│   │   ├── card.wxml
│   │   ├── card.wxss
│   │   ├── card.js
│   │   └── card.json
│   ├── boss/                 # Boss组件
│   │   ├── boss.wxml
│   │   ├── boss.wxss
│   │   ├── boss.js
│   │   └── boss.json
│   └── animation/            # 动画效果组件
│       ├── animation.wxml
│       ├── animation.wxss
│       ├── animation.js
│       └── animation.json
│
├── assets/                   # 资源目录
│   └── scripts/              # 脚本目录
│       ├── index.js          # 游戏核心逻辑
│       ├── data/             # 数据文件
│       │   ├── ClassSkillSystem.js    # 职业技能系统
│       │   ├── EnemyAI.js             # 敌人AI系统
│       │   ├── EnemyPhase1.js         # 第一阶段敌人
│       │   ├── EnemyPhase2.js         # 第二阶段敌人
│       │   ├── BossDevilDealer.js     # 恶魔庄家Boss
│       │   ├── BossStageMaster.js     # 舞台主宰Boss
│       │   ├── BossMachineJudge.js    # 机械裁决者Boss
│       │   ├── BossFinalMadman.js     # 终末狂徒Boss
│       │   └── BossLordOfFate.js      # 命运之主Boss
│       └── animation/        # 动画系统
│           └── SkillAnimationSystem.js # 技能动画系统
│
└── .trae/documents/          # 项目文档
    ├── prd.md                # 产品需求文档
    └── arch.md               # 技术架构文档
```

## 核心数据结构

### 卡牌数据
```javascript
{
  id: string,           // 卡牌ID
  name: string,         // 卡牌名称
  description: string,  // 卡牌描述
  type: string,         // 卡牌类型 (ATTACK/DEFENSE/SPECIAL/CURSE)
  rarity: string,       // 稀有度 (COMMON/UNCOMMON/RARE/LEGENDARY/FINISHER)
  cost: number,         // 能量消耗
  rollRange: {          // Roll点范围
    min: number,
    max: number
  },
  speed: number,        // 速度值
  effects: Array,       // 效果列表
  tags: Array,          // 标签
  riskLevel: string,    // 风险等级
  archetype: string     // 流派
}
```

### 敌人数据
```javascript
{
  id: string,           // 敌人ID
  name: string,         // 敌人名称
  title: string,        // 敌人称号
  icon: string,         // 图标
  hp: number,           // 生命值
  difficulty: string,   // 难度等级
  faction: string,      // 阵营
  aiType: string,       // AI类型
  description: string,  // 描述
  abilities: Array,     // 能力列表
  isBoss: boolean,      // 是否为Boss
  specialMechanic: {    // 特殊机制
    name: string,
    description: string
  }
}
```

## 游戏玩法

### 基础规则
1. **选择职业**：在主菜单选择喜欢的职业
2. **进入战斗**：与敌人进行回合制对决
3. **出牌阶段**：选择手牌并确认出牌
4. **Roll点阶段**：双方同时Roll点，数值大者生效
5. **结算阶段**：根据胜负结果造成伤害或触发效果

### 战斗机制
- **速度优先**：速度高的卡牌先出手
- **Roll点范围**：每张卡牌有自己的Roll点范围
- **暴击系统**：Roll出最大值触发暴击
- **闪避系统**：Roll出最小值触发闪避
- **效果触发**：根据卡牌效果触发各种能力

### 进阶策略
- **能量管理**：合理分配每回合的能量
- **风险把控**：根据风险等级选择卡牌
- **流派构建**：围绕特定机制构建卡组
- **Boss对策**：针对不同Boss调整策略

## 视觉设计规范

### 颜色系统
- **主色调**：#0D0D0D (深黑背景)
- **金色**：#D4AF37 (主高光)
- **深红**：#B3001B (危险/敌人)
- **霓虹紫**：#8A2BE2 (Boss/特殊)
- **疯狂红**：#FF2E63 (狂徒职业)

### 字体规范
- 标题：48-72rpx，粗体，金色
- 正文：24-28rpx，常规，白色/灰色
- 标签：16-20rpx，常规，对应颜色

### 动画规范
- 过渡时间：0.3s 标准，0.5s 长动画
- 缓动函数：ease 标准，ease-in-out 循环动画
- 发光效果：box-shadow 多层叠加

## 开发计划

### 已完成
- ✅ 核心战斗系统
- ✅ 四大职业体系
- ✅ 敌人系统 (普通 + 精英 + Boss)
- ✅ 卡牌系统 (100+ 张卡牌)
- ✅ 职业技能系统
- ✅ 动画效果系统
- ✅ UI 界面设计
- ✅ 卡牌百科系统

### 进行中
- 🔄 音效系统
- 🔄 粒子特效优化
- 🔄 平衡性调整

### 计划中
- ⏳ 多人对战模式
- ⏳ 排行榜系统
- ⏳ 成就系统
- ⏳ 云存档功能

## 如何运行

### 开发环境
1. 安装微信开发者工具
2. 导入项目目录
3. 编译并预览

### 生产环境
1. 在微信开发者工具中上传代码
2. 登录微信公众平台提交审核
3. 审核通过后发布

## 贡献指南

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循微信小程序开发规范
- 组件化开发，保持代码复用

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 样式调整
- refactor: 代码重构

## 版本历史

### v1.0.0 (2026-05-23)
- 初始版本发布
- 完整的核心玩法
- 四大职业 + 五个Boss
- 基础UI和动画系统

## 联系方式

- 项目地址：[GitHub Repository]
- 问题反馈：[Issues]
- 官方QQ群：[群号]

## 许可证

MIT License

---

**命运赌局** - 在命运的赌桌上，谁才是真正的赢家？
