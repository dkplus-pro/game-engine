import { System, type Entity, type World } from '@game-engine/core';
import { Transform, type TransformData } from '@game-engine/renderer-canvas';

export interface VelocityData {
  vx: number;
  vy: number;
}

import { defineComponent, type ComponentType } from '@game-engine/core';
export const Velocity: ComponentType<VelocityData> = defineComponent<VelocityData>();

export function createVelocity(vx: number, vy: number): VelocityData {
  return { vx, vy };
}

export class MovementSystem extends System {
  readonly query = [Transform, Velocity];
  private bounds: { width: number; height: number };

  constructor(bounds: { width: number; height: number }) {
    super();
    this.bounds = bounds;
  }

  update(world: World, dt: number): void {
    const entities = world.query(this.query);

    for (const entity of entities) {
      const transform = world.getComponent<TransformData>(entity, Transform)!;
      const velocity = world.getComponent<VelocityData>(entity, Velocity)!;

      // Update position based on velocity and dt
      transform.x += velocity.vx * dt;
      transform.y += velocity.vy * dt;

      // Bounce off bounds (accounting for entity size - assume 50x50)
      const halfWidth = 25;
      const halfHeight = 25;

      if (transform.x - halfWidth < 0 || transform.x + halfWidth > this.bounds.width) {
        velocity.vx *= -1;
        transform.x = Math.max(halfWidth, Math.min(this.bounds.width - halfWidth, transform.x));
      }

      if (transform.y - halfHeight < 0 || transform.y + halfHeight > this.bounds.height) {
        velocity.vy *= -1;
        transform.y = Math.max(halfHeight, Math.min(this.bounds.height - halfHeight, transform.y));
      }
    }
  }
}