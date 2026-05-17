export interface TileDef {
  id: number;
  color: string;
  solid: boolean;
}

export interface TilemapLayer {
  name: string;
  data: number[][];
}

export interface TilemapData {
  tileWidth: number;
  tileHeight: number;
  tiles: TileDef[];
  layers: TilemapLayer[];
  collisionLayerIndex: number;
}

export function createTilemap(
  tileWidth: number,
  tileHeight: number,
  tiles: TileDef[],
  layers: TilemapLayer[],
  collisionLayerIndex: number = 0,
): TilemapData {
  return {
    tileWidth,
    tileHeight,
    tiles,
    layers,
    collisionLayerIndex,
  };
}

export function getTileById(tiles: TileDef[], id: number): TileDef | undefined {
  return tiles.find((t) => t.id === id);
}