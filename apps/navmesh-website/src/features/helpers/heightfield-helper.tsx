import { useMemo } from 'react';
import {
  NavMesh,
  RecastHeightfield,
  SoloNavMeshGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
} from 'recast-navigation';
import { HeightfieldHelper as HeightfieldHelperImpl } from 'recast-navigation/three';
import { MeshStandardMaterial } from 'three';

export const HeightfieldHelper = ({
  enabled,
  navMesh,
  generatorIntermediates,
}: {
  enabled: boolean;
  generatorIntermediates?:
    | SoloNavMeshGeneratorIntermediates
    | TiledNavMeshGeneratorIntermediates;
  navMesh?: NavMesh;
}) => {
  const helper = useMemo(() => {
    if (!navMesh || !enabled) {
      return undefined;
    }

    let heightfields: RecastHeightfield[] = [];

    if (generatorIntermediates) {
      if (
        generatorIntermediates.type === 'solo' &&
        generatorIntermediates.heightfield
      ) {
        heightfields = [generatorIntermediates.heightfield].filter(Boolean);
      } else if (generatorIntermediates.type === 'tiled') {
        heightfields = generatorIntermediates.tileIntermediates
          .map((t) => t.heightfield)
          .filter(Boolean) as RecastHeightfield[];
      }
    }

    if (heightfields.length <= 0) {
      return undefined;
    }

    const heightfieldHelper = new HeightfieldHelperImpl({
      heightfields,
      material: new MeshStandardMaterial(),
      highlightWalkable: true,
    });

    return heightfieldHelper;
  }, [navMesh, enabled]);

  return enabled && helper && <primitive object={helper} />;
};
