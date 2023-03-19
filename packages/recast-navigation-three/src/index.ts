import R from '@recast-navigation/core';
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  Object3D,
  Scene,
  Vector3,
} from 'three';

const Epsilon = 0.001;

export type Obstacle = any;

/**
 * Configures the navigation mesh creation
 */
export type NavMeshParameters = {
  /**
   * The xz-plane cell size to use for fields. [Limit: > 0] [Units: wu]
   */
  cs: number;

  /**
   * The y-axis cell size to use for fields. [Limit: > 0] [Units: wu]
   */
  ch: number;

  /**
   * The maximum slope that is considered walkable. [Limits: 0 <= value < 90] [Units: Degrees]
   */
  walkableSlopeAngle: number;

  /**
   * Minimum floor to 'ceiling' height that will still allow the floor area to
   * be considered walkable. [Limit: >= 3] [Units: vx]
   */
  walkableHeight: number;

  /**
   * Maximum ledge height that is considered to still be traversable. [Limit: >=0] [Units: vx]
   */
  walkableClimb: number;

  /**
   * The distance to erode/shrink the walkable area of the heightfield away from
   * obstructions.  [Limit: >=0] [Units: vx]
   */
  walkableRadius: number;

  /**
   * The maximum allowed length for contour edges along the border of the mesh. [Limit: >=0] [Units: vx]
   */
  maxEdgeLen: number;

  /**
   * The maximum distance a simplified contour's border edges should deviate
   * the original raw contour. [Limit: >=0] [Units: vx]
   */
  maxSimplificationError: number;

  /**
   * The minimum number of cells allowed to form isolated island areas. [Limit: >=0] [Units: vx]
   */
  minRegionArea: number;

  /**
   * Any regions with a span count smaller than this value will, if possible,
   * be merged with larger regions. [Limit: >=0] [Units: vx]
   */
  mergeRegionArea: number;

  /**
   * The maximum number of vertices allowed for polygons generated during the
   * contour to polygon conversion process. [Limit: >= 3]
   */
  maxVertsPerPoly: number;

  /**
   * Sets the sampling distance to use when generating the detail mesh.
   * (For height detail only.) [Limits: 0 or >= 0.9] [Units: wu]
   */
  detailSampleDist: number;

  /**
   * The maximum distance the detail mesh surface should deviate from heightfield
   * data. (For height detail only.) [Limit: >=0] [Units: wu]
   */
  detailSampleMaxError: number;

  /**
   * If using obstacles, the navmesh must be subdivided internaly by tiles.
   * This member defines the tile cube side length in world units.
   * If no obstacles are needed, leave it undefined or 0.
   */
  tileSize?: number;

  /**
   * The size of the non-navigable border around the heightfield.
   */
  borderSize?: number;
};

/**
 * Configures an agent
 */
export type AgentParameters = {
  /**
   *  Agent radius. [Limit: >= 0]
   */
  radius: number;

  /**
   * Agent height. [Limit: > 0]
   */
  height: number;

  /**
   *  Maximum allowed acceleration. [Limit: >= 0]
   */
  maxAcceleration: number;

  /**
   * Maximum allowed speed. [Limit: >= 0]
   */
  maxSpeed: number;

  /**
   * Defines how close a collision element must be before it is considered for steering behaviors. [Limits: > 0]
   */
  collisionQueryRange: number;

  /**
   * The path visibility optimization range. [Limit: > 0]
   */
  pathOptimizationRange: number;

  /**
   * How aggressive the agent manager should be at avoiding collisions with this agent. [Limit: >= 0]
   */
  separationWeight: number;

  /**
   * Observers will be notified when agent gets inside the virtual circle with this Radius around destination point.
   * Default is agent radius
   */
  reachRadius?: number;
};

/**
 * Recast navigation wrapper
 */
export class Recast {
  /**
   * Reference to the Recast library
   */
  recast: typeof R = null as any;

  /**
   * The first navmesh created. We might extend this to support multiple navmeshes
   */
  navMesh!: R.NavMesh;

  private _maximumSubStepCount = 10;

  private _timeStep: number = 1 / 60;

  private _timeFactor = 1;

