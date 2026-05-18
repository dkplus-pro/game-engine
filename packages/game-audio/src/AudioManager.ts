import { AudioPool } from './AudioPool';

export interface SfxOptions {
  volume?: number;
  loop?: boolean;
}

export interface MusicOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
}

export class AudioManager {
  readonly context: AudioContext;
  readonly masterGain: GainNode;
  readonly musicGain: GainNode;
  readonly sfxGain: GainNode;
  private pool = new AudioPool();
  private bufferCache = new Map<string, AudioBuffer>();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;

  constructor() {
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setSfxVolume(volume: number): void {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  async load(url: string): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(url);
    if (cached) return cached;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load audio: ${url} (${response.status})`);

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.bufferCache.set(url, audioBuffer);
    return audioBuffer;
  }

  unload(url: string): void {
    this.bufferCache.delete(url);
  }

  getBuffer(url: string): AudioBuffer | undefined {
    return this.bufferCache.get(url);
  }

  playSfx(url: string, options?: SfxOptions): void {
    const buffer = this.bufferCache.get(url);
    if (!buffer) {
      console.warn(`Audio not loaded: ${url}. Call load() first.`);
      return;
    }
    this.pool.play(buffer, this.sfxGain, { volume: options?.volume, loop: options?.loop });
  }

  async playMusic(url: string, options?: MusicOptions): Promise<void> {
    this.stopMusic();

    const buffer = await this.load(url);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = options?.loop ?? true;

    const gainNode = this.context.createGain();
    const targetVolume = options?.volume ?? 1;
    gainNode.gain.value = targetVolume;

    if (options?.fadeIn && options.fadeIn > 0) {
      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetVolume, this.context.currentTime + options.fadeIn);
    }

    source.connect(gainNode);
    gainNode.connect(this.musicGain);
    source.start(0);

    this.musicSource = source;
    this.musicGainNode = gainNode;
  }

  stopMusic(fadeOut?: number): void {
    if (!this.musicSource) return;

    if (fadeOut && fadeOut > 0 && this.musicGainNode) {
      this.musicGainNode.gain.cancelScheduledValues(this.context.currentTime);
      this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, this.context.currentTime);
      this.musicGainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut);
    }

    try {
      this.musicSource.stop();
    } catch {
      // already stopped
    }
    this.musicSource = null;
    this.musicGainNode = null;
  }

  stopAll(): void {
    this.stopMusic();
    this.pool.stopAll();
  }

  suspend(): void {
    this.context.suspend();
  }

  resume(): void {
    this.context.resume();
  }

  destroy(): void {
    this.stopAll();
    this.context.close();
  }
}

export default AudioManager;