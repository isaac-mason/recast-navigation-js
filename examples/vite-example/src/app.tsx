import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { NavMeshQuery, init } from 'recast-navigation';
import { NavMeshHelper, threeToSoloNavMesh } from 'recast-navigation/three';
import { suspend } from 'suspend-react';
import { Color, Group, Mesh, MeshBasicMaterial, Vector2, Vector3 } from 'three';
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib';

const App = () => {
  const scene = useThree((state) => state.scene);

  const groupRef = useRef<Group>(null!);

  useEffect(() => {
    const meshes: Mesh[] = [];

    groupRef.current.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
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

    if (!success) return

    const navMeshQuery = new NavMeshQuery({ navMesh });

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: new MeshBasicMaterial({
        color: 'red',
        wireframe: true,
      }),
    });

    scene.add(navMeshHelper);

    const { path } = navMeshQuery.computePath(
      navMeshQuery.getClosestPoint(new Vector3(2, 1, 2)),
      navMeshQuery.getClosestPoint(new Vector3(-2, 1, -2))
    );
    console.log(path);

    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(path.flatMap((p) => [p.x, p.y, p.z]));
    lineGeometry.setColors(
      path.flatMap((_, idx) => {
        const color = new Color();
        color.setHSL(idx / path.length, 1, 0.5);
        return [color.r, color.g, color.b];
      })
    );

    const line = new Line2(
      lineGeometry,
      new LineMaterial({
        linewidth: 5, // in pixels
        vertexColors: true,
        resolution: new Vector2(window.innerWidth, window.innerHeight),
        dashed: true,
      })
    );

    scene.add(line);

    return () => {
      scene.remove(navMeshHelper);
      scene.remove(line);
    };
  }, []);

  return (
    <>
      <group ref={groupRef}>
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
      </group>
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

      <Environment preset="city" />

      <OrbitControls />
    </Canvas>
  </RecastInit>
);
