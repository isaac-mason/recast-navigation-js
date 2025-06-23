import { NavMesh } from 'recast-navigation';
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from 'three';
import { GLTFExporter } from 'three/addons';

export const navMeshToPositionsAndIndices = (navMesh: NavMesh) => {
  const positions: number[] = [];
  const indices: number[] = [];
  let tri = 0;

  const maxTiles = navMesh.getMaxTiles();

  for (let tileIndex = 0; tileIndex < maxTiles; tileIndex++) {
    const tile = navMesh.getTile(tileIndex);
    const tileHeader = tile.header();

    if (!tileHeader) continue;

    const tilePolyCount = tileHeader.polyCount();

    for (
      let tilePolyIndex = 0;
      tilePolyIndex < tilePolyCount;
      ++tilePolyIndex
    ) {
      const poly = tile.polys(tilePolyIndex);

      if (poly.getType() === 1) continue;

      const polyVertCount = poly.vertCount();
      const polyDetail = tile.detailMeshes(tilePolyIndex);
      const polyDetailTriBase = polyDetail.triBase();
      const polyDetailTriCount = polyDetail.triCount();

      for (
        let polyDetailTriIndex = 0;
        polyDetailTriIndex < polyDetailTriCount;
        ++polyDetailTriIndex
      ) {
        const detailTrisBaseIndex =
          (polyDetailTriBase + polyDetailTriIndex) * 4;

        for (let trianglePoint = 0; trianglePoint < 3; ++trianglePoint) {
          if (
            tile.detailTris(detailTrisBaseIndex + trianglePoint) < polyVertCount
          ) {
            const tileVertsBaseIndex =
              poly.verts(tile.detailTris(detailTrisBaseIndex + trianglePoint)) *
              3;

            positions.push(
              tile.verts(tileVertsBaseIndex),
              tile.verts(tileVertsBaseIndex + 1),
              tile.verts(tileVertsBaseIndex + 2)
            );
          } else {
            const tileVertsBaseIndex =
              (polyDetail.vertBase() +
                tile.detailTris(detailTrisBaseIndex + trianglePoint) -
                poly.vertCount()) *
              3;

            positions.push(
              tile.detailVerts(tileVertsBaseIndex),
              tile.detailVerts(tileVertsBaseIndex + 1),
              tile.detailVerts(tileVertsBaseIndex + 2)
            );
          }

          indices.push(tri++);
        }
      }
    }
  }

  return [positions, indices];
};

type GLTFExport =
  | ArrayBuffer
  | {
      [key: string]: any;
    };

export const navMeshToGLTF = (navMesh: NavMesh): Promise<GLTFExport> => {
  const exporter = new GLTFExporter();

  const [positions, indices] = navMeshToPositionsAndIndices(navMesh);

  const geometry = new BufferGeometry();

  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

  const material = new MeshStandardMaterial({ color: 0xffffff });

  const mesh = new Mesh(geometry, material);
  const scene = new Scene();
  scene.add(mesh);

  return new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject);
  });
};
