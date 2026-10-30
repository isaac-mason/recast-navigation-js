import {
  CrowdHelper,
  NavMeshHelper,
  threeToSoloNavMesh,
} from '@recast-navigation/three';
import { Crowd, init, NavMeshQuery } from 'recast-navigation';
import * as THREE from 'three';
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
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener('resize', onWindowResize);

/* load level */
const level = await loadGLTF('./dungeon.gltf');
scene.add(level.scene);

const meshes: THREE.Mesh[] = [];
level.scene.traverse((object) => {
  if (object instanceof THREE.Mesh) {
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

/* crowd of agents wandering between random points */
const agentCount = 150;

const crowd = new Crowd(navMesh, {
  maxAgents: agentCount,
  maxAgentRadius: agentRadius,
});

for (let i = 0; i < agentCount; i++) {
  const { randomPoint } = navMeshQuery.findRandomPoint();

  crowd.addAgent(randomPoint, {
    radius: agentRadius,
    height: 0.5,
    maxAcceleration: 4,
    maxSpeed: 1 + Math.random() * 0.5,
    separationWeight: 1,
  });
}

const wander = () => {
  for (const agent of crowd.getAgents()) {
    const { randomPoint } = navMeshQuery.findRandomPoint();
    agent.requestMoveTarget(randomPoint);
  }
};

wander();
const wanderInterval = 6000;
let wanderTimer = setInterval(wander, wanderInterval);

const crowdHelper = new CrowdHelper(crowd, {
  agentMaterial: new THREE.MeshStandardMaterial({ color: '#ff4444' }),
});
scene.add(crowdHelper);

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

/* nav mesh toggle */
const navMeshToggle = document.getElementById('navmesh-toggle')!;

const toggleNavMesh = () => {
  navMeshHelper.visible = !navMeshHelper.visible;
  navMeshToggle.textContent = `${navMeshHelper.visible ? 'Hide' : 'Show'} NavMesh [H]`;
};

navMeshToggle.addEventListener('click', toggleNavMesh);

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'h') {
    toggleNavMesh();
  }
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
