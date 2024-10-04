import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { NavMesh, importNavMesh, init } from 'recast-navigation';
import { DebugDrawer, getPositionsAndIndices } from '@recast-navigation/three';
import { suspend } from 'suspend-react';
import { Mesh } from 'three';
import NavMeshWorker from './navmesh-worker?worker';

const App = () => {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const debugDrawer = new DebugDrawer();

    const meshes: Mesh[] = [];

    scene.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const [positions, indices] = getPositionsAndIndices(meshes);

    const config = {
      cs: 0.05,
      ch: 0.2,
    };

    const worker = new NavMeshWorker();

    let navMesh: NavMesh | undefined;

    worker.onmessage = (event) => {
      const navMeshExport = event.data;

      const result = importNavMesh(navMeshExport);

      navMesh = result.navMesh;

      debugDrawer.clear();
      debugDrawer.drawNavMesh(navMesh);
    };

    worker.postMessage({ positions, indices, config }, [
      positions.buffer,
      indices.buffer,
    ]);

    scene.add(debugDrawer);

    return () => {
      worker.terminate();

      if (navMesh) {
        navMesh.destroy();
      }

      scene.remove(debugDrawer);
      debugDrawer.dispose();
    };
  }, []);

  return (
    <>
      {/* ground */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[5, 0.5, 5]} />
        <meshStandardMaterial color="#ccc" />
      </mesh>

      {/* obstacle */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </>
  );
};

const RecastInit = (props: { children: JSX.Element }) => {
  suspend(() => init(), []);

  return props.children;
};

export default () => (
  <RecastInit>
    <Canvas camera={{ position: [5, 5, 5] }}>
      <App />

      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, -5]} intensity={3} />

      <OrbitControls />
    </Canvas>
  </RecastInit>
);
