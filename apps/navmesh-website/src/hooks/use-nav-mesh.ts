import { NavMesh } from 'recast-navigation/three';
import { suspend } from 'suspend-react';

export const useNavMesh = () =>
  suspend(async () => {
    const navMesh = new NavMesh();
    await navMesh.init();
    return navMesh;
  }, []);
