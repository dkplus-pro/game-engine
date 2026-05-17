import { defineComponent, type ComponentType, type Entity } from '@game-engine/core';

export interface CameraData {
  x: number;
  y: number;
  zoom: number;
  followEntity?: Entity;
  followMode: 'center' | 'lerp';
  lerpSpeed: number;
}

export const Camera: ComponentType<CameraData> = defineComponent<CameraData>();

export function createCamera(options?: Partial<CameraData>): CameraData {
  return {
    x: options?.x ?? 0,
    y: options?.y ?? 0,
    zoom: options?.zoom ?? 1,
    followEntity: options?.followEntity,
    followMode: options?.followMode ?? 'center',
    lerpSpeed: options?.lerpSpeed ?? 5,
  };
}