  private _tempVec1!: R.Vec3;

  private _tempVec2!: R.Vec3;

  /**
   * Initializes the recastJS plugin
   * @param recastInjection optional @recast-navigation/core import, can be used to inject your own recast reference
   */
  constructor(recastInjection?: typeof R) {
    if (recastInjection) {
      this.recast = recastInjection;
    }

    this.setTimeStep();
  }

  /**
   * Initializes recast.
   */
  async init(): Promise<void> {
    if (!this.recast) {
      this.recast = await R();
    }

    if (!this.isSupported()) {
      console.error(
        'RecastJS is not available. Please make sure you included the js file.'
      );
      return;
    }

    this._tempVec1 = new this.recast.Vec3();
    this._tempVec2 = new this.recast.Vec3();
  }

  /**
   * Set the time step of the navigation tick update.
   * Default is 1/60.
   * A value of 0 will disable fixed time update
   * @param newTimeStep the new timestep to apply to this world.
   */
  setTimeStep(newTimeStep: number = 1 / 60): void {
    this._timeStep = newTimeStep;
  }

  /**
   * Get the time step of the navigation tick update.
   * @returns the current time step
   */
  getTimeStep(): number {
    return this._timeStep;
  }

  /**
   * If delta time in navigation tick update is greater than the time step
   * a number of sub iterations are done. If more iterations are need to reach deltatime
   * they will be discarded.
   * A value of 0 will set to no maximum and update will use as many substeps as needed
   * @param newStepCount the maximum number of iterations
   */
  setMaximumSubStepCount(newStepCount = 10): void {
    this._maximumSubStepCount = newStepCount;
  }

  /**
   * Get the maximum number of iterations per navigation tick update
   * @returns the maximum number of iterations
   */
  getMaximumSubStepCount(): number {
    return this._maximumSubStepCount;
  }

  /**
   * Time factor applied when updating crowd agents (default 1). A value of 0 will pause crowd updates.
   * @param value the time factor applied at update
   */
  set timeFactor(value: number) {
    this._timeFactor = Math.max(value, 0);
  }

  /**
   * Get the time factor used for crowd agent update
   * @returns the time factor
   */
  get timeFactor(): number {
    return this._timeFactor;
  }

  /**
   * Creates a navigation mesh
   * @param meshes array of all the geometry used to compute the navigation mesh
   * @param parameters bunch of parameters used to filter geometry
   */
  createNavMesh(meshes: Array<Mesh>, parameters: NavMeshParameters): R.NavMesh {
    const navMesh = new this.recast.NavMesh();

    this.navMesh = navMesh;

    let index: number;
    let tri: number;
    let pt: number;

    const indices = [];
    const positions = [];
    let offset = 0;
    for (index = 0; index < meshes.length; index++) {
      if (meshes[index]) {
        const mesh = meshes[index];

        const meshIndices = mesh.geometry.getIndex()?.array;
        if (!meshIndices) {
          continue;
        }

        const meshPositions = (mesh.geometry.getAttribute(
          'position'
        ) as BufferAttribute)!.array;
        if (!meshPositions) {
          continue;
        }

        const worldMatrices = [];
        mesh.updateMatrixWorld();
        const worldMatrix = mesh.matrixWorld;

        // todo - support instanced meshes

        worldMatrices.push(worldMatrix);

        for (
          let matrixIndex = 0;
          matrixIndex < worldMatrices.length;
          matrixIndex++
        ) {
          const wm = worldMatrices[matrixIndex];
          for (tri = 0; tri < meshIndices.length; tri++) {
            indices.push(meshIndices[tri] + offset);
          }

          const transformed = new Vector3();
          const position = new Vector3();
          for (pt = 0; pt < meshPositions.length; pt += 3) {
            position.set(
              meshPositions[pt],
              meshPositions[pt + 1],
              meshPositions[pt + 2]
            );

            transformed.copy(position).applyMatrix4(wm);
            positions.push(transformed.x, transformed.y, transformed.z);
          }

          offset += meshPositions.length / 3;
        }
      }
    }

    const rc = new this.recast.rcConfig();
    rc.cs = parameters.cs;
    rc.ch = parameters.ch;
    rc.borderSize = parameters.borderSize ? parameters.borderSize : 0;
    rc.tileSize = parameters.tileSize ? parameters.tileSize : 0;
    rc.walkableSlopeAngle = parameters.walkableSlopeAngle;
    rc.walkableHeight = parameters.walkableHeight;
    rc.walkableClimb = parameters.walkableClimb;
    rc.walkableRadius = parameters.walkableRadius;
    rc.maxEdgeLen = parameters.maxEdgeLen;
    rc.maxSimplificationError = parameters.maxSimplificationError;
    rc.minRegionArea = parameters.minRegionArea;
    rc.mergeRegionArea = parameters.mergeRegionArea;
    rc.maxVertsPerPoly = parameters.maxVertsPerPoly;
    rc.detailSampleDist = parameters.detailSampleDist;
    rc.detailSampleMaxError = parameters.detailSampleMaxError;

    this.navMesh.build(positions, offset, indices, indices.length, rc);

    return navMesh;
  }

