import { Line, OrbitControls } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import {
  Crowd,
  type CrowdAgent,
  type NavMesh,
  NavMeshQuery,
  QueryFilter,
} from '@recast-navigation/core';
import { getPositionsAndIndices } from '@recast-navigation/three';
import { useControls } from 'leva';
import { type RefObject, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AgentPath } from '../../common/agent-path';
import { Debug } from '../../common/debug';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';
import {
  type NavMeshGeneratorConfig,
  PolyFlags,
  generateNavMesh,
} from './custom-areas-generator';

export default {
  title: 'Advanced / Custom Areas',
  decorators,
  parameters,
};

const waterBoxAreas: NavMeshGeneratorConfig['waterBoxAreas'] = [
  {
    bmin: [-3, -1, -3],
    bmax: [3, 1, 3],
  },
];

const unwalkableBoxAreas: NavMeshGeneratorConfig['unwalkableBoxAreas'] = [
  {
    bmin: [-1.5, -1.5, -1.5],
    bmax: [1.5, 1.5, 1.5],
  },
];

const useNavMesh = (group: RefObject<THREE.Group>) => {
  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [navMeshQuery, setNavMeshQuery] = useState<NavMeshQuery>();

  useEffect(() => {
    if (!group) return;

    const meshes: THREE.Mesh[] = [];

    group.current!.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });

    const [positions, indices] = getPositionsAndIndices(meshes);

    const { success, navMesh } = generateNavMesh(positions, indices, {
      cs: 0.05,
      ch: 0.2,
      waterBoxAreas,
      unwalkableBoxAreas,
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    setNavMesh(navMesh);
    setNavMeshQuery(navMeshQuery);

    return () => {
      setNavMeshQuery(undefined);
      setNavMesh(undefined);

      navMeshQuery.destroy();
      navMesh.destroy();
    };
  }, [group]);

  return {
    navMesh,
    navMeshQuery,
  };
};

const CustomAreas = () => {
  return (
    <>
      {waterBoxAreas.map((area, i) => (
        <mesh
          key={String(i)}
          position={[
            (area.bmax[0] + area.bmin[0]) / 2,
            (area.bmax[1] + area.bmin[1]) / 2,
            (area.bmax[2] + area.bmin[2]) / 2,
          ]}
        >
          <boxGeometry
            args={[
              area.bmax[0] - area.bmin[0],
              area.bmax[1] - area.bmin[1],
              area.bmax[2] - area.bmin[2],
            ]}
          />
          <meshStandardMaterial
            color="blue"
            transparent
            opacity={0.2}
            depthTest={false}
          />
        </mesh>
      ))}

      {unwalkableBoxAreas.map((area, i) => (
        <mesh
          key={String(i)}
          position={[
            (area.bmax[0] + area.bmin[0]) / 2,
            (area.bmax[1] + area.bmin[1]) / 2,
            (area.bmax[2] + area.bmin[2]) / 2,
          ]}
        >
          <boxGeometry
            args={[
              area.bmax[0] - area.bmin[0],
              area.bmax[1] - area.bmin[1],
              area.bmax[2] - area.bmin[2],
            ]}
          />
          <meshStandardMaterial
            color="red"
            transparent
            opacity={0.2}
            depthTest={false}
          />
        </mesh>
      ))}
    </>
  );
};

const Level = () => (
  <mesh>
    <boxGeometry args={[10, 1, 10]} />
    <meshStandardMaterial color="#999" />
  </mesh>
);

export const ComputePath = () => {
  const { canSwim } = useControls({
    canSwim: false,
  });

  const groupRef = useRef<THREE.Group>(null!);

  const { navMesh, navMeshQuery } = useNavMesh(groupRef);

  const [path, setPath] = useState<THREE.Vector3Tuple[]>();

  useEffect(() => {
    if (!navMesh || !navMeshQuery) return;

    let includeFlags = PolyFlags.WALK;

    if (canSwim) {
      includeFlags |= PolyFlags.SWIM;
    }

    const filter = new QueryFilter();
    filter.includeFlags = includeFlags;

    const { point: start } = navMeshQuery.findClosestPoint({
      x: -4,
      y: 0,
      z: -4,
    });

    const { point: end } = navMeshQuery.findClosestPoint({
      x: 4,
      y: 0,
      z: 4,
    });

    const { path } = navMeshQuery.computePath(start, end, {
      filter,
    });

    setPath(path ? path.map((v) => [v.x, v.y, v.z]) : undefined);

    return () => {
      setPath(undefined);
    };
  }, [navMesh, navMeshQuery, canSwim]);

  return (
    <>
      <group ref={groupRef}>
        <Level />
      </group>

      {path && <Line points={path} color="orange" lineWidth={10} />}

      <Debug navMesh={navMesh} />

      <CustomAreas />

      <OrbitControls />
    </>
  );
};

