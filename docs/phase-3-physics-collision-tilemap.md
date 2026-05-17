# Phase 3: Physics + Collision + Tilemap

## Overview

在阶段2的基础上，将物理和碰撞从 demo 级硬编码提升为引擎级通用系统：
1. **Physics System** — 刚体、重力、速度/加速度，独立于 MovementSystem
2. **Collision Detection** — AABB 碰撞检测引擎，支持碰撞响应和碰撞事件
3. **Tilemap** — 瓦片地图渲染 + 碰撞数据

## Architecture Decisions

### Physics 放在 core 包

物理是引擎基础能力，与渲染无关。刚体、碰撞检测等纯数学逻辑放在 `packages/game-engine/src/physics/`。

碰撞响应策略可由使用者自定义（通过 EventBus 发出碰撞事件），引擎只负责检测和通知。

### Tilemap 放在 renderer-canvas 包

瓦片地图本质是渲染 + 碰撞数据的组合：
- 渲染层：`TilemapRenderer` 用 Canvas 批量绘制瓦片
- 碰撞层：`TilemapCollider` 从瓦片数据中提取碰撞体

Tilemap 数据格式独立定义（不依赖渲染），但渲染实现放在 renderer-canvas。

### 碰撞检测用 AABB + 分层

- 所有碰撞体用 AABB（Axis-Aligned Bounding Box）
- 按碰撞层（CollisionLayer）分组，层间碰撞规则可配置
- 第一版不做空间分区（broadphase），直接全量检测。实体数 <1000 时性能足够。

## Package Changes

### packages/game-engine/src/physics/

```
physics/
  RigidBody.ts        # 刚体组件：mass, velocity, acceleration, type(static/dynamic)
  CollisionBox.ts     # AABB 碰撞盒组件：offset, width, height
  CollisionLayer.ts   # 碰撞层定义
  PhysicsSystem.ts    # 物理步进：gravity, velocity → position
  CollisionSystem.ts  # 碰撞检测：遍历碰撞体，发射碰撞事件
  index.ts
```

### packages/game-renderer-canvas/src/

新增：

```
tilemap/
  TilemapData.ts      # 瓦片数据：tileset, layers, collision flags
  TilemapRenderer.ts  # 批量绘制瓦片到 Canvas
  index.ts

components/
  Tilemap.ts          # Tilemap Component（引用 TilemapData）
```

## API Design

### RigidBody Component

```ts
enum BodyType {
  Static = 0,   // 不受力影响，不移动（地面、平台、墙）
  Dynamic = 1,  // 受力影响，可移动（玩家、敌人、可推动物体）
}

interface RigidBodyData {
  type: BodyType;
  mass: number;        // 0 = infinite (static)
  vx: number;
  vy: number;
  ax: number;          // acceleration
  ay: number;
  gravityScale: number; // 1 = normal, 0 = no gravity, -1 = reverse
  friction: number;    // 0-1, 0 = no friction, 1 = full stop
  restitution: number; // 0-1, bounciness
}

const RigidBody: ComponentType<RigidBodyData>;
function createRigidBody(options?: Partial<RigidBodyData>): RigidBodyData;
```

### CollisionBox Component

```ts
interface CollisionBoxData {
  offsetX: number;    // 相对 Transform 中心的偏移
  offsetY: number;
  width: number;
  height: number;
  layer: number;      // CollisionLayer ID
}

const CollisionBox: ComponentType<CollisionBoxData>;
function createCollisionBox(w: number, h: number, options?: Partial<CollisionBoxData>): CollisionBoxData;
```

### CollisionLayer

```ts
// 碰撞层：定义哪些层之间会碰撞
class CollisionMatrix {
  private matrix: Map<number, Set<number>>;

  addLayer(id: number): void;
  enableCollision(layerA: number, layerB: number): void;
  shouldCollide(layerA: number, layerB: number): boolean;
}

// 预定义常用层
const LAYER_DEFAULT = 0;
const LAYER_PLAYER = 1;
const LAYER_ENVIRONMENT = 2;
const LAYER_ENEMY = 3;
const LAYER_PROJECTILE = 4;
```

### PhysicsSystem

