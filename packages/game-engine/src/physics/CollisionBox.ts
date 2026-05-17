import { defineComponent, type ComponentType } from '../ecs/Component';

export interface CollisionBoxData {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  layer: number;
}

export function createCollisionBox(
  width: number,
  height: number,
  options?: Partial<CollisionBoxData>,
): CollisionBoxData {
  return {
    offsetX: options?.offsetX ?? 0,
    offsetY: options?.offsetY ?? 0,
    width,
    height,
    layer: options?.layer ?? 0,
  };
}

export const CollisionBox: ComponentType<CollisionBoxData> = defineComponent<CollisionBoxData>();