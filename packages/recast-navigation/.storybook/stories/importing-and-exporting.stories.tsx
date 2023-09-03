import { OrbitControls } from '@react-three/drei';
import {
  NavMesh,
  TileCacheMeshProcess,
  exportNavMesh,
  importNavMesh,
} from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import { button, useControls } from 'leva';
import React, { useState } from 'react';
import { Group, Mesh, MeshBasicMaterial } from 'three';
import { Debug } from '../common/debug';
import { NavTestEnvirionment } from '../common/nav-test-environment';
import { useNavMeshConfig } from '../common/use-nav-mesh-config';
import { decorators } from '../decorators';

export default {
  title: 'Utilities / Importing And Exporting',
  decorators,
};

const navMeshMaterial = new MeshBasicMaterial({
  wireframe: true,
  color: 'red',
});

const controlsPrefix = 'nav-mesh-importer-exporter';

export const ImportingAndExporting = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh | undefined>();
  const [navMeshExport, setNavMeshExport] = useState<Uint8Array | undefined>();

  const navMeshConfig = useNavMeshConfig(controlsPrefix);

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

        setNavMesh(navMesh);
      }),
      reset: button(() => {
        setNavMesh(undefined);
      }),
      save: button(
        () => {
          if (!navMesh) return;

          const buffer = exportNavMesh(navMesh);

          setNavMeshExport(buffer);
        },
        { disabled: !navMesh }
      ),
      load: button(
        () => {
          if (!navMeshExport) return;

          const meshProcess = new TileCacheMeshProcess(
            (navMeshCreateParams, polyAreas, polyFlags) => {
              for (let i = 0; i < navMeshCreateParams.polyCount; ++i) {
                polyAreas.set_data(i, 0);
                polyFlags.set_data(i, 1);
              }
            }
          );

          const { navMesh } = importNavMesh(navMeshExport, meshProcess);

          setNavMesh(navMesh);
        },
        { disabled: !navMeshExport }
      ),
    },
    [group, navMeshConfig, navMesh, navMeshExport]
  );

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvirionment />
      </group>

      <Debug navMesh={navMesh} navMeshMaterial={navMeshMaterial} />

      <OrbitControls />
    </>
  );
};
