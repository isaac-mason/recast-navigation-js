export const mergePositionsAndIndices = (
  meshes: Array<{
    positions: ArrayLike<number>;
    indices: ArrayLike<number>;
  }>,
): [Float32Array, Uint32Array] => {
  const mergedPositions: number[] = [];
  const mergedIndices: number[] = [];

  const positionToIndex: { [hash: string]: number } = {};
  let indexCounter = 0;

  for (const { positions, indices } of meshes) {
    for (let i = 0; i < indices.length; i++) {
      const pt = indices[i] * 3;

      const x = positions[pt];
      const y = positions[pt + 1];
      const z = positions[pt + 2];

      const key = `${x}_${y}_${z}`;
      let idx = positionToIndex[key];

      if (!idx) {
        positionToIndex[key] = idx = indexCounter;
        mergedPositions.push(x, y, z);
        indexCounter++;
      }

      mergedIndices.push(idx);
    }
  }

  return [Float32Array.from(mergedPositions), Uint32Array.from(mergedIndices)];
};
