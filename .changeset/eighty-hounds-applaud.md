---
'@recast-navigation/core': minor
'recast-navigation': minor
---

feat: change Crowd and NavMeshQuery constructors to take NavMesh as first arg, and options as second

old usage:

```ts
import { NavMesh, Crowd, NavMeshQuery } from 'recast-navigation';

const navMesh = new NavMesh();

const crowd = new Crowd({
  navMesh,
  maxAgents: 100,
  maxAgentRadius: 0.6,
});

const navMeshQuery = new NavMeshQuery({ navMesh });
```

new usage:

```ts
import { NavMesh, Crowd, NavMeshQuery } from 'recast-navigation';

const navMesh = new NavMesh();

const crowd = new Crowd(navMesh, {
  maxAgents: 100,
  maxAgentRadius: 0.6,
});

const navMeshQuery = new NavMeshQuery(navMesh);
```
