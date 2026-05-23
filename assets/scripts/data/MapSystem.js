/**
 * 分岔路线地图系统 - 心理博弈Roguelike卡牌游戏
 * 
 * 核心设计：
 * - 分支路线选择，增加决策深度
 * - 节点类型多样化
 * - 5个主题区域，每区6-8场战斗
 * - 路线可视化
 */

// ==================== 节点类型 ====================

const NodeType = {
  START: 'START',           // 起点
  BATTLE: 'BATTLE',         // 普通战斗
  ELITE: 'ELITE',           // 精英战斗
  BOSS: 'BOSS',             // Boss战
  SHOP: 'SHOP',             // 商店
  EVENT: 'EVENT',           // 随机事件
  REST: 'REST',             // 休息点
  TREASURE: 'TREASURE',     // 宝藏
  MYSTERY: 'MYSTERY'        // 神秘节点
};

// ==================== 主题区域 ====================

const AreaTheme = {
  CASINO_ENTRANCE: {
    id: 'CASINO_ENTRANCE',
    name: '赌场入口',
    description: '霓虹闪烁的赌场大门，这里是新手试炼之地',
    icon: '🎰',
    color: '#FFD700',
    difficulty: 1,
    enemyPool: ['JOKER_GAMBLER', 'NOVICE_DEALER'],
    specialRule: null,
    nodeCount: { min: 6, max: 8 }
  },
  
  CHEATERS_DEN: {
    id: 'CHEATERS_DEN',
    name: '老千巢穴',
    description: '阴暗的角落，到处都是骗局和陷阱',
    icon: '🎭',
    color: '#8B4513',
    difficulty: 2,
    enemyPool: ['CHEAT', 'CARD_SHARK', 'TRICKSTER'],
    specialRule: 'HIDDEN_INFO', // 隐藏部分信息
    nodeCount: { min: 7, max: 9 }
  },
  
  MECHANICAL_FLOOR: {
    id: 'MECHANICAL_FLOOR',
    name: '机械层',
    description: '冰冷的机械统治着这里，绝对公平是唯一的法则',
    icon: '⚙️',
    color: '#708090',
    difficulty: 3,
    enemyPool: ['MECHANICAL_GUARD', 'AUTOMATED_DEALER'],
    specialRule: 'FAIRNESS_ZONE', // 公平领域
    nodeCount: { min: 7, max: 9 }
  },
  
  DEMON_VAULT: {
    id: 'DEMON_VAULT',
    name: '恶魔金库',
    description: '贪婪的气息弥漫，债务和诱惑无处不在',
    icon: '💀',
    color: '#8B0000',
    difficulty: 4,
    enemyPool: ['DEMON_DEALER', 'SOUL_COLLECTOR'],
    specialRule: 'DEBT_SYSTEM', // 债务系统
    nodeCount: { min: 8, max: 10 }
  },
  
  FATE_ARENA: {
    id: 'FATE_ARENA',
    name: '命运竞技场',
    description: '最终的试炼，命运在这里被决定',
    icon: '👑',
    color: '#FFD700',
    difficulty: 5,
    enemyPool: ['FATE_MASTER'],
    specialRule: 'FATE_ROLL', // 命运Roll点
    nodeCount: { min: 1, max: 1 } // 只有Boss
  }
};

// ==================== 地图生成器 ====================

class MapGenerator {
  constructor() {
    this.areas = [];
    this.currentArea = 0;
  }

  static getInstance() {
    if (!MapGenerator._instance) {
      MapGenerator._instance = new MapGenerator();
    }
    return MapGenerator._instance;
  }

  // 生成完整地图（5个区域）
  generateFullMap() {
    const areas = [];
    const areaKeys = Object.keys(AreaTheme);
    
    for (let i = 0; i < areaKeys.length; i++) {
      const areaConfig = AreaTheme[areaKeys[i]];
      const nodeCount = this._randomRange(
        areaConfig.nodeCount.min,
        areaConfig.nodeCount.max
      );
      
      const area = this._generateArea(areaConfig, nodeCount, i);
      areas.push(area);
    }
    
    this.areas = areas;
    return areas;
  }

