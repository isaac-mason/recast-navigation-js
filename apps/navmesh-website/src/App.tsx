import { Environment, Html, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Leva, useControls } from 'leva';
import { useState } from 'react';
import { Group } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { DropZone } from './components/drop-zone';
import { Loader } from './components/loader';
import { gltfLoader } from './utils/gltf-loader';
import { readFile } from './utils/read-file';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [scene, setScene] = useState<Group | null>(null);

  const {
    borderSize,
    tileSize,
    cs,
    ch,
    walkableSlopeAngle,
    walkableHeight,
    walkableClimb,
    walkableRadius,
    maxEdgeLen,
    maxSimplificationError,
    minRegionArea,
    mergeRegionArea,
    maxVertsPerPoly,
    detailSampleDist,
    detailSampleMaxError,
  } = useControls('NavMesh Configuration', {
    borderSize: 0,
    tileSize: 0,
    cs: 0.2,
    ch: 0.2,
    walkableSlopeAngle: 35,
    walkableHeight: 1,
    walkableClimb: 1,
    walkableRadius: 1,
    maxEdgeLen: 12,
    maxSimplificationError: 1.3,
    minRegionArea: 8,
    mergeRegionArea: 20,
    maxVertsPerPoly: 6,
    detailSampleDist: 6,
    detailSampleMaxError: 1,
  });

  const selectExample = () => {};

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const { buffer } = await readFile(acceptedFiles[0]);

      const gltf: GLTF = await new Promise((resolve, reject) =>
        gltfLoader.parse(buffer, '', resolve, reject)
      );

      setScene(gltf.scene);
    } catch (e) {}

    setLoading(false);
  };

  let content: React.ReactNode;
  
  if (scene) {
    content = (
      <>
        <primitive object={scene} />

        <Environment preset="city" />

        <OrbitControls />
      </>
    );
  } else {
    content = (
      <Html fullscreen>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          width: '100%',
          height: '100vh',
        }}>
        {loading ? <Loader /> : <DropZone onDrop={onDrop} selectExample={selectExample} />}
          
        </div>
      </Html>
    )
  }

  return (
    <>
      <Canvas
        camera={{
          position: [0, 0, 10],
        }}
      >
        {content}
      </Canvas>

      <Leva
        hidden={!scene}
        collapsed={true}
        theme={{
          sizes: {
            controlWidth: '60px',
          },
        }}
      />
    </>
  );
};

export default () => {
  return (
    <>
      <App />
    </>
  );
};
