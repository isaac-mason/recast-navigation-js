import { Crowd, CrowdAgent } from '@recast-navigation/core@';
import {
  BasicMaterial,
  Entity,
  Vec3,
  CylinderGeometry,
  Mesh,
  MeshInstance,
  Material,
  GraphicsDevice,
  StandardMaterial,
  GraphNode
} from 'playcanvas';


export type CrowdHelperParams = {
  crowd: Crowd;
  agentMaterial?: Material;
};

export type CrowdAgentData = {
  radius: number;
  height: number;
};

const tmpVec3: Vec3 = new Vec3();

export class CrowdHelper extends GraphNode
 {
  agentMeshes: Map<number, Mesh> = new Map();

  recastCrowd: Crowd;

  agentMaterial: Material;

  graphicsDevice: GraphicsDevice;

  agentMeshData: Map<number, CrowdAgentData> = new Map();

  constructor(graphicsDevice: GraphicsDevice, { crowd, agentMaterial }: CrowdHelperParams) {
    super();

    this.agentMeshData = new Map();
    this.recastCrowd = crowd;
    this.graphicsDevice = graphicsDevice;

    this.agentMaterial = agentMaterial ?? new StandardMaterial();

    agentMaterial && this.agentMaterial.diffuse?.set(1, 0, 0);

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

      let agentMesh = this.agentMeshes.get(agent.agentIndex);

      if (agentMesh === undefined) {
        agentMesh = this.createAgentMesh(agent);

        this.addChild(agentMesh);
        this.agentMeshes.set(agent.agentIndex, agentMesh);
      } else {
        this.updateAgentGeometry(agentMesh, agent);
      }

      agentMesh.setLocalPosition(
        position.x,
        position.y + agent.height / 2,
        position.z
      );

      agentMesh.lookAt(
        tmpVec3.copy(agentMesh.position).add(velocity)
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

    mesh.material = this.agentMaterial;

    this.updateAgentGeometry(mesh, agent);

    this.agentMeshData.set(agent.agentIndex, {
      radius: agent.radius,
      height: agent.height,
    });

    return mesh;
  }

  updateAgentGeometry(agentMesh: Entity, agentParams: CrowdAgent) {

    const agentData : CrowdAgentData | undefined = this.agentMeshData.get(agentParams.agentIndex);

    if (
      agentData === undefined ||
      agentData.radius !== agentParams.radius ||
      agentData.height !== agentParams.height
    ) {

      // Dispose of the old mesh
      agentMesh.render.meshInstances.forEach((meshInstance : MeshInstance) => meshInstance.mesh.dispose());

      const mesh: Mesh = Mesh.fromGeometry(this.graphicsDevice, new CylinderGeometry(agentParams))
      agentMesh.render.meshInstances = [new MeshInstance(mesh, this.agentMaterial, agentMesh)];

      this.agentMeshData.set(agentParams.agentIndex, agentParams);
    }
  }
}
