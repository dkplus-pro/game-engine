# Phase 2: Input + Sprites + Camera

## Overview

在阶段1骨架基础上，添加：
1. **输入系统** — 键盘/鼠标事件抽象，支持查询式和事件式两种使用方式
2. **精灵动画** — 帧动画支持（Animation Component + AnimationSystem）
3. **相机系统** — 视口变换，世界坐标到屏幕坐标映射，相机跟随

## Architecture Decisions

### 输入系统放在 core 包

虽然输入依赖 DOM 事件，但这是游戏引擎的基础设施，几乎所有游戏都需要。放在 core 保持统一入口，通过依赖注入传入 DOM 环境。

设计两种使用模式：
- **查询式**：`input.isKeyDown('ArrowLeft')` — 在 System.update() 中直接查询当前状态
- **事件式**：`input.on('keydown', handler)` — 通过 EventBus 发布事件

### 动画用 Component + System 模式

新增：
- `Animation` Component：当前帧、帧列表、帧率、播放状态
- `AnimationSystem`：按 dt 更新帧索引

Sprite 组件存储静态图像数据，Animation 组件存储帧序列，两者可以共存（Animation 当前帧索引决定绘制哪个 Sprite 区域）。

### 相机跟随模式

相机默认模式：
- **CenterLock**：相机中心始终锁定目标 Entity
- 可扩展：LerpFollow（平滑跟随）、BoundCamera（限制在世界边界内）

## Package Changes

### packages/game-engine/src/input/

```
input/
  InputManager.ts      # 统一入口，聚合键盘和鼠标
  Keyboard.ts          # 键盘状态追踪
  Mouse.ts             # 鼠标位置、按键状态
  index.ts
```

### packages/game-renderer-canvas/src/

新增：

```
components/
  Animation.ts         # 帧动画数据
  Camera.ts            # 相机位置、缩放、跟随目标

systems/
  AnimationSystem.ts   # 更新帧动画
  CameraSystem.ts      # 计算相机变换矩阵
```

修改：

```
RenderSystem.ts        # 应用相机变换到绘制
CanvasDriver.ts        # 添加视口尺寸获取
```

## API Design

### InputManager

```ts
interface InputManagerOptions {
  target?: HTMLElement; // 监听事件的元素，默认 window
}

class InputManager {
  keyboard: Keyboard;
  mouse: Mouse;

  constructor(options?: InputManagerOptions);

  // 查询式
  isKeyDown(key: string): boolean;
  isKeyUp(key: string): boolean;
  isKeyPressed(key: string): boolean; // 当前帧按下
  isKeyReleased(key: string): boolean; // 当前帧释放

  getMousePosition(): { x: number; y: number };
  isMouseDown(button: number): boolean;

  // 事件式（通过 EventBus）
  on(event: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'mousemove', handler: Function): void;

  // 内部方法，GameLoop 每帧调用
  update(): void; // 清除单帧状态（pressed/released）
  destroy(): void; // 移除事件监听
}
```

### Keyboard

```ts
class Keyboard {
  private keys: Map<string, boolean>; // 当前持续状态
  private pressedThisFrame: Set<string>;
  private releasedThisFrame: Set<string>;

  isDown(key: string): boolean;
  isPressed(key: string): boolean;
  isReleased(key: string): boolean;

  // 内部：事件处理
  handleKeyDown(e: KeyboardEvent): void;
  handleKeyUp(e: KeyboardEvent): void;
  clearFrameState(): void;
}
```

### Mouse

```ts
class Mouse {
  private position: { x: number; y: number };
  private buttons: Map<number, boolean>; // 0=左键, 1=中键, 2=右键
  private pressedThisFrame: Set<number>;
  private releasedThisFrame: Set<number>;

  getPosition(): { x: number; y: number };
  isDown(button: number): boolean;
  isPressed(button: number): boolean;
  isReleased(button: number): boolean;

  handleMouseDown(e: MouseEvent): void;
  handleMouseMove(e: MouseEvent): void;
  handleMouseUp(e: MouseEvent): void;
  clearFrameState(): void;
}
```

### Animation Component

