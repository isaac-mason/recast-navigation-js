import { Vector3 } from '@recast-navigation/core';
import { Color, Vector2 } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

export const createLineMesh = (path: Vector3[]) => {
  const lineGeometry = new LineGeometry();
  lineGeometry.setPositions(path.flatMap((p) => [p.x, p.y, p.z]));
  lineGeometry.setColors(
    path.flatMap((_, idx) => {
      const color = new Color().lerpColors(
        new Color('red'),
        new Color('blue'),
        (idx + 1) / path.length
      );
      return [color.r, color.g, color.b];
    })
  );

  const line = new Line2(
    lineGeometry,
    new LineMaterial({
      linewidth: 5,
      vertexColors: true,
      resolution: new Vector2(window.innerWidth, window.innerHeight),
    })
  );

  return line;
};
