/**
 * GameMain 游戏主入口
 *
 * Cocos Creator 3.x 组件
 * 负责初始化游戏系统和启动战斗
 */

import { _decorator, Component, Node, director, instantiate, Prefab, Label, Color, Sprite, UITransform, Vec3, Button, EventTouch } from 'cc';
import { Entity } from './entities/Entity';
import { getBattleManager } from './managers/BattleManager';
import { getCardSystem } from './systems/CardSystem';
import { getEffectSystem } from './systems/EffectSystem';
import { getRollSystem } from './systems/RollSystem';
import { getStartingDeck, getEnemyDeck } from './data/CardDatabase';
import { EntityType, BattleEventType, CardInstance, BattlePhase, EntityStats } from './types/GameTypes';
import { generateId } from './utils/Utils';

const { ccclass, property } = _decorator;

@ccclass('GameMain')
export class GameMain extends Component {
    // UI 节点引用
    @property(Node)
    playerArea: Node | null = null;

    @property(Node)
    enemyArea: Node | null = null;

    @property(Node)
    handArea: Node | null = null;

    @property(Node)
    battleLogArea: Node | null = null;

    @property(Node)
    rollDisplayArea: Node | null = null;

    // 预制体
    @property(Prefab)
    cardPrefab: Prefab | null = null;

    @property(Prefab)
    entityDisplayPrefab: Prefab | null = null;

    // 内部状态
    private _player: Entity | null = null;
    private _enemy: Entity | null = null;
    private _battleLog: string[] = [];
    private _maxLogLines: number = 20;
    private _cardNodes: Map<string, Node> = new Map();

    onLoad() {
        console.log('[GameMain] 游戏加载');
        this._initSystems();
        this._createUI();
        this._startBattle();
    }

    onDestroy() {
        console.log('[GameMain] 游戏销毁');
        this._cleanupSystems();
    }

    /**
     * 初始化所有系统
     */
    private _initSystems(): void {
        // 初始化各个系统（单例模式会自动创建）
        getRollSystem();
        getEffectSystem();
        getCardSystem();
        getBattleManager();

        console.log('[GameMain] 所有系统初始化完成');
    }

    /**
     * 清理系统
     */
    private _cleanupSystems(): void {
        getBattleManager().reset();
        getCardSystem().reset();
        getEffectSystem().reset();
        getRollSystem().reset();
    }

    /**
     * 创建基础UI
     */
    private _createUI(): void {
        // 创建玩家区域
        if (this.playerArea) {
            this._createEntityDisplay(this.playerArea, '玩家', Color.GREEN);
        }

        // 创建敌人区域
        if (this.enemyArea) {
            this._createEntityDisplay(this.enemyArea, '敌人', Color.RED);
        }

        // 创建手牌区域背景
        if (this.handArea) {
            this._createHandAreaBackground();
        }

        // 创建战斗日志区域
        if (this.battleLogArea) {
            this._createBattleLogBackground();
        }

        // 创建Roll点显示区域
        if (this.rollDisplayArea) {
            this._createRollDisplayBackground();
        }
    }

    /**
     * 创建实体显示
     */
    private _createEntityDisplay(parent: Node, name: string, color: Color): void {
        // 创建实体节点
        const entityNode = new Node(name);
        entityNode.setParent(parent);

        // 添加背景方块
        const bg = entityNode.addComponent(Sprite);
        bg.color = color;

        const transform = entityNode.addComponent(UITransform);
        transform.setContentSize(150, 200);

        // 创建名称标签
        const nameLabel = this._createLabel(name, 20, new Vec3(0, 80, 0));
        nameLabel.setParent(entityNode);
        nameLabel.name = 'NameLabel';

        // 创建生命值标签
        const hpLabel = this._createLabel('HP: 100/100', 16, new Vec3(0, 40, 0));
        hpLabel.setParent(entityNode);
        hpLabel.name = 'HPLabel';

        // 创建能量标签
        const energyLabel = this._createLabel('Energy: 3/3', 16, new Vec3(0, 10, 0));
        energyLabel.setParent(entityNode);
        energyLabel.name = 'EnergyLabel';

        // 创建护盾标签
        const shieldLabel = this._createLabel('Shield: 0', 16, new Vec3(0, -20, 0));
        shieldLabel.setParent(entityNode);
        shieldLabel.name = 'ShieldLabel';

        // 创建效果标签
        const effectLabel = this._createLabel('Effects: None', 14, new Vec3(0, -60, 0));
        effectLabel.setParent(entityNode);
        effectLabel.name = 'EffectLabel';
    }

