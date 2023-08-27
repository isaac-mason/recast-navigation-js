import { finalizer } from './finalizer';
import type { NavMesh } from './nav-mesh';
import { NavMeshQuery } from './nav-mesh-query';
import { Raw } from './raw';
import type R from './raw-module';
import { Vector3, vec3 } from './utils';


export type CrowdParams = {
  /**
   * The maximum number of agents that can be managed by the crowd.
   * [Limit: >= 1]
   */
  maxAgents: number;

  /**
   * The maximum radius of any agent that will be added to the crowd.
   * [Limit: > 0]
   */
  maxAgentRadius: number;

  /**
   * The navigation mesh to use for planning.
   */
  navMesh: NavMesh;
};

export type CrowdAgentParams = {
  /**
   * The radius of the agent.
   * @default 0.5
   */
  radius: number;

  /**
   * The height of the agent.
   * @default 1
   */
  height: number;

  /**
   * The maximum allowed acceleration for the agent.
   * @default 20
   */
  maxAcceleration: number;

  /**
   * The maximum allowed speed for the agent.
   * @default 6
   */
  maxSpeed: number;

  /**
   * Defines how close a collision element must be before it is considered for steering behaviors.
   * [Limits: > 0]
   * @default 2.5
   */
  collisionQueryRange: number;

  /**
   * The path visibility optimization range.
   * [Limit: > 0]
   * @default 0
   */
  pathOptimizationRange: number;

  /**
   * How aggresive the agent manager should be at avoiding collisions with this agent.
   * [Limit: >= 0]
   * @default 0
   */
  separationWeight: number;

  /**
   * Flags that impact steering behavior.
   * @default 7
   */
  updateFlags: number;

  /**
   * The index of the avoidance configuration to use for the agent.
   * [Limits: 0 <= value <= #DT_CROWD_MAX_OBSTAVOIDANCE_PARAMS]
   * @default 0
   */
  obstacleAvoidanceType: number;

  /**
   * The index of the query filter used by this agent.
   * @default 0
   */
  queryFilterType: number;

  /**
   * User defined data attached to the agent.
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
  raw: R.dtCrowd;

  /**
   * The indices of the active agents in the crowd.
   */
  agents: number[] = [];

  /**
   * The NavMesh the crowd is interacting with.
   */
  navMesh: NavMesh;

  /**
   * If delta time in navigation tick update is greater than the time step a number of sub iterations are done.
   * If more iterations are need to reach deltatime they will be discarded.
   * A value of 0 will set to no maximum and update will use as many substeps as needed.
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

  /**
   * The NavMeshQuery used to find nearest polys for commands
   */
  navMeshQuery: NavMeshQuery;

  constructor({ maxAgents, maxAgentRadius, navMesh }: CrowdParams) {
    this.navMesh = navMesh;
    this.raw = new Raw.Module.dtCrowd();
    this.raw.init(maxAgents, maxAgentRadius, navMesh.raw.getNavMesh());

    this.navMeshQuery = new NavMeshQuery(
      new Raw.Module.NavMeshQuery(this.raw.getNavMeshQuery())
    );

    finalizer.register(this);
  }

  /**
   * Adds a new agent to the crowd.
   */
  addAgent(
    position: Vector3,
    crowdAgentParams: Partial<CrowdAgentParams>
  ): number {
    const params = {
      ...crowdAgentParamsDefaults,
      ...crowdAgentParams,
    } as Required<CrowdAgentParams>;

    const dtCrowdAgentParams = new Raw.Module.dtCrowdAgentParams();
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

    const agentId = this.raw.addAgent(
      vec3.toArray(position),
      dtCrowdAgentParams
    );

    this.agents.push(agentId);

    return agentId;
  }

  /**
   * Removes the agent from the crowd.
   */
  removeAgent(agentIndex: number) {
    this.raw.removeAgent(agentIndex);

    const index = this.agents.indexOf(agentIndex);
    if (index !== -1) {
      this.agents.splice(index, 1);
    }
  }

  /**
   * Submits a new move request for the specified agent.
   */
  goto(agentIndex: number, position: Vector3): boolean {
    const { nearestPoint, nearestRef } = this.navMeshQuery.findNearestPoly(
      position,
      this.navMeshQuery.defaultQueryHalfExtents,
      this.navMeshQuery.defaultFilter
    );

    return this.raw.requestMoveTarget(
      agentIndex,
      nearestRef,
      vec3.toArray(nearestPoint)
    );
  }

  /**
   * Teleports the agent to the given position.
   */
  teleport(agentIndex: number, position: Vector3) {
    Raw.CrowdUtils.agentTeleport(
      this.raw,
      agentIndex,
      vec3.toArray(position),
      vec3.toArray(this.navMeshQuery.defaultQueryHalfExtents),
      this.navMeshQuery.defaultFilter
    );
  }

  /**
   * Resets the current move request for the specified agent.
   */
  resetMoveTarget(agentIndex: number) {
    this.raw.resetMoveTarget(agentIndex);
  }

  /**
   * Updates the crowd
   */
  update(deltaTime: number) {
    if (deltaTime <= Epsilon) {
      return;
    }

    // update crowd
    const { timeStep } = this;
    const maxStepCount = this.maximumSubStepCount;

    if (timeStep <= Epsilon) {
      this.raw.update(deltaTime, undefined!);
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
        this.raw.update(step, undefined!);
      }
    }
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
    return Raw.CrowdUtils.getActiveAgentCount(this.raw);
  }

  /**
   * Returns the indices of all active agents.
   */
  getAgents(): number[] {
    return this.agents;
  }

  /**
   * Returns the position of the specified agent.
   */
  getAgentPosition(agentIndex: number): Vector3 {
    const agent = this.raw.getAgent(agentIndex);

    return { x: agent.get_npos(0), y: agent.get_npos(1), z: agent.get_npos(2) };
  }

  /**
   * Returns the velocity of the specified agent.
   */
  getAgentVelocity(agentIndex: number): Vector3 {
    const agent = this.raw.getAgent(agentIndex);

    return { x: agent.get_vel(0), y: agent.get_vel(1), z: agent.get_vel(2) };
  }

  /**
   * Returns the next target position on the path to the specified agents target.
   */
  getAgentNextTargetPath(agentIndex: number): Vector3 {
    const agent = this.raw.getAgent(agentIndex);

    return {
      x: agent.get_targetPos(0),
      y: agent.get_targetPos(1),
      z: agent.get_targetPos(2),
    };
  }

  /**
   * Returns the state of the specified agent.
   *
   * 0 = DT_CROWDAGENT_STATE_INVALID
   * 1 = DT_CROWDAGENT_STATE_WALKING
   * 2 = DT_CROWDAGENT_STATE_OFFMESH
   */
  getAgentState(agentIndex: number): number {
    const agent = this.raw.getAgent(agentIndex);

    return agent.state;
  }

  /**
   * Returns the local path corridor corners for the specified agent.
   */
  getAgentCorners(agentIndex: number): Vector3[] {
    const agent = this.raw.getAgent(agentIndex);

    const points: Vector3[] = [];

    for (let i = 0; i < agent.ncorners; i++) {
      points.push({
        x: agent.get_cornerVerts(i * 3),
        y: agent.get_cornerVerts(i * 3 + 1),
        z: agent.get_cornerVerts(i * 3 + 2),
      });
    }

    return points;
  }

  /**
   * Returns the parameters for the specified agent.
   */
  getAgentParameters(agentIndex: number): CrowdAgentParams {
    const { params } = this.raw.getAgent(agentIndex);

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

  /**
   * Sets the parameters for the specified agent.
   * Any parameters not specified in the crowdAgentParams object will be set to their default values.
   * @param agentIndex
   * @param crowdAgentParams
   */
  setAgentParameters(
    agentIndex: number,
    crowdAgentParams: Partial<CrowdAgentParams>
  ) {
    const params = {
      ...crowdAgentParamsDefaults,
      ...crowdAgentParams,
    } as CrowdAgentParams;

    const dtCrowdAgentParams = new Raw.Module.dtCrowdAgentParams();

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

    this.updateAgentParameters(agentIndex, dtCrowdAgentParams);
  }

  /**
   * Updates the parameters for the specified agent.
   * Any parameters not specified in the crowdAgentParams object will be unchanged.
   * @param agentIndex
   * @param crowdAgentParams
   */
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

  destroy(): void {
    finalizer.unregister(this);
    Raw.Module.destroy(this.raw);
  }
}
