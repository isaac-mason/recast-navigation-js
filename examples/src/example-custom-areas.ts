import { init, NavMeshQuery, QueryFilter } from 'recast-navigation';
import { getPositionsAndIndices } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';
import { createExample } from './common/example-base';
import { createLine } from './common/line';
import { createNavMeshHelper } from './common/nav-mesh-debug';
import {
    type NavMeshGeneratorConfig,
    PolyFlags,
    generateNavMesh,
} from './advanced/custom-areas-generator';

await init();

const waterBoxAreas: NavMeshGeneratorConfig['waterBoxAreas'] = [
    {
        bmin: [-3, -1, -3],
        bmax: [3, 1, 3],
    },
];

const unwalkableBoxAreas: NavMeshGeneratorConfig['unwalkableBoxAreas'] = [
    {
        bmin: [-1.5, -1.5, -1.5],
        bmax: [1.5, 1.5, 1.5],
    },
];

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 10, 10);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

/* level */
const meshes: THREE.Mesh[] = [];

const level = new THREE.Mesh(
    new THREE.BoxGeometry(10, 1, 10),
    new THREE.MeshStandardMaterial({ color: '#999' }),
);
scene.add(level);
meshes.push(level);

/* visualize the custom areas */
const addAreaBox = (
    area: { bmin: THREE.Vector3Tuple; bmax: THREE.Vector3Tuple },
    color: THREE.ColorRepresentation,
) => {
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(
            area.bmax[0] - area.bmin[0],
            area.bmax[1] - area.bmin[1],
            area.bmax[2] - area.bmin[2],
        ),
        new THREE.MeshStandardMaterial({
            color,
            transparent: true,
            opacity: 0.2,
            depthTest: false,
        }),
    );
    box.position.set(
        (area.bmax[0] + area.bmin[0]) / 2,
        (area.bmax[1] + area.bmin[1]) / 2,
        (area.bmax[2] + area.bmin[2]) / 2,
    );
    scene.add(box);
};

for (const area of waterBoxAreas) addAreaBox(area, 'blue');
for (const area of unwalkableBoxAreas) addAreaBox(area, 'red');

/* generate the nav mesh */
const [positions, indices] = getPositionsAndIndices(meshes);

const { success, navMesh } = generateNavMesh(positions, indices, {
    cs: 0.05,
    ch: 0.2,
    waterBoxAreas,
    unwalkableBoxAreas,
});

if (!success || !navMesh) {
    throw new Error('failed to generate nav mesh');
}

scene.add(createNavMeshHelper(navMesh));

const navMeshQuery = new NavMeshQuery(navMesh);

/* compute a path, recomputed on config change */
const config = { canSwim: false };

let pathLine: THREE.Object3D | undefined;

const computePath = () => {
    if (pathLine) {
        scene.remove(pathLine);
        pathLine = undefined;
    }

    let includeFlags = PolyFlags.WALK;

    if (config.canSwim) {
        includeFlags |= PolyFlags.SWIM;
    }

    const filter = new QueryFilter();
    filter.includeFlags = includeFlags;

    const { point: start } = navMeshQuery.findClosestPoint({
        x: -4,
        y: 0,
        z: -4,
    });

    const { point: end } = navMeshQuery.findClosestPoint({
        x: 4,
        y: 0,
        z: 4,
    });

    const { path } = navMeshQuery.computePath(start, end, { filter });

    if (path) {
        const points = path.map(
            (v) => [v.x, v.y + 0.1, v.z] as THREE.Vector3Tuple,
        );
        pathLine = createLine(points, 'orange');
        scene.add(pathLine);
    }
};

computePath();

/* gui */
const gui = new GUI();
gui.add(config, 'canSwim').onChange(computePath);

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
