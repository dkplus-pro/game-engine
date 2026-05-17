import { defineComponent, type ComponentType } from '@game-engine/core';

export interface AnimationFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimationData {
  frames: AnimationFrame[];
  currentFrame: number;
  frameTime: number; // seconds per frame
  elapsed: number; // accumulated time
  playing: boolean;
  loop: boolean;
}

export const Animation: ComponentType<AnimationData> = defineComponent<AnimationData>();

export function createAnimation(
  frames: AnimationFrame[],
  frameRate: number,
  options?: Partial<{ loop: boolean }>
): AnimationData {
  return {
    frames,
    currentFrame: 0,
    frameTime: 1 / frameRate,
    elapsed: 0,
    playing: true,
    loop: options?.loop ?? true,
  };
}

export function playAnimation(data: AnimationData): void {
  data.playing = true;
}

export function stopAnimation(data: AnimationData): void {
  data.playing = false;
  data.currentFrame = 0;
  data.elapsed = 0;
}

export function pauseAnimation(data: AnimationData): void {
  data.playing = false;
}

export function resetAnimation(data: AnimationData): void {
  data.currentFrame = 0;
  data.elapsed = 0;
}