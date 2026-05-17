import { System, type Entity, type World } from '@game-engine/core';
import { Transform, type TransformData } from '../components/Transform';
import { Sprite, type SpriteData } from '../components/Sprite';
import { CanvasDriver } from '../CanvasDriver';

export class RenderSystem extends System {
  readonly query = [Transform, Sprite];
  private driver: CanvasDriver;

  constructor(driver: CanvasDriver) {
    super();
    this.driver = driver;
  }

  update(world: World, _dt: number): void {
    this.driver.clear();
    const ctx = this.driver.getContext();

    const entities = world.query(this.query);

    // Sort by zIndex
    entities.sort((a, b) => {
      const spriteA = world.getComponent<SpriteData>(a, Sprite)!;
      const spriteB = world.getComponent<SpriteData>(b, Sprite)!;
      return spriteA.zIndex! - spriteB.zIndex!;
    });

    for (const entity of entities) {
      const transform = world.getComponent<TransformData>(entity, Transform)!;
      const sprite = world.getComponent<SpriteData>(entity, Sprite)!;

      this.drawSprite(ctx, transform, sprite);
    }
  }

  private drawSprite(ctx: CanvasRenderingContext2D, transform: TransformData, sprite: SpriteData): void {
    ctx.save();

    ctx.translate(transform.x, transform.y);
    ctx.rotate(transform.rotation ?? 0);
    ctx.scale(transform.scaleX ?? 1, transform.scaleY ?? 1);

    ctx.fillStyle = sprite.color;
    ctx.fillRect(-sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);

    ctx.restore();
  }
}