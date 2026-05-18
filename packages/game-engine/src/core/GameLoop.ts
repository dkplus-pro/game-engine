import type { World } from '../ecs/World';
import { Stats } from '../debug/Stats';
import type { TransitionEffect } from '../scene/Transition';

export interface GameLoopOptions {
  fps?: number;
  onVisibilityChange?: (running: boolean) => void;
  stats?: Stats;
  transition?: TransitionEffect;
}

export class GameLoop {
  private world: World;
  private fps: number;
  private frameInterval: number;
  private lastTime = 0;
  private rafId: number | null = null;
  private running = false;
  private stats: Stats | null;
  private transition?: TransitionEffect;

  constructor(world: World, options: GameLoopOptions = {}) {
    this.world = world;
    this.fps = options.fps ?? 60;
    this.frameInterval = this.fps > 0 ? 1000 / this.fps : 0;
    this.stats = options.stats ?? null;
    this.transition = options.transition;

    if (options.onVisibilityChange) {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.running) {
          this.stop();
          options.onVisibilityChange!(false);
        } else if (!document.hidden && !this.running) {
          this.start();
          options.onVisibilityChange!(true);
        }
      });
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return;

    const elapsed = timestamp - this.lastTime;

    if (this.frameInterval === 0 || elapsed >= this.frameInterval) {
      if (this.stats) this.stats.beginFrame(timestamp);

      const dt = elapsed / 1000;
      this.lastTime = timestamp - (this.frameInterval > 0 ? elapsed % this.frameInterval : 0);

      if (this.transition && this.currentTransitionProgress !== undefined) {
        this.world.clearEntities();
        this.transition.onEnter?.(this.getCanvasContext(), this.currentTransitionProgress);
        if (this.currentTransitionProgress >= 1) {
          this.currentTransitionProgress = undefined;
        }
      } else {
        this.world.update(dt);
      }

      if (this.stats) this.stats.update(timestamp);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private currentTransitionProgress: number | undefined;

  startTransition(duration: number): void {
    if (!this.transition) return;
    this.currentTransitionProgress = 0;
    const step = 16 / (duration * 1000);

    const animate = (timestamp: number): void => {
      if (this.currentTransitionProgress !== undefined) {
        this.currentTransitionProgress = Math.min(1, this.currentTransitionProgress + step);
        this.getCanvasContext().clearRect(0, 0, this.getCanvasContext().canvas.width, this.getCanvasContext().canvas.height);
        this.transition.onEnter?.(this.getCanvasContext(), this.currentTransitionProgress);

        if (this.currentTransitionProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.currentTransitionProgress = undefined;
          this.world.update(0);
        }
      }
    };

    requestAnimationFrame(animate);
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
