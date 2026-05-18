
import type { World } from '../ecs/World';
import type { Entity } from '../ecs/Entity';
import type { CollisionEvent } from '../physics/CollisionSystem';

/**
 * Behavior 接口 - 实体行为脚本
 * 参考 Unity 的 MonoBehaviour，但使用函数式定义
 */
export interface Behavior {
  /** 创建时调用（场景初始化或 Entity 创建后） */
  onCreate?(world: World, entity: Entity): void;

  /** 每帧调用 */
  onUpdate?(world: World, entity: Entity, dt: number): void;

  /** Entity 销毁时调用 */
  onDestroy?(world: World, entity: Entity): void;

  /** 碰撞时调用（需要 CollisionSystem + EventBus） */
  onCollision?(world: World, entity: Entity, other: Entity, event: CollisionEvent): void;
}
