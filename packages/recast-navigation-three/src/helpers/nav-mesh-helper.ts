import { NavMesh, ObstacleRef } from '@recast-navigation/core';
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';

export type NavMeshHelperParams = {
  navMesh: NavMesh;
  navMeshMaterial?: Material;
  obstaclesMaterial?: Material;
};

export class NavMeshHelper {
  navMesh: Mesh;

  obstacles: Group;

  obstacleMeshes: Map<ObstacleRef, Mesh> = new Map();

  navMeshMaterial: Material;

  obstaclesMaterial: Material;

  recastNavMesh: NavMesh;

  constructor({
    navMesh,
    navMeshMaterial,
    obstaclesMaterial,
  }: NavMeshHelperParams) {
    this.recastNavMesh = navMesh;

    this.navMeshMaterial = navMeshMaterial
      ? navMeshMaterial
      : new MeshBasicMaterial({ color: 'blue', wireframe: true });
    this.obstaclesMaterial = obstaclesMaterial
      ? obstaclesMaterial
      : new MeshBasicMaterial({ color: 'red', wireframe: true });

    this.navMesh = new Mesh(new BufferGeometry(), this.navMeshMaterial);

    this.obstacles = new Group();

    this.updateNavMesh();
    this.updateObstacles();
  }

  /**
   * Update the three debug nav mesh.
   * 
   * This should be called after updating the nav mesh.
   */
  updateNavMesh() {
    const { positions, indices } = this.recastNavMesh.getDebugNavMesh();

    // Set the winding order of the affected faces to clockwise
    for (let i = 0; i < indices.length; i += 3) {
      const tmp = indices[i];
      indices[i] = indices[i + 2];
      indices[i + 2] = tmp;
    }

    const geometry = this.navMesh.geometry;

    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3)
    );

    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

    geometry.computeVertexNormals();
  }

  /**
   * Update the obstacle meshes.
   *
   * This should be called after adding or removing obstacles.
   */
  updateObstacles() {    
    const unseen = new Set(this.obstacleMeshes.keys());

    for (const [ref, obstacle] of this.recastNavMesh.obstacles) {
      let obstacleMesh = this.obstacleMeshes.get(ref);

      unseen.delete(ref);

      if (!obstacleMesh) {
        const { position } = obstacle;

        const mesh = new Mesh(undefined, this.obstaclesMaterial);

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
        this.obstacleMeshes.set(ref, mesh);
      }
    }

    for (const ref of unseen) {
      const obstacleMesh = this.obstacleMeshes.get(ref);

      if (obstacleMesh) {
        this.obstacles.remove(obstacleMesh);
        this.obstacleMeshes.delete(ref);
      }
    }
  }
}
