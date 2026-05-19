import { System, type World } from '@game-engine/core';
import { Transform, type TransformData, Sprite, type SpriteData } from '@game-engine/renderer-canvas';
import {
  Dir, DX, DY, Tank, TankData, BulletComponent, BulletData,
  ENEMY_SPEED, BULLET_SPEED, HALF_TANK, CELL,
  clamp, MIN_X, MAX_X, MIN_Y, MAX_Y,
} from '../constants';

export class EnemySystem extends System {
  readonly query = [Tank, Transform, Sprite];
  private timers: Map<number, { moveTimer: number; fireTimer: number }> = new Map();

  update(world: World, dt: number): void {
    const tanks = world.query([Tank, Transform, Sprite]);
    for (const entity of tanks) {
      const td = world.getComponent<TankData>(entity, Tank)!;
      if (td.isPlayer) continue;
      if (td.health <= 0) {
        world.destroyEntity(entity);
        continue;
      }

      const t = world.getComponent<TransformData>(entity, Transform)!;
      let timers = this.timers.get(entity);
      if (!timers) {
        timers = { moveTimer: Math.random() * 2, fireTimer: 2 + Math.random() };
        this.timers.set(entity, timers);
      }

      timers.moveTimer -= dt;
      timers.fireTimer -= dt;

      if (timers.moveTimer <= 0) {
        const dirs = [Dir.Up, Dir.Down, Dir.Left, Dir.Right];
        td.direction = dirs[Math.floor(Math.random() * 4)];
        timers.moveTimer = 1 + Math.random() * 2;
      }

      this.moveWithCollision(world, entity, t, td, dt);

      if (timers.fireTimer <= 0) {
        this.spawnBullet(world, entity, t, td);
        timers.fireTimer = 1.5 + Math.random() * 2;
      }
    }
  }

  private moveWithCollision(world: World, entity: number, t: TransformData, td: TankData, dt: number): void {
    const spd = td.speed * dt;
    const nx = t.x + DX[td.direction] * spd;
    const ny = t.y + DY[td.direction] * spd;
    if (this.hitsAnything(world, nx, ny, entity)) {
      const dirs = [Dir.Up, Dir.Down, Dir.Left, Dir.Right];
      td.direction = dirs[Math.floor(Math.random() * 4)];
    } else {
      t.x = clamp(nx, MIN_X, MAX_X);
      t.y = clamp(ny, MIN_Y, MAX_Y);
    }
  }

  private hitsAnything(world: World, x: number, y: number, self: number): boolean {
    const all = world.query([Transform, Sprite]);
    for (const other of all) {
      if (other === self) continue;
      if (world.hasComponent(other, BulletComponent)) continue;
      const ot = world.getComponent<TransformData>(other, Transform)!;
      const os = world.getComponent<SpriteData>(other, Sprite)!;
      if (!os.width || !os.height) continue;
      const hw = os.width / 2, hh = os.height / 2;
      if (
        x - HALF_TANK < ot.x + hw &&
        x + HALF_TANK > ot.x - hw &&
        y - HALF_TANK < ot.y + hh &&
        y + HALF_TANK > ot.y - hh
      ) {
        return true;
      }
    }
    return false;
  }

  private spawnBullet(world: World, owner: number, t: TransformData, td: TankData): void {
    const bullet = world.createEntity();
    const offset = HALF_TANK + 4 + 2;
    let bx = t.x, by = t.y;
    switch (td.direction) {
      case Dir.Up:    bx = t.x;   by = t.y - offset; break;
      case Dir.Down:  bx = t.x;   by = t.y + offset; break;
      case Dir.Left:  bx = t.x - offset; by = t.y;   break;
      case Dir.Right: bx = t.x + offset; by = t.y;   break;
    }
    world.addComponent(bullet, Transform, {
      x: bx, y: by, rotation: 0, scaleX: 1, scaleY: 1,
    });
    world.addComponent(bullet, Sprite, {
      color: '#ff6666', width: 8, height: 8, zIndex: 10,
    });
    world.addComponent(bullet, BulletComponent, {
      dir: td.direction,
      speed: BULLET_SPEED * 0.8,
      isPlayer: false,
      lifetime: 2,
      owner,
    });
  }
}
