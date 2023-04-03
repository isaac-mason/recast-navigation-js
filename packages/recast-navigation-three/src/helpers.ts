import { Crowd, CrowdAgentParams, NavMesh } from '@recast-navigation/core';
import {
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';

export type NavMeshHelperParams = {
  navMesh: NavMesh;
  navMeshMaterial?: Material;
};

export class NavMeshHelper {
  navMesh: Mesh;

  obstacles: Group;

  recastNavMesh: NavMesh;

  constructor({ navMesh, navMeshMaterial }: NavMeshHelperParams) {
    this.recastNavMesh = navMesh;

    this.navMesh = new Mesh(
      new BufferGeometry(),
      navMeshMaterial ??
        new MeshBasicMaterial({ color: 'red' })
    );
    this.obstacles = new Group();

    this.updateNavMesh();
    this.updateNavMeshObstacles();
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
    // Recompute vertex normals
    geometry.computeVertexNormals();

    this.navMesh.geometry = geometry;
  }

  updateNavMeshObstacles() {
    /* todo! */
  }
}

export type CrowdHelperParams = {
  crowd: Crowd;
};

export class CrowdHelper {
  agents: Group;

  agentMeshes: Map<number, Mesh> = new Map();

  recastCrowd: Crowd;

  constructor({ crowd }: CrowdHelperParams) {
    this.recastCrowd = crowd;

    this.agents = new Group();
  }

  updateAgents() {
    const activeAgentCount = this.recastCrowd.getActiveAgentCount();

    const unseen = new Set(this.agentMeshes.keys());

    for (let i = 0; i < activeAgentCount; i++) {
      unseen.delete(i);

      const position = this.recastCrowd.getAgentPosition(i);
      const velocity = this.recastCrowd.getAgentVelocity(i);
      const agentParams = this.recastCrowd.getAgentParameters(i);

      let agentMesh = this.agentMeshes.get(i);

      if (!agentMesh) {
        agentMesh = this.createAgentMesh(agentParams);
        this.agentMeshes.set(i, agentMesh);
      }

      agentMesh.position.set(position.x, position.y, position.z);
      agentMesh.lookAt(
        new Vector3().copy(position as Vector3).add(velocity as Vector3)
      );
    }

    for (const agentId of unseen) {
      const agentMesh = this.agentMeshes.get(agentId);

      if (agentMesh) {
        agentMesh.parent?.remove(agentMesh);
      }

      this.agentMeshes.delete(agentId);
    }
  }

  private createAgentMesh(agentParams: CrowdAgentParams): Mesh {
    const geometry = new CapsuleGeometry(
      agentParams.radius,
      agentParams.height,
      8
    );
    const material = new MeshBasicMaterial({ color: 'blue', wireframe: true });
    const mesh = new Mesh(geometry, material);

    return mesh;
  }
}
