import type { World } from '../ecs/World';

export interface GameLoopOptions {
  /** Target FPS, 0 = uncapped (runs every rAF) */
  fps?: number;
  /** Callback when loop starts/stops, useful for pausing when tab hidden */
  onVisibilityChange?: (running: boolean) => void;
}

export class GameLoop {
  private world: World;
  private fps: number;
  private frameInterval: number;
  private lastTime = 0;
  private rafId: number | null = null;
  private running = false;

  constructor(world: World, options: GameLoopOptions = {}) {
    this.world = world;
    this.fps = options.fps ?? 60;
    this.frameInterval = this.fps > 0 ? 1000 / this.fps : 0;

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
      const dt = elapsed / 1000;
      this.lastTime = timestamp - (this.frameInterval > 0 ? elapsed % this.frameInterval : 0);
      this.world.update(dt);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}