# 增强版战斗系统 - 功能说明

## 已完成的核心系统

### 1. Roll系统优化 ✅
- **取消基础攻击力**：Roll结果就是伤害
- 例如：Roll 15 = 造成15点伤害

### 2. Roll品质系统 ✅
根据Roll结果区间，同一张牌触发不同品质效果：

| Roll区间 | 品质 | 效果 |
|---------|------|------|
| 1-5 | 极差 | 伤害减半 |
| 6-10 | 较低 | 正常伤害 |
| 11-15 | 普通 | 伤害+额外效果 |
| 16-20 | 较高 | 伤害+强力效果 |
| 21-25 | 优秀 | 伤害翻倍+特效 |

示例卡牌：
- **火球术**：1~5微弱火苗 → 21~25炼狱火球
- **斩击**：1~5失误斩击 → 21~25斩首

### 3. 不出牌机制 ✅
选择不出牌进入**防御姿态**：
- 立即获得5点护盾
- 下回合首次Roll+3

### 4. 速度机制 ✅
- 每张牌拥有速度值
- 速度差≥5时，高速牌优先结算
- 高速牌可以打断慢速牌

### 5. 反制系统 ✅
新增反制牌：

| 卡牌 | 效果 |
|------|------|
| **偏转** | 敌方Roll≥15时，伤害减半 |
| **赌徒狂笑** | 双方Roll差值≤1时，额外行动 |
| **失衡打击** | 敌方Roll≥20时，下回合Roll上限减半 |
| **预判格挡** | 速度差≥5时，完全格挡 |

### 6. 爆点机制 ✅
- 连续3回合获胜进入爆点状态
- 爆点状态效果：
  - Roll+2
  - Roll上限+3
  - 特殊动画效果

### 7. AI性格系统 ✅
4种AI类型：

| AI类型 | 特点 |
|--------|------|
| **狂战士** | 偏好高风险牌（大Roll范围） |
| **机械体** | 偏好稳定Roll（小Roll范围） |
| **赌徒** | 极高概率使用赌博牌 |
| **法师** | 喜欢蓄力与状态叠加 |

### 8. 稳定流 vs 赌博流 ✅

**稳定流卡牌**：
- 精准刺击：Roll 7~10
- 双重斩击：两次Roll 5~7

**赌博流卡牌**：
- 赌徒之刃：Roll 0~25
- 命运骰子：Roll 1~20

## 新增文件

### 核心代码
1. `assets/scripts/EnhancedBattleManager.ts` - 增强版战斗管理器
2. `assets/scripts/data/EnhancedCardDatabase.ts` - 增强版卡牌数据库
3. `pages/battle-enhanced/battle-enhanced.ts` - 增强版战斗页面
4. `pages/battle-enhanced/battle-enhanced.wxml` - 增强版页面结构

### 导出更新
- `assets/scripts/index.ts` - 导出所有增强版功能

## 使用方法

```typescript
import {
  getEnhancedBattleManager,
  AIType,
  ENHANCED_STARTING_DECK,
  GAMBLER_DECK,
  STABLE_DECK
} from '../../assets/scripts/index';

// 开始战斗
getEnhancedBattleManager().startBattle({
  player: playerEntity,
  enemy: enemyEntity,
  drawCountPerTurn: 5,
  maxTurns: 50,
  aiType: AIType.BERSERKER // 选择AI类型
});

// 不出牌（进入防御姿态）
getEnhancedBattleManager().playerSkipCard();
```

## 新增卡牌列表

### 赌博流
- 赌徒之刃 (0~25)
- 命运骰子 (1~20)

### 稳定流
- 精准刺击 (7~10)
- 双重斩击 (5~7 x2)

### 反制牌
- 偏转
- 赌徒狂笑
- 失衡打击
- 预判格挡

### 高速牌
- 疾风斩 (速度12)
- 瞬步 (速度15)

### 重型牌
- 重击 (速度2, 12~16)
- 蓄力一击 (速度1, 15~20)

### 带Roll品质
- 火球术 (1~25, 5种品质)
- 斩击 (1~25, 5种品质)
