# Phase 10: Editor Tooling

## Overview

为引擎添加开发工具，帮助游戏开发者快速构建和调试游戏：
1. **Live Editor** — 实时拖拽放置 Entity、属性面板编辑
2. **Tilemap Editor** — 可视化瓦片地图编辑器
3. **Scene Serializer** — 场景序列化/反序列化（JSON 导入导出）

## Architecture Decisions

### Editor 作为独立应用 `apps/editor`

编辑器是一个独立的 Web 应用，使用引擎包来运行预览。架构：

```
apps/editor/
  → 运行时：使用 @game-engine/core + @game-engine/renderer-canvas
  → 编辑时：叠加编辑层（DOM UI + Canvas 选择框）
  → 保存时：序列化为 JSON，供游戏应用加载
```

### 编辑器 UI 技术

不引入重型 UI 框架（React/Vue），保持引擎独立性。用原生 DOM + CSS 构建：
- 属性面板、Entity 列表、工具栏用 DOM
- Canvas 上叠加选择框、拖拽手柄

原因：游戏引擎应尽量轻量，不绑定特定 UI 框架。

### 序列化格式：JSON

```json
{
  "version": 1,
  "scene": {
    "name": "level1",
    "entities": [
      {
        "id": 0,
        "components": {
          "Transform": { "x": 100, "y": 200 },
          "Sprite": { "color": "#e94560", "width": 32, "height": 48 }
        }
      }
    ],
    "systems": ["PhysicsSystem", "RenderSystem"]
  }
}
```

### 编辑器模式 vs 运行模式

- **编辑模式**：GameLoop 暂停，Entity 可拖拽、属性可编辑
- **运行模式**：GameLoop 运行，正常游戏逻辑执行
- 两种模式可实时切换（类似 Unity 的 Play/Pause）

## Package Structure

### 新增 `packages/game-editor`

```
packages/game-editor/
  src/
    Editor.ts               # 编辑器主类：管理编辑/运行模式切换
    SelectionManager.ts     # 选择框、拖拽手柄、Entity 选中
    PropertyPanel.ts        # 属性面板 DOM 构建
    EntityList.ts           # Entity 列表 DOM
    Toolbar.ts              # 工具栏：添加 Entity、切换模式
    Serializer.ts           # 场景 JSON 序列化/反序列化
    TilemapEditor.ts        # 瓦片地图可视化编辑
    index.ts
```

### core 包新增

```ts
// packages/game-engine/src/serialize/
//   Serializer.ts — 从 World 导出/导入 JSON
//   ComponentRegistry.ts — 注册 Component 的序列化规则

interface SerializableComponent {
  type: ComponentType;
  name: string;           // 如 'Transform', 'Sprite'
  serialize(data: any): Record<string, any>;
  deserialize(json: Record<string, any>): any;
}

class ComponentRegistry {
  private registry: Map<ComponentType, SerializableComponent>;

  register(config: SerializableComponent): void;
  get(type: ComponentType): SerializableComponent | undefined;
  getName(type: ComponentType): string;
  getByName(name: string): ComponentType;
}

class WorldSerializer {
  private registry: ComponentRegistry;

  serialize(world: World): SceneJSON;
  deserialize(world: World, json: SceneJSON): void;
}
```

## API Design

### Editor

```ts
class Editor {
  private world: World;
  private driver: CanvasDriver;
  private loop: GameLoop;
  private mode: 'edit' | 'run';

  // 编辑器组件
  private selection: SelectionManager;
  private propertyPanel: PropertyPanel;
  private entityList: EntityList;
  private toolbar: Toolbar;
  private serializer: WorldSerializer;

  constructor(world: World, driver: CanvasDriver, loop: GameLoop);

  // 模式切换
  enterEditMode(): void;   // 暂停 GameLoop，启用拖拽
  enterRunMode(): void;    // 恢复 GameLoop，禁用编辑

  // 选中 Entity
  selectEntity(entity: Entity): void;
  deselectAll(): void;

  // 拖拽移动
  dragEntity(entity: Entity, dx: number, dy: number): void;

  // 序列化
  saveScene(): SceneJSON;
  loadScene(json: SceneJSON): void;

  // 添加 Entity
  addEntity(type: 'rect' | 'circle' | 'platform' | 'tilemap'): Entity;
  removeEntity(entity: Entity): void;

  // 属性编辑
  setComponentProperty(entity: Entity, componentName: string, property: string, value: any): void;
}
```

### SelectionManager

```ts
class SelectionManager {
  private selected: Entity | null;
  private driver: CanvasDriver;

  // 在 Canvas 上叠加绘制选择框和拖拽手柄
  renderSelectionOverlay(ctx: CanvasRenderingContext2D, world: World): void;

  // 鼠标点击检测（哪个 Entity 被点击）
  pickEntity(world: World, mouseX: number, mouseY: number, camera?: CameraData): Entity | null;

  // 拖拽逻辑
  startDrag(entity: Entity, mouseX: number, mouseY: number): void;
  updateDrag(mouseX: number, mouseY: number): void;
  endDrag(): void;
}
```

