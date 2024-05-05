import { Crowd, NavMesh, NavMeshQuery, init } from 'recast-navigation';
import { generateSoloNavMesh } from 'recast-navigation/generators';
import { BoxGeometry, BufferAttribute, Mesh } from 'three';
import { beforeEach, describe, expect, test } from 'vitest';
import { expectVectorToBeCloseTo } from './utils';

describe('Crowd', () => {
  let navMesh: NavMesh;
  let crowd: Crowd;

  beforeEach(async () => {
    await init();

    const mesh = new Mesh(new BoxGeometry(5, 0.1, 5));

    const positions = (
      mesh.geometry.getAttribute('position') as BufferAttribute
    ).array;
    const indices = mesh.geometry.getIndex()!.array;

    const result = generateSoloNavMesh(positions, indices);

    if (!result.success) throw new Error('nav mesh generation failed');

    navMesh = result.navMesh;

    crowd = new Crowd(navMesh, {
      maxAgents: 10,
      maxAgentRadius: 0.5,
    });
  });

  test('goto', () => {
    const agent = crowd.addAgent(
      { x: 0, y: 0, z: 0 },
      {
        radius: 0.5,
      }
    );

    expectVectorToBeCloseTo(agent.position(), { x: 0, y: 0, z: 0 }, 0.3);

    agent.requestMoveTarget({ x: 2, y: 0, z: 2 });

    for (let i = 0; i < 120; i++) {
      crowd.update(1 / 60);
    }

    expectVectorToBeCloseTo(agent.position(), { x: 2, y: 0, z: 2 }, 0.3);
  });

  test('teleport', () => {
    const agent = crowd.addAgent(
      { x: 0, y: 0, z: 0 },
      {
        radius: 0.5,
      }
    );

    expectVectorToBeCloseTo(agent.position(), { x: 0, y: 0, z: 0 }, 0.3);

    agent.teleport({ x: 2, y: 0, z: 2 });

    expectVectorToBeCloseTo(agent.position(), { x: 2, y: 0, z: 2 }, 0.3);
  });

  test('parameter getters and setters', () => {
    const agent = crowd.addAgent(
      { x: 0, y: 0, z: 0 },
      {
        radius: 0.5,
      }
    );

    expect(agent.radius).toBeCloseTo(0.5);

    agent.radius = 0.2;

    expect(agent.radius).toBeCloseTo(0.2);
  });
});
