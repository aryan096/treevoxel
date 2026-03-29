import { create } from 'zustand';
import type {
  TreeParams,
  PresetId,
  VoxelStore,
  RenderBuffer,
  TreeModel,
  BlockColors,
  BlockType,
  TreeSnapshot,
} from '../core/types';
import { getDefaultParams } from '../core/parameters';
import { PRESETS, applyPreset, applyPresetBlockColors } from '../core/presets';
import { generateTree, type GenerationResult } from '../core/generate';
import { buildRenderBuffer } from '../core/renderBuffer';

type DisplayToggles = {
  showLog: boolean;
  showBranch: boolean;
  showLeaf: boolean;
  showGrid: boolean;
  showAxes: boolean;
  darkMode: boolean;
};

type TreeState = {
  // Source of truth
  presetId: PresetId;
  params: TreeParams;
  activeLayerIndex: number;
  display: DisplayToggles;
  blockColors: BlockColors;

  // Derived (computed eagerly on param change)
  model: TreeModel;
  voxels: VoxelStore;
  buffer: RenderBuffer;

  // Actions
  setParam: (id: string, value: number | string) => void;
  setPreset: (id: PresetId) => void;
  setActiveLayer: (y: number) => void;
  toggleDisplay: (key: keyof DisplayToggles) => void;
  setBlockColor: (type: BlockType, color: string) => void;
  randomizeSeed: () => void;
  loadSnapshot: (snapshot: TreeSnapshot) => void;
};

const DEFAULT_BLOCK_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
};

function regenerate(params: TreeParams, blockColors: BlockColors): GenerationResult {
  return generateTree(params, blockColors);
}

const initialParams = applyPreset(getDefaultParams(), PRESETS[0]);
const initialBlockColors = applyPresetBlockColors(DEFAULT_BLOCK_COLORS, PRESETS[0]);
const initialResult = regenerate(initialParams, initialBlockColors);

export const useTreeStore = create<TreeState>((set) => ({
  presetId: PRESETS[0].id,
  params: initialParams,
  activeLayerIndex: 0,
  blockColors: initialBlockColors,
  display: {
    showLog: true,
    showBranch: true,
    showLeaf: true,
    showGrid: true,
    showAxes: true,
    darkMode: false,
  },

  model: initialResult.model,
  voxels: initialResult.voxels,
  buffer: initialResult.buffer,

  setParam: (id, value) =>
    set((state) => {
      const params = { ...state.params, [id]: value };
      const result = regenerate(params, state.blockColors);
      return {
        params,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
      };
    }),

  setPreset: (id) =>
    set((state) => {
      const preset = PRESETS.find((p) => p.id === id);
      if (!preset) return {};
      const params = applyPreset(getDefaultParams(), preset);
      const blockColors = applyPresetBlockColors(state.blockColors, preset);
      const result = regenerate(params, blockColors);
      return {
        presetId: id,
        params,
        blockColors,
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

  setBlockColor: (type, color) =>
    set((state) => {
      const blockColors = { ...state.blockColors, [type]: color };
      return {
        blockColors,
        buffer: buildRenderBuffer(state.voxels, blockColors, state.params.colorRandomness),
      };
    }),

  randomizeSeed: () =>
    set((state) => {
      const params = { ...state.params, randomSeed: Math.floor(Math.random() * 99999) };
      const result = regenerate(params, state.blockColors);
      return {
        params,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
      };
    }),

  loadSnapshot: (snapshot) =>
    set(() => {
      const params = { ...getDefaultParams(), ...snapshot.params };
      const result = regenerate(params, snapshot.blockColors);
      return {
        presetId: snapshot.presetId,
        params,
        blockColors: snapshot.blockColors,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
        activeLayerIndex: 0,
      };
    }),
}));