    /**
     * 创建标签
     */
    private _createLabel(text: string, fontSize: number, position: Vec3): Node {
        const node = new Node('Label');
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = Color.WHITE;
        node.setPosition(position);
        return node;
    }

    /**
     * 创建手牌区域背景
     */
    private _createHandAreaBackground(): void {
        if (!this.handArea) return;

        const bg = this.handArea.addComponent(Sprite);
        bg.color = new Color(50, 50, 50, 200);

        const transform = this.handArea.addComponent(UITransform);
        transform.setContentSize(800, 150);

        // 添加标题
        const title = this._createLabel('手牌区域', 18, new Vec3(0, 60, 0));
        title.setParent(this.handArea);
    }

    /**
     * 创建战斗日志背景
     */
    private _createBattleLogBackground(): void {
        if (!this.battleLogArea) return;

        const bg = this.battleLogArea.addComponent(Sprite);
        bg.color = new Color(30, 30, 30, 255);

        const transform = this.battleLogArea.addComponent(UITransform);
        transform.setContentSize(300, 400);

        // 添加标题
        const title = this._createLabel('战斗日志', 18, new Vec3(0, 180, 0));
        title.setParent(this.battleLogArea);

        // 创建日志内容节点
        const logContent = new Node('LogContent');
        logContent.setParent(this.battleLogArea);
        logContent.setPosition(0, 0, 0);

        const logLabel = logContent.addComponent(Label);
        logLabel.string = '战斗开始...';
        logLabel.fontSize = 12;
        logLabel.color = Color.WHITE;
        logLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
        logLabel.verticalAlign = Label.VerticalAlign.TOP;
        logLabel.enableWrapText = true;

        const logTransform = logContent.addComponent(UITransform);
        logTransform.setContentSize(280, 350);
    }

    /**
     * 创建Roll点显示背景
     */
    private _createRollDisplayBackground(): void {
        if (!this.rollDisplayArea) return;

        const bg = this.rollDisplayArea.addComponent(Sprite);
        bg.color = new Color(100, 100, 100, 255);

        const transform = this.rollDisplayArea.addComponent(UITransform);
        transform.setContentSize(200, 100);

        // 添加Roll点显示标签
        const rollLabel = this._createLabel('Roll: ?', 24, new Vec3(0, 0, 0));
        rollLabel.setParent(this.rollDisplayArea);
        rollLabel.name = 'RollLabel';
    }

    /**
     * 开始战斗
     */
    private _startBattle(): void {
        // 创建玩家实体
        const playerStats: EntityStats = {
            maxHealth: 80,
            currentHealth: 80,
            maxEnergy: 3,
            currentEnergy: 3,
            shield: 0
        };

        this._player = new Entity({
            id: generateId(),
            name: '勇者',
            type: EntityType.PLAYER,
            baseStats: playerStats,
            deck: getStartingDeck()
        });

        // 创建敌人实体
        const enemyStats: EntityStats = {
            maxHealth: 60,
            currentHealth: 60,
            maxEnergy: 3,
            currentEnergy: 3,
            shield: 0
        };

        this._enemy = new Entity({
            id: generateId(),
            name: '哥布林',
            type: EntityType.ENEMY,
            baseStats: enemyStats,
            deck: getEnemyDeck()
        });

        // 注册战斗事件监听
        this._registerBattleEvents();

        // 开始战斗
        getBattleManager().startBattle({
            player: this._player,
            enemy: this._enemy,
            drawCountPerTurn: 5,
            firstTurn: EntityType.PLAYER
        });

        // 更新UI
        this._updateEntityUI();
        this._updateHandUI();
    }

