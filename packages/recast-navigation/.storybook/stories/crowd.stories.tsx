import { useFrame, useThree } from '@react-three/fiber';
import { Crowd, NavMesh } from '@recast-navigation/core';
import React, { useEffect, useRef, useState } from 'react';
import {
  CrowdHelper,
  NavMeshHelper,
  threeToNavMesh,
  threeToNavMeshArgs,
} from 'recast-navigation/three';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { BasicEnvironment } from '../utils/basic-environment';
import { decorators } from '../utils/decorators';

export default {
  title: 'Crowd',
  decorators,
};

export const Basic = () => {
  const scene = useThree((state) => state.scene);

  const [group, setGroup] = useState<Group | null>(null);
  const [threeNavMesh, setThreeNavMesh] = useState<Mesh | null>(null);
  const [threeCrowdAgents, setThreeCrowdAgents] = useState<Group | null>(null);

  const crowdRef = useRef<Crowd>(null!);
  const crowdHelperRef = useRef<CrowdHelper>(null!);

  useEffect(() => {
    if (!group) return;

    const navMesh = threeToNavMesh(group, {
      cs: 0.2,
      ch: 0.2,
      walkableSlopeAngle: 90,
      walkableHeight: 1.0,
      walkableClimb: 1,
      walkableRadius: 1,
      maxEdgeLen: 12.,
      maxSimplificationError: 1.3,
      minRegionArea: 8,
      mergeRegionArea: 20,
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    });

    navMesh.setDefaultQueryExtent({ x: 10, y: 10, z: 10 });

    const crowd = new Crowd({
      navMesh,
      maxAgents: 11,
      maxAgentRadius: 0.2,
    });

    crowd.setDefaultQueryExtent({ x: 2, y: 2, z: 2 });

    console.log(
      crowd.addAgent(
        { x: 0, y: 0, z: 0 },
        {
          radius: 0.1,
          height: 0.2,
          maxAcceleration: 4.0,
          maxSpeed: 1.0,
          collisionQueryRange: 0.5,
          pathOptimizationRange: 0.0,
          separationWeight: 1.0,
        }
      )
    );

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: new MeshStandardMaterial({
        color: 'orange',
        transparent: true,
        opacity: 1,
        wireframe: true,
        wireframeLinewidth: 3,
      }),
    });

    setThreeNavMesh(navMeshHelper.navMesh);

    const crowdHelper = new CrowdHelper({
      crowd,
    });

    setThreeCrowdAgents(crowdHelper.agents);

    crowdRef.current = crowd;
    crowdHelperRef.current = crowdHelper;

    (window as any).crowdRef = crowdRef;

    return () => {
      crowd.destroy();
      navMesh.destroy();

      crowdRef.current = null!;
      crowdHelperRef.current = null!;
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowdRef.current || !crowdHelperRef.current) return;

    crowdRef.current.update(delta * 1000);
    crowdHelperRef.current.updateAgents();
  });

  return (
    <>
      <group ref={setGroup}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color="grey" />
        </mesh>
      </group>

      <group>
        {threeCrowdAgents && <primitive object={threeCrowdAgents} />}
      </group>

      <group
        onClick={(e) => {
          if (!crowdRef.current) return;

          const agent = 0;

          console.log(crowdRef.current.getActiveAgentCount());

          const start = crowdRef.current.getAgentPosition(agent);

          const target = crowdRef.current.navMesh.getClosestPoint(e.point);

          console.log(start, target);
          console.log(crowdRef.current.navMesh.computePath(start, target));

          crowdRef.current.teleport(agent, e.point);
        }}
      >
        {threeNavMesh && <primitive object={threeNavMesh} />}
      </group>
    </>
  );
};
