import { Html, OrbitControls } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import {
  NavMesh,
  NavMeshQuery,
  statusToReadableString,
} from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { create } from 'zustand';

import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators, htmlTunnel } from '../../decorators';
import { parameters } from '../../parameters';

type PolyVisual = {
  polyId: number;
  geometry: THREE.BufferGeometry;
  center: THREE.Vector3;
};

type NearbyPolygonsState = {
  navMesh?: NavMesh;
  navMeshQuery?: NavMeshQuery;

  selectType: 'cube' | 'circle';
  clickedPosition?: THREE.Vector3;

  /** Only one tile in `threeToSoloNavMesh` */
  touchedPolyIds: { [tilePolyId: number]: boolean };

  polyVisuals?: PolyVisual[];
};

const useNearbyPolygonsStore = create<
  NearbyPolygonsState & {
    set: (state: Partial<NearbyPolygonsState>) => void;
  }
>((set) => ({
  selectType: 'cube',
  touchedPolyIds: {},
  set,
}));

export function ClickNearbyPolygons() {
  const {
    navMesh,
    navMeshQuery,
    polyVisuals,
    clickedPosition,
    selectType,
    touchedPolyIds,
    set,
  } = useNearbyPolygonsStore();

  const [group, setGroup] = useState<THREE.Group | null>(null);

  const downAt = useRef(0);

  useEffect(() => {
    if (!group) return;

    const meshes = [] as THREE.Mesh[];
    group.traverse((x) => x instanceof THREE.Mesh && meshes.push(x));

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: 0.05,
      ch: 0.2,

      // Avoids extracting triangles
      maxVertsPerPoly: 3,
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    set({ navMesh, navMeshQuery });

    return () => {
      set({ navMesh: undefined, navMeshQuery: undefined });

      navMeshQuery.destroy();
      navMesh.destroy();
    };
  }, [group]);

  /* toggle whether a poly is selected */
  function togglePolySelected(polyId: number, e: React.MouseEvent) {
    e.preventDefault();

    if (!navMesh || !navMeshQuery) return;

    const newTouchedPolyIds = { ...touchedPolyIds };
    newTouchedPolyIds[polyId] = !touchedPolyIds[polyId];

    set({
      touchedPolyIds: newTouchedPolyIds,
    });
  }

  /* update visuals for selected polys */
  useEffect(() => {
    if (!navMesh || !touchedPolyIds) return;

    const enabledPolyIds = Object.keys(touchedPolyIds)
      .map(Number)
      .filter((polyId) => touchedPolyIds[polyId]);

    const polyVisuals: PolyVisual[] = enabledPolyIds.map((polyId) => {
      const salt = navMesh.getTile(0).salt();
      const polyRef = navMesh.encodePolyId(salt, 0, polyId);

      const geometry = polyRefToGeom(polyRef, navMesh);

      const { position } = geometry.attributes;

      const center = new THREE.Vector3();

      for (let i = 0; i < position.count; i++) {
        center.add(new THREE.Vector3().fromBufferAttribute(position, i));
      }

      center.divideScalar(position.count);

      return { polyId, geometry, center };
    });

    set({ polyVisuals });
  }, [navMesh, touchedPolyIds]);

  /* set clicked position and find touched polys */
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    // ignore camera manipulation
    if (Date.now() - downAt.current > 300) {
      return;
    }

    if (!navMesh || !navMeshQuery) return;

    const center = e.point;
    const clickedPosition = center.clone();
    if (selectType === 'cube') {
      clickedPosition.setY(center.y + 0.5);
    }

    const { nearestRef: startRef } =
      navMeshQuery.findNearestPoly(clickedPosition);
    console.info('findNearestPoly', startRef);

    const maxPolys = 100;

    const findPolysAroundCircleResult = navMeshQuery.findPolysAroundCircle(
      startRef,
      clickedPosition,
      1,
      { maxPolys }
    );
    console.info('findPolysAroundCircle', findPolysAroundCircleResult);
    console.info(
      'findPolysAroundCircle status',
      statusToReadableString(findPolysAroundCircleResult.status)
    );

    const halfExtents = { x: 0.5, y: 0.5, z: 0.5 };
    const queryPolygonsResult = navMeshQuery.queryPolygons(
      clickedPosition,
      halfExtents,
      { maxPolys }
    );
    console.info('queryPolygons', queryPolygonsResult);

    let polyRefs: number[] = [];

    if (selectType === 'circle') {
      polyRefs = findPolysAroundCircleResult.resultRefs.slice(
        0,
        findPolysAroundCircleResult.resultCount
      );
    } else {
      polyRefs = queryPolygonsResult.polyRefs;
    }

    const decodedPolyRefs = polyRefs.map((polyRef) =>
      navMesh.decodePolyId(polyRef)
    );
    console.info('decodedPolyRefs', decodedPolyRefs);

    const touchedPolyIds = {};
    for (const { tilePolygonIndex } of decodedPolyRefs) {
      touchedPolyIds[tilePolygonIndex] = true;
    }

    set({
      clickedPosition,
      touchedPolyIds,
    });
  };

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvironment
          onPointerDown={(_) => (downAt.current = Date.now())}
          onPointerUp={onPointerUp}
        />
      </group>

      {polyVisuals?.map(({ polyId, geometry, center }, i) => (
        <Fragment key={polyId}>
          <mesh key={i} geometry={geometry} material={touchMaterial} />

          <Html
            position={center}
            style={{
              color: '#fff',
              fontSize: '1em',
              textShadow: '0px 0px 3px #000',
              fontWeight: '600',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div>{polyId}</div>
          </Html>
        </Fragment>
      ))}

      {clickedPosition && (
        <>
          {selectType === 'cube' && (
            <mesh position={clickedPosition}>
              <meshStandardMaterial
                color="green"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                depthTest={false}
              />
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          )}
          {selectType === 'circle' && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={clickedPosition}>
              <meshStandardMaterial
                color="green"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                depthTest={false}
              />
              <circleGeometry args={[1, 24]} />
            </mesh>
          )}
        </>
      )}

      <Debug navMesh={navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls makeDefault zoomToCursor />

      <htmlTunnel.In>
        <div
          style={{
            position: 'absolute',
            top: 0,
            padding: '25px',
            userSelect: 'none',
            fontFamily: 'monospace',
            fontWeight: 400,
            color: 'white',
          }}
        >
          <h2>Click to select triangles</h2>
          <select
            defaultValue="foo"
            style={{
              fontFamily: 'monospace',
              fontSize: '16px',
              padding: '12px',
            }}
            onChange={({ currentTarget: { value } }) => {
              set({ selectType: value as NearbyPolygonsState['selectType'] });
            }}
          >
            <option value="cube">triangles touching 1x1x1 cube</option>
            <option value="circle">
              triangles touching circle with radius 1
            </option>
          </select>

          <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: 200 }}>
            {Object.entries(touchedPolyIds)
              .sort((a, b) => Number(b) - Number(a))
              .map(([polyIdString, enabled]) => (
                <button
                  key={polyIdString}
                  onPointerDown={(e) =>
                    togglePolySelected(Number(polyIdString), e)
                  }
                  {...(!enabled && { style: { filter: 'brightness(40%)' } })}
                >
                  {polyIdString}
                </button>
              ))}
          </div>
        </div>
      </htmlTunnel.In>
    </>
  );
}

