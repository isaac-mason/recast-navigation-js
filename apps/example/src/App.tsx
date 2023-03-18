import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { createRecastNavigation, Recast } from "@three-recast/core";
import { useEffect } from "react";
import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";

const recastNavigation = await createRecastNavigation();

const App = () => {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const recast = new Recast(recastNavigation);

    const mesh = new Mesh(new BoxGeometry(10, 1, 10), new MeshBasicMaterial());

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

    recast.createNavMesh([mesh], navMeshParameters);

    const debugNavMesh = recast.createDebugNavMesh();
    scene.add(debugNavMesh);

    console.log(debugNavMesh)

    console.log(recast)
  }, []);

  return null;
};

export default () => (
  <>
    <Canvas camera={{ position: [5, 5, 5] }}>
      <App />

      <OrbitControls />
    </Canvas>
    <h1>hello</h1>
  </>
);
