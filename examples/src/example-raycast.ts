import { init, NavMeshQuery } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls, type Line2 } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { createLine } from './common/line';
import { loadGLTF } from './common/load-gltf';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 10, 10);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

/* instruction overlay */
const instructions = document.createElement('div');
instructions.className = 'mc-info mc-hint';
instructions.textContent =
    'left click to set start point, right click to set end point';
document.body.appendChild(instructions);

/* load the nav test environment */
const model = await loadGLTF('./nav_test.glb');
scene.add(model.scene);

const meshes: THREE.Mesh[] = [];
model.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
        meshes.push(object);
    }
});

/* generate the nav mesh */
const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: 0.05,
    ch: 0.2,
});

const start = new THREE.Vector3(-3, 0.26, 4.7);
const end = new THREE.Vector3(0.8, 0.26, 3.3);

/* markers group, offset up by 0.05 */
const markers = new THREE.Group();
markers.position.set(0, 0.05, 0);
scene.add(markers);

const startSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 'blue' }),
);
markers.add(startSphere);

const endSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 'green' }),
);
markers.add(endSphere);

const hitSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 'orange' }),
);
markers.add(hitSphere);

let line: Line2 | undefined;

if (success && navMesh) {
    scene.add(createNavMeshHelper(navMesh));

    const navMeshQuery = new NavMeshQuery(navMesh);

    const compute = () => {
        startSphere.position.copy(start);
        endSphere.position.copy(end);

        const nearestStartPoly = navMeshQuery.findNearestPoly(start);

        const raycastResult = navMeshQuery.raycast(
            nearestStartPoly.nearestRef,
            start,
            end,
        );

        const hit = 0 < raycastResult.t && raycastResult.t < 1.0;

        if (line) {
            markers.remove(line);
            line = undefined;
        }

        if (!hit) {
            hitSphere.visible = false;
            line = createLine(
                [
                    [start.x, start.y, start.z],
                    [end.x, end.y, end.z],
                ],
                'orange',
            );
            markers.add(line);
        } else {
            const distanceToHitBorder =
                start.distanceTo(end) * (raycastResult?.t ?? 0);

            const direction = end.clone().sub(start).normalize();

            const hitPoint = start
                .clone()
                .add(direction.clone().multiplyScalar(distanceToHitBorder));

            hitSphere.visible = true;
            hitSphere.position.copy(hitPoint);

            line = createLine(
                [
                    [start.x, start.y, start.z],
                    [hitPoint.x, hitPoint.y, hitPoint.z],
                ],
                'orange',
            );
            markers.add(line);
        }
    };

    compute();

    /* pointer interaction */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function getPointerIntersection(
        event: PointerEvent,
        targets: THREE.Object3D[],
    ): THREE.Vector3 | null {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(targets, true);
        return hits.length ? hits[0].point : null;
    }

    renderer.domElement.addEventListener('pointerdown', (event) => {
        const point = getPointerIntersection(event, meshes);
        if (!point) return;

        if (event.button === 0) {
            // left click
            start.set(point.x, point.y, point.z);
        } else if (event.button === 2) {
            // right click
            end.set(point.x, point.y, point.z);
        }

        compute();
    });

    renderer.domElement.addEventListener('contextmenu', (e) =>
        e.preventDefault(),
    );
}

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
