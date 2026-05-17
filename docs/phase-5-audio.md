# Phase 5: Audio System

## Overview

为引擎添加音频支持：
1. **AudioManager** — 音效播放、背景音乐管理、音量控制
2. **AudioSource Component** — 绑定到 Entity 的音频源（位置音效）
3. **音频池** — 频繁播放的短音效（如跳跃、碰撞）复用 AudioBufferNode

## Architecture Decisions

### 音频放在独立包 `packages/game-audio`

音频依赖 Web Audio API，与渲染无关。独立包便于未来替换实现（比如用 Howler.js 或适配小游戏平台）。

core 包只定义 Audio 相关的 Component 接口，game-audio 提供具体实现。

### 用 Web Audio API 而非 HTML5 `<audio>`

- Web Audio API 提供精确控制：音量、播放速率、循环、淡入淡出
- 支持 AudioBuffer 复用（同一个音效多次并发播放）
- 支持位置音效（通过 PannerNode 做空间化）

### 音频资源通过 ResourceManager 加载

阶段4的 ResourceManager 扩展 AudioResourceLoader：
- 加载 → 解码为 AudioBuffer → 缓存
- 播放时从缓存取 AudioBuffer，创建 BufferSourceNode

## Package Structure

```
packages/game-audio/
  src/
    AudioManager.ts        # 统一音频管理：播放、停止、音量
    AudioSource.ts         # 绑定 Entity 的音频源组件
    AudioSystem.ts         # 每帧检查 AudioSource 状态，触发/停止播放
    AudioPool.ts           # 短音效池化复用
    AudioResourceLoader.ts # 加载音频文件为 AudioBuffer
    index.ts
```

### core 包新增接口

```ts
// packages/game-engine/src/audio/types.ts
interface AudioSourceData {
  url: string;
  volume: number;        // 0-1
  loop: boolean;
  playing: boolean;
  spatial: boolean;      // 是否根据 Entity 位置做空间音效
  fadeIn: number;        // 淡入时间（秒）
  fadeOut: number;       // 淡出时间（秒）
}

// Component 注册在 core，实现在 game-audio
```

## API Design

### AudioManager

```ts
class AudioManager {
  private context: AudioContext;
  private masterGain: GainNode;         // 总音量
  private musicGain: GainNode;          // 音乐音量
  private sfxGain: GainNode;            // 音效音量
  private pool: AudioPool;
  private bufferCache: Map<string, AudioBuffer>;
  private resourceManager?: ResourceManager;

  constructor(options?: { resourceManager?: ResourceManager });

  // 全局音量控制
  setMasterVolume(volume: number): void;  // 0-1
  setMusicVolume(volume: number): void;
  setSfxVolume(volume: number): void;

  // 加载音频
  load(url: string): Promise<AudioBuffer>;
  unload(url: string): void;

  // 播放
  playSfx(url: string, options?: { volume?: number }): void;      // 短音效，自动池化
  playMusic(url: string, options?: { volume?: number, loop?: boolean, fadeIn?: number }): void;
  stopMusic(fadeOut?: number): void;
  stopAll(): void;

  // 全局暂停/恢复（游戏暂停时）
  suspend(): void;   // AudioContext.suspend()
  resume(): void;    // AudioContext.resume()

  destroy(): void;   // 关闭 AudioContext
}
```

### AudioPool

```ts
class AudioPool {
  // 管理短音效的并发播放
  // 同一个 AudioBuffer 可同时有多个 BufferSourceNode 播放
  // 播放结束后 Node 自动回收

  play(buffer: AudioBuffer, gainNode: GainNode, options?: PlayOptions): AudioBufferSourceNode;
  stop(node: AudioBufferSourceNode): void;
}
```

### AudioSource Component

```ts
// 绑定到 Entity，定义该 Entity 关联的声音
const AudioSource: ComponentType<AudioSourceData>;

function createAudioSource(url: string, options?: Partial<AudioSourceData>): AudioSourceData;
```

### AudioSystem

```ts
class AudioSystem extends System {
  query = [AudioSource];

  constructor(audioManager: AudioManager);
  update(world: World, dt: number): void;
  // 遍历 AudioSource Entity：
  //   如果 playing=true 且还没在播放 → audioManager.playSfx()
  //   如果 playing=false 且正在播放 → 停止
  //   如果 spatial=true → 根据 Transform 更新 PannerNode 位置
}
```

### 位置音效（Spatial Audio）

```ts
// 空间音效需要 Entity 有 Transform
// AudioSystem 对有 spatial=true 的 AudioSource：
//   创建 PannerNode 连接到 source
//   每帧根据 Transform 更新 PannerNode.positionX/Y/Z

// 2D 空间音效简化版：
//   - 只有左右声道偏移（基于 Entity 与 Camera 的水平距离）
//   - 音量随距离衰减
```

## 使用示例

```ts
const audioManager = new AudioManager();
await audioManager.load('/assets/jump.wav');
await audioManager.load('/assets/bg_music.mp3');

// 背景音乐
audioManager.playMusic('/assets/bg_music.mp3', { loop: true, fadeIn: 1 });

// 玩家跳跃音效（在 PlayerMovementSystem 中）
if (playerJumped) {
  audioManager.playSfx('/assets/jump.wav');
}

// Entity 绑定音源（脚步声循环）
const footstepSource = createAudioSource('/assets/footstep.wav', { loop: true, volume: 0.3 });
world.addComponent(player, AudioSource, footstepSource);
```

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `packages/game-audio/package.json` | Create |
| 2 | `packages/game-audio/tsconfig.json` | Create |
| 3 | `packages/game-audio/src/AudioManager.ts` | Create |
| 4 | `packages/game-audio/src/AudioPool.ts` | Create |
| 5 | `packages/game-audio/src/AudioResourceLoader.ts` | Create |
| 6 | `packages/game-audio/src/AudioSource.ts` | Create |
| 7 | `packages/game-audio/src/AudioSystem.ts` | Create |
| 8 | `packages/game-audio/src/index.ts` | Create |
| 9 | `packages/game-engine/src/audio/types.ts` | Create (接口定义) |
| 10 | `packages/game-engine/src/index.ts` | Modify |
| 11 | `apps/demo-audio/*` | Create (demo) |