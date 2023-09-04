import { Crowd, CrowdAgentParams } from '@recast-navigation/core';
import {
  CapsuleGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

export type CrowdHelperParams = {
  crowd: Crowd;
  agentMaterial?: Material;
};

export class CrowdHelper extends Object3D {
  agentMeshes: Map<number, Mesh> = new Map();

  recastCrowd: Crowd;

  agentMaterial: Material;

  constructor({ crowd, agentMaterial }: CrowdHelperParams) {
    super();

    this.recastCrowd = crowd;

    this.agentMaterial =
      agentMaterial ?? new MeshBasicMaterial({ color: 'red' });

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
      const agentParams = agent.parameters();

      let agentMesh = this.agentMeshes.get(agent.agentIndex);

      if (agentMesh === undefined) {
        agentMesh = this.createAgentMesh(agentParams);

        this.add(agentMesh);
        this.agentMeshes.set(agent.agentIndex, agentMesh);
      }

      agentMesh.position.set(
        position.x,
        position.y + agentParams.height / 2,
        position.z
      );
      agentMesh.lookAt(
        new Vector3().copy(agentMesh.position).add(velocity as Vector3)
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

  private createAgentMesh(agentParams: CrowdAgentParams): Mesh {
    const geometry = new CapsuleGeometry(
      agentParams.radius,
      agentParams.height - agentParams.radius * 2
    );

    return new Mesh(geometry, this.agentMaterial);
  }
}