  // 生成单个区域
  _generateArea(areaConfig, nodeCount, areaIndex) {
    const nodes = [];
    const layers = [];
    
    // 起点
    const startNode = {
      id: `area${areaIndex}_start`,
      type: NodeType.START,
      x: 50,
      y: 5,
      connections: [],
      visited: false,
      available: true,
      area: areaConfig.id
    };
    nodes.push(startNode);
    layers.push([startNode]);
    
    // 生成中间层
    const layerCount = Math.ceil(nodeCount / 2);
    for (let layer = 1; layer < layerCount; layer++) {
      const layerNodes = [];
      const nodeCountInLayer = this._randomRange(2, 3);
      
      for (let n = 0; n < nodeCountInLayer; n++) {
        const nodeType = this._decideNodeType(areaConfig, layer, layerCount);
        const node = {
          id: `area${areaIndex}_layer${layer}_node${n}`,
          type: nodeType,
          x: this._calculateX(n, nodeCountInLayer),
          y: layer * 15,
          connections: [],
          visited: false,
          available: false,
          area: areaConfig.id,
          ...this._generateNodeContent(nodeType, areaConfig)
        };
        
        layerNodes.push(node);
        nodes.push(node);
      }
      
      // 建立与上一层的连接
      this._connectLayers(layers[layer - 1], layerNodes);
      layers.push(layerNodes);
    }
    
    // Boss节点
    const bossNode = {
      id: `area${areaIndex}_boss`,
      type: NodeType.BOSS,
      x: 50,
      y: layerCount * 15 + 5,
      connections: [],
      visited: false,
      available: false,
      area: areaConfig.id,
      bossType: this._getAreaBoss(areaConfig)
    };
    
    // 连接最后一层到Boss
    this._connectLayers(layers[layers.length - 1], [bossNode]);
    nodes.push(bossNode);
    layers.push([bossNode]);
    
    return {
      config: areaConfig,
      nodes: nodes,
      layers: layers,
      currentNode: startNode.id
    };
  }

  // 决定节点类型
  _decideNodeType(areaConfig, currentLayer, totalLayers) {
    const progress = currentLayer / totalLayers;
    const rand = Math.random();
    
    // 根据进度调整概率
    if (progress < 0.3) {
      // 前期：更多战斗和事件
      if (rand < 0.5) return NodeType.BATTLE;
      if (rand < 0.7) return NodeType.EVENT;
      if (rand < 0.85) return NodeType.SHOP;
      return NodeType.REST;
    } else if (progress < 0.7) {
      // 中期：增加精英
      if (rand < 0.4) return NodeType.BATTLE;
      if (rand < 0.6) return NodeType.ELITE;
      if (rand < 0.75) return NodeType.EVENT;
      if (rand < 0.85) return NodeType.SHOP;
      return NodeType.REST;
    } else {
      // 后期：更多精英和准备
      if (rand < 0.3) return NodeType.BATTLE;
      if (rand < 0.5) return NodeType.ELITE;
      if (rand < 0.7) return NodeType.REST;
      if (rand < 0.85) return NodeType.SHOP;
      return NodeType.EVENT;
    }
  }

  // 生成节点内容
  _generateNodeContent(nodeType, areaConfig) {
    switch (nodeType) {
      case NodeType.BATTLE:
        return {
          enemyType: this._randomFromArray(areaConfig.enemyPool),
          rewardTier: 'normal'
        };
      
      case NodeType.ELITE:
        return {
          enemyType: this._randomFromArray(areaConfig.enemyPool),
          eliteModifier: this._generateEliteModifier(),
          rewardTier: 'elite'
        };
      
      case NodeType.EVENT:
        return {
          eventPool: this._getAreaEvents(areaConfig.id)
        };
      
      case NodeType.SHOP:
        return {
          itemCount: this._randomRange(3, 5),
          discount: Math.random() < 0.2 ? 0.8 : 1.0
        };
      
      case NodeType.REST:
        return {
          options: ['heal', 'upgrade', 'remove']
        };
      
      case NodeType.TREASURE:
        return {
          treasureType: Math.random() < 0.7 ? 'relic' : 'gold'
        };
      
      default:
        return {};
    }
  }

  // 生成精英敌人规则改变
  _generateEliteModifier() {
    const modifiers = [
      { id: 'NO_FAST', name: '禁止高速', description: '速度>7的牌无法使用', effect: 'ban_fast' },
      { id: 'HIDDEN_INFO', name: '信息封锁', description: '无法看到敌方Roll范围', effect: 'hide_enemy_info' },
      { id: 'DOUBLE_ROLL', name: '双重Roll', description: '双方Roll两次，取平均', effect: 'double_roll' },
      { id: 'NO_SKIP', name: '强制出牌', description: '不能空过', effect: 'ban_skip' },
      { id: 'REVERSE_SPEED', name: '速度反转', description: '速度慢的牌先出', effect: 'reverse_speed' },
      { id: 'HIGH_STAKES', name: '高风险', description: '双方伤害+50%', effect: 'increased_damage' }
    ];
    
    return this._randomFromArray(modifiers);
  }

