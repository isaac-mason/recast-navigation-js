import { Raw } from './raw';

export const getRandomSeed = () => {
  return Raw.Module.FastRand.getSeed();
};

export const setRandomSeed = (seed: number) => {
  Raw.Module.FastRand.setSeed(seed);
};