  /**
   * Create a navigation mesh debug mesh
   * @param scene is where the mesh will be added
   * @returns debug display mesh
   */
  createDebugNavMesh(): Mesh {
    let tri: number;
    let pt: number;

    const debugNavMesh = this.navMesh.getDebugNavMesh();
    const triangleCount = debugNavMesh.getTriangleCount();

    const positions = [];
    for (tri = 0; tri < triangleCount; tri++) {
      for (pt = 0; pt < 3; pt++) {
        const point = debugNavMesh.getTriangle(tri).getPoint(pt);
        positions.push(point.x, point.y, point.z);
      }
    }

    const indices = [];
    for (tri = 0; tri < triangleCount * 3; tri++) {
      indices.push(tri);
    }

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3)
    );

    geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

    const mesh = new Mesh(geometry);

    return mesh;
  }

  /**
   * Get a navigation mesh constrained position, closest to the parameter position
   * @param position world position
   * @param result optional vector3 to set the result to
   * @returns the closest point to position constrained by the navigation mesh
   */
  getClosestPoint(position: Vector3, result: Vector3 = new Vector3()): Vector3 {
    this._tempVec1.x = position.x;
    this._tempVec1.y = position.y;
    this._tempVec1.z = position.z;
    const ret = this.navMesh.getClosestPoint(this._tempVec1);

    result.set(ret.x, ret.y, ret.z);
    return result;
  }

  /**
   * Get a navigation mesh constrained position, within a particular radius
   * @param position world position
   * @param maxRadius the maximum distance to the constrained world position
   * @param result optional vector3 to set the result to
   * @returns the closest point to position constrained by the navigation mesh
   */
  getRandomPointAround(
    position: Vector3,
    maxRadius: number,
    result: Vector3 = new Vector3()
  ): Vector3 {
    this._tempVec1.x = position.x;
    this._tempVec1.y = position.y;
    this._tempVec1.z = position.z;
    const ret = this.navMesh.getRandomPointAround(this._tempVec1, maxRadius);
    result.set(ret.x, ret.y, ret.z);
    return result;
  }

  /**
   * Compute the final position from a segment made of destination-position
   * @param position world position
   * @param destination world position
   * @param result optional vector3 to set the result to
   * @returns the resulting point along the navmesh
   */
  moveAlong(
    position: Vector3,
    destination: Vector3,
    result: Vector3 = new Vector3()
  ): Vector3 {
    this._tempVec1.x = position.x;
    this._tempVec1.y = position.y;
    this._tempVec1.z = position.z;
    this._tempVec2.x = destination.x;
    this._tempVec2.y = destination.y;
    this._tempVec2.z = destination.z;
    const ret = this.navMesh.moveAlong(this._tempVec1, this._tempVec2);
    result.set(ret.x, ret.y, ret.z);
    return result;
  }

  /**
   * Compute a navigation path from start to end. Returns an empty array if no path can be computed
   * @param start world position
   * @param end world position
   * @returns array containing world position composing the path
   */
  computePath(start: Vector3, end: Vector3): Vector3[] {
    let pt: number;
    this._tempVec1.x = start.x;
    this._tempVec1.y = start.y;
    this._tempVec1.z = start.z;
    this._tempVec2.x = end.x;
    this._tempVec2.y = end.y;
    this._tempVec2.z = end.z;
    const navPath = this.navMesh.computePath(this._tempVec1, this._tempVec2);
    const pointCount = navPath.getPointCount();
    const positions = [];
    for (pt = 0; pt < pointCount; pt++) {
      const p = navPath.getPoint(pt);
      positions.push(new Vector3(p.x, p.y, p.z));
    }
    return positions;
  }

  /**
   * Create a new Crowd so you can add agents
   * @param maxAgents the maximum agent count in the crowd
   * @param maxAgentRadius the maximum radius an agent can have
   * @param scene to attach the crowd to
   * @returns the crowd you can add agents to
   */
  createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene): Crowd {
    return new Crowd(this, maxAgents, maxAgentRadius, scene);
  }

  /**
   * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
   * The queries will try to find a solution within those bounds
   * default is (1,1,1)
   * @param extent x,y,z value that define the extent around the queries point of reference
   */
  setDefaultQueryExtent(extent: Vector3): void {
    this._tempVec1.x = extent.x;
    this._tempVec1.y = extent.y;
    this._tempVec1.z = extent.z;
    this.navMesh.setDefaultQueryExtent(this._tempVec1);
  }

  /**
   * Get the Bounding box extent specified by setDefaultQueryExtent
   * @returns the box extent values
   */
  getDefaultQueryExtent(): Vector3 {
    const p = this.navMesh.getDefaultQueryExtent();
    return new Vector3(p.x, p.y, p.z);
  }

  /**
   * build the navmesh from a previously saved state using getNavMeshData
   * @param data the Uint8Array returned by getNavmeshData
   */
  buildFromNavMeshData(data: Uint8Array): void {
    const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    const dataPtr = this.recast._malloc(nDataBytes);

    const dataHeap = new Uint8Array(
      this.recast.HEAPU8.buffer,
      dataPtr,
      nDataBytes
    );
    dataHeap.set(data);

    const buf = new this.recast.NavmeshData();
    buf.dataPointer = dataHeap.byteOffset;
    buf.size = data.length;
    this.navMesh = new this.recast.NavMesh();
    this.navMesh.buildFromNavmeshData(buf);

    // Free memory
    this.recast._free(dataHeap.byteOffset);
  }

  /**
   * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
   * @returns data the Uint8Array that can be saved and reused
   */
  getNavMeshData(): Uint8Array {
    const navmeshData = this.navMesh.getNavmeshData();
    const arrView = new Uint8Array(
      this.recast.HEAPU8.buffer,
      navmeshData.dataPointer,
      navmeshData.size
    );
    const ret = new Uint8Array(navmeshData.size);
    ret.set(arrView);
    this.navMesh.freeNavmeshData(navmeshData);
    return ret;
  }

  /**
   * Get the Bounding box extent result specified by setDefaultQueryExtent
   * @param result output the box extent values
   */
  getDefaultQueryExtentToRef(result: Vector3): void {
    const p = this.navMesh.getDefaultQueryExtent();
    result.set(p.x, p.y, p.z);
  }

  /**
   * Creates a cylinder obstacle and add it to the navigation
   * @param position world position
   * @param radius cylinder radius
   * @param height cylinder height
   * @returns the obstacle freshly created
   */
  addCylinderObstacle(
    position: Vector3,
    radius: number,
    height: number
  ): Obstacle {
    this._tempVec1.x = position.x;
    this._tempVec1.y = position.y;
    this._tempVec1.z = position.z;
    return this.navMesh.addCylinderObstacle(this._tempVec1, radius, height);
  }

  /**
   * Creates an oriented box obstacle and add it to the navigation
   * @param position world position
   * @param extent box size
   * @param angle angle in radians of the box orientation on Y axis
   * @returns the obstacle freshly created
   */
  addBoxObstacle(position: Vector3, extent: Vector3, angle: number): Obstacle {
    this._tempVec1.x = position.x;
    this._tempVec1.y = position.y;
    this._tempVec1.z = position.z;
    this._tempVec2.x = extent.x;
    this._tempVec2.y = extent.y;
    this._tempVec2.z = extent.z;
    return this.navMesh.addBoxObstacle(this._tempVec1, this._tempVec2, angle);
  }

  /**
   * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
   * @param obstacle obstacle to remove from the navigation
   */
  removeObstacle(obstacle: Obstacle): void {
    this.navMesh.removeObstacle(obstacle);
  }

  /**
   * If this plugin is supported
   * @returns true if plugin is supported
   */
  isSupported(): boolean {
    return this.recast !== undefined;
  }
}

