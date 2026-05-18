import { System, type World } from '@game-engine/core';
import { AudioSource, type AudioSourceData } from '@game-engine/core';
import { AudioManager } from './AudioManager';

export class AudioSystem extends System {
  readonly query = [AudioSource];
  private activeSet = new Set<string>();

  constructor(private manager: AudioManager) {
    super();
  }

  update(world: World, _dt: number): void {
    const entities = world.query(this.query);
    for (const entity of entities) {
      const data = world.getComponent<AudioSourceData>(entity, AudioSource);
      if (!data) continue;

      const key = `${entity}:${data.url}`;

      if (data.playing && !this.activeSet.has(key)) {
        this.manager.playSfx(data.url, { volume: data.volume, loop: data.loop });
        this.activeSet.add(key);
      } else if (!data.playing && this.activeSet.has(key)) {
        this.manager.stopAll();
        this.activeSet.delete(key);
      }
    }
  }
}