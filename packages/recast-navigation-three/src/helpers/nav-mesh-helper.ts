import { NavMesh } from '@recast-navigation/core';
import {
  BufferAttribute,
  BufferGeometry, Group,
  Material,
  Mesh,
  MeshBasicMaterial
} from 'three';

export type NavMeshHelperParams = {
  navMesh: NavMesh;
  navMeshMaterial?: Material;
  obstaclesMaterial?: Material;
};

export class NavMeshHelper {
  navMesh: Mesh;

  obstacles: Group;

  recastNavMesh: NavMesh;

  navMeshMaterial: Material;

  obstaclesMaterial: Material;

  constructor({ navMesh, navMeshMaterial, obstaclesMaterial }: NavMeshHelperParams) {
    this.recastNavMesh = navMesh;

    this.navMeshMaterial = navMeshMaterial ? navMeshMaterial : new MeshBasicMaterial({ color: 'blue', wireframe: true });
    this.obstaclesMaterial = obstaclesMaterial ? obstaclesMaterial : new MeshBasicMaterial({ color: 'red', wireframe: true });

    this.navMesh = new Mesh(
      new BufferGeometry(),
      
    );

    this.obstacles = new Group();

    this.updateNavMesh();
    this.updateObstacles();
  }

  updateNavMesh() {
    const { positions, indices } = this.recastNavMesh.getDebugNavMesh();

    // Set the winding order of the affected faces to clockwise
    for (let i = 0; i < indices.length; i += 3) {
      const tmp = indices[i];
      indices[i] = indices[i + 2];
      indices[i + 2] = tmp;
    }

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3)
    );

    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

    geometry.computeVertexNormals();

    this.navMesh.geometry = geometry;
  }

  updateObstacles() {
    /* todo! */
  }
}
