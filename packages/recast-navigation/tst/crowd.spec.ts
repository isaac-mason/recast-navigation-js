import { Crowd, NavMesh, NavMeshQuery, init } from 'recast-navigation';
import { generateSoloNavMesh } from 'recast-navigation/generators';
import { BoxGeometry, BufferAttribute, Mesh } from 'three';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { expectVectorToBeCloseTo } from './utils';

describe('Crowd', () => {
  beforeAll(async () => {
    await init();
  });

  let navMesh: NavMesh;
  let navMeshQuery: NavMeshQuery;
  let crowd: Crowd;

  beforeEach(() => {
    const mesh = new Mesh(new BoxGeometry(5, 0.1, 5));

    const positions = (
      mesh.geometry.getAttribute('position') as BufferAttribute
    ).array;
    const indices = mesh.geometry.getIndex()!.array;

    const result = generateSoloNavMesh(positions, indices);

    if (!result.success) throw new Error('nav mesh generation failed');

    navMesh = result.navMesh;

    navMeshQuery = new NavMeshQuery({ navMesh });

    crowd = new Crowd({
      navMesh,
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

    agent.goto({ x: 2, y: 0, z: 2 });

    crowd.update(5);

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
