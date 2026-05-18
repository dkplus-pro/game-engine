
import { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { EventBus } from '../core/EventBus';
import type { CollisionEvent } from '../physics/CollisionSystem';
import type { Entity } from '../ecs/Entity';

/**
 * BehaviorSystem - 驱动所有 Behavior 的生命周期调用
 */
export class BehaviorSystem extends System {
  // BehaviorSystem 不使用标准 query，直接遍历 behaviorStore
  readonly query: any[] = [];

  private eventBus: EventBus;
  private collisionQueue: Array<{ entityA: Entity; entityB: Entity; event: CollisionEvent }> = [];

  constructor(eventBus: EventBus) {
    super();
    this.eventBus = eventBus;

    // 监听碰撞事件，加入队列，在 update 时处理
    this.eventBus.on('collision', (event: CollisionEvent) => {
      this.collisionQueue.push({
        entityA: event.entityA,
        entityB: event.entityB,
        event,
      });
    });
  }

  update(world: World, dt: number): void {
    const behaviorStore = (world as any)._behaviorStore;
    if (!behaviorStore) return;

    // 处理所有 behavior 的 onUpdate
    for (const entity of behaviorStore.getEntities()) {
      const behaviors = behaviorStore.getAll(entity);
      for (const [name, behavior] of behaviors) {
        if (behavior.onUpdate) {
          behavior.onUpdate(world, entity, dt);
        }
      }
    }

    // 处理碰撞队列
    this.processCollisionQueue(behaviorStore, world);
  }

  /** 处理碰撞队列，分发给相关 Behavior */
  private processCollisionQueue(behaviorStore: any, world: World): void {
    if (this.collisionQueue.length === 0) {
      return;
    }

    for (const item of this.collisionQueue) {
      const { entityA, entityB, event } = item;

      // 分发给 entityA 的所有 Behavior
      const behaviorsA = behaviorStore.getAll(entityA);
      for (const [name, behavior] of behaviorsA) {
        if (behavior.onCollision) {
          behavior.onCollision(world, entityA, entityB, event);
        }
      }

      // 分发给 entityB 的所有 Behavior
      const behaviorsB = behaviorStore.getAll(entityB);
      for (const [name, behavior] of behaviorsB) {
        if (behavior.onCollision) {
          behavior.onCollision(world, entityB, entityA, event);
        }
      }
    }

    this.collisionQueue = [];
  }
}
