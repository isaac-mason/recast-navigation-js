import { Crowd, CrowdAgent } from '@recast-navigation/core';
import {
  CylinderGeometry,
  Entity,
  GraphNode,
  GraphicsDevice,
  Material,
  Mesh,
  MeshInstance,
  StandardMaterial,
  Vec3,
} from 'playcanvas';

export type CrowdHelperParams = {
  agentMaterial?: Material;
};

export type CrowdAgentData = {
  radius: number;
  height: number;
};

const _position = new Vec3();
const _velocity = new Vec3();

export class CrowdHelper extends GraphNode {
  agentMeshes = new Map<CrowdAgent, Entity>();

  recastCrowd: Crowd;

  agentMaterial: Material;

  graphicsDevice: GraphicsDevice;

  agentMeshData = new Map<number, CrowdAgentData>();

  constructor(
    crowd: Crowd,
    graphicsDevice: GraphicsDevice,
    params?: CrowdHelperParams,
  ) {
    super();

    this.agentMeshData = new Map();
    this.recastCrowd = crowd;
    this.graphicsDevice = graphicsDevice;

    if (params?.agentMaterial) {
      this.agentMaterial = params.agentMaterial;
    } else {
      const material = new StandardMaterial();
      material.diffuse.set(1, 0, 0);
      this.agentMaterial = material;
    }

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
      unseen.delete(agent);

      const position = agent.position();
      const velocity = agent.velocity();

      let agentMesh = this.agentMeshes.get(agent);

      if (agentMesh === undefined) {
        agentMesh = this.createAgentMesh(agent);

        this.addChild(agentMesh);
        this.agentMeshes.set(agent, agentMesh);
      } else {
        this.updateAgentGeometry(agentMesh, agent);
      }

      agentMesh.setLocalPosition(
        position.x,
        position.y + agent.height / 2,
        position.z,
      );

      agentMesh.lookAt(
        _position
          .copy(agentMesh.getPosition())
          .add(_velocity.set(velocity.x, velocity.y, velocity.z)),
      );
    }

    for (const agentId of unseen) {
      const agentMesh = this.agentMeshes.get(agentId);

      if (agentMesh) {
        this.removeChild(agentMesh);
        this.agentMeshes.delete(agentId);
      }
    }
  }

  createAgentMesh(agent: CrowdAgent): Entity {
    const mesh = new Entity();
    mesh.addComponent('render');

    mesh.render!.material = this.agentMaterial;

    this.updateAgentGeometry(mesh, agent);

    this.agentMeshData.set(agent.agentIndex, {
      radius: agent.radius,
      height: agent.height,
    });

    return mesh;
  }

  updateAgentGeometry(agentMesh: Entity, agentParams: CrowdAgent) {
    const agentData: CrowdAgentData | undefined = this.agentMeshData.get(
      agentParams.agentIndex,
    );

    if (
      agentData === undefined ||
      agentData.radius !== agentParams.radius ||
      agentData.height !== agentParams.height
    ) {
      // Dispose of the old mesh
      if (agentMesh.render) {
        agentMesh.render.meshInstances.forEach((meshInstance: MeshInstance) =>
          meshInstance.mesh.destroy(),
        );
      }

      const mesh: Mesh = Mesh.fromGeometry(
        this.graphicsDevice,
        new CylinderGeometry(agentParams),
      );

      if (agentMesh.render) {
        agentMesh.render.meshInstances = [
          new MeshInstance(mesh, this.agentMaterial, agentMesh),
        ];
      }

      this.agentMeshData.set(agentParams.agentIndex, agentParams);
    }
  }
}
