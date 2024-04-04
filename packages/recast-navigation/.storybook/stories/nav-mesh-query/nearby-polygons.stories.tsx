import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { NavMesh, NavMeshQuery, range } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';

import { decorators } from '../../decorators';
import { parameters } from '../../parameters';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { Debug } from '../../common/debug';

export function NearbyPolygons() {

  const [state, setState] = React.useState({} as {
    group: THREE.Group;
    navMesh: NavMesh;
    navMeshQuery: NavMeshQuery;
    nearbyPolys?: THREE.BufferGeometry;
    downAt?: number;
  });

  React.useEffect(() => {
    if (state.group) {
      const meshes = [] as THREE.Mesh[];
      state.group.traverse(x => x instanceof THREE.Mesh && meshes.push(x));
      const { success, navMesh } = threeToSoloNavMesh(meshes, {
        cs: 0.05,
        ch: 0.2,
        maxVertsPerPoly: 3, // Avoids extracting triangles
      });
      if (success) {
        setState(s => ({ ...s, navMesh, navMeshQuery: new NavMeshQuery({ navMesh }) }));
        return () => navMesh.destroy();
      }
    }
  }, [state.group]);

  return (
    <>
      <group ref={group => group && !state.group && setState(s => ({ ...s, group }))}>
        <NavTestEnvironment
          onPointerDown={_ => state.downAt = Date.now()}
          onPointerUp={e => {
            if (Date.now() - state.downAt! > 300) {
              return; // ignore camera manipulation
            }

            const query = new NavMeshQuery({ navMesh: state.navMesh });
            const center = e.point;
            const halfExtents = { x: .5, y: .5, z: .5 };
            const queryPolygonsResult = query.queryPolygons(center, halfExtents, undefined, 100);
            console.log('queryPolygons', queryPolygonsResult);
            
            // const { nearestRef: startRef } = query.findNearestPoly(center);
            // console.log('findNearestPoly', startRef);
            // const findPolysAroundCircleResult = query.findPolysAroundCircle(startRef, center, 5, undefined, 5);
            // console.log('findPolysAroundCircle', findPolysAroundCircleResult.success, findPolysAroundCircleResult);

            const geom = polyRefsToGeom(queryPolygonsResult.polyRefs, state.navMesh);

            setState(s => ({ ...s, nearbyPolys: geom }));
          }}
        />
      </group>

      <mesh args={[state.nearbyPolys, nearbyPolyMaterial]} />

      <Debug navMesh={state.navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls />
    </>
  );
}

const navMeshMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 'red' });
const nearbyPolyMaterial = new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false });

function polyRefsToGeom(polyRefs: number[], navMesh: NavMesh): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices = [] as THREE.Vector3Tuple[];
  const rings = [] as number[][];
  // Only one tile because we use `threeToSoloNavMesh`
  let allVertices = undefined as undefined | THREE.Vector3Tuple[];
  
  for (const polyRef of polyRefs) {
    const result = navMesh.getTileAndPolyByRef(polyRef);
    const poly = result.poly();
    const vertexIds = range(poly.vertCount()).map(i => poly.verts(i));
    
    const tile = result.tile();
    allVertices ??= range((tile.header()!.vertCount() * 3) + 1).reduce((agg, i) => 
      i && (i % 3 === 0) ? agg.concat([[tile.verts(i - 3), tile.verts(i - 2), tile.verts(i - 1)]]) : agg,
      [] as THREE.Vector3Tuple[],
    );

    rings.push(range(vertexIds.length).map(x => x + vertices.length));
    vertices.push(...vertexIds.map(id => allVertices![id]));
  }

  console.log({
    vertices,
    rings,
  })

  geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices.flatMap(v => v)), 3));
  geom.setIndex(rings.flatMap(r => r));
  return geom;
}

export default {
  title: 'NavMeshQuery / NearbyPolygons',
  decorators,
  parameters,
};