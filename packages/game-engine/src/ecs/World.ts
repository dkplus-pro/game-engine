import { type ComponentType, type ComponentStore, ComponentStore as ComponentStoreClass, defineComponent, getComponentId } from './Component';
import { type Entity, createEntity, destroyEntity, isEntityAlive } from './Entity';
import type { System } from './System';
import type { Behavior } from '../behavior/Behavior';
import { BehaviorStore } from '../behavior/BehaviorStore';
import { BehaviorSystem } from '../behavior/BehaviorSystem';
import { EventBus } from '../core/EventBus';
import { InputManager } from '../input';

export class World {
  private entities = new Set<Entity>();
  private stores = new Map<number, ComponentStore<any>>();
  private systems: System[] = [];
  private _behaviorStore = new BehaviorStore();
  private eventBus: EventBus;
  private inputManager: InputManager;

  constructor(eventBus?: EventBus, inputManager?: InputManager) {
    this.eventBus = eventBus || new EventBus();
    this.inputManager = inputManager || new InputManager();
  }

  createEntity(): Entity {
    const entity = createEntity();
    this.entities.add(entity);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    // Call onDestroy for all behaviors before removing
    const behaviors = this._behaviorStore.getAll(entity);
    for (const [name, behavior] of behaviors) {
      if (behavior.onDestroy) {
        behavior.onDestroy(this, entity);
      }
    }
    this._behaviorStore.removeAll(entity);

    // Remove all components
    for (const store of this.stores.values()) {
      if (store.has(entity)) {
        store.remove(entity);
      }
    }
    this.entities.delete(entity);
    destroyEntity(entity);
  }

  addComponent<T>(entity: Entity, type: ComponentType<T>, data: T): void {
    const id = getComponentId(type);
    if (!this.stores.has(id)) {
      this.stores.set(id, new ComponentStoreClass());
    }
    this.stores.get(id)!.add(entity, data);
  }

  removeComponent(entity: Entity, type: ComponentType): void {
    const id = getComponentId(type);
    this.stores.get(id)?.remove(entity);
  }

  getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
    const id = getComponentId(type);
    return this.stores.get(id)?.get(entity) as T | undefined;
  }

  hasComponent(entity: Entity, type: ComponentType): boolean {
    const id = getComponentId(type);
    return this.stores.get(id)?.has(entity) ?? false;
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  removeSystem(system: System): void {
    const idx = this.systems.indexOf(system);
    if (idx !== -1) this.systems.splice(idx, 1);
  }

  /** Query entities that have ALL of the specified component types */
  query(types: ComponentType[]): Entity[] {
    if (types.length === 0) return [];

    // Start with the smallest store for efficiency
    const sorted = [...types].sort((a, b) => {
      const sizeA = this.getStoreSize(a);
      const sizeB = this.getStoreSize(b);
      return sizeA - sizeB;
    });

    const firstStore = this.stores.get(getComponentId(sorted[0]));
    if (!firstStore || firstStore.size === 0) return [];

    const result: Entity[] = [];
    for (const entity of firstStore.entityIds()) {
      let match = true;
      for (let i = 1; i < sorted.length; i++) {
        const store = this.stores.get(getComponentId(sorted[i]));
        if (!store || !store.has(entity)) {
          match = false;
          break;
        }
      }
      if (match) result.push(entity);
    }
    return result;
  }

  update(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(this, dt);
      }
    }
  }

  clearEntities(): void {
    const entities: Entity[] = [];
    this.entities.forEach(entity => entities.push(entity));
    for (const entity of entities) {
      this.destroyEntity(entity);
    }
  }

  getStoreSize(type: ComponentType): number {
    const id = getComponentId(type);
    return this.stores.get(id)?.size ?? 0;
  }

  /** Get the EventBus instance */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /** Get the InputManager instance */
  getInputManager(): InputManager {
    return this.inputManager;
  }

  /** Add a behavior to an entity */
  addBehavior(entity: Entity, name: string, behavior: Behavior): void {
    this._behaviorStore.add(entity, name, behavior);
    // Call onCreate immediately
    if (behavior.onCreate) {
      behavior.onCreate(this, entity);
    }
  }

  /** Remove a behavior from an entity */
  removeBehavior(entity: Entity, name: string): void {
    const behavior = this._behaviorStore.get(entity, name);
    if (behavior && behavior.onDestroy) {
      behavior.onDestroy(this, entity);
    }
    this._behaviorStore.remove(entity, name);
  }

  /** Get a behavior from an entity */
  getBehavior(entity: Entity, name: string): Behavior | undefined {
    return this._behaviorStore.get(entity, name);
  }

  /** Get all behaviors of an entity */
  getBehaviors(entity: Entity): Map<string, Behavior> {
    return this._behaviorStore.getAll(entity);
  }

  /** Remove all behaviors from an entity */
  removeAllBehaviors(entity: Entity): void {
    const behaviors = this._behaviorStore.getAll(entity);
    for (const [name, behavior] of behaviors) {
      if (behavior.onDestroy) {
        behavior.onDestroy(this, entity);
      }
    }
    this._behaviorStore.removeAll(entity);
  }
}

export { defineComponent, createEntity, destroyEntity, isEntityAlive };
export type { Entity, ComponentType, System };