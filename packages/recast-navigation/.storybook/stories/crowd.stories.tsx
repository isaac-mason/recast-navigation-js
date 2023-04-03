import { useFrame, useThree } from '@react-three/fiber';
import { Crowd, NavMesh } from '@recast-navigation/core';
import React, { useEffect, useRef, useState } from 'react';
import {
  CrowdHelper,
  NavMeshHelper,
  threeToNavMeshArgs,
} from 'recast-navigation/three';
import { Group, MeshStandardMaterial } from 'three';
import { BasicEnvironment } from '../utils/basic-environment';
import { decorators } from '../utils/decorators';

export default {
  title: 'Crowd',
  decorators,
};

export const Basic = () => {
  const scene = useThree((state) => state.scene);

  const [group, setGroup] = useState<Group | null>(null);

  const crowdRef = useRef<Crowd>(null!)
  const crowdHelperRef = useRef<CrowdHelper>(null!)

  useEffect(() => {
    if (!group) return;

    const args = threeToNavMeshArgs(group);

    console.log(args);

    const navMesh = new NavMesh();
    navMesh.build(...args, {
      cs: 0.05,
      ch: 0.02,
    });

    const crowd = new Crowd({
      navMesh,
      maxAgents: 5,
      maxAgentRadius: 0.5,
    });

    const agentId = crowd.addAgent(
      { x: 0, y: 0, z: 0 },
      {
        radius: 0.5,
        height: 1,
      }
    );

    console.log(`new agent! - ${agentId}`)

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: new MeshStandardMaterial({
        color: 'orange',
        transparent: true,
        opacity: 0.5,
      }),
    });

    scene.add(navMeshHelper.navMesh);

    const crowdHelper = new CrowdHelper({
      crowd,
    });

    scene.add(crowdHelper.agents);

    crowdRef.current = crowd
    crowdHelperRef.current = crowdHelper

    return () => {
      scene.remove(navMeshHelper.navMesh);
      scene.remove(crowdHelper.agents);

      crowdRef.current = null!
      crowdHelperRef.current = null!
    };
  }, [group]);

  useFrame((_, delta) => {
    if (!crowdRef.current || !crowdHelperRef.current) return

    crowdRef.current.update(delta)
    crowdHelperRef.current.updateAgents()
  })

  return (
    <>
      <group ref={setGroup}>
        <BasicEnvironment />
      </group>
    </>
  );
};
