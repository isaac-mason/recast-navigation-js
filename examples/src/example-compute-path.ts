import { init, NavMeshQuery } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { createFlag } from './common/flag';
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

if (success && navMesh) {
    scene.add(createNavMeshHelper(navMesh));

    const navMeshQuery = new NavMeshQuery(navMesh);

    /* mutable start & end points, snapped onto the nav mesh */
    let start = navMeshQuery.findClosestPoint({
        x: -4.128927083678903,
        y: 0.2664172349988201,
        z: 4.8521110263641685,
    }).point;
    let end = navMeshQuery.findClosestPoint({
        x: 2.0756323479723005,
        y: 2.38756142461898,
        z: -1.9437325288048717,
    }).point;

    /* reusable visuals — cleared and rebuilt on every recompute */
    type Visual = { object: THREE.Object3D; dispose: () => void };
    let visuals: Visual[] = [];
    const clearVisuals = () => {
        for (const visual of visuals) {
            scene.remove(visual.object);
            visual.dispose();
        }
        visuals = [];
    };
    const addVisual = (visual: Visual) => {
        visuals.push(visual);
        scene.add(visual.object);
    };

    const updatePath = () => {
        clearVisuals();

        const startFlag = createFlag(0x2196f3);
        startFlag.object.position.set(start.x, start.y, start.z);
        addVisual(startFlag);

        const endFlag = createFlag(0x00ff00);
        endFlag.object.position.set(end.x, end.y, end.z);
        addVisual(endFlag);

        const { path } = navMeshQuery.computePath(start, end);
        if (path && path.length > 0) {
            const points = path.map(
                (v) => [v.x, v.y + 0.1, v.z] as THREE.Vector3Tuple,
            );
            const line = createLine(points, 'orange');
            addVisual({
                object: line,
                dispose: () => {
                    line.geometry.dispose();
                    (line.material as THREE.Material).dispose();
                },
            });
        }
    };

    /* raycast into the level to place / drag the start & end points */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getPointOnNavMesh = (
        event: PointerEvent,
    ): { x: number; y: number; z: number } | null => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(meshes, true);
        if (intersects.length === 0) return null;
        const { point } = intersects[0];
        return { x: point.x, y: point.y, z: point.z };
    };

    let moving: 'start' | 'end' | null = null;

    renderer.domElement.addEventListener('pointerdown', (event) => {
        const point = getPointOnNavMesh(event);
        if (!point) return; // missed the level — let orbit controls handle it

        if (event.button === 0) {
            start = point;
            moving = 'start';
        } else if (event.button === 2) {
            end = point;
            moving = 'end';
        } else {
            return;
        }

        // don't rotate the camera while dragging a point
        orbitControls.enabled = false;
        updatePath();
    });

    renderer.domElement.addEventListener('pointermove', (event) => {
        if (!moving) return;
        const point = getPointOnNavMesh(event);
        if (!point) return;
        if (moving === 'start') start = point;
        else end = point;
        updatePath();
    });

    window.addEventListener('pointerup', () => {
        moving = null;
        orbitControls.enabled = true;
    });

    renderer.domElement.addEventListener('contextmenu', (event) =>
        event.preventDefault(),
    );

    updatePath();

    /* instructions overlay */
    const instructions = document.createElement('div');
    instructions.style.cssText =
        'position:fixed;top:12px;left:12px;padding:8px 12px;background:rgba(0,0,0,0.6);' +
        'color:#fff;font:13px system-ui,sans-serif;border-radius:6px;pointer-events:none;';
    instructions.innerHTML =
        'Left-click: place <b style="color:#2196f3">start</b> &nbsp;·&nbsp; ' +
        'Right-click: place <b style="color:#00ff00">end</b> &nbsp;·&nbsp; drag to move';
    container.appendChild(instructions);
}

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
