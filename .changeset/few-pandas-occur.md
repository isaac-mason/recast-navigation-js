---
'@recast-navigation/core': minor
'recast-navigation': minor
---

feat(Crowd): improve 'update' method, add support for fixed time stepping with interpolation

The previous `update` method did a form of variable time stepping with a target time step.

This has been replaced with a method that supports fixed time stepping, variable time stepping, and fixed time stepping with interpolation.

The new method signature is:

```ts
update(dt: number, timeSinceLastCalled?: number, maxSubSteps?: number): void;
```

To perform a variable sized time step update, call `update` with only the `dt` parameter.

```ts
crowd.update(1 / 60);

// or

crowd.update(deltaTime);
```

To perform fixed time stepping with interpolation, call `update` with the `dt`, `timeSinceLastCalled`, and `maxSubSteps` parameters.

```ts
const dt = 1 / 60;
const timeSinceLastCalled = /* get this from your game loop */;
const maxSubSteps = 10; // optional, default is 10

crowd.update(dt, timeSinceLastCalled, maxSubSteps);
```

The interpolated position of the agents can be retrieved from `agent.interpolatedPosition`.

If the old behavior is desired, the following can be done:

```ts
const crowd = new Crowd(navMesh);

const targetStepSize = 1 / 60;
const maxSubSteps = 10;
const episilon = 0.001;

const update = (deltaTime: number) => {
  if (deltaTime <= Epsilon) {
    return;
  }

  if (targetStepSize <= episilon) {
    crowd.update(deltaTime);
  } else {
    let iterationCount = Math.floor(deltaTime / targetStepSize);

    if (iterationCount > maxSubSteps) {
      iterationCount = maxSubSteps;
    }
    if (iterationCount < 1) {
      iterationCount = 1;
    }

    const step = deltaTime / iterationCount;
    for (let i = 0; i < iterationCount; i++) {
      crowd.update(step);
    }
  }
};
```

As part of this change, the `maximumSubStepCount` and `timeFactor` Crowd properties have been removed.
