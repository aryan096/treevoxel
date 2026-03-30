import { create } from 'zustand';
import type {
  TreeParams,
  PresetId,
  VoxelStore,
  RenderBuffer,
  TreeModel,
  BlockColors,
  BlockType,
  MinecraftPalette,
  TreeSnapshot,
} from '../core/types';
import { getDefaultParams } from '../core/parameters';
import {
  PRESETS,
  DEFAULT_MINECRAFT_PALETTE,
  applyPreset,
  applyPresetBlockColors,
  applyPresetMinecraftPalette,
} from '../core/presets';
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
  minecraftPalette: MinecraftPalette;

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
  setMinecraftPaletteEntry: (type: keyof MinecraftPalette, blockId: string, color: string) => void;
  randomizeSeed: () => void;
  loadSnapshot: (snapshot: TreeSnapshot) => void;
};

const DEFAULT_BLOCK_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};

function regenerate(params: TreeParams, blockColors: BlockColors): GenerationResult {
  return generateTree(params, blockColors);
}

const initialParams = applyPreset(getDefaultParams(), PRESETS[0]);
const initialBlockColors = applyPresetBlockColors(DEFAULT_BLOCK_COLORS, PRESETS[0]);
const initialMinecraftPalette = applyPresetMinecraftPalette(DEFAULT_MINECRAFT_PALETTE, PRESETS[0]);
const initialResult = regenerate(initialParams, initialBlockColors);

export const useTreeStore = create<TreeState>((set) => ({
  presetId: PRESETS[0].id,
  params: initialParams,
  activeLayerIndex: 0,
  blockColors: initialBlockColors,
  minecraftPalette: initialMinecraftPalette,
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
      if (state.params[id as keyof TreeParams] === value) {
        return state;
      }

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
      const minecraftPalette = applyPresetMinecraftPalette(state.minecraftPalette, preset);
      const result = regenerate(params, blockColors);
      return {
        presetId: id,
        params,
        blockColors,
        minecraftPalette,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
        activeLayerIndex: 0,
      };
    }),

  setActiveLayer: (y) =>
    set((state) => {
      if (state.activeLayerIndex === y) {
        return state;
      }

      return { activeLayerIndex: y };
    }),

  toggleDisplay: (key) =>
    set((state) => ({
      display: { ...state.display, [key]: !state.display[key] },
    })),

  setBlockColor: (type, color) =>
    set((state) => {
      if (state.blockColors[type] === color) {
        return state;
      }

      const blockColors = { ...state.blockColors, [type]: color };
      return {
        blockColors,
        buffer: buildRenderBuffer(state.voxels, blockColors, state.params.colorRandomness),
      };
    }),

  setMinecraftPaletteEntry: (type, blockId, color) =>
    set((state) => {
      if (state.minecraftPalette[type] === blockId && (type === 'fence' || state.blockColors[type] === color)) {
        return state;
      }

      const minecraftPalette = { ...state.minecraftPalette, [type]: blockId };
      if (type === 'fence') {
        return { minecraftPalette };
      }

      const blockColors = { ...state.blockColors, [type]: color };
      return {
        minecraftPalette,
        blockColors,
        buffer: buildRenderBuffer(state.voxels, blockColors, state.params.colorRandomness),
      };
    }),

  randomizeSeed: () =>
    set((state) => {
      const params = { ...state.params, randomSeed: Math.floor(Math.random() * 999999) };
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
        minecraftPalette: snapshot.minecraftPalette ?? DEFAULT_MINECRAFT_PALETTE,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
        activeLayerIndex: 0,
      };
    }),
}));
