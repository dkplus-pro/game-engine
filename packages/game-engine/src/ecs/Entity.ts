export type Entity = number;

const INDEX_BITS = 24;
const INDEX_MASK = (1 << INDEX_BITS) - 1;

let nextId = 0;
const freeIds: Entity[] = [];

export function createEntity(): Entity {
  if (freeIds.length > 0) {
    return freeIds.pop()!;
  }
  return nextId++;
}

export function destroyEntity(entity: Entity): void {
  freeIds.push(entity);
}

export function getEntityIndex(entity: Entity): number {
  return entity & INDEX_MASK;
}

export function getEntityGeneration(entity: Entity): number {
  return (entity >> INDEX_BITS) & 0xff;
}