import { Raw } from './raw';

export const getRandomSeed = () => {
  return Raw.Module.FastRand.prototype.getSeed();
};

export const setRandomSeed = (seed: number) => {
  Raw.Module.FastRand.prototype.setSeed(seed);
};
