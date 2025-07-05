import type { NavMesh } from 'recast-navigation';
import type {
  SoloNavMeshGeneratorIntermediates,
  TiledNavMeshGeneratorIntermediates,
} from 'recast-navigation/generators';
import type { Group } from 'three';
import { create } from 'zustand';

export type EditorState = {
  loading: boolean;
  error?: string;

  model?: Group;

  indexedTriangleMesh?: {
    positions: Float32Array;
    indices: Uint32Array;
  };

  generatorIntermediates?:
    | SoloNavMeshGeneratorIntermediates
    | TiledNavMeshGeneratorIntermediates;

  navMesh?: NavMesh;
};

export const useEditorState = create<
  EditorState & { setEditorState: (partial: Partial<EditorState>) => void }
>((set) => ({
  loading: false,
  error: undefined,
  model: undefined,
  indexedTriangleMesh: undefined,
  generatorIntermediates: undefined,
  navMesh: undefined,
  setEditorState: (partial) => set(partial),
}));
