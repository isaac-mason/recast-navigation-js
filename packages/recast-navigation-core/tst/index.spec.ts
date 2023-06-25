import { BoxGeometry, BufferAttribute, Mesh } from 'three';
import { beforeAll, beforeEach, describe, test } from 'vitest';
import { init, NavMesh, NavMeshGenerator, NavMeshQuery } from '../src';

describe('Smoke tests', () => {
  beforeAll(async () => {
    await init();
  });

  describe('NavMesh Generation', () => {
    let navMeshGenerator: NavMeshGenerator;
    let navMesh: NavMesh;
    let navMeshQuery: NavMeshQuery;

    beforeEach(() => {
      navMeshGenerator = new NavMeshGenerator();

      const mesh = new Mesh(new BoxGeometry(5, 0.1, 5));

      const positions = (
        mesh.geometry.getAttribute('position') as BufferAttribute
      ).array;
      const indices = mesh.geometry.getIndex()!.array;

      const result = navMeshGenerator.generateSoloNavMesh(positions, indices);
      navMesh = result.navMesh;

      navMeshQuery = new NavMeshQuery({ navMesh });
    });

    test('getClosestPoint', async ({ expect }) => {
      const closestPoint = navMeshQuery.getClosestPoint({ x: 2, y: 1, z: 2 });

      expect(closestPoint.x).toBe(2);
      expect(closestPoint.y).toBeCloseTo(0.15, 0.01);
      expect(closestPoint.z).toBe(2);
    });
  });
});
