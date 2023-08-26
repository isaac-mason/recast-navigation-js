import { RecastHeightfield, RecastSpan } from '@recast-navigation/core';
import {
  BoxGeometry,
  Color,
  ColorRepresentation,
  DynamicDrawUsage,
  InstancedMesh,
  Material,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  Vector3Tuple,
} from 'three';

const tmpMatrix4 = new Matrix4();

export type HeightfieldHelperParams = {
  heightfields: RecastHeightfield[];

  /**
   * @default false
   */
  highlightWalkable?: boolean;

  /**
   * @default 'blue'
   */
  defaultColor?: ColorRepresentation;

  /**
   * @default 'green'
   */
  walkableColor?: ColorRepresentation;

  /**
   * @default MeshBasicMaterial
   */
  material?: Material;
};

export class HeightfieldHelper extends Object3D {
  heightfields: RecastHeightfield[];

  highlightWalkable: boolean;

  defaultColor: Color;

  walkableColor: Color;

  material: Material;

  constructor({
    heightfields,
    highlightWalkable = false,
    material = new MeshBasicMaterial(),
    defaultColor = 'blue',
    walkableColor = 'green',
  }: HeightfieldHelperParams) {
    super();

    this.heightfields = heightfields;
    this.highlightWalkable = highlightWalkable;
    this.material = material;
    this.defaultColor = new Color(defaultColor);
    this.walkableColor = new Color(walkableColor);
  }

  update(): void {
    this.clear();

    for (const hf of this.heightfields) {
      const orig = hf.bmin();
      const cs = hf.cs();
      const ch = hf.ch();

      const width = hf.width();
      const height = hf.height();

      const boxes: {
        position: Vector3Tuple;
        walkable: boolean;
      }[] = [];

      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const fx = orig.x + x * cs;
          const fz = orig.z + y * cs;

          let span: RecastSpan | null = hf.spans(x + y * width);

          while (span) {
            const minX = fx;
            const minY = orig.y + span.smin() * ch;
            const minZ = fz;

            const maxX = fx + cs;
            const maxY = orig.y + span.smax() * ch;
            const maxZ = fz + cs;

            boxes.push({
              position: [
                (maxX + minX) / 2,
                (maxY + minY) / 2,
                (maxZ + minZ) / 2,
              ],
              walkable: this.highlightWalkable && span.area() !== 0,
            });

            span = span.next();
          }
        }
      }

      const geometry = new BoxGeometry(cs, ch, cs);

      const instancedMesh = new InstancedMesh(
        geometry,
        this.material,
        boxes.length
      );
      instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);

      for (let i = 0; i < boxes.length; i++) {
        const { position, walkable } = boxes[i];

        instancedMesh.setMatrixAt(i, tmpMatrix4.setPosition(...position));
        instancedMesh.setColorAt(
          i,
          walkable ? this.walkableColor : this.defaultColor
        );
      }

      instancedMesh.instanceMatrix.needsUpdate = true;

      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }

      this.add(instancedMesh);
    }
  }
}
