
import type { Entity } from '../ecs/Entity';
import type { Behavior } from './Behavior';

/**
 * BehaviorStore - 存储所有实体的 Behavior
 * 不同于标准的 ComponentStore，因为 Behavior 是有状态的对象而非纯数据
 */
export class BehaviorStore {
  // 存储结构：Entity -> (Behavior名称 -> Behavior)
  private behaviors: Map<Entity, Map<string, Behavior>>;

  constructor() {
    this.behaviors = new Map();
  }

  /** 添加一个 Behavior 到实体 */
  add(entity: Entity, name: string, behavior: Behavior): void {
    if (!this.behaviors.has(entity)) {
      this.behaviors.set(entity, new Map());
    }
    this.behaviors.get(entity)!.set(name, behavior);
  }

  /** 移除实体的指定 Behavior */
  remove(entity: Entity, name: string): void {
    const entityBehaviors = this.behaviors.get(entity);
    if (entityBehaviors) {
      entityBehaviors.delete(name);
      if (entityBehaviors.size === 0) {
        this.behaviors.delete(entity);
      }
    }
  }

  /** 获取实体的指定 Behavior */
  get(entity: Entity, name: string): Behavior | undefined {
    return this.behaviors.get(entity)?.get(name);
  }

  /** 获取实体的所有 Behavior */
  getAll(entity: Entity): Map<string, Behavior> {
    return this.behaviors.get(entity) || new Map();
  }

  /** 移除实体的所有 Behavior */
  removeAll(entity: Entity): void {
    this.behaviors.delete(entity);
  }

  /** 获取所有实体（包含 Behavior 的） */
  getEntities(): Entity[] {
    return Array.from(this.behaviors.keys());
  }

  /** 获取 Behavior 的总数 */
  get size(): number {
    let count = 0;
    for (const map of this.behaviors.values()) {
      count += map.size;
    }
    return count;
  }
}
