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
import { getPresetById } from '../core/minecraftBlocks';
import { generateTree, type GenerationResult } from '../core/generate';
import { buildRenderBuffer } from '../core/renderBuffer';
import type { TextureSetId } from '../textures/textureSet';
import type { RenderStyleId } from '../render/renderStyle';

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
  blockColors: BlockColors;
  minecraftPalette: MinecraftPalette;
  textureSet: TextureSetId;
  renderStyle: RenderStyleId;

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
  setTextureSet: (id: TextureSetId) => void;
  setRenderStyle: (id: RenderStyleId) => void;
  randomizeSeed: () => void;
  loadSnapshot: (snapshot: TreeSnapshot) => void;
};

const DEFAULT_BLOCK_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};

function getEffectiveColorRandomness(textureSet: TextureSetId, colorRandomness: number): number {
  return textureSet === 'minecraft' ? 0 : colorRandomness;
}

function regenerate(
  params: TreeParams,
  blockColors: BlockColors,
  textureSet: TextureSetId,
): GenerationResult {
  const result = generateTree(params, blockColors);
  result.buffer = buildRenderBuffer(
    result.voxels,
    blockColors,
    getEffectiveColorRandomness(textureSet, params.colorRandomness),
  );
  return result;
}

const initialParams = applyPreset(getDefaultParams(), PRESETS[0]);
const initialBlockColors = applyPresetBlockColors(DEFAULT_BLOCK_COLORS, PRESETS[0]);
const initialMinecraftPalette = applyPresetMinecraftPalette(DEFAULT_MINECRAFT_PALETTE, PRESETS[0]);
const initialResult = regenerate(initialParams, initialBlockColors, 'flat_color');

export const useTreeStore = create<TreeState>((set) => ({
  presetId: PRESETS[0].id,
  params: initialParams,
  activeLayerIndex: 0,
  blockColors: initialBlockColors,
  minecraftPalette: initialMinecraftPalette,
  textureSet: 'flat_color',
  renderStyle: 'diorama',
  display: {
    showLog: true,
    showBranch: true,
    showLeaf: true,
    showGrid: false,
    showAxes: false,
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
      const result = regenerate(params, state.blockColors, state.textureSet);
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
      const result = regenerate(params, blockColors, state.textureSet);
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
        buffer: buildRenderBuffer(
          state.voxels,
          blockColors,
          getEffectiveColorRandomness(state.textureSet, state.params.colorRandomness),
        ),
      };
    }),

  setMinecraftPaletteEntry: (type, blockId, color) =>
    set((state) => {
      if (state.minecraftPalette[type] === blockId && (type === 'fence' || state.blockColors[type] === color)) {
        return state;
      }

      const minecraftPalette = { ...state.minecraftPalette, [type]: blockId };
      if (type === 'fence') {
        const fencePreset = getPresetById(blockId);
        const fenceColor = fencePreset?.approximateHex ?? state.blockColors.fence;
        const blockColors = { ...state.blockColors, fence: fenceColor };
        return {
          minecraftPalette,
          blockColors,
          buffer: buildRenderBuffer(
            state.voxels,
            blockColors,
            getEffectiveColorRandomness(state.textureSet, state.params.colorRandomness),
          ),
        };
      }

      const blockColors = { ...state.blockColors, [type]: color };
      return {
        minecraftPalette,
        blockColors,
        buffer: buildRenderBuffer(
          state.voxels,
          blockColors,
          getEffectiveColorRandomness(state.textureSet, state.params.colorRandomness),
        ),
      };
    }),

  setTextureSet: (id) =>
    set((state) => {
      if (state.textureSet === id) {
        return state;
      }

      return {
        textureSet: id,
        buffer: buildRenderBuffer(state.voxels, state.blockColors, getEffectiveColorRandomness(id, state.params.colorRandomness)),
      };
    }),

  setRenderStyle: (id) =>
    set((state) => {
      if (state.renderStyle === id) {
        return state;
      }

      return { renderStyle: id };
    }),

  randomizeSeed: () =>
    set((state) => {
      const params = { ...state.params, randomSeed: Math.floor(Math.random() * 999999) };
      const result = regenerate(params, state.blockColors, state.textureSet);
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
      const textureSet = snapshot.textureSet ?? 'flat_color';
      const result = regenerate(params, snapshot.blockColors, textureSet);
      const legacyRenderStyle = snapshot.renderStyle as RenderStyleId | 'editor' | undefined;
      return {
        presetId: snapshot.presetId,
        params,
        blockColors: snapshot.blockColors,
        minecraftPalette: snapshot.minecraftPalette ?? DEFAULT_MINECRAFT_PALETTE,
        textureSet,
        renderStyle: legacyRenderStyle === 'editor' ? 'flat' : (legacyRenderStyle ?? 'flat'),
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
        activeLayerIndex: 0,
      };
    }),
}));