export const FindClosestPoint = () => {
  const { canSwim } = useControls({
    canSwim: false,
  });

  const groupRef = useRef<THREE.Group>(null!);

  const [queryFilter, setQueryFilter] = useState<QueryFilter>();

  const [point, setPoint] = useState<THREE.Vector3>();

  const [closestPointOnNavMesh, setClosestPointOnNavMesh] =
    useState<THREE.Vector3>();

  const { navMesh, navMeshQuery } = useNavMesh(groupRef);

  useEffect(() => {
    let includeFlags = PolyFlags.WALK;

    if (canSwim) {
      includeFlags |= PolyFlags.SWIM;
    }

    const filter = new QueryFilter();
    filter.includeFlags = includeFlags;

    setQueryFilter(filter);

    return () => {
      setQueryFilter(undefined);
    };
  });

  useEffect(() => {
    if (!navMesh || !navMeshQuery || !queryFilter || !point) return;

    const halfExtents = {
      x: 10,
      y: 10,
      z: 10,
    };

    const { point: nearest } = navMeshQuery.findClosestPoint(point, {
      filter: queryFilter,
      halfExtents,
    });

    setClosestPointOnNavMesh(
      new THREE.Vector3(nearest.x, nearest.y, nearest.z),
    );

    return () => {
      setClosestPointOnNavMesh(undefined);
    };
  }, [navMesh, navMeshQuery, queryFilter, point]);

  return (
    <>
      <group ref={groupRef} onClick={(e) => setPoint(e.point)}>
        <Level />
      </group>

      {point && (
        <mesh position={point}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      )}

      {closestPointOnNavMesh && (
        <mesh position={closestPointOnNavMesh}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="green" />
        </mesh>
      )}

      <Debug navMesh={navMesh} />

      <CustomAreas />

      <OrbitControls />
    </>
  );
};

const CROWD_QUERY_FILTER_TYPE = 0;

export const SingleAgent = () => {
  const { canSwim } = useControls({
    canSwim: false,
  });

  const groupRef = useRef<THREE.Group>(null!);

  const { navMesh, navMeshQuery } = useNavMesh(groupRef);

  const [crowd, setCrowd] = useState<Crowd | undefined>();
  const [agent, setAgent] = useState<CrowdAgent | undefined>();

  const [agentTarget, setAgentTarget] = useState<THREE.Vector3 | undefined>();

  useEffect(() => {
    if (!navMesh || !navMeshQuery) return;

    const crowd = new Crowd(navMesh, {
      maxAgents: 1,
      maxAgentRadius: 0.6,
    });

    crowd.navMeshQuery.defaultQueryHalfExtents.x = 5;
    crowd.navMeshQuery.defaultQueryHalfExtents.z = 5;

    const { point: agentPosition } = navMeshQuery.findClosestPoint({
      x: 4,
      y: 0,
      z: 4,
    });

    const agent = crowd.addAgent(agentPosition, {
      height: 1,
      radius: 0.5,
      queryFilterType: CROWD_QUERY_FILTER_TYPE,
    });

    setCrowd(crowd);
    setAgent(agent);

    return () => {
      setAgent(undefined);
      setCrowd(undefined);

      crowd.destroy();
    };
  }, [navMesh, navMeshQuery]);

  useEffect(() => {
    if (!crowd || !agent) return;

    let includeFlags = PolyFlags.WALK;

    if (canSwim) {
      includeFlags |= PolyFlags.SWIM;
    }

    const filter = crowd.getFilter(CROWD_QUERY_FILTER_TYPE);
    filter.includeFlags = includeFlags;

    if (agentTarget) {
      agent.requestMoveTarget(agentTarget);
    }
  }, [crowd, agent, agentTarget, canSwim]);

  useFrame((_, delta) => {
    if (!crowd) return;

    crowd.update(delta);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !navMeshQuery || !crowd || !agent) return;

    e.stopPropagation();

    const { point: target } = navMeshQuery.findClosestPoint(e.point);

    if (e.button === 2) {
      agent.teleport(target);

      setAgentTarget(undefined);
    } else {
      agent.requestMoveTarget(target);

      setAgentTarget(new THREE.Vector3().copy(target as THREE.Vector3));
    }
  };

  return (
    <>
      <group onPointerDown={onClick}>
        <group ref={groupRef}>
          <Level />
        </group>

        <Debug navMesh={navMesh} crowd={crowd} />
      </group>

      <AgentPath agent={agent} target={agentTarget} />

      <CustomAreas />

      <OrbitControls makeDefault />
    </>
  );
};
