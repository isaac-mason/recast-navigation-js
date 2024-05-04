import { NavMesh, NavMeshQuery, init } from 'recast-navigation';
import { generateSoloNavMesh } from 'recast-navigation/generators';
import { BoxGeometry, BufferAttribute, Mesh } from 'three';
import { beforeEach, describe, test } from 'vitest';

describe('Smoke tests', () => {
  let navMesh: NavMesh;
  let navMeshQuery: NavMeshQuery;

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

    navMeshQuery = new NavMeshQuery(navMesh);
  });

  test('findClosestPoint', async ({ expect }) => {
    const { point: closestPoint } = navMeshQuery.findClosestPoint({
      x: 2,
      y: 1,
      z: 2,
    });

    expect(closestPoint.x).toBe(2);
    expect(closestPoint.y).toBeCloseTo(0.15, 0.01);
    expect(closestPoint.z).toBe(2);
  });
});
