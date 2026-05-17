export interface CanvasDriverOptions {
  width?: number;
  height?: number;
  parent?: HTMLElement | string;
  backgroundColor?: string;
}

export class CanvasDriver {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private backgroundColor: string;

  constructor(options: CanvasDriverOptions = {}) {
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;
    this.backgroundColor = options.backgroundColor ?? '#1a1a2e';

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();

    const parent =
      typeof options.parent === 'string'
        ? document.querySelector(options.parent)
        : options.parent ?? document.body;
    (parent ?? document.body).appendChild(this.canvas);
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  clear(): void {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.setupCanvas();
  }
}