/**
 * Recast detour crowd implementation
 */
export class Crowd {
  /**
   * Recast/detour plugin
   */
  bjsRECASTPlugin: Recast;

  /**
   * Link to the detour crowd
   */
  recastCrowd: any = {};

  /**
   * One transform per agent
   */
  transforms: Object3D[] = new Array<Object3D>();

  /**
   * All agents created
   */
  agents: number[] = new Array<number>();

  /**
   * agents reach radius
   */
  reachRadii: number[] = new Array<number>();

  /**
   * true when a destination is active for an agent and notifier hasn't been notified of reach
   */
  private _agentDestinationArmed: boolean[] = new Array<boolean>();

  /**
   * agent current target
   */
  private _agentDestination: Vector3[] = new Array<Vector3>();

  /**
   * Link to the scene is kept to unregister the crowd from the scene
   */
  // @ts-expect-error todo
  private _scene: Scene;

  /**
   * Observer for crowd updates
   */
  // private _onBeforeAnimationsObserver: Observer<Scene> | null = null;

  /**
   * Fires each time an agent is in reach radius of its destination
   */
  onReachTargetObservable = new Observable<{
    agentIndex: number;
    destination: Vector3;
  }>();

  /**
   * Constructor
   * @param recastJs recastJS class
   * @param maxAgents the maximum agent count in the crowd
   * @param maxAgentRadius the maximum radius an agent can have
   * @param scene to attach the crowd to
   * @returns the crowd you can add agents to
   */
  constructor(
    recastJs: Recast,
    maxAgents: number,
    maxAgentRadius: number,
    scene: Scene
  ) {
    this.bjsRECASTPlugin = recastJs;
    this.recastCrowd = new this.bjsRECASTPlugin.recast.Crowd(
      maxAgents,
      maxAgentRadius,
      this.bjsRECASTPlugin.navMesh.getNavMesh()
    );
    this._scene = scene;

    // todo: updates
    // this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(
    //   () => {
    //     this.update(
    //       scene.getEngine().getDeltaTime() * 0.001 * recastJs.timeFactor
    //     );
    //   }
    // );
  }

