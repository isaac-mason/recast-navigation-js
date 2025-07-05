import cityEnvironment from '@pmndrs/assets/hdri/city.exr';
import { Bounds, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Leva } from 'leva';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { exportNavMesh, init as initRecast } from 'recast-navigation';
import {
  generateSoloNavMesh,
  generateTiledNavMesh,
} from 'recast-navigation/generators';
import { getPositionsAndIndices } from '@recast-navigation/three';
import { Mesh } from 'three';
import { RouterPaths } from '../app';
import {
  useActionsControls,
  useDisplayOptionsControls,
  useNavMeshGenerationControls,
  useTestAgentControls,
} from '../features/controls';
import { download } from '../features/download';
import { ErrorBoundary, ErrorMessage } from '../features/error-handling';
import {
  NavMeshGeneratorInputHelper,
  NavMeshDebugDrawer,
  RecastAgent,
  RecastAgentRef,
  navMeshToGLTF,
} from '../features/recast';
import { LoadingSpinner } from '../features/ui';
import { useEditorState } from '../state/editor-state';
import { HtmlTunnel } from '../tunnels';

await initRecast()

const Editor = () => {
  const navigate = useNavigate();

  const {
    loading,
    error,
    model,
    indexedTriangleMesh,
    generatorIntermediates,
    navMesh,
    setEditorState,
  } = useEditorState();

  useEffect(() => {
    if (!model) {
      navigate(RouterPaths.upload);
    }
  }, [model]);

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

      gtag('event', 'generate_nav_mesh', {
        success: result.success,
        ...navMeshConfig,
      });

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

      gtag('event', 'generate_nav_mesh_error');
    } finally {
      setEditorState({
        loading: false,
      });
    }
  };

  const exportAsGltf = useCallback(async () => {
    if (!navMesh) return;

    const gltfJson = await navMeshToGLTF(navMesh, false);

    download(JSON.stringify(gltfJson), 'application/json', 'navmesh.gltf');

    gtag('event', 'export_as_gltf', {
      ...navMeshConfig,
    });
  }, [navMesh]);

  const exportAsGlb = useCallback(async () => {
    if (!navMesh) return;

    const gltfJson = await navMeshToGLTF(navMesh, true);

    download(JSON.stringify(gltfJson), 'application/json', 'navmesh.glb');

    gtag('event', 'export_as_gltf', {
      ...navMeshConfig,
    });
  }, [navMesh]);

  const exportAsRecastNavMesh = useCallback(async () => {
    if (!navMesh) return;

    const navMeshExport = exportNavMesh(navMesh);

    download(navMeshExport, 'application/octet-stream', 'navmesh.bin');

    gtag('event', 'export_as_recast_nav_mesh', {
      ...navMeshConfig,
    });
  }, [navMesh]);

  const onNavMeshPointerDown = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!navMesh || !recastAgent.current) return;

      e.stopPropagation();

      if (e.button === 2) {
        recastAgent.current.teleport(e.point);
      } else {
        recastAgent.current.requestMoveTarget(e.point);
      }
    },
    [navMesh]
  );

  /* controls */
  useActionsControls({
    navMesh,
    loading,
    generateNavMesh,
    exportAsGltf,
    exportAsGlb,
    exportAsRecastNavMesh,
  });

  const { keepIntermediates, navMeshConfig } = useNavMeshGenerationControls();

  const {
    displayModel,
    navMeshGeneratorInputDebugColor,
    displayNavMeshGenerationInput,
    navMeshGeneratorInputWireframe,
    navMeshGeneratorInputOpacity,
    navMeshDebugDraw,
    navMeshDebugDrawOption,
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
        <NavMeshDebugDrawer
          enabled={navMeshDebugDraw}
          navMesh={navMesh}
          intermediates={generatorIntermediates}
          option={navMeshDebugDrawOption}
        />
      </group>

      <NavMeshGeneratorInputHelper
        enabled={displayNavMeshGenerationInput}
        indexedTriangleMesh={indexedTriangleMesh}
        navMeshGeneratorInputDebugColor={navMeshGeneratorInputDebugColor}
        navMeshGeneratorInputWireframe={navMeshGeneratorInputWireframe}
        navMeshGeneratorInputOpacity={navMeshGeneratorInputOpacity}
      />

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


      <HtmlTunnel.In>
        {loading && <LoadingSpinner />}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Leva
          hidden={!model}
          theme={{
            sizes: {
              rootWidth: '400px',
              controlWidth: '150px',
            },
          }}
        />
      </HtmlTunnel.In>
    </>
  );
};

export const EditorPage = () => {
  return (
    <ErrorBoundary>
      <Canvas
        camera={{ position: [100, 100, 100] }}
      >
        <Editor />
        <Environment files={cityEnvironment} />
        <OrbitControls makeDefault />
      </Canvas>

      <HtmlTunnel.Out />
    </ErrorBoundary>
  );
};
