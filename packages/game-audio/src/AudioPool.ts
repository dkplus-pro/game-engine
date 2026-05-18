export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
}

export class AudioPool {
  private nodes = new Set<AudioBufferSourceNode>();

  play(
    buffer: AudioBuffer,
    gainNode: GainNode,
    options?: PlayOptions,
  ): AudioBufferSourceNode {
    const ctx = gainNode.context;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options?.loop ?? false;
    source.playbackRate.value = options?.playbackRate ?? 1;

    const nodeGain = ctx.createGain();
    nodeGain.gain.value = options?.volume ?? 1;
    nodeGain.connect(gainNode);

    source.connect(nodeGain);
    source.start(0);

    this.nodes.add(source);

    source.onended = () => {
      this.nodes.delete(source);
    };

    return source;
  }

  stop(node: AudioBufferSourceNode): void {
    try {
      node.stop();
    } catch {
      // already stopped
    }
    this.nodes.delete(node);
  }

  stopAll(): void {
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    }
    this.nodes.clear();
  }

  get activeCount(): number {
    return this.nodes.size;
  }
}