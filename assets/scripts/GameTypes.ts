/**
 * 游戏类型定义
 * 所有核心类型和接口
 */

import { _decorator, Component, Node, Label, Button, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;

// ==================== 实体类型 ====================

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY'
}

// ==================== 卡牌类型 ====================

export enum CardType {
  ATTACK = 'ATTACK',
  DEFENSE = 'DEFENSE',
  SKILL = 'SKILL',
  POWER = 'POWER'
}

export enum CardRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY'
}

// ==================== 效果类型 ====================

export enum EffectType {
  BLEEDING = 'BLEEDING',
  BURNING = 'BURNING',
  FREEZE = 'FREEZE',
  SHIELD = 'SHIELD',
  STRENGTH = 'STRENGTH',
  DEXTERITY = 'DEXTERITY',
  WEAK = 'WEAK',
  VULNERABLE = 'VULNERABLE',
  HEAL = 'HEAL',
  ENERGY = 'ENERGY',
  DRAW = 'DRAW',
  DAMAGE = 'DAMAGE',
  STUN = 'STUN'
}

export enum EffectTrigger {
  IMMEDIATE = 'IMMEDIATE',
  ON_TURN_START = 'ON_TURN_START',
  ON_TURN_END = 'ON_TURN_END',
  ON_DAMAGE_DEALT = 'ON_DAMAGE_DEALT',
  ON_DAMAGE_TAKEN = 'ON_DAMAGE_TAKEN'
}

// ==================== 战斗阶段 ====================

export enum BattlePhase {
  INIT = 'INIT',
  PLAYER_TURN = 'PLAYER_TURN',
  ENEMY_TURN = 'ENEMY_TURN',
  RESOLUTION = 'RESOLUTION',
  END = 'END'
}

// ==================== 战斗事件类型 ====================

export enum BattleEventType {
  BATTLE_START = 'BATTLE_START',
  BATTLE_END = 'BATTLE_END',
  TURN_START = 'TURN_START',
  TURN_END = 'TURN_END',
  CARD_SELECTED = 'CARD_SELECTED',
  CARD_REVEALED = 'CARD_REVEALED',
  ROLL_STARTED = 'ROLL_STARTED',
  ROLL_COMPLETED = 'ROLL_COMPLETED',
  RESOLUTION_COMPLETED = 'RESOLUTION_COMPLETED',
  DAMAGE_DEALT = 'DAMAGE_DEALT',
  DAMAGE_TAKEN = 'DAMAGE_TAKEN',
  HEAL_RECEIVED = 'HEAL_RECEIVED',
  EFFECT_APPLIED = 'EFFECT_APPLIED',
  EFFECT_TRIGGERED = 'EFFECT_TRIGGERED',
  EFFECT_EXPIRED = 'EFFECT_EXPIRED',
  ENTITY_DIED = 'ENTITY_DIED',
  ENERGY_CHANGED = 'ENERGY_CHANGED',
  SHIELD_CHANGED = 'SHIELD_CHANGED'
}

// ==================== 接口定义 ====================

export interface RollRange {
  min: number;
  max: number;
}

export interface EffectData {
  type: EffectType;
  value: number;
  duration: number;
  trigger: EffectTrigger;
}

export interface CardData {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  baseValue: number;
  rollRange: RollRange;
  energyCost: number;
  speed: number;
  effects: EffectData[];
}

export interface CardInstance extends CardData {
  instanceId: string;
}

export interface EntityStatus {
  id: string;
  name: string;
  type: EntityType;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  shield: number;
  isDead: boolean;
}

export interface BattleEvent {
  type: BattleEventType;
  data: any;
  timestamp: number;
}

export interface BattleConfig {
  player: any;
  enemy: any;
  drawCountPerTurn: number;
  maxTurns: number;
}

