export class Keyboard {
  private keys = new Map<string, boolean>();
  private pressedThisFrame = new Set<string>();
  private releasedThisFrame = new Set<string>();

  isDown(key: string): boolean {
    return this.keys.get(key) ?? false;
  }

  isPressed(key: string): boolean {
    return this.pressedThisFrame.has(key);
  }

  isReleased(key: string): boolean {
    return this.releasedThisFrame.has(key);
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (!this.keys.get(e.key)) {
      this.keys.set(e.key, true);
      this.pressedThisFrame.add(e.key);
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    this.keys.set(e.key, false);
    this.releasedThisFrame.add(e.key);
  }

  clearFrameState(): void {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }
}