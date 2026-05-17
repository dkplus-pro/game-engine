import type { ComponentType } from './Component';
import type { World } from './World';

export abstract class System {
  /** Component types this system operates on */
  abstract readonly query: ComponentType[];

  /** Whether this system is active (will be called each frame) */
  enabled = true;

  abstract update(world: World, dt: number): void;
}