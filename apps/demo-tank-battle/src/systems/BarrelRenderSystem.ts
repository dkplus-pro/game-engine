import { System, type World } from '@game-engine/core';
import { Transform, type TransformData } from '@game-engine/renderer-canvas';
import { Tank, TankData, Dir } from '../constants';

export class BarrelRenderSystem extends System {
  readonly query = [Tank, Transform];
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    super();
    this.ctx = ctx;
  }

  update(world: World, _dt: number): void {
    const tanks = world.query([Tank, Transform]);
    for (const entity of tanks) {
      const td = world.getComponent<TankData>(entity, Tank)!;
      const t = world.getComponent<TransformData>(entity, Transform)!;
      this.drawBarrel(t.x, t.y, td.direction, td.isPlayer);
    }
  }

  private drawBarrel(x: number, y: number, dir: Dir, isPlayer: boolean): void {
    const bw = 8, bh = 18;
    const ctx = this.ctx;
    ctx.fillStyle = isPlayer ? '#ffee88' : '#ff7777';

    ctx.save();
    ctx.translate(x, y);
    switch (dir) {
      case Dir.Up:    break;
      case Dir.Down:  ctx.rotate(Math.PI); break;
      case Dir.Left:  ctx.rotate(-Math.PI / 2); break;
      case Dir.Right: ctx.rotate(Math.PI / 2); break;
    }
    ctx.fillRect(-bw / 2, -22 - bh / 2, bw, bh);
    ctx.restore();
  }
}
