# Phase 8: Behavior / Scripting System

## Overview

为引擎添加行为脚本系统，让游戏逻辑可以以组件式的方式挂载到 Entity 上：
1. **Behavior Component** — 绑定脚本到 Entity
2. **生命周期钩子** — onCreate, onUpdate, onDestroy, onCollision
3. **BehaviorSystem** — 驱动所有 Behavior 的生命周期调用

## Architecture Decisions

### Behavior 而非 MonoBehaviour

参考 Unity 的 MonoBehaviour 但简化：
- 不做继承体系，用接口 + 函数式定义
- 一个 Behavior = 一个普通对象，实现 `Behavior` 接口
- 多个 Behavior 可挂载到同一个 Entity

### Behavior 是 Component 的一种

Behavior 数据存储在 ECS 的 ComponentStore 中，但内部结构特殊：
- 每个 Behavior 实例是一个有状态的对象（不像 Component 通常是纯数据）
- Behavior 实例持有自己的方法和内部变量

### 生命周期钩子设计

```ts
interface Behavior {
  onCreate?(world: World, entity: Entity): void;
  onUpdate?(world: World, entity: Entity, dt: number): void;
  onDestroy?(world: World, entity: Entity): void;
  onCollision?(world: World, entity: Entity, other: Entity, event: CollisionEvent): void;
}
```

### 多 Behavior 挂载

同一个 Entity 可以挂载多个 Behavior（比如同时有 PlayerController 和 HealthBehavior）。需要区分标识：

```ts
interface BehaviorEntry {
  name: string;     // Behavior 标识名（如 'playerController', 'health')
  behavior: Behavior;
  active: boolean;
}

// BehaviorStore 存储：Map<Entity, BehaviorEntry[]>
```

### 与 EventBus 集成

Behavior.onCollision 由 CollisionSystem 通过 EventBus 触发：
- CollisionSystem 发射 `collision` 事件
- BehaviorSystem 监听该事件，分发给相关 Behavior

## API Design

### Behavior 接口

```ts
interface Behavior {
  // 创建时调用（场景初始化或 Entity 创建后）
  onCreate?(world: World, entity: Entity): void;

  // 每帧调用
  onUpdate?(world: World, entity: Entity, dt: number): void;

  // Entity 销毁时调用
  onDestroy?(world: World, entity: Entity): void;

  // 碰撞时调用（需要 CollisionSystem + EventBus）
  onCollision?(world: World, entity: Entity, other: Entity, event: CollisionEvent): void;
}
```

### BehaviorStore

```ts
// 不走标准 ComponentStore，因为 Behavior 是有状态对象而非纯数据
// 单独存储在 World 中

class BehaviorStore {
  private behaviors: Map<Entity, Map<string, Behavior>>;

  add(entity: Entity, name: string, behavior: Behavior): void;
  remove(entity: Entity, name: string): void;
  get(entity: Entity, name: string): Behavior | undefined;
  getAll(entity: Entity): Map<string, Behavior>;
  removeAll(entity: Entity): void;
}
```

### World 扩展

```ts
class World {
  // 新增方法
  addBehavior(entity: Entity, name: string, behavior: Behavior): void;
  removeBehavior(entity: Entity, name: string): void;
  getBehavior(entity: Entity, name: string): Behavior | undefined;

  // 内部
  private behaviorStore: BehaviorStore;
}
```

### BehaviorSystem

```ts
class BehaviorSystem extends System {
  // 不走标准 query，直接遍历 behaviorStore

  constructor(eventBus?: EventBus);
  update(world: World, dt: number): void;
  // 遍历 behaviorStore 所有 entry：
  //   调用 behavior.onUpdate(world, entity, dt)

  // 初始化阶段（World.addBehavior 时立即调用 onCreate）
  // 销毁阶段（World.destroyEntity 时调用 onDestroy）
}
```

### 生命周期调用时机

