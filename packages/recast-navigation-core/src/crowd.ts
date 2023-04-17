import type R from '@recast-navigation/wasm';
import type { NavMesh } from './nav-mesh';
import { Raw } from './raw';
import type { NavPath, Vector3 } from './utils';
import { navPath, vec3 } from './utils';

export type CrowdParams = {
  maxAgents: number;
  maxAgentRadius: number;
  navMesh: NavMesh;
};

export type CrowdAgentParams = {
  /**
   * @default 0.5
   */
  radius: number;

  /**
   * @default 1
   */
  height: number;

  /**
   * @default 20
   */
  maxAcceleration: number;

  /**
   * @default 6
   */
  maxSpeed: number;

  /**
   * @default 2.5
   */
  collisionQueryRange: number;

  /**
   * @default 0
   */
  pathOptimizationRange: number;

  /**
   * @default 0
   */
  separationWeight: number;

  /**
   * @default 7
   */
  updateFlags: number;

  /**
   * @default 0
   */
  obstacleAvoidanceType: number;

  /**
   * @default 0
   */
  queryFilterType: number;

  /**
   * @default 0
   */
  userData: unknown;
};

const crowdAgentParamsDefaults: CrowdAgentParams = {
  radius: 0.5,
  height: 1,
  maxAcceleration: 20,
  maxSpeed: 6,
  collisionQueryRange: 2.5,
  pathOptimizationRange: 0,
  separationWeight: 0,
  updateFlags: 7,
  obstacleAvoidanceType: 0,
  queryFilterType: 0,
  userData: 0,
};

const Epsilon = 0.001;

export class Crowd {
  raw: R.Crowd;

  agents: number[] = [];

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
    this.raw = new Raw.Recast.Crowd(
      maxAgents,
      maxAgentRadius,
      navMesh.raw.getNavMesh()
    );
  }

  addAgent(
    position: Vector3,
    crowdAgentParams: Partial<CrowdAgentParams>
  ): number {
    const params = {
      ...crowdAgentParamsDefaults,
      ...crowdAgentParams,
    } as Required<CrowdAgentParams>;

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

    this.agents.push(agentId);

    return agentId;
  }

  removeAgent(agentIndex: number) {
    this.raw.removeAgent(agentIndex);

    const i = this.agents.indexOf(agentIndex);
    if (i > -1) {
      this.agents.splice(i, 1);
    }
  }

  goto(agentIndex: number, position: Vector3) {
    this.raw.agentGoto(agentIndex, vec3.toRaw(position));
  }

  teleport(agentIndex: number, position: Vector3) {
    this.raw.agentTeleport(agentIndex, vec3.toRaw(position));
  }

  resetMoveTarget(agentIndex: number) {
    this.raw.agentResetMoveTarget(agentIndex);
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

  /**
   * Returns the number of active agents in the crowd.
   */
  getActiveAgentCount(): number {
    return this.raw.getActiveAgentCount();
  }

  getAgents(): number[] {
    return this.agents;
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

  setAgentParameters(
    agentIndex: number,
    crowdAgentParams: Partial<CrowdAgentParams>
  ) {
    const params = {
      ...crowdAgentParamsDefaults,
      ...crowdAgentParams,
    } as CrowdAgentParams;

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

  updateAgentParameters(
    agentIndex: number,
    crowdAgentParams: Partial<CrowdAgentParams>
  ) {
    const params = {
      ...this.getAgentParameters(agentIndex),
      ...crowdAgentParams,
    } as CrowdAgentParams;

    this.setAgentParameters(agentIndex, params);
  }

  getDefaultQueryExtent(): Vector3 {
    return vec3.fromRaw(this.raw.getDefaultQueryExtent());
  }

  setDefaultQueryExtent(extent: Vector3): void {
    this.raw.setDefaultQueryExtent(vec3.toRaw(extent));
  }
}