  /**
   * Add a new agent to the crowd with the specified parameter a corresponding transformNode.
   * You can attach anything to that node. The node position is updated in the scene update tick.
   * @param pos world position that will be constrained by the navigation mesh
   * @param parameters agent parameters
   * @param transform hooked to the agent that will be update by the scene
   * @returns agent index
   */
  addAgent(
    pos: Vector3,
    parameters: AgentParameters,
    transform: Object3D
  ): number {
    const agentParams = new this.bjsRECASTPlugin.recast.dtCrowdAgentParams();
    agentParams.radius = parameters.radius;
    agentParams.height = parameters.height;
    agentParams.maxAcceleration = parameters.maxAcceleration;
    agentParams.maxSpeed = parameters.maxSpeed;
    agentParams.collisionQueryRange = parameters.collisionQueryRange;
    agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
    agentParams.separationWeight = parameters.separationWeight;
    agentParams.updateFlags = 7;
    agentParams.obstacleAvoidanceType = 0;
    agentParams.queryFilterType = 0;
    agentParams.userData = 0;

    const agentIndex = this.recastCrowd.addAgent(
      new this.bjsRECASTPlugin.recast.Vec3(pos.x, pos.y, pos.z),
      agentParams
    );
    this.transforms.push(transform);
    this.agents.push(agentIndex);
    this.reachRadii.push(
      parameters.reachRadius ? parameters.reachRadius : parameters.radius
    );
    this._agentDestinationArmed.push(false);
    this._agentDestination.push(new Vector3(0, 0, 0));

    return agentIndex;
  }

