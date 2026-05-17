import { System } from '../ecs/System';
import type { Entity } from '../ecs/Entity';
import type { World } from '../ecs/World';
import { EventBus } from '../core/EventBus';
import { Transform, type TransformData } from '../components/Transform';
import { RigidBody, type RigidBodyData, BodyType } from './RigidBody';
import { CollisionBox, type CollisionBoxData } from './CollisionBox';
import { CollisionMatrix } from './CollisionLayer';

export interface CollisionEvent {
  entityA: Entity;
  entityB: Entity;
  overlapX: number;
  overlapY: number;
  normalX: number;
  normalY: number;
}

export class CollisionSystem extends System {
  readonly query = [Transform, CollisionBox];
  private collisionMatrix: CollisionMatrix;
  private eventBus?: EventBus;

  constructor(collisionMatrix: CollisionMatrix, eventBus?: EventBus) {
    super();
    this.collisionMatrix = collisionMatrix;
    this.eventBus = eventBus;
  }

  update(world: World, _dt: number): void {
    const entities = world.query(this.query);

    // Reset onGround for all dynamic rigid bodies
    for (const entity of entities) {
      const rb = world.getComponent<RigidBodyData>(entity, RigidBody);
      if (rb) rb.onGround = false;
    }

    // Check collisions between all pairs
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i];
        const b = entities[j];

        const boxA = world.getComponent<CollisionBoxData>(a, CollisionBox)!;
        const boxB = world.getComponent<CollisionBoxData>(b, CollisionBox)!;

        // Skip if layers don't collide
        if (!this.collisionMatrix.shouldCollide(boxA.layer, boxB.layer)) continue;

        const tA = world.getComponent<TransformData>(a, Transform)!;
        const tB = world.getComponent<TransformData>(b, Transform)!;

        // Calculate world AABB for A
        const aLeft = tA.x + boxA.offsetX - boxA.width / 2;
        const aRight = tA.x + boxA.offsetX + boxA.width / 2;
        const aTop = tA.y + boxA.offsetY - boxA.height / 2;
        const aBottom = tA.y + boxA.offsetY + boxA.height / 2;

        // Calculate world AABB for B
        const bLeft = tB.x + boxB.offsetX - boxB.width / 2;
        const bRight = tB.x + boxB.offsetX + boxB.width / 2;
        const bTop = tB.y + boxB.offsetY - boxB.height / 2;
        const bBottom = tB.y + boxB.offsetY + boxB.height / 2;

        // AABB overlap test
        const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
        const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);

        if (overlapX <= 0 || overlapY <= 0) continue;

        // Determine collision normal (smallest overlap axis)
        let normalX = 0;
        let normalY = 0;

        const centerAx = tA.x + boxA.offsetX;
        const centerBx = tB.x + boxB.offsetX;
        const centerAy = tA.y + boxA.offsetY;
        const centerBy = tB.y + boxB.offsetY;

        if (overlapX < overlapY) {
          normalX = centerAx < centerBx ? -1 : 1;
          normalY = 0;
        } else {
          normalX = 0;
          normalY = centerAy < centerBy ? -1 : 1;
        }

        // Emit collision event
        const event: CollisionEvent = {
          entityA: a,
          entityB: b,
          overlapX,
          overlapY,
          normalX,
          normalY,
        };
        this.eventBus?.emit('collision', event);

        // Resolve collision (separate overlapping bodies)
        this.resolveCollision(world, a, b, event);
      }
    }
  }

  private resolveCollision(world: World, a: Entity, b: Entity, event: CollisionEvent): void {
    const rbA = world.getComponent<RigidBodyData>(a, RigidBody);
    const rbB = world.getComponent<RigidBodyData>(b, RigidBody);
    const tA = world.getComponent<TransformData>(a, Transform)!;
    const tB = world.getComponent<TransformData>(b, Transform)!;

    const isDynamicA = rbA?.type === BodyType.Dynamic;
    const isDynamicB = rbB?.type === BodyType.Dynamic;

    if (!isDynamicA && !isDynamicB) return; // Both static, no resolution

    // Separate bodies based on collision normal
    if (isDynamicA && !isDynamicB) {
      // A is dynamic, B is static — move A only
      this.separateAndRespond(world, a, b, event, rbA!, tA);
    } else if (!isDynamicA && isDynamicB) {
      // A is static, B is dynamic — move B only
      const reversedEvent = {
        ...event,
        normalX: -event.normalX,
        normalY: -event.normalY,
      };
      this.separateAndRespond(world, b, a, reversedEvent, rbB!, tB);
    } else {
      // Both dynamic — move both by half
      tA.x += event.normalX * event.overlapX / 2;
      tA.y += event.normalY * event.overlapY / 2;
      tB.x -= event.normalX * event.overlapX / 2;
      tB.y -= event.normalY * event.overlapY / 2;

      // Velocity response along normal
      if (rbA && rbB) {
        if (event.normalX !== 0) {
          rbA.vx = event.normalX * Math.abs(rbA.vx) * rbA.restitution;
          rbB.vx = -event.normalX * Math.abs(rbB.vx) * rbB.restitution;
        }
        if (event.normalY !== 0) {
          rbA.vy = event.normalY * Math.abs(rbA.vy) * rbA.restitution;
          rbB.vy = -event.normalY * Math.abs(rbB.vy) * rbB.restitution;
        }
      }
    }
  }

  private separateAndRespond(
    world: World,
    dynamicEntity: Entity,
    staticEntity: Entity,
    event: CollisionEvent,
    rb: RigidBodyData,
    t: TransformData,
  ): void {
    // Move dynamic body out of overlap
    if (event.normalX !== 0) {
      t.x += event.normalX * event.overlapX;
      // Velocity response
      if (Math.abs(rb.vx) > 0) {
        rb.vx = event.normalX * Math.abs(rb.vx) * rb.restitution;
      }
    }
    if (event.normalY !== 0) {
      t.y += event.normalY * event.overlapY;
      // Velocity response
      if (event.normalY < 0) {
        // Hit something below → landing
        rb.vy = 0;
        rb.onGround = true;
      } else if (event.normalY > 0) {
        // Hit something above → ceiling
        rb.vy = 0;
      }
    }
  }
}