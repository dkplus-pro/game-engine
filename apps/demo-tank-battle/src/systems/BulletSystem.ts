import { System, type World } from '@game-engine/core';
import { Transform, type TransformData, Sprite, type SpriteData } from '@game-engine/renderer-canvas';
import {
  Dir, DX, DY, BulletComponent, BulletData, BULLET_SIZE,
  Tank, TankData, WallComponent, WallData, BaseComponent, BaseData,
  HALF_TANK,
} from '../constants';

export class BulletSystem extends System {
  readonly query = [BulletComponent, Transform, Sprite];

  update(world: World, dt: number): void {
    const bullets = world.query([BulletComponent, Transform, Sprite]);

    for (const bullet of bullets) {
      const b = world.getComponent<BulletData>(bullet, BulletComponent)!;
      const t = world.getComponent<TransformData>(bullet, Transform)!;

      b.lifetime -= dt;
      if (b.lifetime <= 0) {
        world.destroyEntity(bullet);
        continue;
      }

      const spd = b.speed * dt;
      t.x += DX[b.dir] * spd;
      t.y += DY[b.dir] * spd;

      if (this.checkCollisions(world, bullet, b, t)) {
        world.destroyEntity(bullet);
      }
    }
  }

  private checkCollisions(world: World, bullet: number, b: BulletData, t: TransformData): boolean {
    const targets = world.query([Transform, Sprite]);
    const halfB = BULLET_SIZE / 2;

    for (const target of targets) {
      if (target === bullet || target === b.owner) continue;

      const tt = world.getComponent<TransformData>(target, Transform)!;
      const ts = world.getComponent<SpriteData>(target, Sprite)!;
      if (!ts.width || !ts.height) continue;

      const ht = ts.width / 2, hh = ts.height / 2;
      const overlaps =
        t.x - halfB < tt.x + ht &&
        t.x + halfB > tt.x - ht &&
        t.y - halfB < tt.y + hh &&
        t.y + halfB > tt.y - hh;

      if (!overlaps) continue;

      const wall = world.getComponent<WallData>(target, WallComponent);
      if (wall) {
        if (wall.brick) world.destroyEntity(target);
        return true;
      }

      const base = world.getComponent<BaseData>(target, BaseComponent);
      if (base) {
        base.alive = false;
        return true;
      }

      const tank = world.getComponent<TankData>(target, Tank);
      if (tank) {
        if (b.isPlayer === tank.isPlayer) continue;
        tank.health -= 1;
        return true;
      }
    }

    return false;
  }
}
