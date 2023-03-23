import { init, NavMesh } from 'recast-navigation';
import { BoxGeometry, BufferAttribute, Mesh } from 'three';
import { beforeAll, beforeEach, describe, test } from 'vitest';

describe('Smoke tests', () => {
  beforeAll(async () => {
    await init();
  });

  describe('NavMesh', () => {
    let navMesh: NavMesh;

    beforeEach(() => {
      navMesh = new NavMesh();

      const mesh = new Mesh(new BoxGeometry(5, 0.1, 5));

      const positions = (
        mesh.geometry.getAttribute('position') as BufferAttribute
      ).array;
      const indices = mesh.geometry.getIndex()!.array;

      navMesh.build(positions, indices);
    });

    test('getClosestPoint', async ({ expect }) => {
      const closestPoint = navMesh.getClosestPoint({ x: 2, y: 1, z: 2 });

      expect(closestPoint.x).toBe(2);
      expect(closestPoint.y).toBeCloseTo(0.15, 0.01);
      expect(closestPoint.z).toBe(2);
    });
  });
});
