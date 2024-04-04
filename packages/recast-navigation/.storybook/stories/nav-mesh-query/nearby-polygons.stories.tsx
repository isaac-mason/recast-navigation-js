import React from 'react';
import * as THREE from 'three';
import { Line, OrbitControls } from '@react-three/drei';
import { NavMesh, NavMeshQuery } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';

import { decorators } from '../../decorators';
import { parameters } from '../../parameters';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { Debug } from '../../common/debug';

export function NearbyPolygons() {

  const [state, setState] = React.useState({} as {
    group?: THREE.Group;
    navMesh?: NavMesh;
    nearbyPolys?: THREE.BufferGeometry;
    pointerDownAt?: number;
  });

  React.useMemo(() => {
    if (state.group) {
      const meshes = [] as THREE.Mesh[];
      state.group.traverse(x => x instanceof THREE.Mesh && meshes.push(x));
      const { success, navMesh } = threeToSoloNavMesh(meshes, { cs: 0.05, ch: 0.2 });
      if (success) {
        setState(s => ({ ...s, navMesh }));
        return () => navMesh.destroy();
      }
    }
  }, [state.group]);

  return (
    <>
      <group ref={group => group && !state.group && setState(s => ({ ...s, group }))}>
        <NavTestEnvironment
          onPointerDown={_ => state.pointerDownAt = Date.now()}
          onPointerUp={e => {
            if ((Date.now() - (state.pointerDownAt ?? 0)) > 300) {
              return; // ignore camera manipulation
            }

            const d = 0.5;
            const dy = 0.05;
            const { x, y, z } = e.point;

            const geom = new THREE.BufferGeometry();
            const xzVertices = new Float32Array([x - d, y + dy, z - d,  x + d, y + dy, z + d,  x + d, y + dy, z - d,  x - d, y + dy, z + d]);
            const xzUvs = new Float32Array([0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0]);
            const xzIndices = [0, 1, 2, 0, 3, 1];
            geom.setAttribute("position", new THREE.BufferAttribute(xzVertices.slice(), 3));
            geom.setAttribute("uv", new THREE.BufferAttribute(xzUvs.slice(), 2));
            geom.setIndex(xzIndices.slice());

            setState(s => ({ ...s, nearbyPolys: geom }));
          }}
        />
      </group>

      {state.nearbyPolys && <mesh key={state.nearbyPolys.uuid} args={[state.nearbyPolys, nearbyPolyMaterial]} />}

      <Debug navMesh={state.navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls />
    </>
  );
}

const navMeshMaterial = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});
const nearbyPolyMaterial = new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false });

export default {
  title: 'NavMeshQuery / NearbyPolygons',
  decorators,
  parameters,
};