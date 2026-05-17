# Phase 6: Scene Management

## Overview

为引擎添加场景管理能力：
1. **Scene** — 场景定义（包含哪些 System、Entity 预设、资源）
2. **SceneManager** — 场景切换、场景栈（支持暂停→菜单→恢复）
3. **场景间数据传递** — 切换场景时携带数据（如玩家状态、分数）

## Architecture Decisions

### Scene 放在 core 包

场景是 ECS World 的高级封装，核心概念：
- 一个 Scene = 一个 World 配置（System 列表 + Entity 创建逻辑）
- SceneManager 管理多个 Scene 的生命周期

### 场景栈而非单场景

支持场景栈，典型用例：
- 游戏场景 → 暂停菜单（push）→ 关闭菜单（pop）→ 回到游戏
- 游戏场景 → 死亡 → 结果场景（replace）→ 重新开始

### 场景切换时的过渡

支持简单的过渡效果：
- 淡入淡出（Canvas alpha）
- 可扩展为自定义过渡动画

## API Design

### Scene

```ts
interface SceneConfig {
  name: string;

  // 场景初始化：创建 Entity、注册 System、加载资源
  onCreate?: (world: World, data?: Record<string, any>) => void;

  // 场景激活时（从栈中恢复）
  onResume?: (world: World) => void;

  // 场景暂停时（被 push 到栈中）
  onPause?: (world: World) => void;

  // 场景销毁时
  onDestroy?: (world: World) => void;

  // 需要预加载的资源列表
  resources?: string[];
}
```

### SceneManager

```ts
class SceneManager {
  private world: World;
  private sceneStack: SceneConfig[];
  private currentScene: SceneConfig | null;
  private sceneRegistry: Map<string, SceneConfig>;
  private transition?: TransitionEffect;

  constructor(world: World);

  // 注册场景
  register(name: string, config: SceneConfig): void;

  // 场景操作
  load(name: string, data?: Record<string, any>): void;    // 替换当前场景
  push(name: string, data?: Record<string, any>): void;    // 暂停当前，切换到新场景
  pop(data?: Record<string, any>): void;                    // 销毁当前，恢复上一个

  // 查询
  getCurrentScene(): SceneConfig | null;
  getSceneStack(): SceneConfig[];

  // 过渡效果
  setTransition(effect: TransitionEffect): void;
}

interface TransitionEffect {
  duration: number;
  onEnter?: (ctx: CanvasRenderingContext2D, progress: number) => void;  // 0→1
  onExit?: (ctx: CanvasRenderingContext2D, progress: number) => void;   // 0→1
}

// 预置过渡效果
class FadeTransition implements TransitionEffect {
  duration = 0.5;
  color = '#000000';

  onEnter(ctx, progress) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = progress;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  onExit(ctx, progress) {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 1 - progress;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
```

### 场景切换流程

```
load('gameLevel2', { score: 100 }):

1. currentScene.onPause?(world)    // 旧场景暂停（如果是 push 则保留 Entity）
2. currentScene.onDestroy?(world)  // 旧场景销毁（如果是 load/pop 则清除 Entity）
3. world.clearEntities()           // 清除所有 Entity（保留 System）
4. newScene.onCreate?(world, data) // 新场景初始化
5. transition.onEnter / onExit     // 过渡动画
6. currentScene = newScene
```

### Scene 与 GameLoop 集成

```ts
// GameLoop 扩展场景切换时的过渡动画
class GameLoop {
  // 切换场景时，GameLoop 暂停 world.update()
  // 只执行 transition 渲染帧
  // 过渡完成后恢复正常 world.update()
}
```

## 典型用例

### 主菜单 → 游戏 → 暂停 → 继续 → 死亡 → 结果

```ts
const sceneManager = new SceneManager(world);

sceneManager.register('menu', {
  onCreate: (world) => {
    // 创建菜单 Entity（按钮、标题）
  },
});

sceneManager.register('game', {
  onCreate: (world, data) => {
    // 创建玩家、地面、相机
    // data.level 决定加载哪个关卡
  },
  onPause: (world) => {
    // 不做任何事，保留 Entity 状态
  },
  onResume: (world) => {
    // 恢复游戏
  },
});

sceneManager.register('pause', {
  onCreate: (world) => {
    // 创建暂停菜单 UI Entity
  },
  onDestroy: (world) => {
    // 移除暂停菜单 Entity
  },
});

sceneManager.register('result', {
  onCreate: (world, data) => {
    // data.score 显示结果
  },
});

// 流程
sceneManager.load('menu');                              // 开始菜单
sceneManager.load('game', { level: 1 });               // 开始游戏（替换菜单）
sceneManager.push('pause');                             // 暂停（栈：[game, pause])
sceneManager.pop();                                     // 继续（栈：[game])
sceneManager.load('result', { score: 500 });            // 死亡 → 结果
sceneManager.load('game', { level: 1 });               // 重试
```

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-engine/src/scene/Scene.ts` | Create |
| 2 | `packages/game-engine/src/scene/SceneManager.ts` | Create |
| 3 | `packages/game-engine/src/scene/Transition.ts` | Create |
| 4 | `packages/game-engine/src/scene/index.ts` | Create |
| 5 | `packages/game-engine/src/index.ts` | Modify |
| 6 | `packages/game-engine/src/ecs/World.ts` | Modify (add clearEntities) |
| 7 | `packages/game-engine/src/core/GameLoop.ts` | Modify (transition support) |
| 8 | `apps/demo-scenes/*` | Create (demo) |