export interface PlayCardResult {
  playerCard: CardInstance | null;
  enemyCard: CardInstance | null;
  playerRoll: number;
  enemyRoll: number;
  playerFinalValue: number;
  enemyFinalValue: number;
  winner: EntityType | null;
  isCrit: { player: boolean; enemy: boolean };
  isDodge: { player: boolean; enemy: boolean };
  damageDealt: { player: number; enemy: number };
}

export interface FinalValueResult {
  baseValue: number;
  rollValue: number;
  buffBonus: number;
  statusBonus: number;
  speedBonus: number;
  finalValue: number;
  isCrit: boolean;
}

export interface RewardData {
  id: string;
  type: 'card' | 'gold' | 'relic' | 'heal';
  name: string;
  description: string;
  value: any;
  rarity: CardRarity;
}

export interface GameProgress {
  currentFloor: number;
  maxFloors: number;
  victories: number;
  defeats: number;
  gold: number;
  unlockedCards: string[];
}

// ==================== 颜色常量 ====================

export const GameColors = {
  // 职业颜色
  WARRIOR: new Color(255, 107, 107, 255),    // 红色
  MAGE: new Color(78, 205, 196, 255),        // 青色
  GAMBLER: new Color(255, 217, 61, 255),     // 金色
  ASSASSIN: new Color(155, 89, 182, 255),    // 紫色
  
  // 卡牌类型颜色
  ATTACK: new Color(231, 76, 60, 255),       // 红色
  DEFENSE: new Color(52, 152, 219, 255),     // 蓝色
  SKILL: new Color(46, 204, 113, 255),       // 绿色
  POWER: new Color(155, 89, 182, 255),       // 紫色
  
  // 稀有度颜色
  COMMON: new Color(189, 195, 199, 255),     // 灰色
  UNCOMMON: new Color(46, 204, 113, 255),    // 绿色
  RARE: new Color(52, 152, 219, 255),        // 蓝色
  LEGENDARY: new Color(241, 196, 15, 255),   // 金色
  
  // UI颜色
  HP: new Color(231, 76, 60, 255),           // 红色
  ENERGY: new Color(241, 196, 15, 255),      // 黄色
  SHIELD: new Color(52, 152, 219, 255),      // 蓝色
  TEXT: new Color(255, 255, 255, 255),       // 白色
  TEXT_DARK: new Color(44, 62, 80, 255),     // 深色
  BACKGROUND: new Color(26, 26, 46, 255),    // 深蓝背景
  
  // 效果颜色
  BLEEDING: new Color(192, 57, 43, 255),     // 深红
  BURNING: new Color(230, 126, 34, 255),     // 橙色
  FREEZE: new Color(52, 152, 219, 255),      // 蓝色
  STRENGTH: new Color(231, 76, 60, 255),     // 红色
  DEXTERITY: new Color(46, 204, 113, 255)    // 绿色
};

// ==================== 工具函数 ====================

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ==================== 卡牌类型图标 ====================

export const CardTypeIcons: Record<CardType, string> = {
  [CardType.ATTACK]: '⚔️',
  [CardType.DEFENSE]: '🛡️',
  [CardType.SKILL]: '✨',
  [CardType.POWER]: '💪'
};

// ==================== 效果描述 ====================

export const EffectDescriptions: Record<EffectType, string> = {
  [EffectType.BLEEDING]: '流血',
  [EffectType.BURNING]: '点燃',
  [EffectType.FREEZE]: '冻结',
  [EffectType.SHIELD]: '护盾',
  [EffectType.STRENGTH]: '力量',
  [EffectType.DEXTERITY]: '敏捷',
  [EffectType.WEAK]: '虚弱',
  [EffectType.VULNERABLE]: '易伤',
  [EffectType.HEAL]: '治疗',
  [EffectType.ENERGY]: '能量',
  [EffectType.DRAW]: '抽牌',
  [EffectType.DAMAGE]: '伤害',
  [EffectType.STUN]: '眩晕'
};
