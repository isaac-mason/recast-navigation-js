import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { NavMesh, NavMeshQuery, range } from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';

import { decorators, tunnelRat } from '../../decorators';
import { parameters } from '../../parameters';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { Debug } from '../../common/debug';

export function ClickNearbyPolygons() {

  const [state, setState] = React.useState({ selectType: 'cube', touchedPolyIds: {} } as State);

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

  function onClickPolyLink(polyId: number, e: React.MouseEvent) {
    e.preventDefault();

    state.touchedPolyIds[polyId] = !state.touchedPolyIds[polyId];
    const enabledPolyIds = Object.keys(state.touchedPolyIds).map(Number).filter(polyId => state.touchedPolyIds[polyId]);
    const currPolyRefs = enabledPolyIds.map(polyId => {
      const salt = state.navMesh.getTile(0).salt();
      return state.navMesh.encodePolyId(salt, 0, polyId);
    });
    console.info('encoded enabled polyIds', currPolyRefs);

    setState(s => ({
      ...s,
      touchGeom: polyRefsToGeom(currPolyRefs, state.navMesh),
    }));
  }

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
            const clickedPosition = center.clone();
            state.selectType === 'cube' && clickedPosition.setY(center.y + 0.5);
            
            const { nearestRef: startRef } = query.findNearestPoly(clickedPosition);
            console.info('findNearestPoly', startRef);

            const findPolysAroundCircleResult = query.findPolysAroundCircle(startRef, clickedPosition, 1, undefined, maxPolys);
            console.info('findPolysAroundCircle', findPolysAroundCircleResult);

            const halfExtents = { x: .5, y: .5, z: .5 };
            const queryPolygonsResult = query.queryPolygons(clickedPosition, halfExtents, undefined, maxPolys);
            console.info('queryPolygons', queryPolygonsResult);
            
            const polyRefs = state.selectType === 'circle' ? findPolysAroundCircleResult.resultRefs : queryPolygonsResult.polyRefs;
            const decodedPolyRefs = polyRefs.map(polyRef => state.navMesh.decodePolyId(polyRef));
            console.info('decodedPolyRefs', decodedPolyRefs);

            setState(s => ({
              ...s,
              clickedPosition,
              touchGeom: polyRefsToGeom(polyRefs, state.navMesh),
              touchedPolyIds: decodedPolyRefs.reduce((agg, { ipRef }) => ({ ...agg, [ipRef]: true }), {}),
            }));
          }}
        />
      </group>

      <mesh args={[state.touchGeom, touchMaterial]} />
      
      {state.clickedPosition && <>
        {state.selectType === 'cube' && <mesh position={state.clickedPosition}>
          <meshStandardMaterial color="green" transparent opacity={0.3} side={THREE.DoubleSide} depthTest={false} />
          <boxGeometry args={[1, 1, 1]} />
        </mesh>}
        {state.selectType === 'circle' && <mesh rotation={[-Math.PI/2, 0, 0]} position={state.clickedPosition} >
          <meshStandardMaterial color="green" transparent opacity={0.3} side={THREE.DoubleSide} depthTest={false} />
          <circleGeometry args={[1, 24]} />
        </mesh>}
      </>}

      <Debug navMesh={state.navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls zoomToCursor />

      <tunnelRat.In>
        <div style={{
          position: 'absolute',
          top: 0,
          color: 'white',
          padding: 24,
          userSelect: 'none',
        }}>
          <h2>Click to select triangles</h2>
          <select
            defaultValue="foo"
            style={{ fontSize: 16, padding: 12 }}
            onChange={({ currentTarget: { value } }) => {
              setState(s => ({ ...s, selectType: value as State['selectType'] }))
            }}
          >
            <option value="cube">triangles touching 1x1x1 cube</option>
            <option value="circle">triangles touching circle with radius 1</option>
          </select>
          <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: 200 }}>
            {Object.entries(state.touchedPolyIds).map(([polyIdStr, enabled]) =>
              <button
                key={polyIdStr}
                onClick={onClickPolyLink.bind(null, Number(polyIdStr))}
                {...!enabled && { style: { filter: 'brightness(40%)' } }}
              >
                {polyIdStr}
              </button>
            )}
          </div>
          
        </div>
      </tunnelRat.In>
    </>
  );
}

interface State {
  group: THREE.Group;
  navMesh: NavMesh;
  navMeshQuery: NavMeshQuery;
  selectType: 'cube' | 'circle';
  downAt?: number;
  clickedPosition?: THREE.Vector3;
  touchGeom?: THREE.BufferGeometry;
  /** Only one tile in `threeToSoloNavMesh` */
  touchedPolyIds: { [tilePolyId: number]: boolean };
}

function polyRefsToGeom(polyRefs: number[], navMesh: NavMesh): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices = [] as THREE.Vector3Tuple[];
  const triangles = [] as number[][];
  // Only one tile because we use `threeToSoloNavMesh`
  let allVertices = undefined as undefined | THREE.Vector3Tuple[];
  
  for (const polyRef of polyRefs) {
    const result = navMesh.getTileAndPolyByRef(polyRef);
    const poly = result.poly();
    const vertexIds = range(poly.vertCount()).map(i => poly.verts(i));
    
    const tile = result.tile();
    allVertices ??= range(tile.header()!.vertCount() * 3).reduce((agg, i) => 
      (i % 3 === 2) ? agg.concat([[tile.verts(i - 2), tile.verts(i - 1), tile.verts(i)]]) : agg,
      [] as THREE.Vector3Tuple[],
    );

    triangles.push(range(vertexIds.length).map(x => x + vertices.length));
    vertices.push(...vertexIds.map(id => allVertices![id]));
  }

  geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices.flatMap(v => v)), 3));
  geom.setIndex(triangles.flatMap(r => r));
  return geom;
}

const navMeshMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 'red' });
const touchMaterial = new THREE.MeshBasicMaterial({ color: 'blue', transparent: true, opacity: 0.3 });
const maxPolys = 100;


export default {
  title: 'NavMeshQuery / Click Nearby Polygons',
  decorators,
  parameters,
};
