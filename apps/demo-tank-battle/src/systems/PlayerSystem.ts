import { System, type World } from '@game-engine/core';
import { Transform, type TransformData, Sprite, type SpriteData } from '@game-engine/renderer-canvas';
import {
  Dir, DX, DY, Tank, TankData,
  BULLET_SPEED, PLAYER_SPEED, HALF_TANK, CELL,
  isPerpendicular, clamp, BulletComponent, BulletData,
  OFFSET_X, OFFSET_Y, MIN_X, MAX_X, MIN_Y, MAX_Y,
} from '../constants';

export class PlayerSystem extends System {
  readonly query = [Tank, Transform, Sprite];
  private keys: Record<string, boolean> = {};

  constructor() {
    super();
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  private pressed(...names: string[]): boolean {
    const lookup: Record<string, string[]> = {
      up: ['ArrowUp', 'KeyW'],
      down: ['ArrowDown', 'KeyS'],
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      fire: ['Space'],
    };
    for (const n of names) {
      for (const k of (lookup[n] || [])) {
        if (this.keys[k]) return true;
      }
    }
    return false;
  }

  update(world: World, dt: number): void {
    const entities = world.query([Tank, Transform, Sprite]);
    let player = -1;
    for (const e of entities) {
      const td = world.getComponent<TankData>(e, Tank)!;
      if (td.isPlayer) { player = e; break; }
    }
    if (player < 0) return;

    const tank = world.getComponent<TankData>(player, Tank)!;
    const t = world.getComponent<TransformData>(player, Transform)!;

    let dir: Dir | null = null;
    if (this.pressed('up')) dir = Dir.Up;
    else if (this.pressed('down')) dir = Dir.Down;
    else if (this.pressed('left')) dir = Dir.Left;
    else if (this.pressed('right')) dir = Dir.Right;

    if (dir !== null) {
      if (isPerpendicular(dir, tank.direction)) {
        if (dir === Dir.Up || dir === Dir.Down) {
          t.x = Math.round((t.x - OFFSET_X) / CELL) * CELL + OFFSET_X;
        } else {
          t.y = Math.round((t.y - OFFSET_Y) / CELL) * CELL + OFFSET_Y;
        }
      }
      tank.direction = dir;
    }

    this.moveWithCollision(world, player, t, tank, dt);
    tank.fireCooldown -= dt;

    if (this.pressed('fire') && tank.fireCooldown <= 0) {
      this.spawnBullet(world, player, t, tank);
      tank.fireCooldown = 1 / tank.fireRate;
    }
  }

  private moveWithCollision(world: World, entity: number, t: TransformData, tank: TankData, dt: number): void {
    const spd = tank.speed * dt;
    const nx = t.x + DX[tank.direction] * spd;
    const ny = t.y + DY[tank.direction] * spd;
    if (!this.hitsAnything(world, nx, ny, entity)) {
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

  private spawnBullet(world: World, owner: number, t: TransformData, tank: TankData): void {
    const bullet = world.createEntity();
    const offset = HALF_TANK + 4 + 2;
    let bx = t.x, by = t.y;
    switch (tank.direction) {
      case Dir.Up:    bx = t.x;   by = t.y - offset; break;
      case Dir.Down:  bx = t.x;   by = t.y + offset; break;
      case Dir.Left:  bx = t.x - offset; by = t.y;   break;
      case Dir.Right: bx = t.x + offset; by = t.y;   break;
    }
    world.addComponent(bullet, Transform, {
      x: bx, y: by, rotation: 0, scaleX: 1, scaleY: 1,
    });
    world.addComponent(bullet, Sprite, {
      color: '#ffff66', width: 8, height: 8, zIndex: 10,
    });
    world.addComponent(bullet, BulletComponent, {
      dir: tank.direction,
      speed: BULLET_SPEED,
      isPlayer: true,
      lifetime: 2,
      owner,
    });
  }
}
