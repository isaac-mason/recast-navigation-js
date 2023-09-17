import cityEnvironment from '@pmndrs/assets/hdri/city.exr';
import { Bounds, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Leva } from 'leva';
import { Suspense, useCallback, useRef, useState } from 'react';
import {
  NavMesh,
  SoloNavMeshGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
  exportNavMesh,
  generateSoloNavMesh,
  generateTiledNavMesh,
  init as initRecast,
} from 'recast-navigation';
import { getPositionsAndIndices } from 'recast-navigation/three';
import { suspend } from 'suspend-react';
import { Group, Mesh } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import dungeonGltfUrl from './assets/dungeon.gltf?url';
import {
  useActionsControls,
  useDisplayOptionsControls,
  useNavMeshConfigControls,
  useTestAgentControls,
} from './features/controls/controls';
import { ErrorBoundary } from './features/error-handling/error-boundary';
import { ErrorMessage } from './features/error-handling/error-message';
import { download } from './features/export/download';
import { navMeshToGLTF } from './features/export/nav-mesh-to-gltf';
import { HeightfieldHelper } from './features/helpers/heightfield-helper';
import { NavMeshGeneratorInputHelper } from './features/helpers/nav-mesh-generator-input-helper';
import { NavMeshHelper } from './features/helpers/nav-mesh-helper';
import { RecastAgent, RecastAgentRef } from './features/recast/recast-agent';
import { CenterLayout } from './features/ui/center-layout';
import { LoadingSpinner } from './features/ui/loading-spinner';
import { GltfDropZone } from './features/upload/gltf-drop-zone';
import { gltfLoader } from './features/upload/gltf-loader';
import { readFile } from './features/upload/read-file';
import { HtmlTunnel } from './tunnels';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const [model, setModel] = useState<Group>();

  const [indexedTriangleMesh, setIndexedTriangleMesh] = useState<{
    positions: Float32Array;
    indices: Uint32Array;
  }>();

  const [generatorIntermediates, setGeneratorIntermediates] = useState<
    SoloNavMeshGeneratorIntermediates | TiledNavMeshGeneratorIntermediates
  >();

  const [navMesh, setNavMesh] = useState<NavMesh>();

  const recastAgent = useRef<RecastAgentRef>(null!);

  const generateNavMesh = async () => {
    if (!model) return;

    if (navMesh) {
      navMesh.destroy();
    }

    setError(undefined);
    setLoading(true);
    setNavMesh(undefined);
    setIndexedTriangleMesh(undefined);

    try {
      const meshes: Mesh[] = [];

      model.traverse((child) => {
        if (child instanceof Mesh) {
          meshes.push(child);
        }
      });

      const [positions, indices] = getPositionsAndIndices(meshes);
      setIndexedTriangleMesh({ positions, indices });

      const result = navMeshConfig.tileSize
        ? generateTiledNavMesh(positions, indices, navMeshConfig, true)
        : generateSoloNavMesh(positions, indices, navMeshConfig, true);

      console.log('nav mesh generation result', result);

      if (!result.success) {
        setError(result.error);
      } else {
        setNavMesh(result.navMesh);
        setGeneratorIntermediates(result.intermediates);
      }
    } catch (e) {
      const message = (e as { message: string })?.message;
      setError(
        'Something went wrong generating the navmesh' + message
          ? ` - ${message}`
          : ''
      );
    } finally {
      setLoading(false);
    }
  };

  const onDropFile = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setError(undefined);
    setLoading(true);

    try {
      const { buffer } = await readFile(acceptedFiles[0]);

      const { scene } = await new Promise<GLTF>((resolve, reject) =>
        gltfLoader.parse(buffer, '', resolve, reject)
      );

      setModel(scene);
    } catch (e) {
      setError(
        'Something went wrong! Please ensure the file is a valid GLTF / GLB.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const exportAsGltf = useCallback(async () => {
    if (!navMesh) return;

    const gltfJson = await navMeshToGLTF(navMesh);

    download(JSON.stringify(gltfJson), 'application/json', 'navmesh.gltf');

    gtag({ event: 'export_as_gltf' });
  }, [navMesh]);

  const exportAsRecastNavMesh = useCallback(async () => {
    if (!navMesh) return;

    const navMeshExport = exportNavMesh(navMesh);

    download(navMeshExport, 'application/octet-stream', 'navmesh.bin');

    gtag({ event: 'export_as_recast_nav_mesh' });
  }, [navMesh]);

  const onNavMeshPointerDown = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!navMesh || !recastAgent.current) return;

      e.stopPropagation();

      if (e.button === 2) {
        recastAgent.current.teleport(e.point);
      } else {
        recastAgent.current.goto(e.point);
      }
    },
    [navMesh]
  );

  const selectExample = useCallback(async () => {
    if (model) return;

    setLoading(true);

    gltfLoader.load(
      dungeonGltfUrl,
      ({ scene }) => {
        setModel(scene);
        setLoading(false);
      },
      undefined,
      () => {
        setLoading(false);
        setError('Failed to load example model');
      }
    );
  }, []);

  /* controls */
  useActionsControls({
    navMesh,
    loading,
    generateNavMesh,
    exportAsGltf,
    exportAsRecastNavMesh,
  });

  const { navMeshConfig } = useNavMeshConfigControls();

  const {
    displayModel,
    heightfieldHelperEnabled,
    navMeshGeneratorInputDebugColor,
    displayNavMeshGenerationInput,
    navMeshGeneratorInputWireframe,
    navMeshGeneratorInputOpacity,
    navMeshHelperDebugColor,
    navMeshDebugOpacity,
    navMeshDebugWireframe,
    displayNavMeshHelper,
  } = useDisplayOptionsControls();

  const {
    agentEnabled,
    agentRadius,
    agentHeight,
    agentMaxAcceleration,
    agentMaxSpeed,
  } = useTestAgentControls();

  return (
    <>
      {model && (
        <group visible={displayModel}>
          <Bounds fit observe>
            <primitive object={model} />
          </Bounds>
        </group>
      )}

      <group onPointerDown={onNavMeshPointerDown}>
        <NavMeshHelper
          enabled={displayNavMeshHelper}
          navMesh={navMesh}
          navMeshHelperDebugColor={navMeshHelperDebugColor}
          navMeshDebugOpacity={navMeshDebugOpacity}
          navMeshDebugWireframe={navMeshDebugWireframe}
        />
      </group>

      <NavMeshGeneratorInputHelper
        enabled={displayNavMeshGenerationInput}
        indexedTriangleMesh={indexedTriangleMesh}
        navMeshGeneratorInputDebugColor={navMeshGeneratorInputDebugColor}
        navMeshGeneratorInputWireframe={navMeshGeneratorInputWireframe}
        navMeshGeneratorInputOpacity={navMeshGeneratorInputOpacity}
      />

      <HeightfieldHelper
        enabled={heightfieldHelperEnabled}
        navMesh={navMesh}
        generatorIntermediates={generatorIntermediates}
      />

      {/* Agent Tester */}
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

      <Environment files={cityEnvironment} />

      <OrbitControls makeDefault />

      <HtmlTunnel.In>
        {loading && <LoadingSpinner />}

        {!model && !loading && (
          <CenterLayout>
            <GltfDropZone onDrop={onDropFile} selectExample={selectExample} />
          </CenterLayout>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Leva
          hidden={!model}
          theme={{
            sizes: {
              rootWidth: '350px',
              controlWidth: '100px',
            },
          }}
        />
      </HtmlTunnel.In>
    </>
  );
};

export default () => {
  suspend(() => initRecast(), []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Canvas camera={{ position: [100, 100, 100] }}>
          <App />
        </Canvas>

        <HtmlTunnel.Out />
      </Suspense>
    </ErrorBoundary>
  );
};
