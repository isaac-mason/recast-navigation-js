import { button, useControls } from 'leva';
import { levaText } from './leva-text';
import { NavMesh } from 'recast-navigation';
import { useState } from 'react';

export const useActionsControls = ({
  navMesh,
  loading,
  generateNavMesh,
  exportAsGltf,
  exportAsRecastNavMesh,
}: {
  navMesh: NavMesh | undefined;
  loading: boolean;
  generateNavMesh: () => {};
  exportAsGltf: () => {};
  exportAsRecastNavMesh: () => {};
}) => {
  useControls(
    'Actions',
    {
      'Generate NavMesh': button(() => generateNavMesh(), {
        disabled: loading,
      }),
      'Export as GLTF': button(exportAsGltf, {
        disabled: !navMesh,
      }),
      'Export as Recast NavMesh': button(exportAsRecastNavMesh, {
        disabled: !navMesh,
      }),
    },
    [navMesh, generateNavMesh, loading]
  );
};

export const useNavMeshGenerationControls = () => {
  const { keepIntermediates, ...navMeshConfig } = useControls('NavMesh Generation Config', {
    cs: {
      label: 'Cell Size',
      value: 0.2,
    },
    ch: {
      label: 'Cell Height',
      value: 0.2,
    },
    tileSize: {
      label: 'Tile Size',
      value: 0,
      step: 1,
    },
    borderSize: {
      label: 'Border Size',
      value: 0,
    },
    walkableSlopeAngle: {
      label: 'Walkable Slope Angle',
      value: 60,
    },
    walkableHeight: {
      label: 'Walkable Height',
      value: 2,
    },
    walkableClimb: {
      label: 'Walkable Climb',
      value: 2,
    },
    walkableRadius: {
      label: 'Walkable Radius',
      value: 1,
    },
    maxEdgeLen: {
      label: 'Max Edge Length',
      value: 12,
    },
    maxSimplificationError: {
      label: 'Max Simplification Error',
      value: 1.3,
    },
    minRegionArea: {
      label: 'Min Region Area',
      value: 8,
    },
    mergeRegionArea: {
      label: 'Merge Region Area',
      value: 20,
    },
    maxVertsPerPoly: {
      label: 'Max Verts Per Poly',
      value: 6,
      step: 1,
    },
    detailSampleDist: {
      label: 'Detail Sample Dist',
      value: 6,
    },
    detailSampleMaxError: {
      label: 'Detail Sample Max Error',
      value: 1,
    },
    expectedLayersPerTile: {
      label: 'Expected Layers Per Tile',
      value: 4,
      step: 1,
    },
    maxLayers: {
      label: 'Max Layers',
      value: 32,
      step: 1,
    },
    keepIntermediates: {
      label: 'Keep Intermediates',
      value: true,
    },
  });

  useControls('NavMesh Generation Config.Tips', {
    _: levaText(
      '- Start by tweaking the cell size and cell height. Enable the "Show Heightfield" display option to visualise the voxel cells.' +
        '\n' +
        '- Set Tile Size to 0 to generate a solo nav mesh, and pick a value e.g. 32 to generate a tiled nav mesh' +
        '\n' +
        '- Uncheck "Keep Intermediates" if you are trying to generate a large nav mesh and are running out of memory.'
    ),
  });

  return { keepIntermediates, navMeshConfig };
};

export const useDisplayOptionsControls = () => {
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
    opacity: navMeshDebugOpacity,
    wireframe: navMeshDebugWireframe,
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
      _: levaText("Visualises Recast's voxelization process. Note that 'Keep Intermediates' must be checked."),
      heightfieldHelperEnabled: {
        value: false,
        label: 'Show Heightfield',
      },
    }
  );

  return {
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
  };
};

export const useTestAgentControls = () => {
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

  return {
    agentEnabled,
    agentRadius,
    agentHeight,
    agentMaxAcceleration,
    agentMaxSpeed,
  };
};
