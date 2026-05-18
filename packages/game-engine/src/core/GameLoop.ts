import type { World } from '../ecs/World';
import { Stats } from '../debug/Stats';

export interface GameLoopOptions {
  fps?: number;
  onVisibilityChange?: (running: boolean) => void;
  stats?: Stats;
}

export class GameLoop {
  private world: World;
  private fps: number;
  private frameInterval: number;
  private lastTime = 0;
  private rafId: number | null = null;
  private running = false;
  private stats: Stats | null;

  constructor(world: World, options: GameLoopOptions = {}) {
    this.world = world;
    this.fps = options.fps ?? 60;
    this.frameInterval = this.fps > 0 ? 1000 / this.fps : 0;
    this.stats = options.stats ?? null;

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
      this.world.update(dt);

      if (this.stats) this.stats.update(timestamp);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
