import { mergePositionsAndIndices } from '@recast-navigation/generators';
import {
  INDEXFORMAT_UINT32,
  Mat4,
  Mesh,
  MeshInstance,
  SEMANTIC_POSITION,
  Vec3,
  VertexBuffer,
  VertexFormat,
  VertexIterator,
} from 'playcanvas';

const _vector3: Vec3 = new Vec3();

export const getPositionsAndIndices = (
  meshInstances: MeshInstance[],
): [Float32Array, Uint32Array] => {
  const toMerge: {
    positions: ArrayLike<number>;
    indices: ArrayLike<number>;
  }[] = [];

  for (const meshInstance of meshInstances) {
    const mesh: Mesh = meshInstance.mesh;

    const vertexBuffer: VertexBuffer = mesh.vertexBuffer;
    if (!vertexBuffer) {
      continue;
    }

    const vertexFormat: VertexFormat = vertexBuffer.getFormat();
    const positionElement = vertexFormat.elements.find(
      (element) => element.name === SEMANTIC_POSITION,
    );

    if (!positionElement || positionElement.numComponents !== 3) {
      continue;
    }

    const worldMatrix: Mat4 = meshInstance.node.getWorldTransform();

    const positions = new Float32Array(vertexBuffer.getNumVertices() * 3);
    const iterator = new VertexIterator(vertexBuffer);
    iterator.readData(SEMANTIC_POSITION, positions);

    for (let i: number = 0; i < positions.length; i += 3) {
      _vector3.set(positions[i], positions[i + 1], positions[i + 2]);

      worldMatrix.transformPoint(_vector3, _vector3);

      positions[i] = _vector3.x;
      positions[i + 1] = _vector3.y;
      positions[i + 2] = _vector3.z;
    }

    let indices: ArrayLike<number> | undefined;

    if (mesh.indexBuffer[0]) {
      const indexBuffer = mesh.indexBuffer[0];
      const indexFormat =
        indexBuffer.getFormat() === INDEXFORMAT_UINT32
          ? Uint32Array
          : Uint16Array;
      const indicesCopy = new indexFormat(indexBuffer.getNumIndices());
      const originalIndices = new indexFormat(indexBuffer.storage);
      indicesCopy.set(originalIndices);
      indices = indicesCopy;
    } else {
      // this will become indexed when merging with other meshes
      const ascendingIndex: number[] = [];
      for (let i = 0; i < vertexBuffer.getNumVertices(); i++) {
        ascendingIndex.push(i);
      }
      indices = ascendingIndex;
    }

    toMerge.push({
      positions,
      indices,
    });
  }

  return mergePositionsAndIndices(toMerge);
};
