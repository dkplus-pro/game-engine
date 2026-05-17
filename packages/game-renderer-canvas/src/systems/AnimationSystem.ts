import { System, type World } from '@game-engine/core';
import { Animation, type AnimationData } from '../components/Animation';

export class AnimationSystem extends System {
  readonly query = [Animation];

  update(world: World, dt: number): void {
    const entities = world.query(this.query);

    for (const entity of entities) {
      const anim = world.getComponent<AnimationData>(entity, Animation)!;

      if (!anim.playing) continue;

      anim.elapsed += dt;

      while (anim.elapsed >= anim.frameTime) {
        anim.elapsed -= anim.frameTime;
        anim.currentFrame++;

        if (anim.currentFrame >= anim.frames.length) {
          if (anim.loop) {
            anim.currentFrame = 0;
          } else {
            anim.currentFrame = anim.frames.length - 1;
            anim.playing = false;
          }
        }
      }
    }
  }
}