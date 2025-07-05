import type { Obstacle, TileCache } from '@recast-navigation/core';
import {
  Color,
  Entity,
  type Material,
  RENDERSTYLE_WIREFRAME,
  StandardMaterial,
  Vec3,
} from 'playcanvas';

/**
 * Parameters for creating TileCacheHelper.
 */
export type TileCacheHelperParams = {
  obstacleMaterial?: Material;
};

/**
 * Represents a helper class to visualize tile cache obstacles in PlayCanvas.
 */
export class TileCacheHelper extends Entity {
  tileCache: TileCache;
  obstacleMeshes = new Map<Obstacle, Entity>();
  obstacleMaterial: Material;

  constructor(tileCache: TileCache, params?: TileCacheHelperParams) {
    super();

    this.tileCache = tileCache;

    // Initialize obstacleMaterial
    if (params?.obstacleMaterial) {
      this.obstacleMaterial = params.obstacleMaterial;
    } else {
      const material = new StandardMaterial();
      material.diffuse = new Color(1, 0, 0); // Red color
      material.update();
      this.obstacleMaterial = material;
    }

    this.updateHelper();
  }

  /**
   * Update the obstacle meshes.
   *
   * This should be called after adding or removing obstacles.
   */
  updateHelper() {
    const unseen = new Set(this.obstacleMeshes.keys());

    for (const obstacle of this.tileCache.obstacles.values()) {
      let obstacleEntity = this.obstacleMeshes.get(obstacle);

      unseen.delete(obstacle);

      if (!obstacleEntity) {
        const { position } = obstacle;

        obstacleEntity = new Entity();
        obstacleEntity.setPosition(
          new Vec3(position.x, position.y, position.z),
        );

        if (obstacle.type === 'box') {
          const { halfExtents, angle } = obstacle;

          obstacleEntity.addComponent('render', {
            type: 'box',
            material: this.obstacleMaterial,
          });

          obstacleEntity.setLocalScale(
            halfExtents.x * 2,
            halfExtents.y * 2,
            halfExtents.z * 2,
          );

          obstacleEntity.setEulerAngles(0, angle * (180 / Math.PI), 0);
        } else if (obstacle.type === 'cylinder') {
          const { radius, height } = obstacle;

          obstacleEntity.addComponent('render', {
            type: 'cylinder',
            material: this.obstacleMaterial,
          });

          obstacleEntity.setLocalScale(radius * 2, height, radius * 2);
          obstacleEntity.translateLocal(0, height / 2, 0);
        } else {
          throw new Error(
            `Unknown obstacle type: ${(obstacle as Obstacle).type}`,
          );
        }

        // Set render style to wireframe
        if (obstacleEntity.render) {
          obstacleEntity.render.meshInstances.forEach((meshInstance) => {
            meshInstance.renderStyle = RENDERSTYLE_WIREFRAME;
          });
        }

        this.addChild(obstacleEntity);
        this.obstacleMeshes.set(obstacle, obstacleEntity);
      }
    }

    for (const obstacle of unseen) {
      const obstacleEntity = this.obstacleMeshes.get(obstacle);

      if (obstacleEntity) {
        obstacleEntity.destroy();
        this.obstacleMeshes.delete(obstacle);
      }
    }
  }
}
