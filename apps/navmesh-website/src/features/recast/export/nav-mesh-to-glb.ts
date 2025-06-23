import { NavMesh } from 'recast-navigation';
import { GLTFExporter } from 'three/addons';
import { navMeshToPositionsAndIndices } from './nav-mesh-to-gltf';
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from 'three';

export async function navMeshToGLB(navMesh: NavMesh): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  const [pos, idx] = navMeshToPositionsAndIndices(navMesh);

  const geom = new BufferGeometry()
    .setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
    .setIndex(
      new BufferAttribute(
        pos.length / 3 > 65_535 ? new Uint32Array(idx) : new Uint16Array(idx),
        1
      )
    );

  const mesh = new Mesh(geom, new MeshStandardMaterial({ color: 0xffffff }));
  const scene = new Scene().add(mesh);

  const glb = await exporter.parseAsync(scene, { binary: true });
  return glb as ArrayBuffer;
}
