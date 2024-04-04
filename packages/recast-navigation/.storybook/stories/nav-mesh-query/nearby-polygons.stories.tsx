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
        <NavTestEnvironment onPointerUp={e => console.log('onPointerUp', e, e.point)} />
      </group>

      {state.nearbyPolys && <mesh args={[state.nearbyPolys, nearbyPolyMaterial]} />}

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