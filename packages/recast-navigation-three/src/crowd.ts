import { NavMesh, Crowd as CrowdImpl } from '@recast-navigation/core';
import { Object3D, Vector3 } from 'three';
import { Observable } from './observable';

const Epsilon = 0.001;

export type CrowdParams = {
  navMesh: NavMesh;
  maxAgents: number;
  maxAgentRadius: number;
};

/**
 * todo - finish implementation
 */
export class Crowd {
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

  /**
   * One transform per agent
   */
  transforms: Object3D[] = [];

  /**
   * true when a destination is active for an agent and notifier hasn't been notified of reach
   */
  agentDestinationArmed: boolean[] = [];

  /**
   * agent current target
   */
  agentDestination: Vector3[] = [];

  /**
   * Fires each time an agent is in reach radius of its destination
   */
  onReachTargetObservable = new Observable<{
    agentIndex: number;
    destination: Vector3;
  }>();

  crowd: CrowdImpl;

  navMesh: NavMesh;

  constructor(params: CrowdParams) {
    this.navMesh = params.navMesh;
    this.crowd = new CrowdImpl(params);
  }

  /**
   * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
   * @param deltaTime
   */
  update(deltaTime: number) {
    // update obstacles
    this.navMesh.update();

    if (deltaTime <= Epsilon) {
      return;
    }

    // update crowd
    const { timeStep } = this;
    const maxStepCount = this.maximumSubStepCount;

    if (timeStep <= Epsilon) {
      this.crowd.update(deltaTime);
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
        this.crowd.update(step);
      }
    }

    // update transforms
    this.crowd.agents.forEach((agent, index) => {
      const agentPosition = agent.getPosition();
      this.transforms[index].position.copy(agentPosition as Vector3);

      // check agent reach destination
      if (this.agentDestinationArmed[index]) {
        const dx = agentPosition.x - this.agentDestination[index].x;
        const dz = agentPosition.z - this.agentDestination[index].z;
        const radius = 0.5; // todo - make configurable
        const groundY = this.agentDestination[index].y - radius;
        const ceilingY = this.agentDestination[index].y + radius;
        const distanceXZSquared = dx * dx + dz * dz;

        if (
          agentPosition.y > groundY &&
          agentPosition.y < ceilingY &&
          distanceXZSquared < radius * radius
        ) {
          this.onReachTargetObservable.notifyObservers({
            agentIndex: agent.agentIndex,
            destination: this.agentDestination[index],
          });
          this.agentDestinationArmed[index] = false;
        }
      }
    });
  }
}
