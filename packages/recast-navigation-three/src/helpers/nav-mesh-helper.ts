import { NavMesh } from '@recast-navigation/core';
import {
  BufferAttribute,
  BufferGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from 'three';

export type NavMeshHelperParams = {
  navMesh: NavMesh;
  navMeshMaterial?: Material;
};

export class NavMeshHelper extends Object3D {
  navMesh: NavMesh;
 
  navMeshMaterial: Material;

  mesh: Mesh;

  constructor({ navMesh, navMeshMaterial }: NavMeshHelperParams) {
    super();

    this.navMesh = navMesh;

    this.navMeshMaterial = navMeshMaterial
      ? navMeshMaterial
      : new MeshBasicMaterial({
        color: 'orange',
        transparent: true,
        opacity: 0.7,
      });

    this.mesh = new Mesh(new BufferGeometry(), this.navMeshMaterial);
    this.add(this.mesh)

    this.update();
  }

  /**
   * Update the three debug nav mesh.
   *
   * This should be called after updating the nav mesh.
   */
  update() {
    const { positions, indices } = this.navMesh.getDebugNavMesh();

    const geometry = this.mesh.geometry;

    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3)
    );

    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

    geometry.computeVertexNormals();
  }
}
