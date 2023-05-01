import { useControls } from 'leva';
import { NavMeshConfig } from 'recast-navigation';

export const useNavMeshConfig = (prefix?: string): Partial<NavMeshConfig> =>
  useControls(`${prefix ? prefix + '-' : ''}config`, {
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
      value: 0.2,
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
  });
