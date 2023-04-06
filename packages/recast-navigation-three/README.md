# @recast-navigation/three

Three.js glue for [`recast-navigation`](https://github.com/isaac-mason/recast-navigation-js/tree/main/packages/recast-navigation).

## Installation

```bash
> npm install @recast-navigation/three
```

## Usage

### Importing

To use the three.js glue, you can either use the `three` entrypoint in `recast-navigation`:

```ts
import * as RecastNavigationThree from 'recast-navigation/three';
```

Or you can use this package directly:

```ts
import * as RecastNavigationThree from '@recast-navigation/three';
```

### `threeToNavMesh`

As a convenience, this package exports a function for converting all descendants within three.js `Object3D` to a `NavMesh`:

```ts
import * as THREE from 'three';
import { NavMesh } from 'recast-navigation';
import { threeToNavMesh } from 'recast-navigation/three';

const scene = new THREE.Scene();

/* add some objects to the scene */
// ...

const navMesh: NavMesh = threeToNavMesh(scene, { /* NavMesh config */ }});
```

You can also use `threeToNavMeshArgs` to get the arguments for `NavMesh.build`:

```ts
const [positions, indices] = threeToNavMeshArgs(scene);
```

### `NavMeshHelper`

```ts
import * as THREE from 'three';
import { NavMeshHelper } from 'recast-navigation/three';

const navMesh = new NavMesh();

/* initialize the NavMesh */
// ...

const navMeshHelper = new NavMeshHelper({ navMesh });

const scene = new THREE.Scene();

scene.add(navMeshHelper.navMesh);
scene.add(navMeshHelper.obstacles);

navMeshHelper.updateNavMesh();
navMeshHelper.updateObstacles();
```

You can optionally pass custom materials to the NavMeshHelper constructor.

```ts
const navMeshMaterial = new THREE.MeshBasicMaterial({ color: 'red' });
const obstaclesMaterial = new THREE.MeshBasicMaterial({ color: 'blue' });

const navMeshHelper = new NavMeshHelper({
  navMesh,
  navMeshMaterial,
  obstaclesMaterial,
});
```

### `CrowdHelper`

```ts
import * as THREE from 'three';
import { Crowd, NavMesh } from 'recast-navigation';
import { CrowdHelper } from 'recast-navigation/three';

const navMesh = new NavMesh();
/* ... */
const crowd = new Crowd({ navMesh, maxAgents: 1, maxAgentRadius: 1 });

const crowdHelper = new CrowdHelper({ crowd });

const scene = new THREE.Scene();

scene.add(navMeshHelper.navMesh);
scene.add(navMeshHelper.obstacles);

navMeshHelper.updateNavMesh();
navMeshHelper.updateObstacles();
```

You can optionally pass a custom crowd material to the CrowdHelper constructor.

```ts
const material = new THREE.MeshBasicMaterial({ color: 'red' });

const crowdHelper = new CrowdHelper({ crowd, material });
```
