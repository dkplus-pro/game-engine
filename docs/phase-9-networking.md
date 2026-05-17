# Phase 9: Networking / Multiplayer

## Overview

为引擎添加网络通信能力，支持简单的多人游戏场景：
1. **NetworkManager** — WebSocket 通信层，连接/断开/消息收发
2. **State Sync** — 实体状态同步（位置、速度等关键 Component）
3. **Client Prediction + Server Reconciliation** — 减少网络延迟感知

## Architecture Decisions

### 网络放在独立包 `packages/game-network`

网络层依赖 WebSocket API，独立包便于未来替换传输协议（HTTP 长轮询、WebRTC 等）。

### 服务端架构选择

第一版只做**客户端 SDK**，服务端由使用者自行实现。引擎提供：
- 客户端通信层（WebSocket 连接管理）
- 状态同步协议定义（哪些 Component 需要同步）
- 客户端预测框架

后续可考虑用 Node.js 实现一个参考服务端。

### 同步策略：快照同步

选择快照同步（而非增量同步），原因：
- 实现简单，调试容易
- 带宽开销可通过频率控制和压缩优化
- 适合小规模多人游戏（2-8人）

每个同步帧：
- 服务端发送所有同步 Entity 的 Component 快照
- 客户端接收后，将本地 Entity 的 Component 覆盖为服务端值

### 客户端预测

```ts
// 客户端操作流程：
// 1. 玩家输入 → 本地立即执行（预测）
// 2. 输入同时发送给服务端
// 3. 服务端返回权威状态
// 4. 客户端对比本地状态 vs 服务端状态
//    - 如果一致 → 无操作
//    - 如果不一致 → 用服务端状态修正，并重放本地未确认的输入
```

## Package Structure

```
packages/game-network/
  src/
    NetworkManager.ts      # WebSocket 连接管理
    StateSync.ts           # 状态同步：定义同步规则 + 序列化/反序列化
    ClientPrediction.ts    # 客户端预测 + 输入缓冲 + 回滚重放
    Protocol.ts            # 消息协议定义
    index.ts
```

### core 包新增标记

```ts
// packages/game-engine/src/network/types.ts
// 标记哪些 Component 需要同步
interface SyncConfig {
  componentType: ComponentType;
  properties: string[];    // 只同步指定属性（如 Transform 只同步 x,y）
  frequency: number;       // 同步频率（Hz），默认 20
  interpolate: boolean;    // 是否做插值平滑
}

// Entity 级别标记
const NetworkSync: ComponentType<{ ownerId: string }>; // 标记 Entity 属于哪个玩家
```

## API Design

### NetworkManager

```ts
interface NetworkOptions {
  url: string;                    // WebSocket 服务端 URL
  reconnect?: boolean;            // 自动重连
  reconnectInterval?: number;     // 重连间隔（ms）
  maxReconnectAttempts?: number;  // 最大重连次数
}

class NetworkManager {
  private ws: WebSocket | null;
  private connected: boolean;
  private playerId: string;

  constructor(options: NetworkOptions);

  connect(): Promise<void>;
  disconnect(): void;

  // 发送消息
  send(type: string, data: any): void;

  // 接收消息
  onMessage(handler: (type: string, data: any) => void): void;

  // 连接状态
  isConnected(): boolean;
  getPlayerId(): string;

  // 事件
  onConnect(handler: () => void): void;
  onDisconnect(handler: () => void): void;
  onError(handler: (error: Error) => void): void;
}
```

### StateSync

```ts
class StateSync {
  private syncConfigs: SyncConfig[];
  private networkManager: NetworkManager;

  constructor(networkManager: NetworkManager);

  // 注册需要同步的 Component
  addSync(config: SyncConfig): void;

  // 每帧调用：将本地 Entity 状态序列化发送
  sendState(world: World, entityFilter?: Entity[]): void;

  // 接收服务端状态：反序列化并应用到本地 Entity
  receiveState(world: World, snapshot: StateSnapshot): void;

  // 序列化/反序列化
  serialize(world: World, configs: SyncConfig[]): StateSnapshot;
  deserialize(world: World, snapshot: StateSnapshot): void;
}

interface StateSnapshot {
  tick: number;        // 服务端帧号
  entities: {
    id: Entity;
    ownerId: string;
    components: Record<string, Record<string, any>>;  // { Transform: { x: 100, y: 200 } }
  }[];
}
```

