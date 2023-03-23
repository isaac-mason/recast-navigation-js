import R from '@recast-navigation/wasm';
import { NavMesh } from './nav-mesh';
import { Raw } from './raw';
import { navPath, NavPath, vec3, Vector3 } from './utils';

export type CrowdParams = {
  maxAgents: number;
  maxAgentRadius: number;
  navMesh: NavMesh;
};

export type CrowdAgentParams = {
  radius: number;
  height: number;
  maxAcceleration: number;
  maxSpeed: number;
  collisionQueryRange: number;
  pathOptimizationRange: number;
  separationWeight: number;
  updateFlags: number;
  obstacleAvoidanceType: number;
  queryFilterType: number;
  userData: unknown;
};

export class CrowdAgent {
  agentIndex: number;

  crowd: Crowd;

  constructor(crowd: Crowd, agentIndex: number) {
    this.crowd = crowd;
    this.agentIndex = agentIndex;
  }

  getPosition(): Vector3 {
    return vec3.fromRaw(this.crowd.raw.getAgentPosition(this.agentIndex));
  }

  getVelocity(): Vector3 {
    return vec3.fromRaw(this.crowd.raw.getAgentVelocity(this.agentIndex));
  }

  getNextTargetPath(): Vector3 {
    return vec3.fromRaw(this.crowd.raw.getAgentNextTargetPath(this.agentIndex));
  }

  getState(): number {
    return this.crowd.raw.getAgentState(this.agentIndex);
  }

  goto(position: Vector3) {
    this.crowd.raw.agentGoto(this.agentIndex, vec3.toRaw(position));
  }

  teleport(position: Vector3) {
    this.crowd.raw.agentTeleport(this.agentIndex, vec3.toRaw(position));
  }

  getCorners(): NavPath {
    const corners = this.crowd.raw.getCorners(this.agentIndex);

    return navPath.fromRaw(corners);
  }

  getParameters(): CrowdAgentParams {
    const params = this.crowd.raw.getAgentParameters(this.agentIndex);

    return {
      radius: params.radius,
      height: params.height,
      maxAcceleration: params.maxAcceleration,
      maxSpeed: params.maxSpeed,
      collisionQueryRange: params.collisionQueryRange,
      pathOptimizationRange: params.pathOptimizationRange,
      separationWeight: params.separationWeight,
      updateFlags: params.updateFlags,
      obstacleAvoidanceType: params.obstacleAvoidanceType,
      queryFilterType: params.queryFilterType,
      userData: params.userData,
    };
  }

  setParameters(params: CrowdAgentParams) {
    const dtCrowdAgentParams = new Raw.Recast.dtCrowdAgentParams();

    dtCrowdAgentParams.radius = params.radius;
    dtCrowdAgentParams.height = params.height;
    dtCrowdAgentParams.maxAcceleration = params.maxAcceleration;
    dtCrowdAgentParams.maxSpeed = params.maxSpeed;
    dtCrowdAgentParams.collisionQueryRange = params.collisionQueryRange;
    dtCrowdAgentParams.pathOptimizationRange = params.pathOptimizationRange;
    dtCrowdAgentParams.separationWeight = params.separationWeight;
    dtCrowdAgentParams.updateFlags = params.updateFlags;
    dtCrowdAgentParams.obstacleAvoidanceType = params.obstacleAvoidanceType;
    dtCrowdAgentParams.queryFilterType = params.queryFilterType;
    dtCrowdAgentParams.userData = params.userData;

    this.crowd.raw.setAgentParameters(this.agentIndex, dtCrowdAgentParams);
  }
}

export class Crowd {
  raw: R.Crowd;

  agents: Map<number, CrowdAgent> = new Map();

  navMesh: NavMesh;

  constructor({ maxAgents, maxAgentRadius, navMesh }: CrowdParams) {
    this.navMesh = navMesh;
    this.raw = new R.Crowd(maxAgents, maxAgentRadius, navMesh.raw);
  }

  getAgent(index: number): CrowdAgent {
    let agent = this.agents.get(index);

    if (!agent) {
      agent = new CrowdAgent(this, index);
      this.agents.set(index, agent);
    }

    return agent;
  }

  addAgent(position: Vector3, params: CrowdAgentParams): CrowdAgent {
    const dtCrowdAgentParams = new Raw.Recast.dtCrowdAgentParams();

    dtCrowdAgentParams.radius = params.radius;
    dtCrowdAgentParams.height = params.height;
    dtCrowdAgentParams.maxAcceleration = params.maxAcceleration;
    dtCrowdAgentParams.maxSpeed = params.maxSpeed;
    dtCrowdAgentParams.collisionQueryRange = params.collisionQueryRange;
    dtCrowdAgentParams.pathOptimizationRange = params.pathOptimizationRange;
    dtCrowdAgentParams.separationWeight = params.separationWeight;
    dtCrowdAgentParams.updateFlags = params.updateFlags;
    dtCrowdAgentParams.obstacleAvoidanceType = params.obstacleAvoidanceType;
    dtCrowdAgentParams.queryFilterType = params.queryFilterType;
    dtCrowdAgentParams.userData = params.userData;

    const agentId = this.raw.addAgent(vec3.toRaw(position), dtCrowdAgentParams);

    const agent = this.getAgent(agentId);
    this.agents.set(agentId, agent);

    return agent;
  }

  removeAgent(agent: CrowdAgent | number) {
    const index = typeof agent === 'number' ? agent : agent.agentIndex;

    this.agents.delete(index);

    this.raw.removeAgent(index);
  }

  getDefaultQueryExtent(): Vector3 {
    return vec3.fromRaw(this.raw.getDefaultQueryExtent());
  }

  setDefaultQueryExtent(extent: Vector3): void {
    this.raw.setDefaultQueryExtent(vec3.toRaw(extent));
  }

  update(dt: number) {
    this.raw.update(dt);
  }

  destroy() {
    this.raw.destroy();
  }
}
