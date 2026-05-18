import { defineComponent, type ComponentType } from '@game-engine/core';

export interface SpriteData {
  color: string;
  width: number;
  height: number;
  zIndex?: number;
  image?: HTMLImageElement;
}

export const Sprite: ComponentType<SpriteData> = defineComponent<SpriteData>();

export function createSprite(color: string, width: number, height: number, options?: Partial<SpriteData>): SpriteData {
  return {
    color,
    width,
    height,
    zIndex: options?.zIndex ?? 0,
    image: options?.image,
  };
}
