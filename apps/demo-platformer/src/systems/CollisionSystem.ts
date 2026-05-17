import { System, type World } from '@game-engine/core';
import { Transform, type TransformData } from '@game-engine/renderer-canvas';
import { Player, type PlayerData } from '../components/Player';

interface PlatformRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class CollisionSystem extends System {
  readonly query = [Transform, Player];
  private groundY: number;
  private platforms: PlatformRect[] = [];

  constructor(groundY: number) {
    super();
    this.groundY = groundY;
  }

  setPlatforms(platforms: PlatformRect[]): void {
    this.platforms = platforms;
  }

  update(world: World, _dt: number): void {
    const entities = world.query(this.query);

    for (const entity of entities) {
      const t = world.getComponent<TransformData>(entity, Transform)!;
      const p = world.getComponent<PlayerData>(entity, Player)!;

      const pw = 28;
      const ph = 44;
      const px = t.x - pw / 2;
      const py = t.y - ph / 2;

      p.onGround = false;

      if (py + ph >= this.groundY) {
        t.y = this.groundY - ph / 2;
        p.vy = 0;
        p.onGround = true;
      }

      for (const plat of this.platforms) {
        const platTop = plat.y - plat.h / 2;
        const platLeft = plat.x - plat.w / 2;
        const platRight = plat.x + plat.w / 2;
        const platBottom = plat.y + plat.h / 2;

        if (px < platRight && px + pw > platLeft && py < platBottom && py + ph > platTop) {
          if (p.vy > 0 && t.y < platTop) {
            t.y = platTop - ph / 2;
            p.vy = 0;
            p.onGround = true;
          }
        }
      }
    }
  }
}
