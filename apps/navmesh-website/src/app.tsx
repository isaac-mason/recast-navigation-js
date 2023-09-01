import cityEnvironment from '@pmndrs/assets/hdri/city.exr';
import { Bounds, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Leva, button, useControls } from 'leva';
import { Suspense, useMemo, useRef, useState } from 'react';
import {
  NavMesh,
  RecastHeightfield,
  SoloNavMeshGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
  generateSoloNavMesh,
  generateTiledNavMesh,
} from 'recast-navigation';
import {
  HeightfieldHelper,
  NavMeshHelper,
  getPositionsAndIndices,
} from 'recast-navigation/three';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import dungeonGltfUrl from './assets/dungeon.gltf?url';
import { downloadText } from './features/download/download-text';
import { navMeshToGLTF } from './features/download/nav-mesh-to-gltf';
import { levaText } from './features/editor/leva-text';
import { ErrorBoundary } from './features/error-handling/error-boundary';
import { ErrorMessage } from './features/error-handling/error-message';
import { RecastAgent, RecastAgentRef } from './features/recast/recast-agent';
import { RecastInit } from './features/recast/recast-init';
import { CenterLayout } from './features/ui/center-layout';
import { LoadingSpinner } from './features/ui/loading-spinner';
import { GltfDropZone } from './features/upload/gltf-drop-zone';
import { gltfLoader } from './features/upload/gltf-loader';
import { readFile } from './features/upload/read-file';
import { HtmlTunnel } from './tunnels';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [gltf, setGtlf] = useState<Group>();
  const [indexedTriangleMesh, setIndexedTriangleMesh] = useState<{
    positions: Float32Array;
    indices: Uint32Array;
  }>();

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [intermediates, setIntermediates] = useState<
    SoloNavMeshGeneratorIntermediates | TiledNavMeshGeneratorIntermediates
  >();

  const recastAgent = useRef<RecastAgentRef>(null!);

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

    if (navMesh) {
      navMesh.destroy();
    }

    setError(undefined);
    setLoading(true);
    setNavMesh(undefined);
    setIndexedTriangleMesh(undefined);

    try {
      const meshes: Mesh[] = [];

      gltf.traverse((child) => {
        if (child instanceof Mesh) {
          meshes.push(child);
        }
      });

      const [positions, indices] = getPositionsAndIndices(meshes);
      setIndexedTriangleMesh({ positions, indices });

      try {
        const result = navMeshConfig.tileSize
          ? generateTiledNavMesh(positions, indices, navMeshConfig, true)
          : generateSoloNavMesh(positions, indices, navMeshConfig, true);

        console.log('nav mesh generation result', result);

        if (!result.success) {
          setError(result.error);
        } else {
          setNavMesh(result.navMesh);
          setIntermediates(result.intermediates);
        }
      } catch (e) {
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

  const selectExample = async () => {
    setLoading(true);

    gltfLoader.load(
      dungeonGltfUrl,
      ({ scene }) => {
        setGtlf(scene);
        setLoading(false);
      },
      undefined,
      () => {
        setLoading(false);
        setError('Failed to load example model');
      }
    );
  };

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

  const navMeshConfig = useControls('NavMesh Generation Config', {
    cs: {
      value: 0.2,
      label: 'Cell Size',
    },
    ch: {
      value: 0.2,
      label: 'Cell Height',
    },
    tileSize: {
      value: 0,
      label: 'Tile Size',
    },
    borderSize: {
      value: 0,
      label: 'Border Size',
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

  useControls('NavMesh Generation Config.Tips', {
    _: levaText(
      '- Start by tweaking the cell size and cell height. Enable the "Show Heightfield" display option to visualise the voxel cells.' +
        '\n' +
        '- Set Tile Size to 0 to generate a solo nav mesh, and pick a value e.g. 32 to generate a tiled nav mesh'
    ),
  });

  const { displayModel } = useControls('Display Options.Model', {
    displayModel: {
      label: 'Show Model',
      value: true,
    },
  });

  const [navMeshGeneratorInputDebugColor, setNavMeshGeneratorInputDebugColor] =
    useState('#ff69b4');

  const {
    displayNavMeshGenerationInput,
    navMeshGeneratorInputWireframe,
    navMeshGeneratorInputOpacity,
  } = useControls('Display Options.NavMesh Generator Input', {
    _: levaText(
      'The indexed indexed triangle mesh that will be used for NavMesh generation.'
    ),
    displayNavMeshGenerationInput: {
      label: 'Show Input',
      value: false,
    },
    color: {
      label: 'Color',
      value: navMeshGeneratorInputDebugColor,
      onEditEnd: setNavMeshGeneratorInputDebugColor,
    },
    navMeshGeneratorInputOpacity: {
      label: 'Opacity',
      value: 0.65,
      min: 0,
      max: 1,
    },
    navMeshGeneratorInputWireframe: {
      label: 'Wireframe',
      value: false,
    },
  });

  const [navMeshHelperDebugColor, setNavMeshHelperDebugColor] =
    useState('#ffa500');

  const {
    wireframe: navMeshDebugWireframe,
    opacity: navMeshDebugOpacity,
    displayNavMeshHelper,
  } = useControls('Display Options.NavMesh', {
    _: levaText('The computed navigation mesh.'),
    displayNavMeshHelper: {
      label: 'Show NavMesh',
      value: true,
    },
    color: {
      label: 'Color',
      value: navMeshHelperDebugColor,
      onEditEnd: setNavMeshHelperDebugColor,
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

  const { heightfieldHelperEnabled } = useControls(
    'Display Options.Heightfield',
    {
      _: levaText("Visualises Recast's voxelization process."),
      heightfieldHelperEnabled: {
        value: false,
        label: 'Show Heightfield',
      },
    }
  );

  const {
    agentEnabled,
    agentRadius,
    agentHeight,
    agentMaxAcceleration,
    agentMaxSpeed,
  } = useControls('Test Agent', {
    _: levaText(
      'Creates a Detour Crowd with a single agent for you to test your NavMesh with.\nLeft click to set a target, right click to teleport.'
    ),
    agentEnabled: {
      label: 'Enabled',
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
  });

  const navMeshHelper = useMemo(() => {
    if (!navMesh) {
      return undefined;
    }

    const navMeshHelper = new NavMeshHelper({
      navMesh,
      navMeshMaterial: new MeshBasicMaterial({
        transparent: true,
        color: Number(navMeshHelperDebugColor.replace('#', '0x')),
        wireframe: navMeshDebugWireframe,
        opacity: navMeshDebugOpacity,
      }),
    });

    return navMeshHelper;
  }, [
    navMesh,
    navMeshHelperDebugColor,
    navMeshDebugWireframe,
    navMeshDebugOpacity,
  ]);

  const navMeshGeneratorInputHelper = useMemo(() => {
    if (!indexedTriangleMesh) return undefined;

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      'position',
      new BufferAttribute(indexedTriangleMesh.positions, 3)
    );
    geometry.setIndex(new BufferAttribute(indexedTriangleMesh.indices, 1));

    const mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({
        transparent: true,
        color: Number(navMeshGeneratorInputDebugColor.replace('#', '0x')),
        wireframe: navMeshGeneratorInputWireframe,
        opacity: navMeshGeneratorInputOpacity,
      })
    );

    return mesh;
  }, [
    indexedTriangleMesh,
    navMeshGeneratorInputDebugColor,
    navMeshGeneratorInputWireframe,
    navMeshGeneratorInputOpacity,
  ]);

  const heightfieldHelper = useMemo(() => {
    if (!navMesh || !heightfieldHelperEnabled) {
      return undefined;
    }

    let heightfields: RecastHeightfield[] = [];

    if (intermediates) {
      if (intermediates.type === 'solo' && intermediates.heightfield) {
        heightfields = [intermediates.heightfield].filter(Boolean);
      } else if (intermediates.type === 'tiled') {
        heightfields = intermediates.tileIntermediates
          .map((t) => t.heightfield)
          .filter(Boolean);
      }
    }

    if (heightfields.length <= 0) {
      return undefined;
    }

    const heightfieldHelper = new HeightfieldHelper({
      heightfields,
      material: new MeshStandardMaterial(),
      highlightWalkable: true,
    });

    return heightfieldHelper;
  }, [navMesh, heightfieldHelperEnabled]);

  return (
    <>
      {gltf && (
        <group visible={displayModel}>
          <Bounds fit observe>
            <primitive object={gltf} />
          </Bounds>
        </group>
      )}

      {/* NavMesh Helper */}
      {displayNavMeshHelper && navMeshHelper && (
        <group onPointerDown={onNavMeshPointerDown}>
          <primitive object={navMeshHelper} />
        </group>
      )}

      {/* NavMesh Generation Input Helper */}
      {displayNavMeshGenerationInput && navMeshGeneratorInputHelper && (
        <primitive object={navMeshGeneratorInputHelper} />
      )}

      {/* Heightfield Helper */}
      {heightfieldHelperEnabled && heightfieldHelper && (
        <primitive object={heightfieldHelper} />
      )}

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
        {loading && (
          <CenterLayout>
            <LoadingSpinner />
          </CenterLayout>
        )}

        {!gltf && !loading && (
          <CenterLayout>
            <GltfDropZone onDrop={onDropFile} selectExample={selectExample} />
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
      </HtmlTunnel.In>
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
        <Canvas camera={{ position: [100, 100, 100] }}>
          <App />
        </Canvas>

        <HtmlTunnel.Out />
      </Suspense>
    </RecastInit>
  </ErrorBoundary>
);
