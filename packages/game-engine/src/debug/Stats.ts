export class Stats {
  fps = 0;
  entityCount = 0;
  systemCount = 0;
  componentCount = 0;
  frameTime = 0;

  private frames = 0;
  private lastTime = 0;
  private frameStart = 0;

  beginFrame(timestamp: number): void {
    this.frameStart = timestamp;
  }

  update(timestamp: number): void {
    this.frames++;
    this.frameTime = timestamp - this.frameStart;

    const elapsed = timestamp - this.lastTime;
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = timestamp;
    }
  }

  reset(): void {
    this.fps = 0;
    this.entityCount = 0;
    this.systemCount = 0;
    this.componentCount = 0;
    this.frameTime = 0;
    this.frames = 0;
    this.lastTime = 0;
    this.frameStart = 0;
  }
}
