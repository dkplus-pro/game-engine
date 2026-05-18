
import { System, type World } from '@game-engine/core';
import { Transform, type TransformData } from '../components/Transform';
import { ParticleEmitter, type ParticleEmitterData, type ParticleValue } from './ParticleEmitter';
import { ParticlePool } from './ParticlePool';

interface ParticleReference {
  particle: any;
  emitter: ParticleEmitterData;
}

export class ParticleSystem extends System {
  query = [Transform, ParticleEmitter];
  private pool: ParticlePool;
  private particleEmitters: Map<any, ParticleEmitterData>;

  constructor(maxParticles: number = 5000) {
    super();
    this.pool = new ParticlePool(maxParticles);
    this.particleEmitters = new Map();
  }

  update(world: World, dt: number): void {
    const entities = world.query(this.query);
    const activeEmitters = new Set<number>();

    for (const entity of entities) {
      const transform = world.getComponent<TransformData>(entity, Transform);
      const emitter = world.getComponent<ParticleEmitterData>(entity, ParticleEmitter);

      if (!transform || !emitter || !emitter.active) continue;

      activeEmitters.add(entity);
      emitter.elapsed += dt;

      // 计算需要发射的新粒子数量
      let emitCount = Math.floor(emitter.rate * dt);

      // 处理爆发模式
      if (emitter.burst && emitter.burst > 0) {
        emitCount = Math.max(emitCount, emitter.burst);
        emitter.burst = 0;
      }

      // 发射新粒子
      for (let i = 0; i < emitCount; i++) {
        this.emitParticle(emitter, transform);
      }

      // 更新该发射器的所有活跃粒子
      this.updateEmitterParticles(emitter, dt);
    }

    // 清理不再活跃的发射器记录
    for (const entity of this.particleEmitters.keys()) {
      if (!activeEmitters.has(entity)) {
        this.particleEmitters.delete(entity);
      }
    }
  }

  private emitParticle(emitter: ParticleEmitterData, transform: TransformData): void {
    const particle = this.pool.acquire();
    if (!particle) return;

    // 计算发射角度
    let angle = this.randomValue(emitter.angle);
    if (emitter.angleSpread) {
      angle += (Math.random() - 0.5) * emitter.angleSpread;
    }

    // 计算初始速度
    const speed = this.randomValue(emitter.speed);

    // 设置粒子初始状态
    particle.x = transform.x;
    particle.y = transform.y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.maxLife = this.randomValue(emitter.lifetime);
    particle.life = particle.maxLife;
    particle.initialSize = this.randomValue(emitter.size);
    particle.size = particle.initialSize;
    particle.color = this.getColor(emitter.color);
    particle.active = true;

    // 记录粒子对应的发射器
    this.particleEmitters.set(particle, emitter);
  }

  private updateEmitterParticles(emitter: ParticleEmitterData, dt: number): void {
    const particles = this.pool.getActiveParticles();

    for (const particle of particles) {
      if (!particle.active) continue;

      // 只更新属于当前发射器的粒子
      const particleEmitter = this.particleEmitters.get(particle);
      if (particleEmitter !== emitter) continue;

      // 减少生命值
      particle.life -= dt;

      // 死亡判定
      if (particle.life <= 0) {
        this.pool.release(particle);
        this.particleEmitters.delete(particle);
        continue;
      }

      // 应用重力
      if (emitter.gravity) {
        particle.vy += emitter.gravity * dt;
      }

      // 应用摩擦力
      if (emitter.friction) {
        particle.vx *= (1 - emitter.friction * dt);
        particle.vy *= (1 - emitter.friction * dt);
      }

      // 更新位置
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      // 更新尺寸
      if (emitter.sizeOverLife !== undefined && emitter.sizeOverLife !== 1) {
        const lifeRatio = particle.life / particle.maxLife;
        particle.size = particle.initialSize * (1 - (1 - lifeRatio) * (1 - emitter.sizeOverLife));
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera?: { x: number; y: number; zoom: number }): void {
    const particles = this.pool.getActiveParticles();

    for (const particle of particles) {
      if (!particle.active) continue;

      const lifeRatio = particle.life / particle.maxLife;
      const emitter = this.particleEmitters.get(particle);
      if (!emitter) continue;

      // 计算透明度
      let opacity = 1;
      if (emitter.opacityOverLife !== undefined) {
        opacity = lifeRatio * emitter.opacityOverLife;
      }

      ctx.save();

      // 应用摄像机变换
      if (camera) {
        const offsetX = ctx.canvas.width / 2 - camera.x * camera.zoom;
        const offsetY = ctx.canvas.height / 2 - camera.y * camera.zoom;
        ctx.translate(offsetX, offsetY);
        ctx.scale(camera.zoom, camera.zoom);
      }

      // 绘制粒子
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

      if (particle.color) {
        ctx.fillStyle = particle.color;
      }

      switch (emitter.shape) {
        case 'point':
          ctx.fillRect(particle.x, particle.y, 1, 1);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, Math.max(0.5, particle.size / 2), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'rect':
          ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            Math.max(1, particle.size),
            Math.max(1, particle.size)
          );
          break;
      }

      ctx.restore();
    }
  }

  private randomValue(value: ParticleValue): number {
    if (typeof value === 'number') {
      return value;
    }
    return value.min + Math.random() * (value.max - value.min);
  }

  private getColor(color: string | { start: string; end: string }): string {
    if (typeof color === 'string') {
      return color;
    }
    // 随机选择起点或终点颜色
    return Math.random() > 0.5 ? color.start : color.end;
  }
}
