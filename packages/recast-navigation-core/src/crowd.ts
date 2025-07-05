import type { NavMesh } from './nav-mesh';
import { NavMeshQuery, QueryFilter } from './nav-mesh-query';
import { Raw, RawModule } from './raw';
import { Vector3, vec3 } from './utils';

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

export const crowdAgentParamsDefaults: CrowdAgentParams = {
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

export class CrowdAgent implements CrowdAgentParams {
  raw: RawModule.dtCrowdAgent;

  get radius(): number {
    return this.raw.params.radius;
  }

  set radius(value: number) {
    this.raw.params.radius = value;
  }

  get height(): number {
    return this.raw.params.height;
  }

  set height(value: number) {
    this.raw.params.height = value;
  }

  get maxAcceleration(): number {
    return this.raw.params.maxAcceleration;
  }

  set maxAcceleration(value: number) {
    this.raw.params.maxAcceleration = value;
  }

  get maxSpeed(): number {
    return this.raw.params.maxSpeed;
  }

  set maxSpeed(value: number) {
    this.raw.params.maxSpeed = value;
  }

  get collisionQueryRange(): number {
    return this.raw.params.collisionQueryRange;
  }

  set collisionQueryRange(value: number) {
    this.raw.params.collisionQueryRange = value;
  }

  get pathOptimizationRange(): number {
    return this.raw.params.pathOptimizationRange;
  }

  set pathOptimizationRange(value: number) {
    this.raw.params.pathOptimizationRange = value;
  }

  get separationWeight(): number {
    return this.raw.params.separationWeight;
  }

  set separationWeight(value: number) {
    this.raw.params.separationWeight = value;
  }

  get updateFlags(): number {
    return this.raw.params.updateFlags;
  }

  set updateFlags(value: number) {
    this.raw.params.updateFlags = value;
  }

  get obstacleAvoidanceType(): number {
    return this.raw.params.obstacleAvoidanceType;
  }

  set obstacleAvoidanceType(value: number) {
    this.raw.params.obstacleAvoidanceType = value;
  }

  get queryFilterType(): number {
    return this.raw.params.queryFilterType;
  }

  set queryFilterType(value: number) {
    this.raw.params.queryFilterType = value;
  }

  get userData(): unknown {
    return this.raw.params.userData;
  }

  set userData(value: unknown) {
    this.raw.params.userData = value;
  }

  /**
   * The interpolated position of the agent.
   *
   * Use this if stepping the crowd with interpolation.
   * This will not be updated if stepping the crowd without interpolation.
   */
  interpolatedPosition: Vector3 = { x: 0, y: 0, z: 0 };

  constructor(
    public crowd: Crowd,
    public agentIndex: number,
  ) {
    this.raw = crowd.raw.getEditableAgent(agentIndex);
    this.interpolatedPosition = this.position();
  }

  /**
   * Updates the agent's target.
   * @param position The new target position.
   * @returns True if the request was successful.
   */
  requestMoveTarget(position: Vector3): boolean {
    const { nearestPoint, nearestRef } =
      this.crowd.navMeshQuery.findNearestPoly(position, {
        halfExtents: this.crowd.navMeshQuery.defaultQueryHalfExtents,
        filter: this.crowd.navMeshQuery.defaultFilter,
      });

    return this.crowd.raw.requestMoveTarget(
      this.agentIndex,
      nearestRef,
      vec3.toArray(nearestPoint),
    );
  }

  /**
   * Submits a new move request for the specified agent.
   * @param velocity The desired velocity of the agent.
   * @returns True if the request was successful.
   */
  requestMoveVelocity(velocity: Vector3): boolean {
    return this.crowd.raw.requestMoveVelocity(
      this.agentIndex,
      vec3.toArray(velocity),
    );
  }

  /**
   * Resets the current move request for the specified agent.
   */
  resetMoveTarget(): void {
    this.crowd.raw.resetMoveTarget(this.agentIndex);
  }

  /**
   * Teleports the agent to the specified position.
   * @param position
   */
  teleport(position: Vector3) {
    Raw.CrowdUtils.agentTeleport(
      this.crowd.raw,
      this.agentIndex,
      vec3.toArray(position),
      vec3.toArray(this.crowd.navMeshQuery.defaultQueryHalfExtents),
      this.crowd.navMeshQuery.defaultFilter.raw,
    );

    vec3.copy(position, this.interpolatedPosition);
  }

  /**
   * The position of the agent.
   * @returns
   */
  position(): Vector3 {
    return {
      x: this.raw.get_npos(0),
      y: this.raw.get_npos(1),
      z: this.raw.get_npos(2),
    };
  }

  /**
   * The actual velocity of the agent. The change from velocityDesiredObstacleAdjusted -> velocity is constrained by max acceleration.
   */
  velocity(): Vector3 {
    return {
      x: this.raw.get_vel(0),
      y: this.raw.get_vel(1),
      z: this.raw.get_vel(2),
    };
  }

  /**
   * The desired velocity of the agent. Based on the current path, calculated from scratch each frame.
   */
  desiredVelocity(): Vector3 {
    return {
      x: this.raw.get_dvel(0),
      y: this.raw.get_dvel(1),
      z: this.raw.get_dvel(2),
    };
  }

  /**
   * The desired velocity adjusted by obstacle avoidance, calculated from scratch each frame.
   */
  desiredVelocityObstacleAdjusted(): Vector3 {
    return {
      x: this.raw.get_nvel(0),
      y: this.raw.get_nvel(1),
      z: this.raw.get_nvel(2),
    };
  }

  /**
   * Returns the state of the agent.
   *
   * 0 = DT_CROWDAGENT_STATE_INVALID
   * 1 = DT_CROWDAGENT_STATE_WALKING
   * 2 = DT_CROWDAGENT_STATE_OFFMESH
   */
  state(): number {
    return this.raw.state;
  }

  /**
   * Returns the next target position on the path to the target
   * @returns
   */
  target(): Vector3 {
    return {
      x: this.raw.get_targetPos(0),
      y: this.raw.get_targetPos(1),
      z: this.raw.get_targetPos(2),
    };
  }

  /**
   * Returns the next target position on the path to the target
   * @returns
   */
  nextTargetInPath(): Vector3 {
    return {
      x: this.raw.get_cornerVerts(0),
      y: this.raw.get_cornerVerts(1),
      z: this.raw.get_cornerVerts(2),
    };
  }

  /**
   * Returns the local path corridor corners for the agent
   * @returns
   */
  corners(): Vector3[] {
    const points: Vector3[] = [];

    for (let i = 0; i < this.raw.ncorners; i++) {
      points.push({
        x: this.raw.get_cornerVerts(i * 3),
        y: this.raw.get_cornerVerts(i * 3 + 1),
        z: this.raw.get_cornerVerts(i * 3 + 2),
      });
    }

    return points;
  }

  /**
   * Returns the agents parameters.
   * @returns
   */
  parameters(): CrowdAgentParams {
    const { params } = this.raw;

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
   * Updates the agent's parameters.
   * Any parameters not specified in the crowdAgentParams object will be unchanged.
   * @param crowdAgentParams agent parameters to update.
   */
  updateParameters(crowdAgentParams: Partial<CrowdAgentParams>): void {
    const params = {
      ...this.parameters(),
      ...crowdAgentParams,
    };

    this.setParameters(params);
  }

  /**
   * Sets the agent's parameters.
   * Any parameters not specified in the crowdAgentParams object will be set to their default values.
   * @param crowdAgentParams agent parameters
   */
  setParameters(crowdAgentParams: Partial<CrowdAgentParams>): void {
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

    this.crowd.raw.updateAgentParameters(this.agentIndex, dtCrowdAgentParams);
  }

  /**
   * Returns whether the agent is over an off-mesh connection.
   * @returns
   */
  overOffMeshConnection(): boolean {
    return Raw.CrowdUtils.overOffMeshConnection(
      this.crowd.raw,
      this.agentIndex,
    );
  }
}

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
};

export class Crowd {
  raw: RawModule.dtCrowd;

  /**
   * The agents in the crowd.
   */
  agents: { [idx: string]: CrowdAgent } = {};

  /**
   * The NavMesh the crowd is interacting with.
   */
  navMesh: NavMesh;

  /**
   * The NavMeshQuery used to find nearest polys for commands
   */
  navMeshQuery: NavMeshQuery;

  /**
   * Accumulator for fixed updates with interpolation
   */
  private accumulator = 0;

  /**
   *
   * @param navMesh the navmesh the crowd will use for planning
   * @param param1 the crowd parameters
   *
   * @example
   * ```ts
   * const crowd = new Crowd(navMesh, {
   *   maxAgents: 100,
   *   maxAgentRadius: 1,
   * });
   * ```
   */
  constructor(navMesh: NavMesh, { maxAgents, maxAgentRadius }: CrowdParams) {
    this.navMesh = navMesh;
    this.raw = Raw.Detour.allocCrowd();
    this.raw.init(maxAgents, maxAgentRadius, navMesh.raw.getNavMesh());

    this.navMeshQuery = new NavMeshQuery(
      new Raw.Module.NavMeshQuery(this.raw.getNavMeshQuery()),
    );
  }

  /**
   * Steps the crowd forward in time with a fixed time step.
   *
   * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
   *
   * @param dt The fixed time step size to use.
   * @param timeSinceLastCalled The time elapsed since the function was last called.
   * @param maxSubSteps Maximum number of fixed steps to take per function call.
   *
   * @example fixed time stepping
   * ```ts
   * const deltaTime = 1 / 60;
   * crowd.update(deltaTime);
   * ```
   *
   * @example variable time stepping
   * ```ts
   * crowd.update(timeSinceLastUpdate);
   * ```
   *
   * @example fixed time stepping with interpolation
   * ```ts
   * const deltaTime = 1 / 60;
   * const maxSubSteps = 10;
   * crowd.update(deltaTime, timeSinceLastUpdate, maxSubSteps);
   *
   * console.log(agent.interpolatedPosition);
   * ```
   */
  update(dt: number, timeSinceLastCalled?: number, maxSubSteps: number = 10) {
    if (timeSinceLastCalled === undefined) {
      // fixed step
      this.raw.update(dt, undefined!);
    } else {
      this.accumulator += timeSinceLastCalled;

      // Do fixed steps to catch up
      let substeps = 0;
      while (this.accumulator >= dt && substeps < maxSubSteps) {
        this.raw.update(dt, undefined!);
        this.accumulator -= dt;
        substeps++;
      }

      // Interpolate the agent positions
      const t = (this.accumulator % dt) / dt;
      const agents = this.getAgents();
      for (const agent of agents) {
        vec3.lerp(
          agent.interpolatedPosition,
          agent.position(),
          t,
          agent.interpolatedPosition,
        );
      }
    }
  }

  /**
   * Adds a new agent to the crowd.
   */
  addAgent(
    position: Vector3,
    crowdAgentParams: Partial<CrowdAgentParams>,
  ): CrowdAgent {
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

    const agentIndex = this.raw.addAgent(
      vec3.toArray(position),
      dtCrowdAgentParams,
    );

    const agent = new CrowdAgent(this, agentIndex);
    this.agents[agentIndex] = agent;

    return agent;
  }

  /**
   * Gets the agent for the specified index, or null if no agent has the given index.
   * @param agentIndex
   * @returns
   */
  getAgent(agentIndex: number): CrowdAgent | null {
    const agent = this.agents[agentIndex];

    if (!agent) {
      return null;
    }

    return agent;
  }

  /**
   * Removes the agent from the crowd.
   */
  removeAgent(agent: number | CrowdAgent) {
    const agentIndex = typeof agent === 'number' ? agent : agent.agentIndex;

    this.raw.removeAgent(agentIndex);

    delete this.agents[agentIndex];
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
   * Returns all the agents managed by the crowd.
   */
  getAgents(): CrowdAgent[] {
    return Object.values(this.agents);
  }

  /**
   * Gets the query filter for the specified index.
   * @param filterIndex the index of the query filter to retrieve, (min 0, max 15)
   * @returns the query filter
   */
  getFilter(filterIndex: number): QueryFilter {
    return new QueryFilter(this.raw.getEditableFilter(filterIndex));
  }

  /**
   * Destroys the crowd.
   */
  destroy(): void {
    Raw.Detour.freeCrowd(this.raw);
  }
}
