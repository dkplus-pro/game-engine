
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  initialSize: number;
  color: string;
  active: boolean;
}

export class ParticlePool {
  private particles: Particle[];
  private freeList: number[];
  private maxParticles: number;

  constructor(max: number) {
    this.maxParticles = max;
    this.particles = [];
    this.freeList = [];
  }

  acquire(): Particle | null {
    // 如果池中有空闲粒子，复用
    if (this.freeList.length > 0) {
      const index = this.freeList.pop()!;
      const particle = this.particles[index];
      particle.active = true;
      return particle;
    }

    // 如果还没达到最大数量，创建新粒子
    if (this.particles.length < this.maxParticles) {
      const particle: Particle = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        size: 0,
        initialSize: 0,
        color: '',
        active: true,
      };
      const index = this.particles.length;
      this.particles.push(particle);
      return particle;
    }

    // 池已满，无法分配
    return null;
  }

  release(particle: Particle): void {
    particle.active = false;
    // 将粒子添加到空闲列表以便复用
    const index = this.particles.indexOf(particle);
    if (index !== -1 && !this.freeList.includes(index)) {
      this.freeList.push(index);
    }
  }

  getActiveParticles(): Particle[] {
    return this.particles.filter(p => p.active);
  }

  getSize(): number {
    return this.particles.length;
  }
}
