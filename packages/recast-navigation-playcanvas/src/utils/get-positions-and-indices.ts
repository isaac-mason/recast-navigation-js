import {
  Vec3,
  Mesh,
  MeshInstance,
  Matrix4,
  GraphicsDevice,
  VertexBuffer,
  IndexBuffer,
  VertexFormat,
  VertexIterator,
  VertexElement,
  INDEXFORMAT_UINT32,
  INDEXFORMAT_UINT16,
  BUFFER_STATIC,
  SEMANTIC_POSITION,
} from 'playcanvas';

const tmpVec3 : Vec3 = new Vec3();

interface MeshToMerge {
  mesh: Mesh;
  meshInstance: MeshInstance;
}

const isSemanticPosition = (element: VertexElement) => element.name === SEMANTIC_POSITION;

export const getPositionsAndIndices = (
  graphicsDevice: GraphicsDevice,
  meshInstances: MeshInstance[]
): [Float32Array, Uint32Array] => {
  const meshesToMerge: MeshToMerge[] = [];

  // Iterate over the mesh instances and collect the meshes that have position data
  for (const meshInstance of meshInstances) {
      const mesh: Mesh = meshInstance.mesh;
      const vertexBuffer: VertexBuffer = mesh.vertexBuffer;
      if (!vertexBuffer) {
          continue;
      }

      // Check that the vertex format has position data with 3 components
      const vertexFormat: VertexFormat = vertexBuffer.getFormat();
      const positionElement = vertexFormat.elements.find(isSemanticPosition);

      // If not, ignore this mesh instance
      if (!positionElement || positionElement.numComponents !== 3) {
          continue;
      }

      let meshToMerge : Mesh = mesh;
      let indexBuffer : IndexBuffer = mesh.indexBuffer[0];

      // Create an index buffer if we don't have one
      if (!indexBuffer) {
          const numVertices : number = vertexBuffer.getNumVertices();
          const requiresLargeIndicesRange : boolean = numVertices > 0xffff;
          const indexFormat : INDEXFORMAT_UINT32 | INDEXFORMAT_UINT16  = requiresLargeIndicesRange ? INDEXFORMAT_UINT32 : INDEXFORMAT_UINT16;
          const IndicesArrayType : Uint32ArrayConstructor | Uint16ArrayConstructor = requiresLargeIndicesRange ? Uint32Array : Uint16Array;
          const indices : Uint32Array | Uint16Array = new IndicesArrayType(numVertices);

          for (let i : number = 0; i < numVertices; i++) {
              indices[i] = i;
          }

          indexBuffer = new IndexBuffer(
              graphicsDevice,
              indexFormat,
              numVertices,
              BUFFER_STATIC,
              indices
          );

          // Create a new mesh with the index buffer
          meshToMerge = new Mesh(graphicsDevice);
          meshToMerge.vertexBuffer = vertexBuffer;
          meshToMerge.indexBuffer[0] = indexBuffer;
      }

      meshesToMerge.push({ mesh: meshToMerge, meshInstance: meshInstance });
  }

  const mergedPositions: number[] = [];
  const mergedIndices: number[] = [];
  const positionToIndex: { [key: string]: number } = {};
  let indexCounter = 0;

  for (const item of meshesToMerge) {
      const mesh : Mesh = item.mesh;
      const meshInstance : MeshInstance = item.meshInstance;

      const vertexBuffer : VertexBuffer = mesh.vertexBuffer;
      const indexBuffer : IndexBuffer = mesh.indexBuffer[0];
      const numVertices : number = vertexBuffer.getNumVertices();
      const positionsArray : Float32Array = new Float32Array(numVertices * 3);

      // Accessing vertex data
      const iterator: VertexIterator = new VertexIterator(vertexBuffer);
      iterator.readData(SEMANTIC_POSITION, positionsArray);

      // Accessing index data
      const isIndexBufferUint32: boolean = indexBuffer.getIndexFormat() === INDEXFORMAT_UINT32;
      const IndexArrayConstructor: Uint32ArrayConstructor | Uint16ArrayConstructor = isIndexBufferUint32 ? Uint32Array : Uint16Array;
      const indices : Uint32Array | Uint16Array = new IndexArrayConstructor(indexBuffer.getNumIndices());
      const originalIndices : Uint32Array | Uint16Array = new IndexArrayConstructor(indexBuffer.lock());
      indices.set(originalIndices);
      indexBuffer.unlock();

      // Transform and merge positions and indices
      const worldMatrix : Matrix4 = meshInstance.node.getWorldTransform();
      for (let i : number = 0; i < indices.length; i++) {
          const idx : number = indices[i];

          const pt : number = idx * 3;
          tmpVec3.set(positionsArray[pt], positionsArray[pt + 1], positionsArray[pt + 2]);

          // Transform to world space
          worldMatrix.transformPoint(tmpVec3, tmpVec3);

          // This can likely be rounded to a fixed precision, but for now we'll keep it as is
          const key : string = `${tmpVec3.x}_${tmpVec3.y}_${tmpVec3.z}`;
          let mergedIdx : number = positionToIndex[key];
          if (mergedIdx === undefined) {
              positionToIndex[key] = mergedIdx = indexCounter;
              mergedPositions.push(tmpVec3.x, tmpVec3.y, tmpVec3.z);
              indexCounter++;
          }
          mergedIndices.push(mergedIdx);
      }
  }

  return [Float32Array.from(mergedPositions), Uint32Array.from(mergedIndices)];
};