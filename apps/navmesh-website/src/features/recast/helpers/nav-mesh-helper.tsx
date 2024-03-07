import { useMemo } from 'react';
import { NavMesh } from 'recast-navigation';
import { NavMeshHelper as NavMeshHelperImpl } from 'recast-navigation/three';
import { Color, MeshBasicMaterial } from 'three';

export const NavMeshHelper = ({
  enabled,
  navMesh,
  navMeshHelperDebugColor,
  navMeshDebugOpacity,
  navMeshDebugWireframe,
}: {
  enabled: boolean;
  navMesh: NavMesh | undefined;
  navMeshHelperDebugColor: string;
  navMeshDebugOpacity: number;
  navMeshDebugWireframe: boolean;
}) => {
  const helper = useMemo(() => {
    if (!navMesh) {
      return undefined;
    }

    return new NavMeshHelperImpl({
      navMesh,
      navMeshMaterial: new MeshBasicMaterial({
        transparent: true,
        opacity: navMeshDebugOpacity,
        wireframe: navMeshDebugWireframe,
        color: new Color(Number(navMeshHelperDebugColor.replace('#', '0x'))),
        depthWrite: false,
      }),
    });
  }, [
    navMesh,
    navMeshHelperDebugColor,
    navMeshDebugOpacity,
    navMeshDebugWireframe,
  ]);

  return enabled && helper && <primitive object={helper} />;
};
