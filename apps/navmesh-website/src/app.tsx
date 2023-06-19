import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Leva, button, useControls } from 'leva';
import { Suspense, useEffect, useRef, useState } from 'react';
import { NavMesh } from 'recast-navigation';
import { NavMeshHelper, threeToNavMesh } from 'recast-navigation/three';
import { Group, Mesh, MeshBasicMaterial } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import dungeonGltfUrl from './assets/dungeon.gltf?url';
import { downloadText } from './features/download/download-text';
import { navMeshToGLTF } from './features/download/nav-mesh-to-gltf';
import { levaText } from './features/editor/leva-text';
import { Viewer } from './features/editor/viewer';
import { ErrorBoundary } from './features/error-handling/error-boundary';
import { ErrorMessage } from './features/error-handling/error-message';
import { RecastAgent, RecastAgentRef } from './features/recast/recast-agent';
import { RecastInit } from './features/recast/recast-init';
import { CenterLayout } from './features/ui/center-layout';
import { LoadingSpinner } from './features/ui/loading-spinner';
import { GltfDropZone } from './features/upload/gltf-drop-zone';
import { gltfLoader } from './features/upload/gltf-loader';
import { readFile } from './features/upload/read-file';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [gltf, setGtlf] = useState<Group>();

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [debugNavMesh, setDebugNavMesh] = useState<Mesh>();
  const [navMeshDebugColor, setNavMeshDebugColor] = useState('#ffa500');

  const recastAgent = useRef<RecastAgentRef>(null!);

  const exampleGltf = useGLTF(dungeonGltfUrl);

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

      console.log(scene);

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

      const { success, navMesh } = threeToNavMesh(meshes, navMeshConfig);

      if (success) {
        setNavMesh(navMesh);
      } else {
        setError('Something went wrong generating the navmesh');
      }
    } catch (e) {
      setError(
        'Something went wrong generating the navmesh - ' +
          (e as { message: string }).message
      );
    } finally {
      setLoading(false);
    }
  };

  const exportAsGLTF = async () => {
    if (!navMesh) return;

    const gltfJson = await navMeshToGLTF(navMesh);

    downloadText(JSON.stringify(gltfJson), 'application/json', 'navmesh.gltf');

    gtag({ event: 'export_as_gltf' });
  };

  const onNavMeshPointerDown = (e: ThreeEvent<MouseEvent>) => {
    if (!navMesh || !recastAgent.current) return;

    e.stopPropagation();

    if (e.button === 2) {
      recastAgent.current.teleport(e.point);
    } else {
      recastAgent.current.goto(e.point);
    }
  };

  const navMeshConfig = useControls('NavMesh Generation Config', {
    borderSize: {
      value: 0,
      label: 'Border Size',
    },
    tileSize: {
      value: 0,
      label: 'Tile Size',
    },
    cs: {
      value: 0.2,
      label: 'Cell Size',
    },
    ch: {
      value: 0.2,
      label: 'Cell Height',
    },
    walkableSlopeAngle: {
      value: 60,
      label: 'Walkable Slope Angle',
    },
    walkableHeight: {
      value: 2,
      label: 'Walkable Height',
    },
    walkableClimb: {
      value: 2,
      label: 'Walkable Climb',
    },
    walkableRadius: {
      value: 1,
      label: 'Walkable Radius',
    },
    maxEdgeLen: {
      value: 12,
      label: 'Max Edge Length',
    },
    maxSimplificationError: {
      value: 1.3,
      label: 'Max Simplification Error',
    },
    minRegionArea: {
      value: 8,
      label: 'Min Region Area',
    },
    mergeRegionArea: {
      value: 20,
      label: 'Merge Region Area',
    },
    maxVertsPerPoly: {
      value: 6,
      label: 'Max Verts Per Poly',
    },
    detailSampleDist: {
      value: 6,
      label: 'Detail Sample Dist',
    },
    detailSampleMaxError: {
      value: 1,
      label: 'Detail Sample Max Error',
    },
    expectedLayersPerTile: {
      value: 4,
      label: 'Expected Layers Per Tile',
    },
    maxLayers: {
      value: 32,
      label: 'Max Layers',
    },
  });

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

  const {
    agentEnabled,
    agentRadius,
    agentHeight,
    agentMaxAcceleration,
    agentMaxSpeed,
  } = useControls(
    'Test Agent',
    {
      agentEnabled: {
        label: 'Agent Enabled',
        value: false,
      },
      agentRadius: {
        label: 'Agent Radius',
        value: 0.5,
        step: 0.1,
      },
      agentHeight: {
        label: 'Agent Height',
        value: 2,
        step: 0.1,
      },
      agentMaxAcceleration: {
        label: 'Agent Max Acceleration',
        value: 20,
        step: 0.1,
      },
      agentMaxSpeed: {
        label: 'Agent Max Speed',
        value: 6,
        step: 0.1,
      },
      text: levaText('Left click to set a target, right click to teleport.'),
    },
    {
      collapsed: true,
    }
  );

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

  return (
    <>
      <Canvas>
        {gltf && <Viewer group={gltf} />}

        <group onPointerDown={onNavMeshPointerDown}>
          {debugNavMesh && <primitive object={debugNavMesh} />}
        </group>

        {navMesh && agentEnabled && (
          <RecastAgent
            ref={recastAgent}
            navMesh={navMesh}
            agentHeight={agentHeight}
            agentRadius={agentRadius}
            agentMaxAcceleration={agentMaxAcceleration}
            agentMaxSpeed={agentMaxSpeed}
          />
        )}

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
          <GltfDropZone
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
  <ErrorBoundary>
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
  </ErrorBoundary>
);
