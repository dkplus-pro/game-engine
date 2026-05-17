# Phase 7: Particle System

## Overview

为引擎添加粒子系统：
1. **ParticleEmitter** — 粒子发射器组件，定义发射规则
2. **ParticleSystem** — 管理粒子生命周期、更新位置、绘制
3. **粒子池化** — 大量粒子的创建/销毁用对象池复用

## Architecture Decisions

### Particle 放在 renderer-canvas 包

粒子本质是大量短暂的渲染元素，与 Canvas 绘制紧密耦合。粒子数据（发射规则）定义在 renderer-canvas 的 Component 中。

### 粒子不是 Entity

粒子数量可能达到数百/数千，如果每个粒子都是一个 Entity + Component，SparseSet 查询会非常慢。因此：
- **ParticleEmitter 是 Entity + Component**（一个发射器管理一批粒子）
- **单个粒子是轻量数据结构**，不走 ECS 管线
- ParticleSystem 直接管理粒子数组，不通过 World.query

### 粒子池化

```ts
class ParticlePool {
  // 预分配 MAX_PARTICLES 个粒子数据
  // 活跃粒子从池中取，死亡后归还
  // 避免 GC 压力
}
```

## API Design

### ParticleEmitter Component

```ts
interface ParticleEmitterData {
  // 发射参数
  rate: number;           // 每秒发射数量
  burst?: number;         // 一次性爆发数量
  maxParticles: number;   // 同时存在的最大粒子数

  // 粒子初始状态
  lifetime: number;       // 粒子存活时间（秒），或 { min, max } 随机范围
  speed: number;          // 初始速度
  angle: number;          // 发射角度（弧度），或 { min, max }
  angleSpread?: number;   // 角度随机散布范围

  // 粒子外观
  color: string;          // 颜色，或渐变 { start, end }
  size: number;           // 初始尺寸，或 { min, max }
  sizeOverLife?: number;  // 專线：1=不变，0=缩小到0
  opacityOverLife?: number; // 透明度曲线

  // 粒子行为
  gravity?: number;       // 粒子受重力影响
  friction?: number;      // 速度衰减
  shape: 'point' | 'circle' | 'rect'; // 粒子形状

  // 发射器状态
  active: boolean;
  elapsed: number;        // 累计时间（用于 rate 计算）
}

const ParticleEmitter: ComponentType<ParticleEmitterData>;
function createEmitter(options: Partial<ParticleEmitterData>): ParticleEmitterData;
```

### Particle（内部数据结构）

```ts
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;        // 剩余生命
  maxLife: number;     // 初始生命（用于计算 life/maxLife 比例）
  size: number;
  initialSize: number;
  color: string;
  active: boolean;
}
```

### ParticleSystem

```ts
class ParticleSystem extends System {
  query = [Transform, ParticleEmitter]; // 需要 Transform 确定发射位置

  private pool: ParticlePool;
  private emitters: Map<Entity, Particle[]>; // 每个发射器管理的粒子列表

  constructor(maxParticles?: number); // 默认 5000

  update(world: World, dt: number): void;
  // 对每个 ParticleEmitter Entity：
  //   1. 根据 rate 和 elapsed 决定发射多少新粒子
  //   2. 从 pool 取空闲粒子，初始化位置/速度/生命
  //   3. 更新所有活跃粒子：gravity、friction、位置
  //   4. 减少生命值，死亡粒子归还 pool

  render(ctx: CanvasRenderingContext2D, camera?: CameraData): void;
  // 在 RenderSystem 之后单独调用
  // 绘制所有活跃粒子（按形状和颜色）
}
```

### ParticlePool

```ts
class ParticlePool {
  private particles: Particle[];
  private freeList: number[]; // 可用粒子索引

  constructor(max: number);

  acquire(): Particle | null;  // 从 freeList 取一个，设 active=true
  release(index: number): void; // 归还到 freeList，设 active=false
}
```

### 预置发射器配置

```ts
// 常用粒子效果的快捷配置
const PRESETS = {
  fire: {
    rate: 30, lifetime: { min: 0.3, max: 0.8 }, speed: 50,
    angle: -Math.PI / 2, angleSpread: 0.3, color: { start: '#ff6600', end: '#ff0000' },
    size: { min: 3, max: 8 }, sizeOverLife: 0.3, shape: 'circle',
  },
  smoke: {
    rate: 10, lifetime: { min: 1, max: 3 }, speed: 20,
    angle: -Math.PI / 2, angleSpread: 0.5, color: { start: '#888888', end: '#333333' },
    size: { min: 10, max: 20 }, sizeOverLife: 0.5, shape: 'circle',
  },
  explosion: {
    burst: 50, lifetime: { min: 0.2, max: 0.6 }, speed: 200,
    angleSpread: Math.PI * 2, color: { start: '#ffffff', end: '#ff6600' },
    size: { min: 2, max: 6 }, sizeOverLife: 0.1, shape: 'circle',
  },
  spark: {
    rate: 5, lifetime: { min: 0.1, max: 0.3 }, speed: 100,
    angleSpread: Math.PI, color: '#ffff00', size: 2, shape: 'point',
  },
};
```

### 渲染集成

```ts
// RenderSystem.update() 最后调用 ParticleSystem.render()
// 或者 ParticleSystem 在 System 列表中排在 RenderSystem 之后
// 单独调用 render() 因为粒子不走 ECS 查询绘制
```

## 使用示例

```ts
// 火焰效果
const fire = world.createEntity();
world.addComponent(fire, Transform, createTransform(400, 350));
world.addComponent(fire, ParticleEmitter, createEmitter(PRESETS.fire));

// 爆炸（一次性）
const explosion = world.createEntity();
world.addComponent(explosion, Transform, createTransform(500, 300));
world.addComponent(explosion, ParticleEmitter, {
  ...PRESETS.explosion,
  rate: 0,
  burst: 50,
  active: true,
});
```

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-renderer-canvas/src/particle/Particle.ts` | Create |
| 2 | `packages/game-renderer-canvas/src/particle/ParticleEmitter.ts` | Create |
| 3 | `packages/game-renderer-canvas/src/particle/ParticlePool.ts` | Create |
| 4 | `packages/game-renderer-canvas/src/particle/ParticleSystem.ts` | Create |
| 5 | `packages/game-renderer-canvas/src/particle/Presets.ts` | Create |
| 6 | `packages/game-renderer-canvas/src/particle/index.ts` | Create |
| 7 | `packages/game-renderer-canvas/src/index.ts` | Modify |
| 8 | `apps/demo-particles/*` | Create (demo) |