/**
 * CardSystem 卡牌系统
 *
 * 职责：
 * 1. 管理牌组（抽牌堆、手牌、弃牌堆、消耗堆）
 * 2. 处理抽牌、弃牌、消耗等操作
 * 3. 创建卡牌实例
 * 4. 管理卡牌能量消耗
 *
 * 牌组流程：
 * 抽牌堆 -> 手牌 -> 弃牌堆
 *          -> 消耗堆（某些卡牌）
 */

import {
    CardData,
    CardInstance,
    CardType,
    EffectType,
    EffectTrigger
} from '../types/GameTypes';
import { generateId, shuffle, deepClone } from '../utils/Utils';

/**
 * 抽牌结果
 */
export interface DrawResult {
    success: boolean;
    cards: CardInstance[];
    deckEmpty: boolean;          // 抽牌堆是否被抽空
}

/**
 * 使用卡牌结果
 */
export interface UseCardResult {
    success: boolean;
    card: CardInstance | null;
    reason?: string;             // 失败原因
}

export class CardSystem {
    private static _instance: CardSystem | null = null;

    // 实体牌组数据
    private _entityDecks: Map<string, EntityDeck> = new Map();

    // 默认手牌上限
    private _defaultHandLimit: number = 10;

    public static getInstance(): CardSystem {
        if (!CardSystem._instance) {
            CardSystem._instance = new CardSystem();
        }
        return CardSystem._instance;
    }

    private constructor() {
        console.log('[CardSystem] 初始化');
    }

    /**
     * 注册实体牌组
     *
     * @param entityId 实体ID
     * @param deck 初始牌组（CardData数组）
     */
    public registerDeck(entityId: string, deck: CardData[]): void {
        const entityDeck: EntityDeck = {
            entityId,
            drawPile: [],              // 抽牌堆
            hand: [],                  // 手牌
            discardPile: [],           // 弃牌堆
            exhaustPile: [],           // 消耗堆
            handLimit: this._defaultHandLimit
        };

        // 将CardData转换为CardInstance并放入抽牌堆
        entityDeck.drawPile = deck.map(cardData => this._createCardInstance(cardData));

        // 洗牌
        shuffle(entityDeck.drawPile);

        this._entityDecks.set(entityId, entityDeck);
        console.log(`[CardSystem] 注册牌组: ${entityId}, ${deck.length}张卡牌`);
    }

    /**
     * 注销实体牌组
     * @param entityId 实体ID
     */
    public unregisterDeck(entityId: string): void {
        this._entityDecks.delete(entityId);
        console.log(`[CardSystem] 注销牌组: ${entityId}`);
    }

    /**
     * 抽牌
     *
     * @param entityId 实体ID
     * @param count 抽牌数量
     * @returns 抽牌结果
     */
    public drawCards(entityId: string, count: number): DrawResult {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) {
            console.error(`[CardSystem] 实体 ${entityId} 未注册牌组`);
            return { success: false, cards: [], deckEmpty: false };
        }

        const drawnCards: CardInstance[] = [];
        let deckEmpty = false;

        for (let i = 0; i < count; i++) {
            // 检查手牌上限
            if (entityDeck.hand.length >= entityDeck.handLimit) {
                console.log(`[CardSystem] 手牌已满，无法继续抽牌`);
                break;
            }

            // 如果抽牌堆为空，将弃牌堆洗入抽牌堆
            if (entityDeck.drawPile.length === 0) {
                if (entityDeck.discardPile.length === 0) {
                    console.log(`[CardSystem] 无牌可抽`);
                    deckEmpty = true;
                    break;
                }

                // 弃牌堆洗入抽牌堆
                entityDeck.drawPile = [...entityDeck.discardPile];
                entityDeck.discardPile = [];
                shuffle(entityDeck.drawPile);
                console.log(`[CardSystem] 弃牌堆洗入抽牌堆: ${entityDeck.drawPile.length}张`);
            }

            // 从抽牌堆顶部抽一张
            const card = entityDeck.drawPile.pop()!;
            entityDeck.hand.push(card);
            drawnCards.push(card);

            console.log(`[CardSystem] 抽牌: ${card.data.name}`);
        }

