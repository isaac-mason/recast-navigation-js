import { NavMeshHelper, pcToSoloNavMesh } from '@recast-navigation/playcanvas';
import * as pc from 'playcanvas';
import { init as initRecast } from 'recast-navigation';

const init = async () => {
  await initRecast();

  const canvas = document.querySelector('#app') as HTMLCanvasElement;

  const device = await pc.createGraphicsDevice(canvas, {
    deviceTypes: [pc.DEVICETYPE_WEBGL2],
  });
  device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

  const app = new pc.Application(canvas);
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();

  const resize = () => app.resizeCanvas();
  window.addEventListener('resize', resize);

  const ground = new pc.Entity('cube');
  ground.addComponent('render');
  ground.render!.meshInstances = [
    new pc.MeshInstance(
      pc.Mesh.fromGeometry(
        app.graphicsDevice,
        new pc.BoxGeometry({ halfExtents: new pc.Vec3(5, 0.2, 5) }),
      ),
      new pc.StandardMaterial(),
    ),
  ];
  app.root.addChild(ground);

  const obstacle = new pc.Entity('obstacle');
  obstacle.addComponent('render', {
    type: 'box',
    material: new pc.StandardMaterial(),
  });
  obstacle.setLocalScale(1, 1, 1);
  obstacle.setPosition(0, 0.5, 0);
  app.root.addChild(obstacle);

  const camera = new pc.Entity('camera');
  camera.addComponent('camera', {
    clearColor: new pc.Color(0.5, 0.6, 0.9),
  });
  app.root.addChild(camera);
  camera.setPosition(5, 5, 5);
  camera.lookAt(0, 0, 0);

  const light = new pc.Entity('light');
  light.addComponent('light');
  app.root.addChild(light);
  light.setEulerAngles(45, 0, 0);

  const recastConfig = {
    cs: 0.05,
    ch: 0.2,
  };

  const navMeshMeshInstances = [
    ...ground.render!.meshInstances,
    ...obstacle.render!.meshInstances,
  ];

  const { success, navMesh } = pcToSoloNavMesh(
    navMeshMeshInstances,
    recastConfig,
  );

  if (success) {
    const navMeshHelper = new NavMeshHelper(navMesh, app.graphicsDevice);

    app.root.addChild(navMeshHelper);
  }
};

init();
