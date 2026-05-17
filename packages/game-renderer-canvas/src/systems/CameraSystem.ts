import { System, type World } from '@game-engine/core';
import { Camera, type CameraData } from '../components/Camera';
import { Transform, type TransformData } from '../components/Transform';

export class CameraSystem extends System {
  readonly query = [Camera];

  update(world: World, dt: number): void {
    const entities = world.query(this.query);

    for (const entity of entities) {
      const camera = world.getComponent<CameraData>(entity, Camera)!;

      if (camera.followEntity === undefined) continue;

      const targetTransform = world.getComponent<TransformData>(camera.followEntity, Transform);
      if (!targetTransform) continue;

      const targetX = targetTransform.x;
      const targetY = targetTransform.y;

      if (camera.followMode === 'center') {
        camera.x = targetX;
        camera.y = targetY;
      } else if (camera.followMode === 'lerp') {
        const t = Math.min(1, camera.lerpSpeed * dt);
        camera.x += (targetX - camera.x) * t;
        camera.y += (targetY - camera.y) * t;
      }
    }
  }
}