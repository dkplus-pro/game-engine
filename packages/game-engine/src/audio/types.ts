import { defineComponent, type ComponentType } from '../ecs/Component';

export interface AudioSourceData {
  url: string;
  volume: number;
  loop: boolean;
  playing: boolean;
  spatial: boolean;
  fadeIn: number;
  fadeOut: number;
}

export const AudioSource: ComponentType<AudioSourceData> = defineComponent<AudioSourceData>();

export function createAudioSource(url: string, options?: Partial<AudioSourceData>): AudioSourceData {
  return {
    url,
    volume: options?.volume ?? 1,
    loop: options?.loop ?? false,
    playing: options?.playing ?? true,
    spatial: options?.spatial ?? false,
    fadeIn: options?.fadeIn ?? 0,
    fadeOut: options?.fadeOut ?? 0,
  };
}