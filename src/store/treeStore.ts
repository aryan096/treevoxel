import { create } from 'zustand';
import type { TreeParams, PresetId, VoxelStore, RenderBuffer, TreeModel } from '../core/types';
import { getDefaultParams } from '../core/parameters';
import { PRESETS, applyPreset } from '../core/presets';
import { generateTree, type GenerationResult } from '../core/generate';

type DisplayToggles = {
  showLog: boolean;
  showBranch: boolean;
  showLeaf: boolean;
  showGrid: boolean;
  showAxes: boolean;
};

type TreeState = {
  // Source of truth
  presetId: PresetId;
  params: TreeParams;
  activeLayerIndex: number;
  display: DisplayToggles;

  // Derived (computed eagerly on param change)
  model: TreeModel;
  voxels: VoxelStore;
  buffer: RenderBuffer;

  // Actions
  setParam: (id: string, value: number | string) => void;
  setPreset: (id: PresetId) => void;
  setActiveLayer: (y: number) => void;
  toggleDisplay: (key: keyof DisplayToggles) => void;
  randomizeSeed: () => void;
};

function regenerate(params: TreeParams): GenerationResult {
  return generateTree(params);
}

const initialParams = applyPreset(getDefaultParams(), PRESETS[0]);
const initialResult = regenerate(initialParams);

export const useTreeStore = create<TreeState>((set) => ({
  presetId: PRESETS[0].id,
  params: initialParams,
  activeLayerIndex: 0,
  display: {
    showLog: true,
    showBranch: true,
    showLeaf: true,
    showGrid: true,
    showAxes: false,
  },

  model: initialResult.model,
  voxels: initialResult.voxels,
  buffer: initialResult.buffer,

  setParam: (id, value) =>
    set((state) => {
      const params = { ...state.params, [id]: value };
      const result = regenerate(params);
      return {
        params,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
      };
    }),

  setPreset: (id) =>
    set(() => {
      const preset = PRESETS.find((p) => p.id === id);
      if (!preset) return {};
      const params = applyPreset(getDefaultParams(), preset);
      const result = regenerate(params);
      return {
        presetId: id,
        params,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
        activeLayerIndex: 0,
      };
    }),

  setActiveLayer: (y) => set({ activeLayerIndex: y }),

  toggleDisplay: (key) =>
    set((state) => ({
      display: { ...state.display, [key]: !state.display[key] },
    })),

  randomizeSeed: () =>
    set((state) => {
      const params = { ...state.params, randomSeed: Math.floor(Math.random() * 99999) };
      const result = regenerate(params);
      return {
        params,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
      };
    }),
}));
