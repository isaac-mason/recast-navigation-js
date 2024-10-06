import { Obstacle, TileCache } from '@recast-navigation/core';
import {
  BoxGeometry,
  CylinderGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

export type TileCacheHelperParams = {
  obstacleMaterial?: Material;
};

export class TileCacheHelper extends Object3D {
  tileCache: TileCache;

  obstacleMeshes: Map<Obstacle, Mesh> = new Map();

  obstacleMaterial: Material;

  constructor(tileCache: TileCache, params?: TileCacheHelperParams) {
    super();

    this.tileCache = tileCache;

    this.obstacleMaterial = params?.obstacleMaterial
      ? params.obstacleMaterial
      : new MeshBasicMaterial({
          color: 'red',
          wireframe: true,
          wireframeLinewidth: 2,
        });

    this.update();
  }

  /**
   * Update the obstacle meshes.
   *
   * This should be called after adding or removing obstacles.
   */
  update() {
    const unseen = new Set(this.obstacleMeshes.keys());

    for (const [, obstacle] of this.tileCache.obstacles) {
      const obstacleMesh = this.obstacleMeshes.get(obstacle);

      unseen.delete(obstacle);

      if (!obstacleMesh) {
        const { position } = obstacle;

        const mesh = new Mesh(undefined, this.obstacleMaterial);

        mesh.position.copy(position as Vector3);

        if (obstacle.type === 'box') {
          const { halfExtents, angle } = obstacle;

          mesh.geometry = new BoxGeometry(
            halfExtents.x * 2,
            halfExtents.y * 2,
            halfExtents.z * 2
          );

          mesh.rotation.y = angle;
        } else if (obstacle.type === 'cylinder') {
          const { radius, height } = obstacle;

          mesh.geometry = new CylinderGeometry(radius, radius, height, 16);

          mesh.position.y += height / 2;
        } else {
          throw new Error(`Unknown obstacle type: ${obstacle}`);
        }

        this.add(mesh);
        this.obstacleMeshes.set(obstacle, mesh);
      }
    }

    for (const obstacle of unseen) {
      const obstacleMesh = this.obstacleMeshes.get(obstacle);

      if (obstacleMesh) {
        this.remove(obstacleMesh);
        this.obstacleMeshes.delete(obstacle);
      }
    }
  }
}
