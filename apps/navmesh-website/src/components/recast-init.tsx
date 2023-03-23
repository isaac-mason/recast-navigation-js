import { ReactElement, ReactNode } from 'react';
import { init } from 'recast-navigation';
import { suspend } from 'suspend-react';

export const RecastInit = ({ children }: { children: ReactNode }) => {
  suspend(async () => {
    await init();
  }, []);

  return <>{children}</>;
};
