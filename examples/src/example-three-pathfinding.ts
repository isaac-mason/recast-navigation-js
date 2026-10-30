import { init, type NavMesh } from 'recast-navigation';
import { DebugDrawer, threeToTileCache } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Pathfinding } from 'three-pathfinding';
import { createExample } from './common/example-base';
import { createLine } from './common/line';

await init();

/**
 * Extract a walkable surface geometry from the nav mesh.
 *
 * The idiomatic JS-side tile iteration (getTile -> tile.polys/detailMeshes) is
 * broken in the current wasm build ("dtMeshTile const*"), so we instead read
 * the triangle geometry from a DebugDrawer, which builds the nav mesh mesh on
 * the C++/Detour side. The result is a triangle-soup BufferGeometry suitable
 * for three-pathfinding's `createZone` (which merges vertices by tolerance).
 */
const navMeshToGeometry = (navMesh: NavMesh): THREE.BufferGeometry => {
    const debugDrawer = new DebugDrawer();
    debugDrawer.drawNavMesh(navMesh);

    const positions: number[] = [];

    debugDrawer.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;

        const geom = mesh.geometry as THREE.BufferGeometry;
        const posAttr = geom.getAttribute('position');
        const index = geom.getIndex();

        if (index) {
            for (let i = 0; i < index.count; i++) {
                const vi = index.getX(i);
                positions.push(
                    posAttr.getX(vi),
                    posAttr.getY(vi),
                    posAttr.getZ(vi),
                );
            }
        } else {
            for (let i = 0; i < posAttr.count; i++) {
                positions.push(
                    posAttr.getX(i),
                    posAttr.getY(i),
                    posAttr.getZ(i),
                );
            }
        }
    });

    debugDrawer.dispose();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), 3),
    );
    const indices = new Uint32Array(positions.length / 3);
    for (let i = 0; i < indices.length; i++) indices[i] = i;
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    return geometry;
};

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(5, 8, 5);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(0, 0, 0);

/* build the level geometry */
const meshes: THREE.Mesh[] = [];

const floor = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.25, 5),
    new THREE.MeshStandardMaterial({ color: '#ccc' }),
);
floor.position.set(0, -0.25, 0);
scene.add(floor);
meshes.push(floor);

const obstacle = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 'hotpink' }),
);
obstacle.position.set(0, 0.5, 0);
scene.add(obstacle);
meshes.push(obstacle);

/* generate the nav mesh */
const { success, navMesh } = threeToTileCache(meshes, {
    cs: 0.02,
    ch: 0.2,
    walkableHeight: 1,
    walkableClimb: 2.5,
    walkableRadius: 1,
    borderSize: 0.2,
    tileSize: 32,
});

if (!success || !navMesh) {
    throw new Error('failed to generate nav mesh');
}

const geometry = navMeshToGeometry(navMesh);

/* show the nav mesh as a red wireframe */
const navMeshMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 'red', wireframe: true }),
);
scene.add(navMeshMesh);

/* find a path using three-pathfinding */
const pathfinding = new Pathfinding();
const ZONE = 'level';
pathfinding.setZoneData(ZONE, Pathfinding.createZone(geometry, 1e-6));

const start = { x: -1.5, y: 0, z: 1.5 };
const startGroupId = pathfinding.getGroup(ZONE, start as any);

const end = { x: 1.5, y: 0, z: -1.5 };

const path = pathfinding.findPath(start as any, end as any, ZONE, startGroupId);

if (path) {
    const points = path.map(
        (v) => [v.x, v.y + 0.1, v.z] as THREE.Vector3Tuple,
    );
    scene.add(createLine(points, 'orange'));
}

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
