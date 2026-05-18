
import { defineComponent, type ComponentType } from '@game-engine/core';

export type ParticleValue = number | { min: number; max: number };

export interface ParticleEmitterData {
  // 发射参数
  rate: number; // 每秒发射数量
  burst?: number; // 一次性爆发数量
  maxParticles: number; // 同时存在的最大粒子数

  // 粒子初始状态
  lifetime: ParticleValue; // 粒子存活时间（秒）
  speed: ParticleValue; // 初始速度
  angle: ParticleValue; // 发射角度（弧度）
  angleSpread?: number; // 角度随机散布范围

  // 粒子外观
  color: string | { start: string; end: string }; // 颜色或渐变
  size: ParticleValue; // 初始尺寸
  sizeOverLife?: number; // 生命周期内尺寸变化率，1=不变，0=缩小到0
  opacityOverLife?: number; // 透明度曲线

  // 粒子行为
  gravity?: number; // 粒子受重力影响
  friction?: number; // 速度衰减
  shape: 'point' | 'circle' | 'rect'; // 粒子形状

  // 发射器状态
  active: boolean;
  elapsed: number; // 累计时间（用于 rate 计算）
}

export const ParticleEmitter: ComponentType<ParticleEmitterData> = defineComponent<ParticleEmitterData>();

export function createEmitter(options: Partial<ParticleEmitterData> & Pick<ParticleEmitterData, 'maxParticles' | 'lifetime' | 'speed' | 'angle' | 'rate' | 'shape' | 'color' | 'size'>): ParticleEmitterData {
  return {
    rate: options.rate,
    maxParticles: options.maxParticles,
    lifetime: options.lifetime,
    speed: options.speed,
    angle: options.angle,
    shape: options.shape,
    color: options.color,
    size: options.size,
    burst: options.burst,
    angleSpread: options.angleSpread ?? 0,
    sizeOverLife: options.sizeOverLife ?? 1,
    opacityOverLife: options.opacityOverLife ?? 1,
    gravity: options.gravity,
    friction: options.friction,
    active: options.active ?? true,
    elapsed: 0,
  };
}
