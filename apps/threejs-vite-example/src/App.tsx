import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { createRecastNavigation, Recast } from "@recast-navigation/three";
import { useEffect } from "react";
import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector2,
  Vector3
} from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";

const recastNavigation = await createRecastNavigation();

const App = () => {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const recast = new Recast(recastNavigation);

    const ground = new Mesh(
      new BoxGeometry(5, 0.5, 5),
      new MeshStandardMaterial()
    );
    const obstacle = new Mesh(
      new BoxGeometry(1, 1, 1),
      new MeshStandardMaterial()
    );
    obstacle.position.y = 0.5;

    scene.add(ground);
    scene.add(obstacle);

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

    recast.createNavMesh([ground, obstacle], navMeshParameters);

    const debugNavMesh = recast.createDebugNavMesh();

    debugNavMesh.material = new MeshBasicMaterial({
      color: "red",
      wireframe: true,
    });

    scene.add(debugNavMesh);

    const path = recast.computePath(
      recast.getClosestPoint(new Vector3(2, 1, 2)),
      recast.getClosestPoint(new Vector3(-2, 1, -2))
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
