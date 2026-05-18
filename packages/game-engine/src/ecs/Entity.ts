export type Entity = number;

const INDEX_BITS = 24;
const INDEX_MASK = (1 << INDEX_BITS) - 1;
const GENERATION_BITS = 8;
const GENERATION_MASK = (1 << GENERATION_BITS) - 1;

let nextIndex = 0;
const freeIndices: number[] = [];
const generations: number[] = [];

export function createEntity(): Entity {
  let index: number;
  if (freeIndices.length > 0) {
    index = freeIndices.pop()!;
  } else {
    index = nextIndex++;
  }
  if (generations[index] === undefined) generations[index] = 0;
  return index | (generations[index] << INDEX_BITS);
}

export function destroyEntity(entity: Entity): void {
  const index = getEntityIndex(entity);
  generations[index] = (generations[index] + 1) & GENERATION_MASK;
  freeIndices.push(index);
}

export function isEntityAlive(entity: Entity): boolean {
  const index = getEntityIndex(entity);
  const gen = getEntityGeneration(entity);
  return generations[index] === gen;
}

export function getEntityIndex(entity: Entity): number {
  return entity & INDEX_MASK;
}

export function getEntityGeneration(entity: Entity): number {
  return (entity >> INDEX_BITS) & GENERATION_MASK;
}
