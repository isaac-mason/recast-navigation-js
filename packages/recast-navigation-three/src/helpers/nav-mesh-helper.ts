import { NavMesh } from '@recast-navigation/core';
import {
  BufferAttribute,
  BufferGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
} from 'three';

export type NavMeshHelperParams = {
  navMesh: NavMesh;
  navMeshMaterial?: Material;
};

export class NavMeshHelper {
  navMesh: Mesh;

  navMeshMaterial: Material;

  recastNavMesh: NavMesh;

  constructor({ navMesh, navMeshMaterial }: NavMeshHelperParams) {
    this.recastNavMesh = navMesh;

    this.navMeshMaterial = navMeshMaterial
      ? navMeshMaterial
      : new MeshBasicMaterial({
        color: 'orange',
        transparent: true,
        opacity: 0.7,
      });

    this.navMesh = new Mesh(new BufferGeometry(), this.navMeshMaterial);

    this.updateNavMesh();
  }

  /**
   * Update the three debug nav mesh.
   *
   * This should be called after updating the nav mesh.
   */
  updateNavMesh() {
    const { positions, indices } = this.recastNavMesh.getDebugNavMesh();

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
}
