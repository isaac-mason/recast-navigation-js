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
  navMeshMaterial?: Material;
};

export class NavMeshHelper extends Object3D {
  navMesh: NavMesh;

  mesh: Mesh;

  navMeshMaterial: Material;

  navMeshGeometry: BufferGeometry;

  constructor(navMesh: NavMesh, params?: NavMeshHelperParams) {
    super();

    this.navMesh = navMesh;

    this.navMeshGeometry = new BufferGeometry();

    this.navMeshMaterial = params?.navMeshMaterial
      ? params.navMeshMaterial
      : new MeshBasicMaterial({
          color: 'orange',
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });

    this.update();

    this.mesh = new Mesh(this.navMeshGeometry, this.navMeshMaterial);

    this.add(this.mesh);
  }

  /**
   * Update the three debug nav mesh.
   *
   * This should be called after updating the nav mesh.
   */
  update() {
    const [positions, indices] = this.navMesh.getDebugNavMesh();

    this.navMeshGeometry.setAttribute(
      'position',
      new BufferAttribute(Float32Array.from(positions), 3)
    );
    this.navMeshGeometry.setIndex(
      new BufferAttribute(Uint32Array.from(indices), 1)
    );
    this.navMeshGeometry.computeVertexNormals();
  }
}
