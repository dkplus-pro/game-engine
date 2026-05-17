import type { TilemapData } from './TilemapData';
import type { CollisionBoxData } from '@game-engine/core';

export interface TileCollider {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TilemapCollider {
  /**
   * Extract solid tile positions as AABB colliders within the given viewport.
   * Only processes the collision layer of the tilemap.
   */
  getColliders(tilemap: TilemapData, viewport?: { x: number; y: number; width: number; height: number }): TileCollider[] {
    const { tileWidth, tileHeight, tiles, layers, collisionLayerIndex } = tilemap;
    const collisionLayer = layers[collisionLayerIndex];
    if (!collisionLayer) return [];

    const rows = collisionLayer.data.length;
    const cols = collisionLayer.data[0]?.length ?? 0;
    const colliders: TileCollider[] = [];

    // Calculate visible tile range
    const startCol = viewport ? Math.max(0, Math.floor(viewport.x / tileWidth)) : 0;
    const endCol = viewport ? Math.min(cols, Math.ceil((viewport.x + viewport.width) / tileWidth)) : cols;
    const startRow = viewport ? Math.max(0, Math.floor(viewport.y / tileHeight)) : 0;
    const endRow = viewport ? Math.min(rows, Math.ceil((viewport.y + viewport.height) / tileHeight)) : rows;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tileId = collisionLayer.data[row]?.[col];
        if (tileId === -1 || tileId === undefined) continue;

        const tile = tiles.find((t) => t.id === tileId);
        if (!tile || !tile.solid) continue;

        colliders.push({
          x: col * tileWidth + tileWidth / 2,
          y: row * tileHeight + tileHeight / 2,
          width: tileWidth,
          height: tileHeight,
        });
      }
    }

    return colliders;
  }
}