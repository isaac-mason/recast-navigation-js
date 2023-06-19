import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Crowd, NavMesh, NavMeshQuery } from 'recast-navigation';
import { CrowdHelper } from 'recast-navigation/three';
import { MeshStandardMaterial, Vector3, Vector3Tuple } from 'three';

export type RecastAgentRef = {
  goto: (target: Vector3) => void;
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
    ref
  ) => {
    const [crowd, setCrowd] = useState<Crowd | undefined>();
    const [crowdHelper, setCrowdHelper] = useState<CrowdHelper | undefined>();

    const [navMeshQuery, setNavMeshQuery] = useState<
      NavMeshQuery | undefined
    >();

    const [agentTarget, setAgentTarget] = useState<Vector3 | undefined>();
    const [agentPath, setAgentPath] = useState<Vector3Tuple[] | undefined>();

    useImperativeHandle(
      ref,
      () => ({
        goto: (position: Vector3) => {
          if (!navMeshQuery || !crowd) return;

          const target = navMeshQuery.getClosestPoint(position);
          crowd.goto(0, target);

          setAgentTarget(new Vector3().copy(target as Vector3));
        },
        teleport: (position: Vector3) => {
          if (!navMeshQuery || !crowd) return;

          const target = navMeshQuery.getClosestPoint(position);
          crowd.teleport(0, target);

          setAgentTarget(undefined);
        },
      }),
      [navMeshQuery, crowd]
    );

    useEffect(() => {
      if (!navMesh) {
        setCrowdHelper(undefined);
        return;
      }

      const navMeshQuery = new NavMeshQuery({ navMesh });

      const crowd = new Crowd({
        navMesh,
        maxAgents: 1,
        maxAgentRadius: agentRadius,
      });

      crowd.addAgent(navMeshQuery.getClosestPoint({ x: 0, y: 0, z: 0 }), {
        radius: agentRadius,
        height: agentHeight,
        maxAcceleration: agentMaxAcceleration,
        maxSpeed: agentMaxSpeed,
      });

      const crowdHelper = new CrowdHelper({
        crowd,
        agentMaterial: new MeshStandardMaterial({ color: 'red' }),
      });

      setNavMeshQuery(navMeshQuery);
      setCrowd(crowd);
      setCrowdHelper(crowdHelper);

      return () => {
        navMeshQuery.destroy();
        crowd.destroy();

        setNavMeshQuery(undefined);
        setCrowd(undefined);
        setCrowdHelper(undefined);
      };
    }, [
      navMesh,
      agentRadius,
      agentHeight,
      agentMaxAcceleration,
      agentMaxSpeed,
    ]);

    useEffect(() => {
      if (!crowd) return;

      if (!agentTarget) {
        setAgentPath(undefined);
        return;
      }

      const interval = setInterval(() => {
        const path = [crowd.getAgentPosition(0), ...crowd.getAgentCorners(0)];

        if (path.length) {
          setAgentPath(path.map((p) => [p.x, p.y + 0.1, p.z]));
        } else {
          setAgentPath(undefined);
        }
      }, 200);

      return () => {
        clearInterval(interval);
      };
    }, [crowd, agentTarget]);

    useFrame((_, delta) => {
      if (!crowd || !crowdHelper) return;
      crowd.update(delta);
      crowdHelper.updateAgents();
    });

    return (
      <>
        {crowdHelper && <primitive object={crowdHelper?.agents} />}

        {agentTarget && (
          <group position={[0, 0, 0]}>
            <mesh position={agentTarget}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </group>
        )}

        {agentPath && <Line points={agentPath} color="blue" lineWidth={10} />}
      </>
    );
  }
);
