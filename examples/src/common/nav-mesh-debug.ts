import type { NavMesh } from '@recast-navigation/core';
import { DebugDrawer } from '@recast-navigation/three';

/**
 * Creates a DebugDrawer (a THREE.Group) visualizing the given nav mesh.
 *
 * We use DebugDrawer rather than NavMeshHelper because the navmesh geometry is
 * generated on the C++/Detour side, avoiding the JS-side tile iteration path.
 *
 * `scene.add(...)` the returned object, and call `.dispose()` to release it.
 */
export const createNavMeshHelper = (navMesh: NavMesh): DebugDrawer => {
    const debugDrawer = new DebugDrawer();
    debugDrawer.drawNavMesh(navMesh);
    return debugDrawer;
};
