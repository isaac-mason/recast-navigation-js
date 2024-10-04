import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { init } from 'recast-navigation';
import { NavMeshHelper, threeToSoloNavMesh } from '@recast-navigation/three';
import { suspend } from 'suspend-react';
import { Mesh } from 'three';
import './styles.css';

const NavMesh = ({ children }) => {
  const group = useRef();
  const [navMesh, setNavMesh] = useState();

  const navMeshHelper = useMemo(() => {
    if (!navMesh) return null;

    return new NavMeshHelper({ navMesh });
  }, [navMesh]);

  useEffect(() => {
    const meshes = [];

    group.current.traverse((object) => {
      if (object instanceof Mesh) {
        meshes.push(object);
      }
    });

    const { success, navMesh } = threeToSoloNavMesh(meshes);

    if (!success) return;

    setNavMesh(navMesh);

    return () => {
      setNavMesh(undefined);
      navMesh.destroy();
    };
  }, []);

  return (
    <group>
      <group ref={group}>{children}</group>

      {navMeshHelper && <primitive object={navMeshHelper} />}
    </group>
  );
};

function App() {
  suspend(() => init(), []);

  return (
    <Canvas camera={{ position: [10, 10, 10] }}>
      <NavMesh>
        <mesh>
          <boxGeometry args={[10, 0.2, 10]} />
          <meshBasicMaterial color="#333" />
        </mesh>
      </NavMesh>

      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />

      <OrbitControls />
    </Canvas>
  );
}

createRoot(document.getElementById('root')).render(<App />);
