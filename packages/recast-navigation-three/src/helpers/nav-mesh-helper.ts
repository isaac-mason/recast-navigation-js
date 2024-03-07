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

  geometry: BufferGeometry;

  constructor({ navMesh, navMeshMaterial }: NavMeshHelperParams) {
    super();

    this.navMesh = navMesh;

    this.geometry = new BufferGeometry();

    this.navMeshMaterial = navMeshMaterial
      ? navMeshMaterial
      : new MeshBasicMaterial({
          color: 'orange',
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });

    this.update();

    this.mesh = new Mesh(this.geometry, this.navMeshMaterial);

    this.add(this.mesh);
  }

  /**
   * Update the three debug nav mesh.
   *
   * This should be called after updating the nav mesh.
   */
  update() {
    const [positions, indices] = this.navMesh.getDebugNavMesh();

    this.geometry.setAttribute(
      'position',
      new BufferAttribute(Float32Array.from(positions), 3)
    );
    this.geometry.setIndex(new BufferAttribute(Uint32Array.from(indices), 1));
    this.geometry.computeVertexNormals();
  }
}