### ClientPrediction

```ts
class ClientPrediction {
  private inputBuffer: InputRecord[];    // 本地输入缓冲（等待服务端确认）
  private lastConfirmedTick: number;     // 最后服务端确认的帧号

  constructor(networkManager: NetworkManager, stateSync: StateSync);

  // 记录玩家输入
  recordInput(tick: number, input: PlayerInput): void;

  // 发送输入给服务端
  sendInput(): void;

  // 收到服务端权威状态 → 对比并修正
  reconcile(world: World, serverSnapshot: StateSnapshot): void;
  // 1. 用服务端快照覆盖本地状态
  // 2. 从 lastConfirmedTick 之后重放 inputBuffer 中所有未确认的输入
  // 3. 结果应接近当前本地状态

  // 插值平滑（非本地玩家的 Entity）
  interpolate(world: World, dt: number): void;
  // 对非自己控制的 Entity，在两次快照之间做位置插值
  // 避免其他玩家移动看起来一帧一帧跳
}

interface InputRecord {
  tick: number;
  input: PlayerInput;
  confirmed: boolean;
}

interface PlayerInput {
  keys: string[];      // 当前按下的键
  mouseX?: number;
  mouseY?: number;
}
```

### Protocol

```ts
// 消息类型定义
enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  STATE_SYNC = 'state_sync',         // 服务端 → 客户端：快照
  INPUT = 'input',                    // 客户端 → 服务端：玩家输入
  ENTITY_CREATE = 'entity_create',    // 服务端 → 客户端：新 Entity
  ENTITY_DESTROY = 'entity_destroy',  // 服务端 → 客户端：销毁 Entity
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
}
```

## 典型多人游戏流程

```ts
const network = new NetworkManager({ url: 'ws://localhost:8080' });
const stateSync = new StateSync(network);
const prediction = new ClientPrediction(network, stateSync);

// 注册同步规则
stateSync.addSync({ componentType: Transform, properties: ['x', 'y'], frequency: 20, interpolate: true });
stateSync.addSync({ componentType: RigidBody, properties: ['vx', 'vy'], frequency: 20 });

// 连接
await network.connect();
const myPlayerId = network.getPlayerId();

// 创建本地玩家 Entity
const player = world.createEntity();
world.addComponent(player, NetworkSync, { ownerId: myPlayerId });
world.addComponent(player, Transform, createTransform(100, 100));

// GameLoop 中
function update(dt: number) {
  // 1. 记录输入
  prediction.recordInput(currentTick, { keys: getCurrentKeys() });
  // 2. 本地预测执行
  world.update(dt);
  // 3. 发送输入和状态
  prediction.sendInput();
  stateSync.sendState(world);
  // 4. 接收服务端数据
  //    通过 onMessage 回调触发 reconcile
}
```

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-network/package.json` | Create |
| 2 | `packages/game-network/tsconfig.json` | Create |
| 3 | `packages/game-network/src/NetworkManager.ts` | Create |
| 4 | `packages/game-network/src/StateSync.ts` | Create |
| 5 | `packages/game-network/src/ClientPrediction.ts` | Create |
| 6 | `packages/game-network/src/Protocol.ts` | Create |
| 7 | `packages/game-network/src/index.ts` | Create |
| 8 | `packages/game-engine/src/network/types.ts` | Create |
| 9 | `packages/game-engine/src/index.ts` | Modify |
| 10 | `pnpm-workspace.yaml` | 无需修改（packages/* 自动包含） |
| 11 | `apps/demo-multiplayer/*` | Create (demo) |