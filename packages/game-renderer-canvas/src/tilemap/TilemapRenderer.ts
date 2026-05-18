import type { TilemapData, TileDef } from './TilemapData';
import { getTileById } from './TilemapData';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TilemapRenderer {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private cachedTilemapKey: string | null = null;
  private dirty = true;

  invalidateCache(): void {
    this.dirty = true;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    tilemap: TilemapData,
    viewport: Viewport,
  ): void {
    const key = this.computeTilemapKey(tilemap);
    if (this.dirty || key !== this.cachedTilemapKey) {
      this.rebuildCache(tilemap);
      this.cachedTilemapKey = key;
      this.dirty = false;
    }

    if (this.offscreenCanvas) {
      const srcX = Math.max(0, viewport.x);
      const srcY = Math.max(0, viewport.y);
      const srcW = Math.min(this.offscreenCanvas.width - srcX, viewport.width);
      const srcH = Math.min(this.offscreenCanvas.height - srcY, viewport.height);

      if (srcW > 0 && srcH > 0) {
        ctx.drawImage(
          this.offscreenCanvas,
          srcX, srcY, srcW, srcH,
          srcX - viewport.x, srcY - viewport.y, srcW, srcH,
        );
      }
    } else {
      this.drawDirect(ctx, tilemap, viewport);
    }
  }

  private rebuildCache(tilemap: TilemapData): void {
    const { tileWidth, tileHeight, tiles, layers } = tilemap;
    const rows = layers[0]?.data.length ?? 0;
    const cols = layers[0]?.data[0]?.length ?? 0;
    const totalWidth = cols * tileWidth;
    const totalHeight = rows * tileHeight;

    if (totalWidth === 0 || totalHeight === 0) {
      this.offscreenCanvas = null;
      this.offscreenCtx = null;
      return;
    }

    if (!this.offscreenCanvas || this.offscreenCanvas.width !== totalWidth || this.offscreenCanvas.height !== totalHeight) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = totalWidth;
      this.offscreenCanvas.height = totalHeight;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    }

    const ctx = this.offscreenCtx;
    if (!ctx) return;

    ctx.clearRect(0, 0, totalWidth, totalHeight);

    for (const layer of layers) {
      const layerRows = layer.data.length;
      for (let row = 0; row < layerRows; row++) {
        const layerCols = layer.data[row]?.length ?? 0;
        for (let col = 0; col < layerCols; col++) {
          const tileId = layer.data[row]?.[col];
          if (tileId === -1 || tileId === undefined) continue;

          const tile = getTileById(tiles, tileId);
          if (!tile) continue;

          const x = col * tileWidth;
          const y = row * tileHeight;

          if (tile.image) {
            ctx.drawImage(tile.image, x, y, tileWidth, tileHeight);
          } else {
            ctx.fillStyle = tile.color;
            ctx.fillRect(x, y, tileWidth, tileHeight);
          }
        }
      }
    }
  }

  private drawDirect(ctx: CanvasRenderingContext2D, tilemap: TilemapData, viewport: Viewport): void {
    const { tileWidth, tileHeight, tiles, layers } = tilemap;

    for (const layer of layers) {
      const rows = layer.data.length;
      const cols = layer.data[0]?.length ?? 0;

      const startCol = Math.max(0, Math.floor(viewport.x / tileWidth));
      const endCol = Math.min(cols, Math.ceil((viewport.x + viewport.width) / tileWidth));
      const startRow = Math.max(0, Math.floor(viewport.y / tileHeight));
      const endRow = Math.min(rows, Math.ceil((viewport.y + viewport.height) / tileHeight));

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          const tileId = layer.data[row]?.[col];
          if (tileId === -1 || tileId === undefined) continue;

          const tile = getTileById(tiles, tileId);
          if (!tile) continue;

          const x = col * tileWidth;
          const y = row * tileHeight;

          if (tile.image) {
            ctx.drawImage(tile.image, x, y, tileWidth, tileHeight);
          } else {
            ctx.fillStyle = tile.color;
            ctx.fillRect(x, y, tileWidth, tileHeight);
          }
        }
      }
    }
  }

  private computeTilemapKey(tilemap: TilemapData): string {
    return `${tilemap.tileWidth}_${tilemap.tileHeight}_${tilemap.layers.length}_${tilemap.tiles.length}`;
  }
}