  /**
   * Returns the agent position in world space
   * @param index agent index returned by addAgent
   * @param result optional vector3 to set the result to
   * @returns world space position
   */
  getAgentPosition(index: number, result: Vector3 = new Vector3()): Vector3 {
    const agentPos = this.recastCrowd.getAgentPosition(index);
    result.set(agentPos.x, agentPos.y, agentPos.z);
    return result;
  }

  /**
   * Returns the agent velocity in world space
   * @param index agent index returned by addAgent
   * @param result optional vector3 to set the result to
   * @returns world space velocity
   */
  getAgentVelocity(index: number, result: Vector3 = new Vector3()): Vector3 {
    const agentVel = this.recastCrowd.getAgentVelocity(index);
    result.set(agentVel.x, agentVel.y, agentVel.z);
    return result;
  }

  /**
   * Returns the agent next target point on the path
   * @param index agent index returned by addAgent
   * @param result optional vector3 to set the result to
   * @returns world space position
   */
  getAgentNextTargetPath(
    index: number,
    result: Vector3 = new Vector3()
  ): Vector3 {
    const pathTargetPos = this.recastCrowd.getAgentNextTargetPath(index);
    result.set(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    return result;
  }

  /**
   * Gets the agent state
   * @param index agent index returned by addAgent
   * @returns agent state
   */
  getAgentState(index: number): number {
    return this.recastCrowd.getAgentState(index);
  }

  /**
   * returns true if the agent in over an off mesh link connection
   * @param index agent index returned by addAgent
   * @returns true if over an off mesh link connection
   */
  overOffMeshConnection(index: number): boolean {
    return this.recastCrowd.overOffmeshConnection(index);
  }

  /**
   * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
   * @param index agent index returned by addAgent
   * @param destination targeted world position
   */
  agentGoto(index: number, destination: Vector3): void {
    this.recastCrowd.agentGoto(
      index,
      new this.bjsRECASTPlugin.recast.Vec3(
        destination.x,
        destination.y,
        destination.z
      )
    );

    // arm observer
    const item = this.agents.indexOf(index);
    if (item > -1) {
      this._agentDestinationArmed[item] = true;
      this._agentDestination[item].set(
        destination.x,
        destination.y,
        destination.z
      );
    }
  }

  /**
   * Teleport the agent to a new position
   * @param index agent index returned by addAgent
   * @param destination targeted world position
   */
  agentTeleport(index: number, destination: Vector3): void {
    this.recastCrowd.agentTeleport(
      index,
      new this.bjsRECASTPlugin.recast.Vec3(
        destination.x,
        destination.y,
        destination.z
      )
    );
  }

  /**
   * Update agent parameters
   * @param index agent index returned by addAgent
   * @param parameters agent parameters
   */
  updateAgentParameters(index: number, parameters: AgentParameters): void {
    const agentParams = this.recastCrowd.getAgentParameters(index);

    if (parameters.radius !== undefined) {
      agentParams.radius = parameters.radius;
    }
    if (parameters.height !== undefined) {
      agentParams.height = parameters.height;
    }
    if (parameters.maxAcceleration !== undefined) {
      agentParams.maxAcceleration = parameters.maxAcceleration;
    }
    if (parameters.maxSpeed !== undefined) {
      agentParams.maxSpeed = parameters.maxSpeed;
    }
    if (parameters.collisionQueryRange !== undefined) {
      agentParams.collisionQueryRange = parameters.collisionQueryRange;
    }
    if (parameters.pathOptimizationRange !== undefined) {
      agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
    }
    if (parameters.separationWeight !== undefined) {
      agentParams.separationWeight = parameters.separationWeight;
    }

    this.recastCrowd.setAgentParameters(index, agentParams);
  }

  /**
   * remove a particular agent previously created
   * @param index agent index returned by addAgent
   */
  removeAgent(index: number): void {
    this.recastCrowd.removeAgent(index);

    const item = this.agents.indexOf(index);
    if (item > -1) {
      this.agents.splice(item, 1);
      this.transforms.splice(item, 1);
      this.reachRadii.splice(item, 1);
      this._agentDestinationArmed.splice(item, 1);
      this._agentDestination.splice(item, 1);
    }
  }

  /**
   * get the list of all agents attached to this crowd
   * @returns list of agent indices
   */
  getAgents(): number[] {
    return this.agents;
  }

  /**
   * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
   * @param deltaTime in seconds
   */
  update(deltaTime: number): void {
    // update obstacles
    this.bjsRECASTPlugin.navMesh.update();

    if (deltaTime <= Epsilon) {
      return;
    }
    // update crowd
    const timeStep = this.bjsRECASTPlugin.getTimeStep();
    const maxStepCount = this.bjsRECASTPlugin.getMaximumSubStepCount();
    if (timeStep <= Epsilon) {
      this.recastCrowd.update(deltaTime);
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
        this.recastCrowd.update(step);
      }
    }

    // update transforms
    for (let index = 0; index < this.agents.length; index++) {
      // update transform position
      const agentIndex = this.agents[index];
      const agentPosition = this.getAgentPosition(agentIndex);
      this.transforms[index].position.copy(agentPosition);

      // check agent reach destination
      if (this._agentDestinationArmed[index]) {
        const dx = agentPosition.x - this._agentDestination[index].x;
        const dz = agentPosition.z - this._agentDestination[index].z;
        const radius = this.reachRadii[index];
        const groundY =
          this._agentDestination[index].y - this.reachRadii[index];
        const ceilingY =
          this._agentDestination[index].y + this.reachRadii[index];
        const distanceXZSquared = dx * dx + dz * dz;
        if (
          agentPosition.y > groundY &&
          agentPosition.y < ceilingY &&
          distanceXZSquared < radius * radius
        ) {
          this.onReachTargetObservable.notifyObservers({
            agentIndex,
            destination: this._agentDestination[index],
          });
          this._agentDestinationArmed[index] = false;
        }
      }
    }
  }

