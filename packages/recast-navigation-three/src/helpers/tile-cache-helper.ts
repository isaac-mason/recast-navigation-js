import { Obstacle, TileCache } from '@recast-navigation/core';
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';

export type TileCacheHelperParams = {
  tileCache: TileCache;
  obstacleMaterial?: Material;
};

export class TileCacheHelper {
  tileCache: TileCache;

  obstacles: Group;

  obstacleMeshes: Map<Obstacle, Mesh> = new Map();

  obstacleMaterial: Material;

  constructor({ tileCache, obstacleMaterial }: TileCacheHelperParams) {
    this.tileCache = tileCache;

    this.obstacleMaterial = obstacleMaterial
      ? obstacleMaterial
      : new MeshBasicMaterial({ color: 'red', wireframe: true, wireframeLinewidth: 2 });

    this.obstacles = new Group();

    this.updateObstacles();
  }

  /**
   * Update the obstacle meshes.
   *
   * This should be called after adding or removing obstacles.
   */
  updateObstacles() {
    const unseen = new Set(this.obstacleMeshes.keys());

    for (const [, obstacle] of this.tileCache.obstacles) {
      let obstacleMesh = this.obstacleMeshes.get(obstacle);

      unseen.delete(obstacle);

      if (!obstacleMesh) {
        const { position } = obstacle;

        const mesh = new Mesh(undefined, this.obstacleMaterial);

        mesh.position.copy(position as Vector3);

        if (obstacle.type === 'box') {
          const { extent, angle } = obstacle;

          mesh.geometry = new BoxGeometry(
            extent.x * 2,
            extent.y * 2,
            extent.z * 2
          );

          mesh.rotation.y = angle;
        } else if (obstacle.type === 'cylinder') {
          const { radius, height } = obstacle;

          mesh.geometry = new CylinderGeometry(radius, radius, height, 16);

          mesh.position.y += height / 2;
        } else {
          throw new Error(`Unknown obstacle type: ${obstacle}`);
        }

        this.obstacles.add(mesh);
        this.obstacleMeshes.set(obstacle, mesh);
      }
    }

    for (const obstacle of unseen) {
      const obstacleMesh = this.obstacleMeshes.get(obstacle);

      if (obstacleMesh) {
        this.obstacles.remove(obstacleMesh);
        this.obstacleMeshes.delete(obstacle);
      }
    }
  }
}
