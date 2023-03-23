import { Recast } from 'recast-navigation/three';
import { suspend } from 'suspend-react';

export const useRecast = () =>
  suspend(async () => {
    const recast = new Recast();
    await recast.init();
    return recast;
  }, []);