        return {
            success: drawnCards.length > 0,
            cards: drawnCards,
            deckEmpty
        };
    }

    /**
     * 使用卡牌
     *
     * @param entityId 实体ID
     * @param cardInstanceId 卡牌实例ID
     * @param energyAvailable 当前可用能量
     * @returns 使用结果
     */
    public useCard(
        entityId: string,
        cardInstanceId: string,
        energyAvailable: number
    ): UseCardResult {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) {
            return { success: false, card: null, reason: '牌组不存在' };
        }

        // 在手牌中查找
        const cardIndex = entityDeck.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) {
            return { success: false, card: null, reason: '卡牌不在手牌中' };
        }

        const card = entityDeck.hand[cardIndex];

        // 检查能量
        if (card.data.energyCost > energyAvailable) {
            return { success: false, card: null, reason: '能量不足' };
        }

        // 从手牌移除
        entityDeck.hand.splice(cardIndex, 1);

        // 根据卡牌类型决定去向
        if (card.data.type === CardType.POWER) {
            // 能力牌直接消耗
            entityDeck.exhaustPile.push(card);
            console.log(`[CardSystem] 使用能力牌并消耗: ${card.data.name}`);
        } else {
            // 其他牌放入弃牌堆
            entityDeck.discardPile.push(card);
            console.log(`[CardSystem] 使用卡牌: ${card.data.name}`);
        }

        return { success: true, card };
    }

    /**
     * 弃掉手牌中的指定卡牌
     *
     * @param entityId 实体ID
     * @param cardInstanceId 卡牌实例ID
     * @returns 是否成功
     */
    public discardCard(entityId: string, cardInstanceId: string): boolean {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) return false;

        const cardIndex = entityDeck.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) return false;

        const card = entityDeck.hand.splice(cardIndex, 1)[0];
        entityDeck.discardPile.push(card);

        console.log(`[CardSystem] 弃牌: ${card.data.name}`);
        return true;
    }

    /**
     * 弃掉所有手牌
     * @param entityId 实体ID
     * @returns 弃掉的卡牌数量
     */
    public discardAllHand(entityId: string): number {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) return 0;

        const count = entityDeck.hand.length;
        entityDeck.discardPile.push(...entityDeck.hand);
        entityDeck.hand = [];

        console.log(`[CardSystem] 弃掉所有手牌: ${count}张`);
        return count;
    }

    /**
     * 消耗卡牌（直接从手牌移除，不进入弃牌堆）
     *
     * @param entityId 实体ID
     * @param cardInstanceId 卡牌实例ID
     * @returns 是否成功
     */
    public exhaustCard(entityId: string, cardInstanceId: string): boolean {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) return false;

        const cardIndex = entityDeck.hand.findIndex(c => c.instanceId === cardInstanceId);
        if (cardIndex === -1) return false;

        const card = entityDeck.hand.splice(cardIndex, 1)[0];
        entityDeck.exhaustPile.push(card);

        console.log(`[CardSystem] 消耗卡牌: ${card.data.name}`);
        return true;
    }

    /**
     * 添加卡牌到抽牌堆
     *
     * @param entityId 实体ID
     * @param cardData 卡牌数据
     * @param toTop 是否放到抽牌堆顶部
     */
    public addCardToDrawPile(entityId: string, cardData: CardData, toTop: boolean = false): void {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) return;

        const card = this._createCardInstance(cardData);

        if (toTop) {
            entityDeck.drawPile.push(card);
        } else {
            entityDeck.drawPile.unshift(card);
        }

        console.log(`[CardSystem] 添加卡牌到抽牌堆: ${card.data.name}`);
    }

    /**
     * 添加卡牌到手牌
     *
     * @param entityId 实体ID
     * @param cardData 卡牌数据
     * @returns 是否成功（可能因手牌上限失败）
     */
    public addCardToHand(entityId: string, cardData: CardData): boolean {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) return false;

        if (entityDeck.hand.length >= entityDeck.handLimit) {
            console.log(`[CardSystem] 手牌已满，无法添加`);
            return false;
        }

        const card = this._createCardInstance(cardData);
        entityDeck.hand.push(card);

        console.log(`[CardSystem] 添加卡牌到手牌: ${card.data.name}`);
        return true;
    }

    /**
     * 获取手牌
     * @param entityId 实体ID
     * @returns 手牌列表
     */
    public getHand(entityId: string): CardInstance[] {
        const entityDeck = this._entityDecks.get(entityId);
        return entityDeck ? [...entityDeck.hand] : [];
    }

    /**
     * 获取抽牌堆数量
     * @param entityId 实体ID
     * @returns 数量
     */
    public getDrawPileCount(entityId: string): number {
        const entityDeck = this._entityDecks.get(entityId);
        return entityDeck ? entityDeck.drawPile.length : 0;
    }

    /**
     * 获取弃牌堆数量
     * @param entityId 实体ID
     * @returns 数量
     */
    public getDiscardPileCount(entityId: string): number {
        const entityDeck = this._entityDecks.get(entityId);
        return entityDeck ? entityDeck.discardPile.length : 0;
    }

    /**
     * 获取消耗堆数量
     * @param entityId 实体ID
     * @returns 数量
     */
    public getExhaustPileCount(entityId: string): number {
        const entityDeck = this._entityDecks.get(entityId);
        return entityDeck ? entityDeck.exhaustPile.length : 0;
    }

    /**
     * 获取手牌数量
     * @param entityId 实体ID
     * @returns 数量
     */
    public getHandCount(entityId: string): number {
        const entityDeck = this._entityDecks.get(entityId);
        return entityDeck ? entityDeck.hand.length : 0;
    }

    /**
     * 设置手牌上限
     * @param entityId 实体ID
     * @param limit 上限
     */
    public setHandLimit(entityId: string, limit: number): void {
        const entityDeck = this._entityDecks.get(entityId);
        if (entityDeck) {
            entityDeck.handLimit = limit;
            console.log(`[CardSystem] 设置手牌上限: ${entityId} -> ${limit}`);
        }
    }

    /**
     * 洗牌（抽牌堆）
     * @param entityId 实体ID
     */
    public shuffleDrawPile(entityId: string): void {
        const entityDeck = this._entityDecks.get(entityId);
        if (entityDeck) {
            shuffle(entityDeck.drawPile);
            console.log(`[CardSystem] 洗牌: ${entityId}`);
        }
    }

    /**
     * 回合开始：抽初始手牌
     *
     * @param entityId 实体ID
     * @param drawCount 抽牌数量
     */
    public onTurnStart(entityId: string, drawCount: number = 5): DrawResult {
        console.log(`[CardSystem] 回合开始抽牌: ${entityId}, ${drawCount}张`);
        return this.drawCards(entityId, drawCount);
    }

    /**
     * 回合结束：弃掉所有手牌
     * @param entityId 实体ID
     */
    public onTurnEnd(entityId: string): void {
        console.log(`[CardSystem] 回合结束弃牌: ${entityId}`);
        this.discardAllHand(entityId);
    }

    /**
     * 获取卡牌实例（通过ID）
     * @param entityId 实体ID
     * @param cardInstanceId 卡牌实例ID
     * @returns 卡牌实例或null
     */
    public getCardByInstanceId(entityId: string, cardInstanceId: string): CardInstance | null {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) return null;

        // 在手牌中查找
        let card = entityDeck.hand.find(c => c.instanceId === cardInstanceId);
        if (card) return card;

        // 在抽牌堆中查找
        card = entityDeck.drawPile.find(c => c.instanceId === cardInstanceId);
        if (card) return card;

        // 在弃牌堆中查找
        card = entityDeck.discardPile.find(c => c.instanceId === cardInstanceId);
        if (card) return card;

        // 在消耗堆中查找
        card = entityDeck.exhaustPile.find(c => c.instanceId === cardInstanceId);
        return card || null;
    }

    /**
     * 重置牌组（重新洗牌，清空所有堆）
     * @param entityId 实体ID
     */
    public resetDeck(entityId: string): void {
        const entityDeck = this._entityDecks.get(entityId);
        if (!entityDeck) return;

        // 将所有卡牌收集起来
        const allCards = [
            ...entityDeck.hand,
            ...entityDeck.drawPile,
            ...entityDeck.discardPile,
            ...entityDeck.exhaustPile
        ];

        // 清空所有堆
        entityDeck.hand = [];
        entityDeck.drawPile = [];
        entityDeck.discardPile = [];
        entityDeck.exhaustPile = [];

        // 放入抽牌堆并洗牌
        entityDeck.drawPile = allCards.map(card => ({
            ...card,
            currentRoll: 0,
            isExhausted: false,
            isSelected: false
        }));
        shuffle(entityDeck.drawPile);

        console.log(`[CardSystem] 重置牌组: ${entityId}, ${allCards.length}张`);
    }

    /**
     * 重置系统
     */
    public reset(): void {
        this._entityDecks.clear();
        console.log('[CardSystem] 已重置');
    }

    /**
     * 创建卡牌实例（内部方法）
     * @param cardData 卡牌数据
     * @returns 卡牌实例
     */
    private _createCardInstance(cardData: CardData): CardInstance {
        return {
            instanceId: generateId(),
            data: deepClone(cardData),
            currentRoll: 0,
            isExhausted: false,
            isSelected: false
        };
    }

    /**
     * 销毁单例
     */
    public static destroy(): void {
        if (CardSystem._instance) {
            CardSystem._instance.reset();
            CardSystem._instance = null;
            console.log('[CardSystem] 单例已销毁');
        }
    }
}

/**
 * 实体牌组数据结构
 */
interface EntityDeck {
    entityId: string;
    drawPile: CardInstance[];        // 抽牌堆
    hand: CardInstance[];            // 手牌
    discardPile: CardInstance[];     // 弃牌堆
    exhaustPile: CardInstance[];     // 消耗堆
    handLimit: number;               // 手牌上限
}

// 导出便捷获取函数
export const getCardSystem = (): CardSystem => CardSystem.getInstance();
