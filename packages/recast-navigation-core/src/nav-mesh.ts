import type R from '@recast-navigation/wasm';
import { DebugNavMesh } from './debug-nav-mesh';
import { Wasm } from './wasm';

export type NavMeshParams = {
  orig: number[];
  tileWidth: number;
  tileHeight: number;
  maxTiles: number;
  maxPolys: number;
};

export type NavMeshAddTileResult = {
  status: number;
  tileRef: number;
};

export class NavMesh {
  raw: R.NavMesh;

  constructor(raw?: R.NavMesh) {
    this.raw = raw ?? new Wasm.Recast.NavMesh();
  }

  /**
   * Initializes the NavMesh for use with a single tile.
   * @param data the nav mesh data
   * @param dataSize the size of the nav mesh data
   * @param flags the flags to use when building the nav mesh
   * @returns the status of the operation
   */
  initSolo(
    data: ReadonlyArray<number>,
    dataSize: number,
    flags: number
  ): boolean {
    return this.raw.initSolo(data, dataSize, flags);
  }

  /**
   * Initializes the NavMesh for use with multiple tiles.
   * @param params parameters for the NavMesh
   * @returns the status of the operation
   */
  initTiled(params: NavMeshParams): boolean {
    return this.raw.initTiled(params as never);
  }

  /**
   * Adds a tile to the NavMesh.
   * @param data the nav mesh data
   * @param dataSize the size of the nav mesh data
   * @param flags the flags to use when building the nav mesh
   * @param lastRef
   * @returns the status of the operation and the reference of the added tile
   */
  addTile(
    data: number[],
    dataSize: number,
    flags: number,
    lastRef: number
  ): NavMeshAddTileResult {
    return this.raw.addTile(data, dataSize, flags, lastRef);
  }

  /**
   * Destroys the NavMesh.
   */
  destroy(): void {
    this.raw?.destroy();
  }

  /**
   * Returns a DebugNavMesh that can be used to visualize the NavMesh.
   */
  getDebugNavMesh(): DebugNavMesh {
    const rawDebugNavMesh = this.raw.getDebugNavMesh();
    return new DebugNavMesh(rawDebugNavMesh);
  }
}
