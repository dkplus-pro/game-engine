# Phase 4: Tooling + Optimization

## Overview

引擎功能基本完备后，补齐基础设施和性能优化：
1. **Resource Manager** — 图片/音频加载、缓存、生命周期管理
2. **性能优化** — 脏标记、视口裁剪、对象池、批量渲染
3. **Debug Tools** — 帧率显示、碰撞盒可视化、Entity 查看器

## Architecture Decisions

### ResourceManager 放在 core 包

资源管理是引擎基础能力，不应依赖渲染层。但具体加载器（ImageLoader、AudioLoader）依赖 DOM API，通过接口注入。

```ts
// core 定义接口
interface ResourceLoader {
  load(url: string): Promise<Resource>;
  unload(url: string): void;
}

// renderer-canvas 实现具体加载器
class ImageResourceLoader implements ResourceLoader { ... }
```

### 对象池用在 Entity 和 Component

Entity ID 回收机制（阶段1已有 freeIds）就是对象池的雏形。阶段4扩展到：
- Entity 对象池：createEntity 从池中取，destroyEntity 归还池
- Component 对象池：addComponent 时复用已销毁的组件数据

### 视口裁剪优化 RenderSystem

只绘制视口范围内的 Entity。根据 Camera 的视口计算 AABB，跳过不在视口内的 Sprite。

### Tilemap 批量渲染优化

TilemapRenderer 改为：
- 只绘制视口范围内瓦片（已设计）
- 用 `ctx.drawImage` 替代逐瓦片 `fillRect`（当使用图片 tileset 时）
- 预渲染到离屏 Canvas，每帧直接 `drawImage(offscreenCanvas)` 复制

## Package Changes

### packages/game-engine/src/resource/

```
resource/
  ResourceManager.ts    # 统一资源管理器：load, cache, unload
  ResourceLoader.ts     # ResourceLoader 接口定义
  index.ts
```

### packages/game-engine/src/debug/

```
debug/
  Stats.ts              # FPS/Entity/System 数量统计
  DebugOverlay.ts       # 可选的调试覆盖层（碰撞盒可视化等）
  index.ts
```

### packages/game-engine/src/ecs/ 优化

- Entity.ts — 对象池扩展
- Component.ts — 对象池扩展
- World.ts — 脏标记查询优化

### packages/game-renderer-canvas/src/ 优化

- RenderSystem.ts — 视口裁剪
- TilemapRenderer.ts — 离屏 Canvas 预渲染
- 新增 ImageResourceLoader

## API Design

### ResourceManager

```ts
interface Resource {
  url: string;
  loaded: boolean;
  data: any;  // Image, AudioBuffer, etc.
}

class ResourceManager {
  private cache: Map<string, Resource>;
  private loaders: Map<string, ResourceLoader>; // 按 resource type 注册 loader

  registerLoader(type: string, loader: ResourceLoader): void;
  load<T>(url: string, type?: string): Promise<T>;
  unload(url: string): void;
  get<T>(url: string): T | undefined;
  clear(): void;
}
```

### Stats

```ts
class Stats {
  fps: number;
  entityCount: number;
  systemCount: number;
  componentCount: number;
  frameTime: number;

  private frames: number;
  private lastTime: number;

  update(timestamp: number): void;
  reset(): void;
}
```

### DebugOverlay（可选）

```ts
class DebugOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stats: Stats;

  constructor(driver: CanvasDriver, stats: Stats);

  showCollisionBoxes: boolean;
  showEntityBounds: boolean;
  showStats: boolean;

  render(world: World): void;
  // 在主画布上方叠加一层半透明 Canvas：
  // - 绘制碰撞盒（绿色矩形）
  // - 绘制 Entity 边界（蓝色矩形）
  // - 显示 FPS、Entity 数量等文本
}
```

### RenderSystem 视口裁剪

```ts
// RenderSystem.update() 中增加：
// 1. 获取 Camera 视口范围
// 2. 计算每个 Sprite 的世界 AABB
// 3. 如果 AABB 不在视口内，跳过绘制

private isInViewport(transform: TransformData, sprite: SpriteData, viewport: Rect): boolean {
  const halfW = sprite.width / 2;
  const halfH = sprite.height / 2;
  return transform.x + halfW > viewport.x &&
         transform.x - halfW < viewport.x + viewport.width &&
         transform.y + halfH > viewport.y &&
         transform.y - halfH < viewport.y + viewport.height;
}
```

## Demo 升级

升级 `apps/demo-platformer` 或创建新 demo `apps/demo-optimized`：
- ResourceManager 加载真实图片作为 Sprite
- DebugOverlay 显示 FPS 和碰撞盒
- 验证视口裁剪对性能的影响（大量 Entity 场景）

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-engine/src/resource/ResourceManager.ts` | Create |
| 2 | `packages/game-engine/src/resource/ResourceLoader.ts` | Create |
| 3 | `packages/game-engine/src/resource/index.ts` | Create |
| 4 | `packages/game-engine/src/debug/Stats.ts` | Create |
| 5 | `packages/game-engine/src/debug/DebugOverlay.ts` | Create |
| 6 | `packages/game-engine/src/debug/index.ts` | Create |
| 7 | `packages/game-engine/src/index.ts` | Modify (export resource + debug) |
| 8 | `packages/game-engine/src/ecs/Entity.ts` | Modify (对象池) |
| 9 | `packages/game-engine/src/ecs/Component.ts` | Modify (对象池) |
| 10 | `packages/game-engine/src/core/GameLoop.ts` | Modify (集成 Stats) |
| 11 | `packages/game-renderer-canvas/src/systems/RenderSystem.ts` | Modify (视口裁剪) |
| 12 | `packages/game-renderer-canvas/src/tilemap/TilemapRenderer.ts` | Modify (离屏 Canvas) |
| 13 | `packages/game-renderer-canvas/src/resource/ImageResourceLoader.ts` | Create |
| 14 | `packages/game-renderer-canvas/src/index.ts` | Modify (export loader) |
| 15 | `apps/demo-optimized/*` 或升级现有 demo | Create/Modify |