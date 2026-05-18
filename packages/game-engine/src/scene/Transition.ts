export interface TransitionEffect {
  duration: number;
  onEnter?: (ctx: CanvasRenderingContext2D, progress: number) => void;
  onExit?: (ctx: CanvasRenderingContext2D, progress: number) => void;
}

export class FadeTransition implements TransitionEffect {
  duration = 0.5;
  color = '#000000';

  onEnter(ctx: CanvasRenderingContext2D, progress: number): void {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = progress;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  onExit(ctx: CanvasRenderingContext2D, progress: number): void {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 1 - progress;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}