  /**
   * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
   * The queries will try to find a solution within those bounds
   * default is (1,1,1)
   * @param extent x,y,z value that define the extent around the queries point of reference
   */
  setDefaultQueryExtent(extent: Vector3): void {
    const ext = new this.bjsRECASTPlugin.recast.Vec3(
      extent.x,
      extent.y,
      extent.z
    );
    this.recastCrowd.setDefaultQueryExtent(ext);
  }

  /**
   * Get the Bounding box extent specified by setDefaultQueryExtent
   * @param result optional vector3 to set the result to
   * @returns the box extent values
   */
  getDefaultQueryExtent(result: Vector3 = new Vector3()): Vector3 {
    const p = this.recastCrowd.getDefaultQueryExtent();
    result.set(p.x, p.y, p.z);
    return result;
  }

  /**
   * Get the next corner points composing the path (max 4 points)
   * @param index agent index returned by addAgent
   * @returns array containing world position composing the path
   */
  getCorners(index: number): Vector3[] {
    let pt: number;
    const navPath = this.recastCrowd.getCorners(index);
    const pointCount = navPath.getPointCount();
    const positions = [];
    for (pt = 0; pt < pointCount; pt++) {
      const p = navPath.getPoint(pt);
      positions.push(new Vector3(p.x, p.y, p.z));
    }
    return positions;
  }

  /**
   * Release all resources
   */
  dispose(): void {
    this.recastCrowd.destroy();
    // this._scene.onBeforeAnimationsObservable.remove(
    //   this._onBeforeAnimationsObserver
    // );
    // this._onBeforeAnimationsObserver = null;
    this.onReachTargetObservable.clear();
  }
}

class Observable<E> {
  listeners: Set<(e: E) => void> = new Set();

  add(listener: (e: E) => void) {
    this.listeners.add(listener);
  }

  remove(listener: (e: E) => void) {
    this.listeners.delete(listener);
  }

  notifyObservers(e: E) {
    this.listeners.forEach((listener) => listener(e));
  }

  clear() {
    this.listeners.clear();
  }
}
