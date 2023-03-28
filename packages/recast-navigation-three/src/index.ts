import { NavMesh, NavMeshConfig } from '@recast-navigation/core';
import {
  BufferAttribute,
  BufferGeometry,
  // DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

export const threeToNavMeshArgs = (
  object: Object3D
): [positions: number[], indices: number[]] => {
  const meshes: Mesh[] = [];

  object.traverse((child) => {
    if (child instanceof Mesh) {
      meshes.push(child);
    }
  });

  let index: number;
  let tri: number;
  let pt: number;

  const indices: number[] = [];
  const positions: number[] = [];

  let offset = 0;
  for (index = 0; index < meshes.length; index++) {
    if (meshes[index]) {
      const mesh = meshes[index];

      const meshIndices = mesh.geometry.getIndex()?.array;
      if (!meshIndices) {
        continue;
      }

      const meshPositions = (mesh.geometry.getAttribute(
        'position'
      ) as BufferAttribute)!.array;
      if (!meshPositions) {
        continue;
      }

      for (tri = 0; tri < meshIndices.length; tri++) {
        indices.push(meshIndices[tri] + offset);
      }

      const position = new Vector3();
      for (pt = 0; pt < meshPositions.length; pt += 3) {
        position.set(
          meshPositions[pt],
          meshPositions[pt + 1],
          meshPositions[pt + 2]
        );
        mesh.localToWorld(position);

        positions.push(position.x, position.y, position.z);
      }

      offset += meshPositions.length / 3;
    }
  }

  return [positions, indices];
};

export const threeToNavMesh = (
  object: Object3D,
  navMeshConfig: NavMeshConfig = {}
): NavMesh => {
  const [positions, indices] = threeToNavMeshArgs(object);

  const navMesh = new NavMesh();
  navMesh.build(positions, indices, navMeshConfig);

  return navMesh;
};

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
      navMeshMaterial ?? new MeshBasicMaterial({ color: 'red' });

    this.obstacles = new Group();

    this.updateNavMesh();
    this.updateNavMeshObstacles();
  }

  updateNavMesh() {
    const { positions, indices } = this.navMesh.getDebugNavMesh();

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
    // Recompute vertex normals
    geometry.computeVertexNormals();

    this.mesh.geometry = geometry;
  }

  updateNavMeshObstacles() {
    /* todo! */
  }
}
