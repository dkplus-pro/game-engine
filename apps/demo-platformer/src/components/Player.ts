import { defineComponent, type ComponentType } from '@game-engine/core';

export interface PlayerData {
  speed: number;
  jumpForce: number;
  groundY: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

export const Player: ComponentType<PlayerData> = defineComponent<PlayerData>();

export function createPlayer(speed: number, groundY: number, vx = 0, vy = 0): PlayerData {
  return { speed, jumpForce: 400, groundY, vx, vy, onGround: false };
}