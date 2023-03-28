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

const Epsilon = 0.001;

export class Crowd {
  raw: R.Crowd;

  /**
   * The NavMesh the crowd is interacting with
   */
  navMesh: NavMesh;

  /**
   * If delta time in navigation tick update is greater than the time step
   * a number of sub iterations are done. If more iterations are need to reach deltatime
   * they will be discarded.
   * A value of 0 will set to no maximum and update will use as many substeps as needed
   */
  maximumSubStepCount = 10;

  /**
   * Get the time step of the navigation tick update.
   */
  timeStep = 1 / 60;

  /**
   * Time factor applied when updating crowd agents (default 1). A value of 0 will pause crowd updates.
   */
  timeFactor = 1;

  constructor({ maxAgents, maxAgentRadius, navMesh }: CrowdParams) {
    this.navMesh = navMesh;
    this.raw = new R.Crowd(maxAgents, maxAgentRadius, navMesh.raw);
  }

  addAgent(position: Vector3, params: CrowdAgentParams): number {
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

    return agentId;
  }

  removeAgent(agentIndex: number) {
    this.raw.removeAgent(agentIndex);
  }

  goto(agentIndex: number, position: Vector3) {
    this.raw.agentGoto(agentIndex, vec3.toRaw(position));
  }

  teleport(agentIndex: number, position: Vector3) {
    this.raw.agentTeleport(agentIndex, vec3.toRaw(position));
  }

  update(deltaTime: number) {
    // update navmesh obstacles
    this.navMesh.update();

    if (deltaTime <= Epsilon) {
      return;
    }

    // update crowd
    const { timeStep } = this;
    const maxStepCount = this.maximumSubStepCount;

    if (timeStep <= Epsilon) {
      this.raw.update(deltaTime);
    } else {
      let iterationCount = Math.floor(deltaTime / timeStep);
      if (maxStepCount && iterationCount > maxStepCount) {
        iterationCount = maxStepCount;
      }
      if (iterationCount < 1) {
        iterationCount = 1;
      }

      const step = deltaTime / iterationCount;
      for (let i = 0; i < iterationCount; i++) {
        this.raw.update(step);
      }
    }
  }

  destroy() {
    this.raw.destroy();
  }

  /**
   * Returns the maximum number of agents that can be managed by the crowd.
   */
  getAgentCount(): number {
    return this.raw.getAgentCount();
  }

  getAgentPosition(agentIndex: number): Vector3 {
    return vec3.fromRaw(this.raw.getAgentPosition(agentIndex));
  }

  getAgentVelocity(agentIndex: number): Vector3 {
    return vec3.fromRaw(this.raw.getAgentVelocity(agentIndex));
  }

  getAgentNextTargetPath(agentIndex: number): Vector3 {
    return vec3.fromRaw(this.raw.getAgentNextTargetPath(agentIndex));
  }

  getAgentState(agentIndex: number): number {
    return this.raw.getAgentState(agentIndex);
  }

  getAgentCorners(agentIndex: number): NavPath {
    const corners = this.raw.getCorners(agentIndex);

    return navPath.fromRaw(corners);
  }

  getAgentParameters(agentIndex: number): CrowdAgentParams {
    const params = this.raw.getAgentParameters(agentIndex);

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

  setAgentParameters(agentIndex: number, params: CrowdAgentParams) {
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

    this.raw.setAgentParameters(agentIndex, dtCrowdAgentParams);
  }

  getDefaultQueryExtent(): Vector3 {
    return vec3.fromRaw(this.raw.getDefaultQueryExtent());
  }

  setDefaultQueryExtent(extent: Vector3): void {
    this.raw.setDefaultQueryExtent(vec3.toRaw(extent));
  }
}