  // 获取区域事件池
  _getAreaEvents(areaId) {
    const baseEvents = ['DEMON_DEAL', 'FATE_WHEEL', 'GAMBLER_GAME', 'CURSE_CONTRACT'];
    
    const areaSpecificEvents = {
      'CASINO_ENTRANCE': ['WELCOME_BONUS', 'NEWBIE_LUCK'],
      'CHEATERS_DEN': ['CHEAT_DETECTION', 'TRAP_ROOM'],
      'MECHANICAL_FLOOR': ['SYSTEM_GLITCH', 'FAIRNESS_TEST'],
      'DEMON_VAULT': ['DEBT_OFFER', 'SOUL_TRADE'],
      'FATE_ARENA': ['FINAL_WAGER', 'DESTINY_CHOICE']
    };
    
    return [...baseEvents, ...(areaSpecificEvents[areaId] || [])];
  }

  // 获取区域Boss
  _getAreaBoss(areaConfig) {
    const bossMap = {
      'CASINO_ENTRANCE': 'JOKER_GAMBLER',
      'CHEATERS_DEN': 'CHEAT',
      'MECHANICAL_FLOOR': 'MECHANICAL_JUDGE',
      'DEMON_VAULT': 'DEMON_DEALER',
      'FATE_ARENA': 'FATE_MASTER'
    };
    
    return bossMap[areaConfig.id] || 'JOKER_GAMBLER';
  }

  // 连接层
  _connectLayers(prevLayer, currentLayer) {
    for (const currentNode of currentLayer) {
      // 每个节点连接1-2个上层节点
      const connectionCount = Math.min(
        this._randomRange(1, 2),
        prevLayer.length
      );
      
      const shuffled = [...prevLayer].sort(() => Math.random() - 0.5);
      const connections = shuffled.slice(0, connectionCount);
      
      for (const prevNode of connections) {
        prevNode.connections.push(currentNode.id);
        currentNode.connections.push(prevNode.id);
      }
    }
  }

  // 计算X坐标
  _calculateX(index, total) {
    const spacing = 80 / (total + 1);
    return 10 + spacing * (index + 1);
  }

  _randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // 获取当前可用节点
  getAvailableNodes(areaIndex) {
    const area = this.areas[areaIndex];
    if (!area) return [];
    
    return area.nodes.filter(node => node.available);
  }

  // 移动到节点
  moveToNode(areaIndex, nodeId) {
    const area = this.areas[areaIndex];
    if (!area) return false;
    
    const targetNode = area.nodes.find(n => n.id === nodeId);
    if (!targetNode || !targetNode.available) return false;
    
    // 标记当前节点为已访问
    const currentNode = area.nodes.find(n => n.id === area.currentNode);
    if (currentNode) {
      currentNode.visited = true;
      currentNode.available = false;
    }
    
    // 更新当前节点
    area.currentNode = nodeId;
    targetNode.visited = true;
    targetNode.available = false;
    
    // 解锁下一层节点
    this._unlockNextLayer(area, targetNode);
    
    return true;
  }

  // 解锁下一层
  _unlockNextLayer(area, currentNode) {
    // 找到当前层索引
    let currentLayerIndex = -1;
    for (let i = 0; i < area.layers.length; i++) {
      if (area.layers[i].some(n => n.id === currentNode.id)) {
        currentLayerIndex = i;
        break;
      }
    }
    
    // 解锁下一层
    if (currentLayerIndex >= 0 && currentLayerIndex < area.layers.length - 1) {
      const nextLayer = area.layers[currentLayerIndex + 1];
      for (const node of nextLayer) {
        if (node.connections.includes(currentNode.id)) {
          node.available = true;
        }
      }
    }
  }

  // 获取地图数据（用于渲染）
  getMapData() {
    return this.areas.map(area => ({
      config: area.config,
      nodes: area.nodes.map(node => ({
        id: node.id,
        type: node.type,
        x: node.x,
        y: node.y,
        visited: node.visited,
        available: node.available,
        connections: node.connections
      })),
      currentNode: area.currentNode
    }));
  }
}

// ==================== 地图渲染数据 ====================

const NODE_ICONS = {
  [NodeType.START]: '🚪',
  [NodeType.BATTLE]: '⚔️',
  [NodeType.ELITE]: '👹',
  [NodeType.BOSS]: '👑',
  [NodeType.SHOP]: '🏪',
  [NodeType.EVENT]: '❓',
  [NodeType.REST]: '🔥',
  [NodeType.TREASURE]: '💎',
  [NodeType.MYSTERY]: '❔'
};

const NODE_COLORS = {
  [NodeType.START]: '#00FF00',
  [NodeType.BATTLE]: '#FF6B6B',
  [NodeType.ELITE]: '#FF0000',
  [NodeType.BOSS]: '#FFD700',
  [NodeType.SHOP]: '#4ECDC4',
  [NodeType.EVENT]: '#9B59B6',
  [NodeType.REST]: '#F39C12',
  [NodeType.TREASURE]: '#3498DB',
  [NodeType.MYSTERY]: '#95A5A6'
};

module.exports = {
  NodeType,
  AreaTheme,
  MapGenerator,
  NODE_ICONS,
  NODE_COLORS
};
