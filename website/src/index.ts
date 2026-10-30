import {
  CrowdHelper,
  NavMeshHelper,
  threeToSoloNavMesh,
} from '@recast-navigation/three';
import { Crowd, init, NavMeshQuery } from 'recast-navigation';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadGLTF } from './load-gltf';

await init();

/* setup scene */
const container = document.getElementById('root')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#222222');

const camera = new THREE.PerspectiveCamera(
  50,
  container.clientWidth / container.clientHeight,
  0.1,
  1000,
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// soft image based lighting, so faces turned away from the sun aren't black
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;

scene.add(new THREE.HemisphereLight('#ffe8c7', '#3a3f5c', 1.2));

const sun = new THREE.DirectionalLight('#ffd9a8', 2.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.radius = 6;
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener('resize', onWindowResize);

/* load level */
const level = await loadGLTF('./dungeon.gltf');
scene.add(level.scene);

// the level has no materials, and glTF's default material is fully metallic, so give it a matte one
const levelMaterial = new THREE.MeshStandardMaterial({
  color: '#c9b9a4',
  roughness: 0.85,
  metalness: 0,
});

const meshes: THREE.Mesh[] = [];
level.scene.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    object.material = levelMaterial;
    object.castShadow = true;
    object.receiveShadow = true;
    meshes.push(object);
  }
});

/* generate nav mesh */
const agentRadius = 0.15;
const cellSize = 0.05;

const { success, navMesh } = threeToSoloNavMesh(meshes, {
  cs: cellSize,
  ch: 0.2,
  walkableRadius: Math.ceil(agentRadius / cellSize),
});

if (!success || !navMesh) {
  throw new Error('failed to generate nav mesh');
}

const navMeshQuery = new NavMeshQuery(navMesh);

const navMeshHelper = new NavMeshHelper(navMesh, {
  navMeshMaterial: new THREE.MeshBasicMaterial({
    color: 'orange',
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  }),
});
navMeshHelper.position.y += 0.02;
scene.add(navMeshHelper);

/* frame the camera on the level */
const bounds = new THREE.Box3().setFromObject(level.scene);
const center = bounds.getCenter(new THREE.Vector3());
const radius = bounds.getSize(new THREE.Vector3()).length() * 0.5;

const cameraAngle = 0.2;
camera.position.set(
  center.x + Math.cos(cameraAngle) * radius * 0.6,
  center.y + radius * 0.6,
  center.z + Math.sin(cameraAngle) * radius * 0.6,
);
camera.lookAt(center);

// light the level from above and to the side, with the shadow camera covering the whole level
const size = bounds.getSize(new THREE.Vector3());
sun.position.set(
  center.x - size.x * 0.4,
  center.y + size.y * 1.5,
  center.z + size.z * 0.2,
);
sun.target.position.copy(center);
const shadowExtent = Math.max(size.x, size.z) * 0.6;
sun.shadow.camera.left = -shadowExtent;
sun.shadow.camera.right = shadowExtent;
sun.shadow.camera.top = shadowExtent;
sun.shadow.camera.bottom = -shadowExtent;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = size.length() * 3;
sun.shadow.camera.updateProjectionMatrix();

/* crowd of agents wandering between random points */
const agentCount = 150;

// pick random points around a known point on the main corridor. findRandomPointAroundCircle
// only visits polygons connected to the start, so agents never spawn on or wander to isolated
// bits of the navmesh like ledges and the tops of walls
const { point: spawnPoint } = navMeshQuery.findClosestPoint({
  x: 18.2,
  y: 10.2,
  z: -43.5,
});

const randomPoint = () =>
  navMeshQuery.findRandomPointAroundCircle(spawnPoint, radius).randomPoint;

const crowd = new Crowd(navMesh, {
  maxAgents: agentCount,
  maxAgentRadius: agentRadius,
});

for (let i = 0; i < agentCount; i++) {
  crowd.addAgent(randomPoint(), {
    radius: agentRadius,
    height: 0.5,
    maxAcceleration: 4,
    maxSpeed: 1 + Math.random() * 0.5,
    separationWeight: 1,
  });
}

const wander = () => {
  for (const agent of crowd.getAgents()) {
    agent.requestMoveTarget(randomPoint());
  }
};

wander();
const wanderInterval = 6000;
let wanderTimer = setInterval(wander, wanderInterval);

const crowdHelper = new CrowdHelper(crowd);
scene.add(crowdHelper);

// give every agent its own colour
crowdHelper.update();
for (const agentMesh of crowdHelper.agentMeshes.values()) {
  agentMesh.material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(Math.random(), 0.75, 0.55),
    roughness: 0.4,
  });
  agentMesh.castShadow = true;
}

/* click to send the crowd somewhere */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(meshes, true)[0];
  if (!hit) return;

  const { point: target } = navMeshQuery.findClosestPoint(hit.point);

  for (const agent of crowd.getAgents()) {
    agent.requestMoveTarget(target);
  }

  // resume wandering a while after the last click
  clearInterval(wanderTimer);
  wanderTimer = setInterval(wander, wanderInterval);
});

/* hide loading spinner */
const loading = document.getElementById('loading')!;
loading.classList.add('hidden');
setTimeout(() => loading.remove(), 500);

/* loop */
const timer = new THREE.Timer();
timer.connect(document);

function update() {
  requestAnimationFrame(update);

  timer.update();

  const delta = Math.min(timer.getDelta(), 0.1);

  crowd.update(delta);
  crowdHelper.update();

  renderer.render(scene, camera);
}

update();
