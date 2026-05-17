import { System, type World } from '@game-engine/core';
import { Transform, type TransformData } from '../components/Transform';
import { Sprite, type SpriteData } from '../components/Sprite';
import { Camera, type CameraData } from '../components/Camera';
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

    // Get camera (assume single camera)
    const cameraEntities = world.query([Camera]);
    const camera = cameraEntities.length > 0
      ? world.getComponent<CameraData>(cameraEntities[0], Camera)
      : null;

    // Apply camera transform if exists
    if (camera) {
      ctx.save();
      const offsetX = this.driver.getWidth() / 2 - camera.x * camera.zoom;
      const offsetY = this.driver.getHeight() / 2 - camera.y * camera.zoom;
      ctx.translate(offsetX, offsetY);
      ctx.scale(camera.zoom, camera.zoom);
    }

    const entities = world.query(this.query);

    // Sort by zIndex
    entities.sort((a, b) => {
      const spriteA = world.getComponent<SpriteData>(a, Sprite)!;
      const spriteB = world.getComponent<SpriteData>(b, Sprite)!;
      return (spriteA.zIndex ?? 0) - (spriteB.zIndex ?? 0);
    });

    for (const entity of entities) {
      const transform = world.getComponent<TransformData>(entity, Transform)!;
      const sprite = world.getComponent<SpriteData>(entity, Sprite)!;

      this.drawSprite(ctx, transform, sprite);
    }

    if (camera) {
      ctx.restore();
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