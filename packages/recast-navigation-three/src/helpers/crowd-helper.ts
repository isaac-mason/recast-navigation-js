import { Crowd, CrowdAgent } from '@recast-navigation/core';
import {
  CylinderGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

export type CrowdHelperParams = {
  agentMaterial?: Material;
};

export class CrowdHelper extends Object3D {
  agentMeshes: Map<number, Mesh> = new Map();

  recastCrowd: Crowd;

  agentMaterial: Material;

  constructor(crowd: Crowd, params?: CrowdHelperParams) {
    super();

    this.recastCrowd = crowd;

    this.agentMaterial =
      params?.agentMaterial ?? new MeshBasicMaterial({ color: 'red' });

    this.update();
  }

  /**
   * Update the three debug view of the crowd agents.
   *
   * This should be called after updating the crowd.
   */
  update() {
    const agents = this.recastCrowd.getAgents();

    const unseen = new Set(this.agentMeshes.keys());

    for (const agent of agents) {
      unseen.delete(agent.agentIndex);

      const position = agent.position();
      const velocity = agent.velocity();

      let agentMesh: Mesh | undefined = this.agentMeshes.get(agent.agentIndex);

      if (agentMesh === undefined) {
        agentMesh = this.createAgentMesh(agent);

        this.add(agentMesh);
        this.agentMeshes.set(agent.agentIndex, agentMesh);
      } else {
        this.updateAgentGeometry(agentMesh, agent);
      }

      agentMesh.position.set(
        position.x,
        position.y + agent.height / 2,
        position.z,
      );

      agentMesh.lookAt(
        new Vector3().copy(agentMesh.position).add(velocity as Vector3),
      );
    }

    for (const agentId of unseen) {
      const agentMesh = this.agentMeshes.get(agentId);

      if (agentMesh) {
        this.remove(agentMesh);
        this.agentMeshes.delete(agentId);
      }
    }
  }

  private createAgentMesh(agent: CrowdAgent): Mesh {
    const mesh = new Mesh();

    mesh.material = this.agentMaterial;

    this.updateAgentGeometry(mesh, agent);

    mesh.userData = {
      radius: agent.radius,
      height: agent.height,
    };

    return mesh;
  }

  private updateAgentGeometry(agentMesh: Mesh, agentParams: CrowdAgent) {
    if (
      agentMesh.userData.radius !== agentParams.radius ||
      agentMesh.userData.height !== agentParams.height
    ) {
      const geometry = new CylinderGeometry(
        agentParams.radius,
        agentParams.radius,
        agentParams.height,
      );

      agentMesh.geometry.dispose();
      agentMesh.geometry = geometry;

      agentMesh.userData.radius = agentParams.radius;
      agentMesh.userData.height = agentParams.height;
    }
  }
}