    /**
     * 注册战斗事件
     */
    private _registerBattleEvents(): void {
        const battleManager = getBattleManager();

        battleManager.addEventListener(BattleEventType.BATTLE_START, (event) => {
            this._addBattleLog('战斗开始！');
        });

        battleManager.addEventListener(BattleEventType.TURN_START, (event) => {
            this._addBattleLog(`--- 回合 ${event.data.turnNumber} ---`);
            this._updateEntityUI();
            this._updateHandUI();
        });

        battleManager.addEventListener(BattleEventType.CARD_PLAYED, (event) => {
            this._addBattleLog(`${event.data.user.name} 使用了 ${event.data.card.name}`);
        });

        battleManager.addEventListener(BattleEventType.ROLL_COMPLETED, (event) => {
            this._showRollResult(event.data.playerRoll, event.data.enemyRoll);
        });

        battleManager.addEventListener(BattleEventType.DAMAGE_DEALT, (event) => {
            const target = event.data.target === this._player?.id ? '玩家' : '敌人';
            this._addBattleLog(`${target} 受到 ${event.data.damage} 点伤害`);
            this._updateEntityUI();
        });

        battleManager.addEventListener(BattleEventType.EFFECT_APPLIED, (event) => {
            this._addBattleLog(`效果: ${event.data.effect.type}`);
            this._updateEntityUI();
        });

        battleManager.addEventListener(BattleEventType.ENTITY_DIED, (event) => {
            this._addBattleLog(`${event.data.entity.name} 被击败！`);
        });

        battleManager.addEventListener(BattleEventType.BATTLE_END, (event) => {
            const winner = event.data.winner === EntityType.PLAYER ? '玩家' : '敌人';
            this._addBattleLog(`战斗结束！胜者: ${winner}`);
        });
    }

    /**
     * 更新实体UI
     */
    private _updateEntityUI(): void {
        if (this._player && this.playerArea) {
            this._updateEntityDisplay(this.playerArea, this._player);
        }

        if (this._enemy && this.enemyArea) {
            this._updateEntityDisplay(this.enemyArea, this._enemy);
        }
    }

    /**
     * 更新实体显示
     */
    private _updateEntityDisplay(area: Node, entity: Entity): void {
        const status = entity.getStatus();

        const hpLabel = area.getChildByName('HPLabel')?.getComponent(Label);
        if (hpLabel) {
            hpLabel.string = `HP: ${status.health}/${status.maxHealth}`;
        }

        const energyLabel = area.getChildByName('EnergyLabel')?.getComponent(Label);
        if (energyLabel) {
            energyLabel.string = `Energy: ${status.energy}/${status.maxEnergy}`;
        }

        const shieldLabel = area.getChildByName('ShieldLabel')?.getComponent(Label);
        if (shieldLabel) {
            shieldLabel.string = `Shield: ${status.shield}`;
        }

        const effectLabel = area.getChildByName('EffectLabel')?.getComponent(Label);
        if (effectLabel) {
            const effects = getEffectSystem().getEntityEffects(entity.id);
            if (effects.length === 0) {
                effectLabel.string = 'Effects: None';
            } else {
                const effectNames = effects.map(e => e.type).join(', ');
                effectLabel.string = `Effects: ${effectNames}`;
            }
        }
    }

    /**
     * 更新手牌UI
     */
    private _updateHandUI(): void {
        if (!this.handArea || !this._player) return;

        // 清除旧的手牌显示
        this._cardNodes.forEach(node => node.destroy());
        this._cardNodes.clear();

        // 获取当前手牌
        const hand = getCardSystem().getHand(this._player.id);

        // 创建卡牌显示
        const startX = -(hand.length * 80) / 2 + 40;
        hand.forEach((card, index) => {
            const cardNode = this._createCardNode(card, index);
            cardNode.setParent(this.handArea);
            cardNode.setPosition(startX + index * 80, 0, 0);
            this._cardNodes.set(card.instanceId, cardNode);
        });
    }

