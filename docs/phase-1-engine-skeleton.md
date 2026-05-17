# Phase 1: Engine Skeleton + Basic Rendering

## Overview

搭建 2D 游戏引擎的最简骨架，打通 ECS 管线：从创建 Entity、挂载 Component、System 驱动逻辑，到 Canvas 渲染出画面。

## Architecture Decisions

### ECS 存储：SparseSet

选择直接用 SparseSet 而非 Map/Dense Array：

- **SparseSet** = 一个 dense 数组存 Entity ID + 一个 sparse 数组按 Entity ID 索引 dense 位置
- O(1) 插入/删除/查找
- 天然支持按 Entity ID 排序的迭代（对 System 查询很友好）
- 一次实现到位，避免后续重构

### 渲染层分离

- `game-engine` (core)：纯逻辑，不依赖任何 DOM/Canvas/Node API。随阶段演进可在浏览器、Node.js 测试运行，甚至未来换渲染后端（WebGL）都不需要改动。
- `game-renderer-canvas`：依赖 core，提供 Canvas2D 渲染能力。

### 包名：`@game-engine/core` / `@game-engine/renderer-canvas`

使用 npm scope `@game-engine`，与 monorepo 命名惯例一致。

## Package Structure

```
packages/game-engine/
  src/
    ecs/
      Entity.ts          # Entity = number, EntityManager 分配/回收 ID
      Component.ts       # ComponentType<T> 定义 + ComponentStore (SparseSet 存储)
      System.ts          # System 抽象基类 + 查询接口
      World.ts           # 组合 EntityManager + ComponentStore + System 调度
    core/
      GameLoop.ts        # requestAnimationFrame 封装，fixed timestep
      EventBus.ts        # 简单 pub/sub 事件系统
    index.ts

packages/game-renderer-canvas/
  src/
    CanvasDriver.ts      # Canvas 元素创建、尺寸管理、context 获取
    components/
      Transform.ts       # 位置(x,y)、旋转、缩放
      Sprite.ts          # 渲染数据：颜色/图像引用、宽高
    systems/
      RenderSystem.ts    # 查询 [Transform, Sprite]，执行 Canvas 绘制
    index.ts

apps/demo-basic/
  src/main.ts            # 入口
  index.html
```

## Core ECS Design

### Entity
```ts
type Entity = number; // bit-packed: [generation:8bit | index:24bit]
```

- `EntityManager` 维护空闲 ID 列表，支持回收复用
- create() → Entity, destroy(Entity)

### Component
```ts
// 每个 Component 类型用唯一 Symbol 标识
const TransformSym = Symbol('Transform');
const SpriteSym = Symbol('Sprite');

interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface Sprite {
  color: string;
  width: number;
  height: number;
}
```

- `ComponentStore`：内部维护 `Map<Symbol, SparseSet<Entity, ComponentData>>`
- 每个 Component 类型独立存储
- 方法：`add(entity, type, data)`, `remove(entity, type)`, `get(entity, type)`, `has(entity, type)`

### System
```ts
abstract class System {
  abstract readonly requiredComponents: Symbol[]; // 查询签名
  abstract update(world: World, dt: number): void;
}
```

- World 在每帧调用每个 System.update()，传入 dt
- System 通过 World.query(components) 获取匹配的 Entity 列表

### World
```ts
class World {
  createEntity(): Entity;
  destroyEntity(entity: Entity): void;
  addComponent<T>(entity: Entity, type: ComponentType<T>, data: T): void;
  removeComponent(entity: Entity, type: ComponentType): void;
  getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined;
  addSystem(system: System): void;
  query(components: ComponentType[]): Entity[]; // 返回同时拥有所有指定组件的 Entity
  update(dt: number): void; // 遍历所有 System
}
```

### GameLoop
```ts
class GameLoop {
  constructor(world: World, fps?: number);
  start(): void;
  stop(): void;
}
```

- 基于 rAF，支持固定帧率（默认 60fps）
- 计算 dt（秒），调用 world.update(dt)

### EventBus
```ts
class EventBus {
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, ...args: any[]): void;
}
```

第一阶段不重度使用，为后续输入系统预留。

## Renderer Design

### CanvasDriver
- 管理 Canvas 元素和 2D Context
- 处理尺寸自适应（devicePixelRatio、resize）
- 暴露 `clear()` 和 `getContext()` 方法

### RenderSystem
- 查询所有拥有 `Transform` + `Sprite` 的 Entity
- 每帧按 z-index 排序后绘制
- 用 Canvas 2D API 绘制矩形（后续扩展到图像）

### Component 定义位置

Transform 和 Sprite 定义在 `renderer-canvas` 中，因为：
- 它们是渲染相关的数据约定
- core 不需要知道「渲染需要哪些数据」
- 未来换渲染后端时，可以定义不同的渲染 Component

但 Component 的**类型标识机制**（Symbol 注册）由 core 提供。

## Demo (apps/demo-basic)

一个 Vite + TypeScript 项目：
- 创建 World，注册 RenderSystem
- 创建 1 个 Entity：挂载 Transform(100, 100) + Sprite(red, 50x50)
- 创建 MovementSystem：让矩形在屏幕内弹跳
- 验证整个 ECS 管线：Entity → Component → System → Render

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `packages/game-engine/package.json` | Package config |
| 2 | `packages/game-engine/tsconfig.json` | TS config |
| 3 | `packages/game-engine/src/ecs/Entity.ts` | Entity + EntityManager |
| 4 | `packages/game-engine/src/ecs/Component.ts` | ComponentStore (SparseSet) |
| 5 | `packages/game-engine/src/ecs/System.ts` | System base class |
| 6 | `packages/game-engine/src/ecs/World.ts` | World coordinator |
| 7 | `packages/game-engine/src/core/GameLoop.ts` | rAF loop |
| 8 | `packages/game-engine/src/core/EventBus.ts` | Event pub/sub |
| 9 | `packages/game-engine/src/index.ts` | Public API exports |
| 10 | `packages/game-renderer-canvas/package.json` | Package config |
| 11 | `packages/game-renderer-canvas/tsconfig.json` | TS config |
| 12 | `packages/game-renderer-canvas/src/CanvasDriver.ts` | Canvas manager |
| 13 | `packages/game-renderer-canvas/src/components/Transform.ts` | Transform component |
| 14 | `packages/game-renderer-canvas/src/components/Sprite.ts` | Sprite component |
| 15 | `packages/game-renderer-canvas/src/systems/RenderSystem.ts` | Render system |
| 16 | `packages/game-renderer-canvas/src/index.ts` | Public API exports |
| 17 | `apps/demo-basic/package.json` | App config |
| 18 | `apps/demo-basic/tsconfig.json` | TS config |
| 19 | `apps/demo-basic/index.html` | HTML entry |
| 20 | `apps/demo-basic/src/main.ts` | Demo entry |
| 21 | `apps/demo-basic/src/MovementSystem.ts` | Demo movement system |
| 22 | `apps/demo-basic/vite.config.ts` | Vite config |