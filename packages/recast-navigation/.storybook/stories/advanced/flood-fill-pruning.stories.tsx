import { OrbitControls } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { Detour, NavMeshQuery } from '@recast-navigation/core';
import { DebugDrawer, threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Group, Mesh } from 'three';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, htmlTunnel } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'Advanced / Flood Fill Pruning',
  decorators,
  parameters,
};

export const FloodFillPruning = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [debug, setDebug] = useState<DebugDrawer | undefined>();

  const [point, setPoint] = useState<THREE.Vector3>(
    new THREE.Vector3(0.8, 0.26, 3.3)
  );

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const agentRadius = 0.1;
    const cellSize = 0.05;

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: cellSize,
      ch: 0.2,
      walkableRadius: Math.ceil(agentRadius / cellSize),
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    const nearestPolyResult = navMeshQuery.findNearestPoly(point, {
      halfExtents: { x: 2, y: 2, z: 2 },
    });

    if (!nearestPolyResult.success) return;

    /* find all polys connected to the nearest poly */
    const visited = new Set<number>();
    visited.add(nearestPolyResult.nearestRef);

    const openList: number[] = [];

    openList.push(nearestPolyResult.nearestRef);

    while (openList.length > 0) {
      const ref = openList.pop()!;

      // get current poly and tile
      const { poly, tile } = navMesh.getTileAndPolyByRefUnsafe(ref);

      // visit linked polys
      for (
        let i = poly.firstLink();
        // https://github.com/emscripten-core/emscripten/issues/22134
        i !== Detour.DT_NULL_LINK;
        i = tile.links(i).next()
      ) {
        const neiRef = tile.links(i).ref();

        // skip invalid and already visited
        if (!neiRef || visited.has(neiRef)) continue;

        // mark as visited
        visited.add(neiRef);

        // visit neighbours
        openList.push(neiRef);
      }
    }

    /* disable unvisited polys */
    for (let tileIndex = 0; tileIndex < navMesh.getMaxTiles(); tileIndex++) {
      const tile = navMesh.getTile(tileIndex);

      if (!tile || !tile.header()) continue;

      const tileHeader = tile.header()!;

      const base = navMesh.getPolyRefBase(tile);

      for (let i = 0; i < tileHeader.polyCount(); i++) {
        const ref = base | i;

        if (!visited.has(ref)) {
          // set flag to 0
          // this could also be a custom 'disabled' area flag if using custom areas
          navMesh.setPolyFlags(ref, 0);
        }
      }
    }

    /* debug draw */
    const debug = new DebugDrawer();

    debug.drawNavMeshPolysWithFlags(navMesh, 1, 0x0000ff);

    setDebug(debug);

    return () => {
      setDebug(undefined);

      debug.dispose();
      navMeshQuery.destroy();
      navMesh.destroy();
    };
  }, [group, point]);

  const onPointerDown = ({ point }: ThreeEvent<PointerEvent>) => {
    setPoint(new THREE.Vector3(point.x, point.y, point.z));
  };

  return (
    <>
      <group ref={setGroup} onPointerDown={onPointerDown}>
        <NavTestEnvironment />
      </group>

      {debug && <primitive object={debug} />}

      <OrbitControls makeDefault />

      <htmlTunnel.In>
        <div
          style={{
            position: 'absolute',
            top: 0,
            padding: '25px',
            userSelect: 'none',
            fontSize: '1.5em',
            fontFamily: 'monospace',
            fontWeight: 400,
            color: 'white',
          }}
        >
          click to set flood fill start point
        </div>
      </htmlTunnel.In>
    </>
  );
};
