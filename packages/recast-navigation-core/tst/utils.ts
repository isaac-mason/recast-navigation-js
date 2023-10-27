import { expect } from 'vitest';
import { Vector3 } from '../src';

export const expectVectorToBeCloseTo = (
  expected: Vector3,
  actual: Vector3,
  numDigits?: number
) => {
  expect(expected.x).toBeCloseTo(actual.x, numDigits);
  expect(expected.y).toBeCloseTo(actual.y, numDigits);
  expect(expected.z).toBeCloseTo(actual.z, numDigits);
};
