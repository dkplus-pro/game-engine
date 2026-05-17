import { defineComponent, type ComponentType } from '@game-engine/core';

export interface TransformData {
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export const Transform: ComponentType<TransformData> = defineComponent<TransformData>();

export function createTransform(x: number, y: number, options?: Partial<TransformData>): TransformData {
  return {
    x,
    y,
    rotation: options?.rotation ?? 0,
    scaleX: options?.scaleX ?? 1,
    scaleY: options?.scaleY ?? 1,
  };
}