export class Mouse {
  private position = { x: 0, y: 0 };
  private buttons = new Map<number, boolean>();
  private pressedThisFrame = new Set<number>();
  private releasedThisFrame = new Set<number>();

  getPosition(): { x: number; y: number } {
    return { x: this.position.x, y: this.position.y };
  }

  isDown(button: number): boolean {
    return this.buttons.get(button) ?? false;
  }

  isPressed(button: number): boolean {
    return this.pressedThisFrame.has(button);
  }

  isReleased(button: number): boolean {
    return this.releasedThisFrame.has(button);
  }

  handleMouseDown(e: MouseEvent): void {
    if (!this.buttons.get(e.button)) {
      this.buttons.set(e.button, true);
      this.pressedThisFrame.add(e.button);
    }
  }

  handleMouseMove(e: MouseEvent): void {
    this.position.x = e.clientX;
    this.position.y = e.clientY;
  }

  handleMouseUp(e: MouseEvent): void {
    this.buttons.set(e.button, false);
    this.releasedThisFrame.add(e.button);
  }

  clearFrameState(): void {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }
}