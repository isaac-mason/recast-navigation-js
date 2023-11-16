import { useControls } from 'leva';
import { RecastConfigType } from 'recast-navigation';

export const useNavMeshConfig = (
  prefix?: string,
  defaults?: Partial<RecastConfigType>
): Partial<RecastConfigType> =>
  useControls(`${prefix ? prefix + '-' : ''}config`, {
    borderSize: {
      value: defaults?.borderSize ?? 0,
      label: 'Border Size',
    },
    tileSize: {
      value: defaults?.tileSize ?? 0,
      label: 'Tile Size',
    },
    cs: {
      value: defaults?.cs ?? 0.2,
      label: 'Cell Size',
    },
    ch: {
      value: defaults?.ch ?? 0.2,
      label: 'Cell Height',
    },
    walkableSlopeAngle: {
      value: defaults?.walkableSlopeAngle ?? 60,
      label: 'Walkable Slope Angle',
    },
    walkableHeight: {
      value: defaults?.walkableHeight ?? 2,
      label: 'Walkable Height',
    },
    walkableClimb: {
      value: defaults?.walkableClimb ?? 2,
      label: 'Walkable Climb',
    },
    walkableRadius: {
      value: defaults?.walkableRadius ?? 0.2,
      label: 'Walkable Radius',
    },
    maxEdgeLen: {
      value: defaults?.maxEdgeLen ?? 12,
      label: 'Max Edge Length',
    },
    maxSimplificationError: {
      value: defaults?.maxSimplificationError ?? 1.3,
      label: 'Max Simplification Error',
    },
    minRegionArea: {
      value: defaults?.minRegionArea ?? 8,
      label: 'Min Region Area',
    },
    mergeRegionArea: {
      value: defaults?.mergeRegionArea ?? 20,
      label: 'Merge Region Area',
    },
    maxVertsPerPoly: {
      value: defaults?.maxVertsPerPoly ?? 6,
      label: 'Max Verts Per Poly',
    },
    detailSampleDist: {
      value: defaults?.detailSampleDist ?? 6,
      label: 'Detail Sample Dist',
    },
    detailSampleMaxError: {
      value: defaults?.detailSampleMaxError ?? 1,
      label: 'Detail Sample Max Error',
    },
  });
