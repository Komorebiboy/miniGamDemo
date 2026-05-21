# Roguelike卡牌RPG - Cocos Creator 微信小游戏

## 项目概述

这是一个基于 Cocos Creator 3.x 开发的 Roguelike 卡牌 RPG 微信小游戏。

## 功能特性

- **主菜单**：开始冒险、卡组编辑、成就、设置
- **战斗系统**：回合制战斗、同时出牌、Roll点机制
- **卡组系统**：100张卡牌、4个职业、多种流派
- **奖励系统**：Roguelike随机奖励
- **结算系统**：胜利/失败结算

## 职业体系

1. **战士**：高防御、流血流派
2. **法师**：元素伤害、冻结控制
3. **赌徒**：高风险高回报、随机性
4. **刺客**：高速度、连击、背刺

## 技术栈

- Cocos Creator 3.8.0
- TypeScript
- 微信小游戏API

## 项目结构

```
assets/
├── scripts/
│   ├── GameTypes.ts          # 类型定义
│   ├── GameManager.ts        # 游戏管理器
│   ├── systems/
│   │   ├── RollSystem.ts     # Roll点系统
│   │   ├── CardSystem.ts     # 卡牌系统
│   │   └── EffectSystem.ts   # 效果系统
│   ├── entities/
│   │   └── Entity.ts         # 实体基类
│   ├── managers/
│   │   └── BattleManager.ts  # 战斗管理器
│   ├── data/
│   │   └── CardDatabase.ts   # 卡牌数据库
│   ├── scenes/
│   │   ├── MainMenuScene.ts  # 主菜单场景
│   │   ├── BattleScene.ts    # 战斗场景
│   │   ├── DeckScene.ts      # 卡组场景
│   │   ├── RewardScene.ts    # 奖励场景
│   │   └── GameOverScene.ts  # 结算场景
│   └── ui/
│       ├── CardUI.ts         # 卡牌UI组件
│       ├── EntityUI.ts       # 实体UI组件
│       └── RollAnimation.ts  # Roll点动画
├── scenes/                    # Cocos场景文件
├── resources/                 # 资源文件
└── settings/                  # 项目设置
```

## 如何运行

1. 使用 Cocos Creator 3.8.0+ 打开项目
2. 点击预览按钮在浏览器中测试
3. 构建为微信小游戏并导入微信开发者工具

## 游戏玩法

1. 在主菜单选择"开始冒险"
2. 在战斗界面选择卡牌并确认
3. 双方同时Roll点，数值大者生效
4. 击败敌人获得奖励
5. 编辑卡组准备下一场战斗

## 卡牌数值

- 1能量 ≈ 6-8点基础值
- 速度范围：1-10
- Roll范围：1-12
- 暴击阈值：Roll ≥ 95
- 闪避阈值：Roll ≤ 5

## 作者

Game Developer

## 许可证

MIT
