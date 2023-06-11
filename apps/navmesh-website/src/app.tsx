import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Leva, button, useControls } from 'leva';
import { Suspense, useEffect, useState } from 'react';
import { NavMesh } from 'recast-navigation';
import { NavMeshHelper, threeToNavMesh } from 'recast-navigation/three';
import { Group, Mesh, MeshBasicMaterial } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import dungeonGltfUrl from './assets/dungeon.gltf?url';
import { CenterLayout } from './components/center-layout';
import { DropZone } from './components/drop-zone';
import { ErrorMessage } from './components/error-message';
import { LoadingSpinner } from './components/loading-spinner';
import { RecastInit } from './components/recast-init';
import { Viewer } from './components/viewer';
import { useNavMeshConfig } from './hooks/use-nav-mesh-config';
import { downloadText } from './utils/download-text';
import { gltfLoader } from './utils/gltf-loader';
import { navMeshToGLTF } from './utils/nav-mesh-to-gltf';
import { readFile } from './utils/read-file';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [gltf, setGtlf] = useState<Group>();
  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [debugNavMesh, setDebugNavMesh] = useState<Mesh>();

  const exampleGltf = useGLTF(dungeonGltfUrl);

  const navMeshConfig = useNavMeshConfig();

  const onDropFile = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      const { buffer } = await readFile(acceptedFiles[0]);

      const { scene } = await new Promise<GLTF>((resolve, reject) =>
        gltfLoader.parse(buffer, '', resolve, reject)
      );

      setGtlf(scene);
    } catch (e) {
      setError(
        'Something went wrong! Please ensure the file is a valid GLTF / GLB.'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateNavMesh = async () => {
    if (!gltf) return;

    setError(undefined);
    setLoading(true);
    setNavMesh(undefined);
    setDebugNavMesh(undefined);

    try {
      const meshes: Mesh[] = [];

      gltf.traverse((child) => {
        if (child instanceof Mesh) {
          meshes.push(child);
        }
      });

      const { navMesh } = threeToNavMesh(meshes, navMeshConfig);

      setNavMesh(navMesh);
    } catch (e) {
      setError(
        'Something went wrong generating the nav mesh - ' +
          (e as { message: string }).message
      );
    } finally {
      setLoading(false);
    }
  };

  const [navMeshDebugColor, setNavMeshDebugColor] = useState('#ffa500');

  const { wireframe: navMeshDebugWireframe, opacity: navMeshDebugOpacity } =
    useControls('NavMesh Debug Display', {
      color: {
        label: 'Color',
        value: navMeshDebugColor,
        onEditEnd: setNavMeshDebugColor,
      },
      opacity: {
        label: 'Opacity',
        value: 0.65,
        min: 0,
        max: 1,
      },
      wireframe: {
        label: 'Wireframe',
        value: false,
      },
    });

  useEffect(() => {
    if (!navMesh) {
      setDebugNavMesh(undefined);
      return;
    }

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: new MeshBasicMaterial({
        transparent: true,
        color: Number(navMeshDebugColor.replace('#', '0x')),
        wireframe: navMeshDebugWireframe,
        opacity: navMeshDebugOpacity,
      }),
    });

    setDebugNavMesh(navMeshHelper.navMesh);
  }, [navMesh, navMeshDebugColor, navMeshDebugWireframe, navMeshDebugOpacity]);

  const exportAsGLTF = async () => {
    if (!navMesh) return;

    const gltfJson = await navMeshToGLTF(navMesh);

    downloadText(JSON.stringify(gltfJson), 'application/json', 'navmesh.gltf');

    gtag({ event: 'export_as_gltf' });
  };

  useControls(
    'Actions',
    {
      'Generate NavMesh': button(() => generateNavMesh(), {
        disabled: loading,
      }),
      'Export as GLTF': button(exportAsGLTF, {
        disabled: !navMesh,
      }),
    },
    [navMesh, generateNavMesh, loading]
  );

  return (
    <>
      <Canvas
        camera={{
          position: [0, 0, 10],
        }}
      >
        {gltf && <Viewer group={gltf} />}
        {debugNavMesh && <primitive object={debugNavMesh} />}

        <Environment preset="city" />

        <OrbitControls />
      </Canvas>

      {loading && (
        <CenterLayout>
          <LoadingSpinner />
        </CenterLayout>
      )}

      {!gltf && !loading && (
        <CenterLayout>
          <DropZone
            onDrop={onDropFile}
            selectExample={() => {
              setGtlf(exampleGltf.scene);
            }}
          />
        </CenterLayout>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Leva
        hidden={!gltf}
        theme={{
          sizes: {
            rootWidth: '350px',
            controlWidth: '100px',
          },
        }}
      />
    </>
  );
};

export default () => (
  <RecastInit>
    <Suspense
      fallback={
        <CenterLayout>
          <LoadingSpinner />
        </CenterLayout>
      }
    >
      <App />
    </Suspense>
  </RecastInit>
);
