import type { TilemapData } from './TilemapData';
import { getTileById } from './TilemapData';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TilemapRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    tilemap: TilemapData,
    viewport: Viewport,
  ): void {
    const { tileWidth, tileHeight, tiles, layers } = tilemap;

    for (const layer of layers) {
      const rows = layer.data.length;
      const cols = layer.data[0]?.length ?? 0;

      // Calculate visible tile range based on viewport
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

          ctx.fillStyle = tile.color;
          ctx.fillRect(x, y, tileWidth, tileHeight);
        }
      }
    }
  }
}