function polyRefToGeom(
  polyRef: number,
  navMesh: NavMesh
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices = [] as THREE.Vector3Tuple[];
  const triangles = [] as number[][];

  // Only one tile because we use `threeToSoloNavMesh`
  let allVertices: undefined | THREE.Vector3Tuple[] = undefined;

  const { poly, tile } = navMesh.getTileAndPolyByRef(polyRef);

  const vertexIds = range(poly.vertCount()).map((i) => poly.verts(i));
  allVertices ??= range(tile.header()!.vertCount() * 3).reduce(
    (agg, i) =>
      i % 3 === 2
        ? agg.concat([[tile.verts(i - 2), tile.verts(i - 1), tile.verts(i)]])
        : agg,
    [] as THREE.Vector3Tuple[]
  );

  triangles.push(range(vertexIds.length).map((x) => x + vertices.length));
  vertices.push(...vertexIds.map((id) => allVertices![id]));

  geom.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(vertices.flatMap((v) => v)), 3)
  );
  geom.setIndex(triangles.flatMap((r) => r));

  return geom;
}

/**
 * @param n A non-negative integer
 * @returns Array `[0, ..., n-1]`
 */
function range(n: number) {
  return [...Array(n)].map((_, i) => i);
}

const navMeshMaterial = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});
const touchMaterial = new THREE.MeshBasicMaterial({
  color: 'blue',
  transparent: true,
  opacity: 0.3,
});

export default {
  title: 'NavMeshQuery / Click Nearby Polygons',
  decorators,
  parameters,
};