```ts
class PhysicsSystem extends System {
  query = [Transform, RigidBody];
  gravity: number;
  collisionMatrix: CollisionMatrix;

  constructor(gravity: number, collisionMatrix?: CollisionMatrix);
  update(world: World, dt: number): void;
  // 对每个 Dynamic RigidBody:
  //   1. ay += gravity * gravityScale
  //   2. vx += ax * dt, vy += ay * dt
  //   3. Transform.x += vx * dt, Transform.y += vy * dt
  //   4. 清除加速度（ax, ay = 0）
}
```

### CollisionSystem

```ts
class CollisionSystem extends System {
  query = [Transform, CollisionBox];
  collisionMatrix: CollisionMatrix;
  eventBus?: EventBus;

  constructor(collisionMatrix: CollisionMatrix, eventBus?: EventBus);
  update(world: World, _dt: number): void;
  // 对每对碰撞体（按 collisionMatrix 过滤）:
  //   1. 计算世界 AABB
  //   2. 检测重叠
  //   3. 发射 CollisionEvent 到 EventBus
  //   4. 对 Dynamic 体执行碰撞响应（分离 + 速度修正）
}

interface CollisionEvent {
  entityA: Entity;
  entityB: Entity;
  overlapX: number;  // 重叠量
  overlapY: number;
  normalX: number;   // 碰撞法线方向
  normalY: number;
}
```

### Tilemap

```ts
interface TileDef {
  id: number;
  color: string;           // 第一版用颜色绘制，后续支持图片
  solid: boolean;          // 是否有碰撞
  collisionLayer?: number;
}

interface TilemapData {
  tileWidth: number;
  tileHeight: number;
  tiles: TileDef[];        // id → TileDef 映射
  layers: {
    name: string;
    data: number[][];      // 二维数组，值 = tile id (-1 = 空)
  }[];
  collisionLayer: number;  // 哪个 layer 的 data 用于碰撞
}

const Tilemap: ComponentType<TilemapData>;

class TilemapRenderer {
  draw(ctx: CanvasRenderingContext2D, tilemap: TilemapData, viewport: { x, y, width, height }): void;
  // 只绘制视口范围内的瓦片（性能优化）
}

class TilemapCollider {
  // 从 TilemapData 的碰撞 layer 提取 AABB 碰撞体列表
  // 每帧动态生成，因为瓦片地图可能比屏幕大很多
  getColliders(tilemap: TilemapData, viewport: { x, y, width, height }): CollisionBoxData[];
}
```

## Demo 升级：apps/demo-platformer

升级现有 demo：
- 用 RigidBody + CollisionBox 替换硬编码的 PlayerMovementSystem/CollisionSystem
- 用 PhysicsSystem 替换手动重力
- 用引擎级 CollisionSystem 替换 demo 级碰撞
- 添加碰撞层（Player vs Environment）

或者创建新 demo `apps/demo-tilemap`：
- 用 Tilemap 绘制地图
- 玩家在瓦片地图中移动，与 solid 瓦片碰撞

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-engine/src/physics/RigidBody.ts` | Create |
| 2 | `packages/game-engine/src/physics/CollisionBox.ts` | Create |
| 3 | `packages/game-engine/src/physics/CollisionLayer.ts` | Create |
| 4 | `packages/game-engine/src/physics/PhysicsSystem.ts` | Create |
| 5 | `packages/game-engine/src/physics/CollisionSystem.ts` | Create |
| 6 | `packages/game-engine/src/physics/index.ts` | Create |
| 7 | `packages/game-engine/src/index.ts` | Modify (export physics) |
| 8 | `packages/game-renderer-canvas/src/tilemap/TilemapData.ts` | Create |
| 9 | `packages/game-renderer-canvas/src/tilemap/TilemapRenderer.ts` | Create |
| 10 | `packages/game-renderer-canvas/src/tilemap/TilemapCollider.ts` | Create |
| 11 | `packages/game-renderer-canvas/src/tilemap/index.ts` | Create |
| 12 | `packages/game-renderer-canvas/src/components/Tilemap.ts` | Create |
| 13 | `packages/game-renderer-canvas/src/index.ts` | Modify (export tilemap) |
| 14 | `apps/demo-tilemap/*` | Create (new demo) |