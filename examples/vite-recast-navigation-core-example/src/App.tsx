import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { init, NavMesh } from 'recast-navigation';
import { BoxGeometry, BufferAttribute, Mesh, Vector3 } from 'three';

const App = () => {
  useEffect(() => {
    init().then(() => {
      const navMeshParameters = {
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
      };

      const navMesh = new NavMesh();

      const groundMesh = new Mesh(new BoxGeometry(5, 0.1, 5));

      const positions = (
        groundMesh.geometry.getAttribute('position') as BufferAttribute
      ).array;
      const indices = groundMesh.geometry.getIndex()!.array;

      console.log(positions);

      navMesh.build(
        positions as number[],
        indices as number[],
        navMeshParameters
      );

      console.log(navMesh.getClosestPoint(new Vector3(2, 1, 2)));
    });
  }, []);

  return null;
};

export default () => (
  <Canvas camera={{ position: [5, 5, 5] }}>
    <App />

    <Environment preset="city" />

    <OrbitControls />
  </Canvas>
);
