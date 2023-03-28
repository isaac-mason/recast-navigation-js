import { NavMesh } from '@recast-navigation/core';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
} from 'three';

export type ThreeDebugNavMeshParams = {
  navMesh: NavMesh;
  navMeshMaterial?: Material;
};

export class ThreeDebugNavMesh {
  mesh: Mesh;

  obstacles: Group;

  navMesh: NavMesh;

  constructor({ navMesh, navMeshMaterial }: ThreeDebugNavMeshParams) {
    this.navMesh = navMesh;

    this.mesh = new Mesh();
    this.mesh.material =
      navMeshMaterial ??
      new MeshBasicMaterial({ color: 'red', side: DoubleSide });

    this.obstacles = new Group();

    this.updateNavMesh();
    this.updateNavMeshObstacles();
  }

  updateNavMesh() {
    const debugNavMesh = this.navMesh.getDebugNavMesh();

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(debugNavMesh.positions), 3)
    );

    geometry.setIndex(
      new BufferAttribute(new Uint16Array(debugNavMesh.indices), 1)
    );

    this.mesh.geometry = geometry;
  }

  updateNavMeshObstacles() {
    /* todo! */
  }
}
