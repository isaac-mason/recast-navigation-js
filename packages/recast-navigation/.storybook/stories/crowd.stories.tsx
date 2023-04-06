import { useFrame } from '@react-three/fiber';
import { Crowd } from '@recast-navigation/core';
import React, { useEffect, useRef, useState } from 'react';
import {
  CrowdHelper,
  NavMeshHelper,
  threeToNavMesh,
} from 'recast-navigation/three';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { BasicEnvironment } from '../utils/basic-environment';
import { decorators } from '../utils/decorators';

export default {
  title: 'Crowd',
  decorators,
};

export const Basic = () => {
  const [group, setGroup] = useState<Group | null>(null);
  const [threeNavMesh, setThreeNavMesh] = useState<Mesh | null>(null);
  const [threeNavMeshObstacles, setThreeNavMeshObstacles] =
    useState<Group | null>(null);
  const [threeCrowdAgents, setThreeCrowdAgents] = useState<Group | null>(null);

  const crowdRef = useRef<Crowd>(null!);
  const crowdHelperRef = useRef<CrowdHelper>(null!);

  useEffect(() => {
    if (!group) return;

    const navMesh = threeToNavMesh(group, {
      cs: 0.2,
      ch: 0.2,
      tileSize: 20,
      walkableSlopeAngle: 90,
      walkableHeight: 1.0,
      walkableClimb: 1,
      walkableRadius: 1,
      maxEdgeLen: 12,
      maxSimplificationError: 1.3,
      minRegionArea: 8,
      mergeRegionArea: 20,
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    });

    navMesh.addCylinderObstacle({ x: 2, y: 0, z: 0 }, 0.5, 2);

    navMesh.addBoxObstacle({ x: -2.5, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }, 0);

    navMesh.update();

    const crowd = new Crowd({
      navMesh,
      maxAgents: 10,
      maxAgentRadius: 0.5,
    });

    for (let i = 0; i < 10; i++) {
      crowd.addAgent(navMesh.getRandomPointAround({ x: 0, y: 0, z: 0 }, 2), {
        radius: 0.1 + Math.random() * 0.1,
        height: 0.5,
        maxAcceleration: 4.0,
        maxSpeed: 1.0,
        collisionQueryRange: 0.5,
        pathOptimizationRange: 0.0,
        separationWeight: 1.0,
      });
    }

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: new MeshStandardMaterial({
        color: 'orange',
        wireframe: true,
        wireframeLinewidth: 3,
      }),
    });

    setThreeNavMesh(navMeshHelper.navMesh);
    setThreeNavMeshObstacles(navMeshHelper.obstacles);

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

      setThreeNavMesh(null);
      setThreeNavMeshObstacles(null);
      setThreeCrowdAgents(null);

      crowdRef.current = null!;
      crowdHelperRef.current = null!;
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowdRef.current || !crowdHelperRef.current) return;

    crowdRef.current.update(delta);
    crowdHelperRef.current.updateAgents();
  });

  return (
    <>
      <group ref={setGroup}>
        {/* <BasicEnvironment /> */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="grey" />
        </mesh>
      </group>

      <group>
        {threeCrowdAgents && <primitive object={threeCrowdAgents} />}
      </group>

      <group
        onClick={(e) => {
          if (!crowdRef.current) return;

          const target = crowdRef.current.navMesh.getClosestPoint(e.point);

          for (const agent of crowdRef.current.getAgents()) {
            crowdRef.current.goto(agent, target);
          }
        }}
      >
        {threeNavMesh && <primitive object={threeNavMesh} />}
        {threeNavMeshObstacles && <primitive object={threeNavMeshObstacles} />}
      </group>
    </>
  );
};