### PropertyPanel

```ts
class PropertyPanel {
  private container: HTMLElement;

  constructor(parent: HTMLElement);

  // 显示选中 Entity 的所有 Component 属性
  show(entity: Entity, world: World): void;
  hide(): void;

  // 属性值变化回调
  onChange: (entity: Entity, componentName: string, property: string, value: any) => void;
}
```

### EntityList

```ts
class EntityList {
  private container: HTMLElement;

  constructor(parent: HTMLElement);

  // 显示所有 Entity 列表
  refresh(world: World): void;

  // 选中 Entity 回调
  onSelect: (entity: Entity) => void;
}
```

### Toolbar

```ts
class Toolbar {
  private container: HTMLElement;

  constructor(parent: HTMLElement);

  // 按钮：Play / Pause / Add Entity / Remove Entity / Save / Load
  onPlay: () => void;
  onPause: () => void;
  onAddEntity: (type: string) => void;
  onRemoveEntity: () => void;
  onSave: () => void;
  onLoad: () => void;
}
```

### Serializer

```ts
interface SceneJSON {
  version: number;
  name: string;
  entities: {
    id: number;
    components: Record<string, Record<string, any>>;
    behaviors?: Record<string, any>; // Behavior 配置（序列化为构造参数）
  }[];
  systems: string[];
  camera?: Record<string, any>;
}

class WorldSerializer {
  private registry: ComponentRegistry;

  // 注册所有 Component 的序列化规则
  registerDefaults(): void;
  // Transform → { x, y, rotation, scaleX, scaleY }
  // Sprite → { color, width, height, zIndex }
  // RigidBody → { type, mass, vx, vy, ... }
  // CollisionBox → { offsetX, offsetY, width, height, layer }
  // Camera → { x, y, zoom, followMode, lerpSpeed }

  serialize(world: World): SceneJSON;
  deserialize(world: World, json: SceneJSON): void;
}
```

### TilemapEditor

```ts
class TilemapEditor {
  private canvas: HTMLCanvasElement;   // 编辑用 Canvas
  private tilemap: TilemapData;
  private selectedTile: number;         // 当前选中的瓦片 ID

  constructor(parent: HTMLElement);

  // 铺瓦片：鼠标点击 → 设置 data[row][col] = selectedTile
  // 删除瓦片：右键 → 设置 -1
  // 选择瓦片：从瓦片面板选择

  setTilemap(tilemap: TilemapData): void;
  render(): void;                       // 绘制编辑视图（网格 + 瓦片颜色）

  onTilePlace: (row: number, col: number, tileId: number) => void;
  onTileRemove: (row: number, col: number) => void;
}
```

## 编辑器布局

```
┌─────────────────────────────────────────────────────────┐
│ Toolbar: [Play] [Pause] [Add Rect] [Add Platform] [Save]│
├──────────────┬──────────────────────────────┬───────────┤
│              │                              │           │
│ Entity List  │      Canvas Preview          │ Property  │
│              │   (游戏画面 + 选择框叠加)      │ Panel     │
│ - Entity 0   │                              │           │
│ - Entity 1   │                              │ Transform │
│ - Entity 2   │                              │  x: 100   │
│              │                              │  y: 200   │
│              │                              │           │
│              │                              │ Sprite    │
│              │                              │  color:.. │
│              │                              │  w: 32    │
│              │                              │  h: 48    │
├──────────────┴──────────────────────────────┴───────────┤
│ Tilemap Editor (展开/折叠)                               │
└──────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-editor/package.json` | Create |
| 2 | `packages/game-editor/tsconfig.json` | Create |
| 3 | `packages/game-editor/src/Editor.ts` | Create |
| 4 | `packages/game-editor/src/SelectionManager.ts` | Create |
| 5 | `packages/game-editor/src/PropertyPanel.ts` | Create |
| 6 | `packages/game-editor/src/EntityList.ts` | Create |
| 7 | `packages/game-editor/src/Toolbar.ts` | Create |
| 8 | `packages/game-editor/src/TilemapEditor.ts` | Create |
| 9 | `packages/game-editor/src/Serializer.ts` | Create |
| 10 | `packages/game-editor/src/index.ts` | Create |
| 11 | `packages/game-editor/src/styles.css` | Create (编辑器样式) |
| 12 | `packages/game-engine/src/serialize/ComponentRegistry.ts` | Create |
| 13 | `packages/game-engine/src/serialize/WorldSerializer.ts` | Create |
| 14 | `packages/game-engine/src/serialize/index.ts` | Create |
| 15 | `packages/game-engine/src/index.ts` | Modify |
| 16 | `apps/editor/package.json` | Create |
| 17 | `apps/editor/vite.config.ts` | Create |
| 18 | `apps/editor/index.html` | Create |
| 19 | `apps/editor/src/main.ts` | Create |