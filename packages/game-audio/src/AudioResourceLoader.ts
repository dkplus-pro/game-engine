import type { Resource, ResourceLoader } from '@game-engine/core';

export class AudioResourceLoader implements ResourceLoader {
  private context: AudioContext;

  constructor(context: AudioContext) {
    this.context = context;
  }

  async load(url: string): Promise<Resource> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${url} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    return { url, loaded: true, data: audioBuffer };
  }

  unload(_url: string): void {
    // AudioBuffers are owned by AudioContext, no explicit cleanup needed
  }
}