    /**
     * 创建卡牌节点
     */
    private _createCardNode(card: CardInstance, index: number): Node {
        const cardNode = new Node(`Card_${card.data.name}`);

        // 添加背景
        const bg = cardNode.addComponent(Sprite);
        bg.color = this._getCardColor(card.data.type);

        const transform = cardNode.addComponent(UITransform);
        transform.setContentSize(70, 100);

        // 添加名称标签
        const nameLabel = this._createLabel(card.data.name.substring(0, 4), 12, new Vec3(0, 35, 0));
        nameLabel.setParent(cardNode);

        // 添加能量消耗标签
        const costLabel = this._createLabel(`${card.data.energyCost}`, 14, new Vec3(-25, 40, 0));
        costLabel.setParent(cardNode);

        // 添加基础值标签
        const valueLabel = this._createLabel(`${card.data.baseValue}`, 16, new Vec3(0, 0, 0));
        valueLabel.setParent(cardNode);

        // 添加Roll范围标签
        const rollLabel = this._createLabel(
            `${card.data.rollRange.min}-${card.data.rollRange.max}`,
            12,
            new Vec3(0, -35, 0)
        );
        rollLabel.setParent(cardNode);

        // 添加点击事件
        const button = cardNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.9;

        // 绑定点击回调
        cardNode.on(Node.EventType.TOUCH_END, () => {
            this._onCardClick(card.instanceId);
        });

        return cardNode;
    }

    /**
     * 获取卡牌颜色
     */
    private _getCardColor(type: string): Color {
        switch (type) {
            case 'ATTACK':
                return new Color(200, 50, 50, 255);
            case 'DEFENSE':
                return new Color(50, 50, 200, 255);
            case 'SKILL':
                return new Color(50, 150, 50, 255);
            case 'POWER':
                return new Color(150, 50, 150, 255);
            default:
                return Color.GRAY;
        }
    }

    /**
     * 卡牌点击处理
     */
    private _onCardClick(cardInstanceId: string): void {
        if (!this._player) return;

        const success = getBattleManager().playerSelectCard(cardInstanceId);

        if (success) {
            this._addBattleLog(`你选择了卡牌`);

            // 高亮选中的卡牌
            this._cardNodes.forEach((node, id) => {
                const bg = node.getComponent(Sprite);
                if (bg) {
                    bg.color = id === cardInstanceId
                        ? Color.YELLOW
                        : this._getCardColor(getCardSystem().getCardByInstanceId(this._player!.id, id)?.data.type || '');
                }
            });
        } else {
            this._addBattleLog('无法使用该卡牌');
        }
    }

    /**
     * 显示Roll点结果
     */
    private _showRollResult(playerRoll: number, enemyRoll: number): void {
        if (!this.rollDisplayArea) return;

        const rollLabel = this.rollDisplayArea.getChildByName('RollLabel')?.getComponent(Label);
        if (rollLabel) {
            rollLabel.string = `玩家: ${playerRoll}\n敌人: ${enemyRoll}`;
        }
    }

    /**
     * 添加战斗日志
     */
    private _addBattleLog(message: string): void {
        this._battleLog.push(message);

        // 限制日志行数
        if (this._battleLog.length > this._maxLogLines) {
            this._battleLog.shift();
        }

        // 更新日志显示
        this._updateBattleLogUI();
    }

    /**
     * 更新战斗日志UI
     */
    private _updateBattleLogUI(): void {
        if (!this.battleLogArea) return;

        const logContent = this.battleLogArea.getChildByName('LogContent');
        if (!logContent) return;

        const logLabel = logContent.getComponent(Label);
        if (logLabel) {
            logLabel.string = this._battleLog.join('\n');
        }
    }

    /**
     * 跳过出牌按钮
     */
    public onSkipButtonClick(): void {
        getBattleManager().playerSkipCard();
        this._addBattleLog('你跳过了出牌');
    }

    /**
     * 重新开始按钮
     */
    public onRestartButtonClick(): void {
        // 重置所有系统
        this._cleanupSystems();

        // 清除UI
        this._cardNodes.forEach(node => node.destroy());
        this._cardNodes.clear();
        this._battleLog = [];

        // 重新开始
        this._initSystems();
        this._startBattle();
    }
}
