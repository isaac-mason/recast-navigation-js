import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Crowd, type CrowdAgent, type NavMesh, NavMeshQuery } from 'recast-navigation';
import { CrowdHelper } from '@recast-navigation/three';
import { MeshStandardMaterial, Vector3, type Vector3Tuple } from 'three';

export type RecastAgentRef = {
  requestMoveTarget: (target: Vector3) => void;
  teleport: (position: Vector3) => void;
};

export type RecastAgentProps = {
  navMesh?: NavMesh;
  agentRadius: number;
  agentHeight: number;
  agentMaxAcceleration: number;
  agentMaxSpeed: number;
};

export const RecastAgent = forwardRef<RecastAgentRef, RecastAgentProps>(
  (
    { navMesh, agentRadius, agentHeight, agentMaxAcceleration, agentMaxSpeed },
    ref,
  ) => {
    const [crowd, setCrowd] = useState<Crowd | undefined>();
    const [agent, setAgent] = useState<CrowdAgent | undefined>();
    const [crowdHelper, setCrowdHelper] = useState<CrowdHelper | undefined>();

    const [navMeshQuery, setNavMeshQuery] = useState<
      NavMeshQuery | undefined
    >();

    const [agentTarget, setAgentTarget] = useState<Vector3 | undefined>();
    const [agentPath, setAgentPath] = useState<Vector3Tuple[] | undefined>();

    useImperativeHandle(
      ref,
      () => ({
        requestMoveTarget: (position: Vector3) => {
          if (!navMeshQuery || !crowd || !agent) return;

          const { point: target } = navMeshQuery.findClosestPoint(position);
          agent.requestMoveTarget(target);

          setAgentTarget(new Vector3().copy(target as Vector3));
        },
        teleport: (position: Vector3) => {
          if (!navMeshQuery || !crowd || !agent) return;

          const { point: target } = navMeshQuery.findClosestPoint(position);
          agent.teleport(target);

          setAgentTarget(undefined);
        },
      }),
      [navMeshQuery, crowd, agent],
    );

    useEffect(() => {
      if (!navMesh) {
        return;
      }

      const navMeshQuery = new NavMeshQuery(navMesh);

      const crowd = new Crowd(navMesh, {
        maxAgents: 1,
        maxAgentRadius: agentRadius,
      });

      const { point: agentPosition } = navMeshQuery.findClosestPoint({
        x: 0,
        y: 0,
        z: 0,
      });

      const agent = crowd.addAgent(agentPosition, {
        radius: agentRadius,
        height: agentHeight,
        maxAcceleration: agentMaxAcceleration,
        maxSpeed: agentMaxSpeed,
      });

      const crowdHelper = new CrowdHelper(crowd, {
        agentMaterial: new MeshStandardMaterial({ color: 'red' }),
      });

      setNavMeshQuery(navMeshQuery);
      setCrowd(crowd);
      setAgent(agent);
      setCrowdHelper(crowdHelper);

      return () => {
        setCrowdHelper(undefined);
        setAgent(undefined);
        setCrowd(undefined);
        setNavMeshQuery(undefined);
      };
    }, [
      navMesh,
      agentRadius,
      agentHeight,
      agentMaxAcceleration,
      agentMaxSpeed,
    ]);

    useEffect(() => {
      if (!crowd || !agentTarget || !agent) return;

      const interval = setInterval(() => {
        const path = [agent.position(), ...agent.corners()];

        if (path.length) {
          setAgentPath(path.map((p) => [p.x, p.y + 0.1, p.z]));
        } else {
          setAgentPath(undefined);
        }
      }, 200);

      return () => {
        clearInterval(interval);
        setAgentPath(undefined);
      };
    }, [crowd, agent, agentTarget]);

    useFrame((_, delta) => {
      if (
        !crowd ||
        !crowdHelper ||
        crowd.raw.getNavMeshQuery().getAttachedNavMesh() !==
          navMesh?.raw.getNavMesh()
      )
        return;

      crowd.update(delta);
      crowdHelper.update();
    });

    return (
      <>
        {crowdHelper && <primitive object={crowdHelper} />}

        {agentTarget && (
          <mesh position={agentTarget}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        )}

        {agentPath && <Line points={agentPath} color="blue" lineWidth={10} />}
      </>
    );
  },
);