```
World.addBehavior(entity, 'myBehavior', behavior)
  → BehaviorSystem 立即调用 behavior.onCreate(world, entity)

GameLoop 每帧:
  → world.update(dt)
    → BehaviorSystem.update()
      → 对每个 Behavior: behavior.onUpdate(world, entity, dt)

World.destroyEntity(entity)
  → BehaviorSystem 调用 behavior.onDestroy(world, entity)
  → 移除 Behavior

CollisionSystem 检测到碰撞:
  → EventBus.emit('collision', entityA, entityB, event)
  → BehaviorSystem 收到事件
    → 对 entityA 和 entityB 的所有 Behavior: behavior.onCollision(...)
```

## 使用示例

### PlayerController

```ts
class PlayerController implements Behavior {
  private speed = 300;
  private jumpForce = 400;
  private input!: InputManager;

  onCreate(world: World, entity: Entity): void {
    this.input = world.getInputManager(); // 需要扩展 World 持有 InputManager
  }

  onUpdate(world: World, entity: Entity, dt: number): void {
    const transform = world.getComponent<TransformData>(entity, Transform)!;
    const rigidBody = world.getComponent<RigidBodyData>(entity, RigidBody)!;

    let dx = 0;
    if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('a')) dx -= 1;
    if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('d')) dx += 1;

    rigidBody.vx = dx * this.speed;

    if (this.input.isKeyPressed(' ') && rigidBody.onGround) {
      rigidBody.vy = -this.jumpForce;
    }
  }

  onCollision(world: World, entity: Entity, other: Entity, event: CollisionEvent): void {
    // 玩家碰到敌人
    const otherSprite = world.getComponent<SpriteData>(other, Sprite);
    if (otherSprite?.color === '#enemy') {
      world.emit('playerDamaged', entity, other);
    }
  }
}
```

### HealthBehavior

```ts
class HealthBehavior implements Behavior {
  private hp = 100;
  private maxHp = 100;

  onCreate(world: World, entity: Entity): void {
    // 可以给 Entity 添加自定义 Component 存储 hp
  }

  onUpdate(_world: World, _entity: Entity, _dt: number): void {
    // 血量自动恢复等逻辑
  }

  onCollision(world: World, entity: Entity, other: Entity, event: CollisionEvent): void {
    // 碰撞扣血
    this.hp -= 10;
    if (this.hp <= 0) {
      world.destroyEntity(entity); // 触发 onDestroy
    }
  }

  onDestroy(_world: World, _entity: Entity): void {
    // 死亡动画、音效等
  }
}
```

### 注册到 Entity

```ts
const player = world.createEntity();
world.addComponent(player, Transform, createTransform(100, 300));
world.addComponent(player, RigidBody, createRigidBody({ type: BodyType.Dynamic }));
world.addComponent(player, CollisionBox, createCollisionBox(32, 48));
world.addBehavior(player, 'controller', new PlayerController());
world.addBehavior(player, 'health', new HealthBehavior());
```

## 与现有 System 的关系

Behavior 不是替代 System，而是补充：
- **System** — 处理全局逻辑（PhysicsSystem、RenderSystem、CameraSystem）
- **Behavior** — 处理单个 Entity 的个体逻辑（玩家控制、敌人AI、道具效果）

选择原则：
- 逻辑需要遍历所有同类 Entity → 用 System
- 逻辑只与某个特定 Entity 相关 → 用 Behavior

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-engine/src/behavior/Behavior.ts` | Create (接口) |
| 2 | `packages/game-engine/src/behavior/BehaviorStore.ts` | Create |
| 3 | `packages/game-engine/src/behavior/BehaviorSystem.ts` | Create |
| 4 | `packages/game-engine/src/behavior/index.ts` | Create |
| 5 | `packages/game-engine/src/ecs/World.ts` | Modify (addBehavior/removeBehavior/getBehavior) |
| 6 | `packages/game-engine/src/index.ts` | Modify |
| 7 | `apps/demo-behavior/*` | Create (用 Behavior 重写 platformer) |