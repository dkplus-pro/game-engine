export class CollisionMatrix {
  private matrix = new Map<number, Set<number>>();

  addLayer(id: number): void {
    if (!this.matrix.has(id)) {
      this.matrix.set(id, new Set());
    }
  }

  enableCollision(layerA: number, layerB: number): void {
    this.addLayer(layerA);
    this.addLayer(layerB);
    this.matrix.get(layerA)!.add(layerB);
    this.matrix.get(layerB)!.add(layerA);
  }

  disableCollision(layerA: number, layerB: number): void {
    this.matrix.get(layerA)?.delete(layerB);
    this.matrix.get(layerB)?.delete(layerA);
  }

  shouldCollide(layerA: number, layerB: number): boolean {
    return this.matrix.get(layerA)?.has(layerB) ?? false;
  }
}

export const LAYER_DEFAULT = 0;
export const LAYER_PLAYER = 1;
export const LAYER_ENVIRONMENT = 2;
export const LAYER_ENEMY = 3;
export const LAYER_PROJECTILE = 4;