export type ComponentType<T = any> = symbol;

let nextComponentId = 0;
const componentIds = new Map<ComponentType, number>();

export function defineComponent<T>(): ComponentType<T> {
  const sym = Symbol(nextComponentId);
  componentIds.set(sym, nextComponentId++);
  return sym as ComponentType<T>;
}

export function getComponentId(type: ComponentType): number {
  return componentIds.get(type) ?? -1;
}

/**
 * SparseSet-based component storage.
 * dense[] — packed array of Entity IDs that have this component
 * sparse[] — for each entity, stores its index in dense (or -1 if absent)
 * data[] — parallel to dense, stores the component data
 */
export class ComponentStore<T> {
  private dense: number[] = [];
  private sparse: number[] = [];
  private data: T[] = [];

  get size(): number {
    return this.dense.length;
  }

  has(entity: number): boolean {
    const idx = this.sparse[entity];
    return idx !== undefined && idx !== -1;
  }

  get(entity: number): T | undefined {
    const idx = this.sparse[entity];
    if (idx === undefined || idx === -1) return undefined;
    return this.data[idx];
  }

  add(entity: number, component: T): void {
    if (this.has(entity)) {
      this.data[this.sparse[entity]] = component;
      return;
    }
    const idx = this.dense.length;
    this.dense.push(entity);
    this.sparse[entity] = idx;
    this.data.push(component);
  }

  remove(entity: number): void {
    const idx = this.sparse[entity];
    if (idx === undefined || idx === -1) return;

    const lastIdx = this.dense.length - 1;
    if (idx !== lastIdx) {
      // Swap-remove: move last element into the removed slot
      const lastEntity = this.dense[lastIdx];
      this.dense[idx] = lastEntity;
      this.data[idx] = this.data[lastIdx];
      this.sparse[lastEntity] = idx;
    }

    this.dense.pop();
    this.data.pop();
    this.sparse[entity] = -1;
  }

  /** Iterate over all (entity, data) pairs */
  entities(): Iterable<{ entity: number; data: T }> {
    const { dense, data } = this;
    return {
      *[Symbol.iterator]() {
        for (let i = 0; i < dense.length; i++) {
          yield { entity: dense[i], data: data[i] };
        }
      },
    };
  }

  /** Iterate entity IDs only */
  entityIds(): number[] {
    return this.dense;
  }

  /** Iterate component data only */
  raw(): readonly T[] {
    return this.data;
  }
}