import cityEnvironment from '@pmndrs/assets/hdri/city.exr';
import { Bounds, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Leva } from 'leva';
import { Suspense, useCallback, useRef } from 'react';
import { NavMesh, exportNavMesh, init as initRecast } from 'recast-navigation';
import {
  SoloNavMeshGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
  generateSoloNavMesh,
  generateTiledNavMesh,
} from 'recast-navigation/generators';
import { getPositionsAndIndices } from 'recast-navigation/three';
import { suspend } from 'suspend-react';
import { Group, Mesh } from 'three';
import { create } from 'zustand';
import dungeonGltfUrl from './assets/dungeon.gltf?url';
import {
  useActionsControls,
  useDisplayOptionsControls,
  useNavMeshGenerationControls,
  useTestAgentControls,
} from './features/controls';
import { ErrorBoundary, ErrorMessage } from './features/error-handling';
import { download, navMeshToGLTF } from './features/export';
import {
  HeightfieldHelper,
  NavMeshGeneratorInputHelper,
  NavMeshHelper,
} from './features/helpers';
import { RecastAgent, RecastAgentRef } from './features/recast/recast-agent';
import { Centered, LoadingSpinner } from './features/ui';
import {
  ModelDropZone,
  gltfLoader,
  loadModel,
  readFile,
} from './features/upload';
import { HtmlTunnel } from './tunnels';

type EditorState = {
  loading: boolean;
  error?: string;

  model?: Group;

  indexedTriangleMesh?: {
    positions: Float32Array;
    indices: Uint32Array;
  };

  generatorIntermediates?:
    | SoloNavMeshGeneratorIntermediates
    | TiledNavMeshGeneratorIntermediates;

  navMesh?: NavMesh;
};

const useEditorState = create<
  EditorState & { setEditorState: (partial: Partial<EditorState>) => void }
>((set) => ({
  loading: false,
  error: undefined,
  model: undefined,
  indexedTriangleMesh: undefined,
  generatorIntermediates: undefined,
  navMesh: undefined,
  setEditorState: (partial) => set(partial),
}));

const App = () => {
  const {
    loading,
    error,
    model,
    indexedTriangleMesh,
    generatorIntermediates,
    navMesh,
    setEditorState,
  } = useEditorState();

  const recastAgent = useRef<RecastAgentRef>(null!);

  const generateNavMesh = async () => {
    if (!model) return;

    if (navMesh) {
      navMesh.destroy();
    }

    setEditorState({
      loading: true,
      error: undefined,
      navMesh: undefined,
      generatorIntermediates: undefined,
    });

    try {
      const meshes: Mesh[] = [];

      model.traverse((child) => {
        if (child instanceof Mesh) {
          meshes.push(child);
        }
      });

      const [positions, indices] = getPositionsAndIndices(meshes);
      setEditorState({
        indexedTriangleMesh: { positions, indices },
      });

      const result = navMeshConfig.tileSize
        ? generateTiledNavMesh(
            positions,
            indices,
            navMeshConfig,
            keepIntermediates
          )
        : generateSoloNavMesh(
            positions,
            indices,
            navMeshConfig,
            keepIntermediates
          );

      console.log('nav mesh generation result', result);

      if (!result.success) {
        setEditorState({
          error: result.error,
          generatorIntermediates: result.intermediates,
        });
      } else {
        setEditorState({
          navMesh: result.navMesh,
          generatorIntermediates: result.intermediates,
        });
      }
    } catch (e) {
      const message = (e as { message: string })?.message;
      setEditorState({
        error:
          'Something went wrong generating the navmesh' +
          (message ? ` - ${message}` : ''),
      });
    } finally {
      setEditorState({
        loading: false,
      });
    }
  };

  const onDropFile = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setEditorState({
      error: undefined,
      loading: true,
    });

    try {
      const modelFile = acceptedFiles[0];
      const { buffer } = await readFile(modelFile);

      const model = await loadModel(buffer, modelFile);
      console.log('loaded model', model);

      setEditorState({
        model,
      });
    } catch (e) {
      const message = (e as { message: string })?.message;

      setEditorState({
        error:
          `Something went wrong! Please ensure the file is a valid GLTF, GLB, FBX or OBJ` +
          (message ? ` - ${message}` : ''),
      });
    } finally {
      setEditorState({
        loading: false,
      });
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

    setEditorState({
      loading: true,
    });

    gltfLoader.load(
      dungeonGltfUrl,
      ({ scene }) => {
        setEditorState({ model: scene, loading: false });
      },
      undefined,
      () => {
        setEditorState({
          loading: false,
          error: 'Failed to load example model',
        });
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

  const { keepIntermediates, navMeshConfig } = useNavMeshGenerationControls();

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
      <group onPointerDown={onNavMeshPointerDown}>
        {model && (
          <group visible={displayModel}>
            <Bounds fit observe>
              <primitive object={model} />
            </Bounds>
          </group>
        )}
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
          <Centered>
            <ModelDropZone onDrop={onDropFile} selectExample={selectExample} />
          </Centered>
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
