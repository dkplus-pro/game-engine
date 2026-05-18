import type { World } from '../ecs/World';
import type { ComponentType } from '../ecs/Component';
import { Stats } from './Stats';

export class DebugOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stats: Stats;

  showCollisionBoxes = false;
  showEntityBounds = false;
  showStats = true;

  private collisionBoxType: ComponentType | null = null;
  private transformType: ComponentType | null = null;
  private spriteType: ComponentType | null = null;

  constructor(parentCanvas: HTMLCanvasElement, stats: Stats) {
    this.stats = stats;

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.style.position = 'absolute';
    this.canvas.style.pointerEvents = 'none';
    this.syncSize(parentCanvas);

    const parent = parentCanvas.parentElement ?? document.body;
    parent.style.position = 'relative';
    this.canvas.style.left = parentCanvas.offsetLeft + 'px';
    this.canvas.style.top = parentCanvas.offsetTop + 'px';
    parent.appendChild(this.canvas);

    const observer = new ResizeObserver(() => this.syncSize(parentCanvas));
    observer.observe(parentCanvas);
  }

  registerComponentTypes(types: {
    collisionBox?: ComponentType;
    transform?: ComponentType;
    sprite?: ComponentType;
  }): void {
    this.collisionBoxType = types.collisionBox ?? null;
    this.transformType = types.transform ?? null;
    this.spriteType = types.sprite ?? null;
  }

  render(world: World): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.showStats) {
      this.drawStats();
    }

    if (this.showCollisionBoxes && this.collisionBoxType && this.transformType) {
      this.drawCollisionBoxes(world);
    }

    if (this.showEntityBounds && this.transformType && this.spriteType) {
      this.drawEntityBounds(world);
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private drawStats(): void {
    const padding = 10;
    const lineHeight = 18;
    const lines = [
      `FPS: ${this.stats.fps}`,
      `Entities: ${this.stats.entityCount}`,
      `Systems: ${this.stats.systemCount}`,
      `Components: ${this.stats.componentCount}`,
      `Frame: ${this.stats.frameTime.toFixed(2)}ms`,
    ];

    const boxWidth = 160;
    const boxHeight = lines.length * lineHeight + padding * 2;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, boxWidth, boxHeight);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '12px monospace';
    this.ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], padding, padding + i * lineHeight);
    }
  }

  private drawCollisionBoxes(world: World): void {
    const entities = world.query([this.transformType!, this.collisionBoxType!]);
    for (const entity of entities) {
      const transform = world.getComponent<any>(entity, this.transformType!);
      const box = world.getComponent<any>(entity, this.collisionBoxType!);
      if (!transform || !box) continue;

      const x = transform.x + (box.offsetX ?? 0) - box.width / 2;
      const y = transform.y + (box.offsetY ?? 0) - box.height / 2;

      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, box.width, box.height);
    }
  }

  private drawEntityBounds(world: World): void {
    const entities = world.query([this.transformType!, this.spriteType!]);
    for (const entity of entities) {
      const transform = world.getComponent<any>(entity, this.transformType!);
      const sprite = world.getComponent<any>(entity, this.spriteType!);
      if (!transform || !sprite) continue;

      const x = transform.x - sprite.width / 2;
      const y = transform.y - sprite.height / 2;

      this.ctx.strokeStyle = '#4488ff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, sprite.width, sprite.height);
    }
  }

  private syncSize(source: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = source.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
  }
}
