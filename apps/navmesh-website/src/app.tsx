import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { button, Leva, useControls } from 'leva';
import { Suspense, useEffect, useState } from 'react';
import { NavMeshHelper, threeToNavMesh } from 'recast-navigation/three';
import styled from 'styled-components';
import { DoubleSide, Group, Mesh, MeshStandardMaterial } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import dungeonGltfUrl from './assets/dungeon.gltf?url';
import { DropZone } from './components/drop-zone';
import { Loader } from './components/loader';
import { RecastInit } from './components/recast-init';
import { Viewer } from './components/viewer';
import { useNavMeshConfig } from './hooks/use-nav-mesh-config';
import { gltfLoader } from './utils/gltf-loader';
import { readFile } from './utils/read-file';

const Fullscreen = styled.div`
  position: absolute;
  top: 0;
  left: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  width: calc(100% - 4em);
  height: calc(100vh - 4em);
  padding: 2em;

  font-weight: 600;
  line-height: 1.3;
  text-align: center;

  color: #fff;
`;

const Error = styled.div`
  position: absolute;
  bottom: 0px;
  left: 50% - 140px;
  width: 280px;
  z-index: 1;

  margin: 0.5em;
  padding: 0.5em;

  background-color: #222;
  color: #fae864;

  border: 1px solid #fae864;
  border-radius: 0.2em;

  font-size: 1em;
  font-weight: 400;
`;

const FullscreenLoader = () => (
  <Fullscreen>
    <Loader />
  </Fullscreen>
);

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gltf, setGtlf] = useState<Group | null>(null);
  const [debugNavMesh, setDebugNavMesh] = useState<Mesh | null>(null);

  const exampleGltf = useGLTF(dungeonGltfUrl);

  const navMeshConfig = useNavMeshConfig();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    setError(null);
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
    }

    setLoading(false);
  };

  const generateNavMesh = async () => {
    if (!gltf) return;

    setError(null);
    setLoading(true);
    setDebugNavMesh(null);

    try {
      const navMesh = threeToNavMesh(gltf, {
        cs: 0.05,
        borderSize: 0.5
      });

      const navMeshHelper = new NavMeshHelper({
        navMesh,
        navMeshMaterial: new MeshStandardMaterial({
          color: 'orange',
          flatShading: true,
          opacity: 0.5,
          transparent: true,
          side: DoubleSide,
        }),
      });

      setDebugNavMesh(navMeshHelper.navMesh);
    } catch (e) {
      setError(
        'Something went wrong generating the nav mesh - ' +
          (e as { message: string }).message
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    generateNavMesh();
  }, [gltf]);

  useControls(
    'Actions',
    {
      'Generate NavMesh': button(() => generateNavMesh(), {
        disabled: loading,
      }),
      'Export as GLTF': button(() => {}, {
        disabled: true,
      }),
      'Export as Recast NavMeshData': button(() => {}, {
        disabled: true,
      }),
    },
    [navMeshConfig, gltf, loading]
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

      {loading && <FullscreenLoader />}

      {!gltf && !loading && (
        <Fullscreen>
          <DropZone
            onDrop={onDrop}
            selectExample={() => {
              setGtlf(exampleGltf.scene);
            }}
          />
        </Fullscreen>
      )}

      {error && <Error>{error}</Error>}

      <Leva
        hidden={!gltf}
        theme={{
          sizes: {
            controlWidth: '60px',
          },
        }}
      />
    </>
  );
};

export default () => (
  <RecastInit>
    <Suspense fallback={<FullscreenLoader />}>
      <App />
    </Suspense>
  </RecastInit>
);

useGLTF.preload(dungeonGltfUrl);
