import { defineComponent } from '@game-engine/core';

export const CANVAS_W = 800;
export const CANVAS_H = 600;
export const CELL = 24;
export const COLS = 26;
export const ROWS = 22;
export const GAME_W = COLS * CELL;
export const GAME_H = ROWS * CELL;
export const OFFSET_X = (CANVAS_W - GAME_W) / 2;
export const OFFSET_Y = 20;

export const TANK_SIZE = 44;
export const HALF_TANK = 22;
export const WALL_W = CELL * 2;
export const WALL_H = CELL * 2;
export const BULLET_SIZE = 8;

export const PLAYER_SPEED = 140;
export const ENEMY_SPEED = 80;
export const BULLET_SPEED = 300;
export const PLAYER_COLOR = '#ffcc00';
export const ENEMY_COLOR = '#e94560';
export const BRICK_COLOR = '#8b6914';
export const STEEL_COLOR = '#8888aa';
export const BASE_COLOR = '#00ff88';
export const BG_COLOR = '#1a1a2e';

export enum Dir { Up, Down, Left, Right }

export const DX: Record<Dir, number> = {
  [Dir.Up]: 0, [Dir.Down]: 0, [Dir.Left]: -1, [Dir.Right]: 1,
};
export const DY: Record<Dir, number> = {
  [Dir.Up]: -1, [Dir.Down]: 1, [Dir.Left]: 0, [Dir.Right]: 0,
};

export function isPerpendicular(a: Dir, b: Dir): boolean {
  return (a === Dir.Up || a === Dir.Down) !== (b === Dir.Up || b === Dir.Down);
}

export function wallCenter(col: number, row: number) {
  return {
    x: OFFSET_X + col * CELL + WALL_W / 2,
    y: OFFSET_Y + row * CELL + WALL_H / 2,
  };
}

export interface TankData {
  direction: Dir;
  health: number;
  speed: number;
  fireCooldown: number;
  fireRate: number;
  isPlayer: boolean;
}

export interface BulletData {
  dir: Dir;
  speed: number;
  isPlayer: boolean;
  lifetime: number;
  owner: number;
}

export interface WallData { brick: boolean }
export interface BaseData { alive: boolean }

export const Tank = defineComponent<TankData>();
export const BulletComponent = defineComponent<BulletData>();
export const WallComponent = defineComponent<WallData>();
export const BaseComponent = defineComponent<BaseData>();
