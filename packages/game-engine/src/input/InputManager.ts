import { EventBus } from '../core/EventBus';
import { Keyboard } from './Keyboard';
import { Mouse } from './Mouse';

export interface InputManagerOptions {
  target?: HTMLElement | Window;
  eventBus?: EventBus;
}

export class InputManager {
  keyboard: Keyboard;
  mouse: Mouse;
  private eventBus?: EventBus;
  private target: HTMLElement | Window;
  private boundKeyDown: EventListener;
  private boundKeyUp: EventListener;
  private boundMouseDown: EventListener;
  private boundMouseMove: EventListener;
  private boundMouseUp: EventListener;

  constructor(options: InputManagerOptions = {}) {
    this.keyboard = new Keyboard();
    this.mouse = new Mouse();
    this.eventBus = options.eventBus;
    this.target = options.target ?? window;

    this.boundKeyDown = this.handleKeyDown;
    this.boundKeyUp = this.handleKeyUp;
    this.boundMouseDown = this.handleMouseDown;
    this.boundMouseMove = this.handleMouseMove;
    this.boundMouseUp = this.handleMouseUp;

    this.attachListeners();
  }

  // Convenience methods
  isKeyDown(key: string): boolean {
    return this.keyboard.isDown(key);
  }

  isKeyPressed(key: string): boolean {
    return this.keyboard.isPressed(key);
  }

  isKeyReleased(key: string): boolean {
    return this.keyboard.isReleased(key);
  }

  getMousePosition(): { x: number; y: number } {
    return this.mouse.getPosition();
  }

  isMouseDown(button: number): boolean {
    return this.mouse.isDown(button);
  }

  isMousePressed(button: number): boolean {
    return this.mouse.isPressed(button);
  }

  isMouseReleased(button: number): boolean {
    return this.mouse.isReleased(button);
  }

  // Called by GameLoop at the end of each frame
  update(): void {
    this.keyboard.clearFrameState();
    this.mouse.clearFrameState();
  }

  destroy(): void {
    this.detachListeners();
  }

  private attachListeners(): void {
    this.target.addEventListener('keydown', this.boundKeyDown);
    this.target.addEventListener('keyup', this.boundKeyUp);
    this.target.addEventListener('mousedown', this.boundMouseDown);
    this.target.addEventListener('mousemove', this.boundMouseMove);
    this.target.addEventListener('mouseup', this.boundMouseUp);
  }

  private detachListeners(): void {
    this.target.removeEventListener('keydown', this.boundKeyDown);
    this.target.removeEventListener('keyup', this.boundKeyUp);
    this.target.removeEventListener('mousedown', this.boundMouseDown);
    this.target.removeEventListener('mousemove', this.boundMouseMove);
    this.target.removeEventListener('mouseup', this.boundMouseUp);
  }

  private handleKeyDown = (e: Event): void => {
    const ke = e as KeyboardEvent;
    this.keyboard.handleKeyDown(ke);
    this.eventBus?.emit('keydown', ke.key, ke);
  };

  private handleKeyUp = (e: Event): void => {
    const ke = e as KeyboardEvent;
    this.keyboard.handleKeyUp(ke);
    this.eventBus?.emit('keyup', ke.key, ke);
  };

  private handleMouseDown = (e: Event): void => {
    const me = e as MouseEvent;
    this.mouse.handleMouseDown(me);
    this.eventBus?.emit('mousedown', me.button, me);
  };

  private handleMouseMove = (e: Event): void => {
    const me = e as MouseEvent;
    this.mouse.handleMouseMove(me);
    this.eventBus?.emit('mousemove', this.mouse.getPosition(), me);
  };

  private handleMouseUp = (e: Event): void => {
    const me = e as MouseEvent;
    this.mouse.handleMouseUp(me);
    this.eventBus?.emit('mouseup', me.button, me);
  };
}