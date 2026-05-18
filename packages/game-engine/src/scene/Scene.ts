import type { System } from '../ecs/System';
import type { World } from '../ecs/World';

export interface SceneConfig {
  name: string;
  onCreate?: (world: World, data?: Record<string, any>) => void;
  onResume?: (world: World) => void;
  onPause?: (world: World) => void;
  onDestroy?: (world: World) => void;
  resources?: string[];
}

export class Scene {
  readonly name: string;
  readonly config: SceneConfig;
  readonly systems: System[] = [];
  private _isActive = false;

  constructor(name: string, config: SceneConfig) {
    this.name = name;
    this.config = config;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  setActive(active: boolean): void {
    this._isActive = active;
  }

  hasResource(resource: string): boolean {
    return this.config.resources?.includes(resource) ?? false;
  }
}