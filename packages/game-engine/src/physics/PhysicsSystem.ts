import { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { Entity } from '../ecs/Entity';
import { Transform, type TransformData } from '../components/Transform';
import { RigidBody, type RigidBodyData, BodyType } from './RigidBody';

export class PhysicsSystem extends System {
  readonly query = [Transform, RigidBody];
  private gravity: number;

  constructor(gravity: number) {
    super();
    this.gravity = gravity;
  }

  update(world: World, dt: number): void {
    const entities = world.query(this.query);

    for (const entity of entities) {
      const rb = world.getComponent<RigidBodyData>(entity, RigidBody)!;
      const t = world.getComponent<TransformData>(entity, Transform)!;

      if (rb.type === BodyType.Static) continue;

      // Apply gravity
      rb.ay += this.gravity * rb.gravityScale;

      // Integrate acceleration → velocity
      rb.vx += rb.ax * dt;
      rb.vy += rb.ay * dt;

      // Integrate velocity → position
      t.x += rb.vx * dt;
      t.y += rb.vy * dt;

      // Reset acceleration (applied each frame by forces)
      rb.ax = 0;
      rb.ay = 0;
    }
  }
}