```ts
interface AnimationData {
  frames: { x: number; y: number; width: number; height: number }[]; // 每帧在 sprite sheet 中的区域
  currentFrame: number;
  frameTime: number; // 每帧持续时间（秒）
  elapsed: number; // 当前帧已累计时间
  playing: boolean;
  loop: boolean;
}

const Animation: ComponentType<AnimationData>;

function createAnimation(frames: Frame[], frameRate: number, loop?: boolean): AnimationData;
function playAnimation(data: AnimationData): void;
function stopAnimation(data: AnimationData): void;
```

### AnimationSystem

```ts
class AnimationSystem extends System {
  query = [Animation];

  update(world: World, dt: number): void {
    // 遍历所有 Animation Entity
    // dt 累加到 elapsed
    // elapsed >= frameTime 时，currentFrame++
    // 如果 loop=true 且 currentFrame >= frames.length，重置为 0
    // 如果 loop=false 且 currentFrame >= frames.length，停止
  }
}
```

### Camera Component

```ts
interface CameraData {
  x: number; // 相机在世界中的位置
  y: number;
  zoom: number; // 缩放比例，默认 1
  followEntity?: Entity; // 跟随目标
  followMode: 'center' | 'lerp'; // 跟随模式
  lerpSpeed?: number; // lerp 模式下的平滑速度
}

const Camera: ComponentType<CameraData>;

function createCamera(options?: Partial<CameraData>): CameraData;
```

### CameraSystem

```ts
class CameraSystem extends System {
  query = [Camera];

  update(world: World, _dt: number): void {
    // 遍历 Camera
    // 如果 followEntity 存在，获取其 Transform
    // 根据 followMode 更新相机位置
  }
}
```

### RenderSystem 修改

```ts
class RenderSystem extends System {
  // 新增：查询相机
  query = [Transform, Sprite];

  update(world: World, _dt: number): void {
    this.driver.clear();
    const ctx = this.driver.getContext();

    // 获取相机（假设只有一个）
    const cameras = world.query([Camera]);
    const camera = cameras.length > 0
      ? world.getComponent<CameraData>(cameras[0], Camera)
      : null;

    // 应用相机变换
    if (camera) {
      ctx.save();
      ctx.translate(-camera.x + this.driver.getWidth() / 2, -camera.y + this.driver.getHeight() / 2);
      ctx.scale(camera.zoom, camera.zoom);
    }

    // 绘制 Sprite（世界坐标）
    // ...

    if (camera) ctx.restore();
  }
}
```

## Demo: apps/demo-platformer

一个简单的 2D 平台跳跃 demo：
- WASD 或方向键控制角色移动
- 空格跳跃
- 角色是一个有帧动画的精灵（简单的颜色切换模拟动画）
- 相机跟随角色
- 有地面和平台（静态 Entity）

验证点：
1. InputManager 能正确捕获键盘输入
2. MovementSystem 通过 input.isKeyDown() 控制角色
3. AnimationSystem 驱动角色动画播放
4. CameraSystem 让相机跟随角色
5. RenderSystem 正确应用相机变换

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-engine/src/input/InputManager.ts` | Create |
| 2 | `packages/game-engine/src/input/Keyboard.ts` | Create |
| 3 | `packages/game-engine/src/input/Mouse.ts` | Create |
| 4 | `packages/game-engine/src/input/index.ts` | Create |
| 5 | `packages/game-engine/src/index.ts` | Modify (export InputManager) |
| 6 | `packages/game-renderer-canvas/src/components/Animation.ts` | Create |
| 7 | `packages/game-renderer-canvas/src/components/Camera.ts` | Create |
| 8 | `packages/game-renderer-canvas/src/systems/AnimationSystem.ts` | Create |
| 9 | `packages/game-renderer-canvas/src/systems/CameraSystem.ts` | Create |
| 10 | `packages/game-renderer-canvas/src/systems/RenderSystem.ts` | Modify (camera support) |
| 11 | `packages/game-renderer-canvas/src/index.ts` | Modify (export new modules) |
| 12 | `apps/demo-platformer/package.json` | Create |
| 13 | `apps/demo-platformer/tsconfig.json` | Create |
| 14 | `apps/demo-platformer/vite.config.ts` | Create |
| 15 | `apps/demo-platformer/index.html` | Create |
| 16 | `apps/demo-platformer/src/main.ts` | Create |
| 17 | `apps/demo-platformer/src/PlayerMovementSystem.ts` | Create |
| 18 | `apps/demo-platformer/src/setup.ts` | Create (地面/平台 Entity) |