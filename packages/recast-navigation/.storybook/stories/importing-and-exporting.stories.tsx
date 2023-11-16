import { OrbitControls } from '@react-three/drei';
import {
  NavMesh,
  TileCacheMeshProcess,
  exportNavMesh,
  importNavMesh,
} from '@recast-navigation/core';
import { threeToSoloNavMesh, threeToTileCache } from '@recast-navigation/three';
import { button, useControls } from 'leva';
import React, { useState } from 'react';
import { Group, Mesh, MeshBasicMaterial } from 'three';
import { Debug } from '../common/debug';
import { NavTestEnvirionment } from '../common/nav-test-environment';
import { useNavMeshConfig } from '../common/use-nav-mesh-config';
import { decorators } from '../decorators';
import { parameters } from '../parameters';

export default {
  title: 'Utilities / Importing And Exporting',
  decorators,
  parameters,
};

const navMeshMaterial = new MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});

const controlsPrefix = 'nav-mesh-importer-exporter';

export const NavMeshExample = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [result, setResult] = useState<NavMesh | undefined>();

  const [navMeshExport, setNavMeshExport] = useState<Uint8Array | undefined>();

  const navMeshConfig = useNavMeshConfig(`${controlsPrefix}/navmesh`);

  useControls(
    controlsPrefix,
    {
      generate: button(() => {
        if (!group) return;

        const meshes: Mesh[] = [];

        group.traverse((child) => {
          if (child instanceof Mesh) {
            meshes.push(child);
          }
        });

        const { navMesh } = threeToSoloNavMesh(meshes, navMeshConfig);

        setResult(navMesh);
      }),
      reset: button(() => {
        setResult(undefined);
      }),
      save: button(
        () => {
          if (!result) return;

          const buffer = exportNavMesh(result);

          setNavMeshExport(buffer);
        },
        { disabled: !result }
      ),
      load: button(
        () => {
          if (!navMeshExport) return;

          const { navMesh } = importNavMesh(navMeshExport);

          setResult(navMesh);
        },
        { disabled: !navMeshExport }
      ),
    },
    [group, navMeshConfig, result, navMeshExport]
  );

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvirionment />
      </group>

      <Debug navMesh={result} navMeshMaterial={navMeshMaterial} />

      <OrbitControls />
    </>
  );
};

export const TileCacheExample = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [result, setResult] = useState<NavMesh | undefined>();

  const [navMeshExport, setNavMeshExport] = useState<Uint8Array | undefined>();

  const navMeshConfig = useNavMeshConfig(`${controlsPrefix}/tilecache`, {
    tileSize: 16,
  });

  useControls(
    controlsPrefix,
    {
      generate: button(() => {
        if (!group) return;

        const meshes: Mesh[] = [];

        group.traverse((child) => {
          if (child instanceof Mesh) {
            meshes.push(child);
          }
        });

        const { navMesh } = threeToTileCache(meshes, navMeshConfig);

        setResult(navMesh);
      }),
      reset: button(() => {
        setResult(undefined);
      }),
      save: button(
        () => {
          if (!result) return;

          const buffer = exportNavMesh(result);

          setNavMeshExport(buffer);
        },
        { disabled: !result }
      ),
      load: button(
        () => {
          if (!navMeshExport) return;

          const meshProcess = new TileCacheMeshProcess(
            (navMeshCreateParams, polyAreas, polyFlags) => {
              for (let i = 0; i < navMeshCreateParams.polyCount(); ++i) {
                polyAreas.set_data(i, 0);
                polyFlags.set_data(i, 1);
              }
            }
          );

          const { navMesh } = importNavMesh(navMeshExport, meshProcess);

          setResult(navMesh);
        },
        { disabled: !navMeshExport }
      ),
    },
    [group, navMeshConfig, result, navMeshExport]
  );

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvirionment />
      </group>

      <Debug navMesh={result} navMeshMaterial={navMeshMaterial} />

      <OrbitControls />
    </>
  );
};
