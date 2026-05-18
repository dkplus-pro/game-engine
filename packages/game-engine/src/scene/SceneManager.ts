import type { World } from '../ecs/World';
import type { System } from '../ecs/System';
import type { TransitionEffect } from './Transition';
import { Scene } from './Scene';

export class SceneManager {
  private world: World;
  private sceneStack: Scene[] = [];
  private currentScene: Scene | null = null;
  private sceneRegistry: Map<string, Scene> = new Map();
  private transition?: TransitionEffect;

  constructor(world: World) {
    this.world = world;
  }

  register(name: string, config: any): void {
    const scene = new Scene(name, config);
    this.sceneRegistry.set(name, scene);
  }

  private destroyCurrentScene(): void {
    if (this.currentScene) {
      this.currentScene.config.onDestroy?.(this.world);
      this.currentScene.setActive(false);
      this.currentScene = null;
    }
  }

  private activateScene(scene: Scene, data?: any): void {
    scene.setActive(true);
    scene.config.onCreate?.(this.world, data);
    scene.config.onResume?.(this.world);
    this.currentScene = scene;
  }

  load(name: string, data?: Record<string, any>): void {
    const scene = this.sceneRegistry.get(name);
    if (!scene) {
      throw new Error(`Scene "${name}" is not registered`);
    }

    if (this.transition && this.currentScene) {
      this.transition.onExit?.(this.getCanvasContext(), 0);
    }

    this.destroyCurrentScene();
    this.activateScene(scene, data);

    if (this.transition) {
      this.transition.onEnter?.(this.getCanvasContext(), 1);
    }
  }

  push(name: string, data?: Record<string, any>): void {
    if (this.currentScene) {
      this.currentScene.config.onPause?.(this.world);
      this.sceneStack.push(this.currentScene);
    }
    this.load(name, data);
  }

  pop(data?: Record<string, any>): void {
    if (this.sceneStack.length === 0) {
      throw new Error('Scene stack is empty, cannot pop');
    }

    const scene = this.sceneStack.pop()!;
    this.destroyCurrentScene();
    this.activateScene(scene, data);
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  getSceneStack(): Scene[] {
    return [...this.sceneStack];
  }

  setTransition(effect: TransitionEffect): void {
    this.transition = effect;
  }

  private getCanvasContext(): CanvasRenderingContext2D {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element with id "gameCanvas" not found');
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    return ctx;
  }
}