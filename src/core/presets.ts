import type { BlockColors, MinecraftPalette, Preset, TreeParams } from './types';

const DEFAULT_PRESET_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};

export const DEFAULT_MINECRAFT_PALETTE: MinecraftPalette = {
  log: 'oak_log',
  branch: 'stripped_oak_log',
  fence: 'oak_fence',
  leaf: 'oak_leaves',
};

export const PRESETS: Preset[] = [
  {
    id: 'spruce',
    name: 'Spruce',
    description: 'Tall excurrent spruce with a strict central leader, short upper tiers, and a narrow conical silhouette.',
    growthForm: 'excurrent conifer',
    blockColors: {
      log: '#5a3925',
      branch: '#66462f',
      leaf: '#2f5632',
      fence: '#66462f',
    },
    minecraftPalette: {
      log: 'spruce_log',
      branch: 'stripped_spruce_log',
      fence: 'spruce_fence',
      leaf: 'spruce_leaves',
    },
    params: {
      randomSeed: 131,
      height: 22, crownWidth: 8, crownDepth: 0.82, trunkBaseRadius: 1.25,
      trunkTaper: 0.9, trunkLean: 0, clearTrunkHeight: 0.1, trunkCurvature: 0.02, trunkNoise: 0.05,
      primaryBranchCount: 11, branchAngle: 64, branchAngleVariance: 4,
      branchLengthRatio: 0.56, branchOrderDepth: 2, branchDensity: 0.9,
      branchDroop: 0.16, apicalDominance: 0.98,
      crownShape: 'conical', crownFullness: 0.9, leafClusterRadius: 1.7,
      leafDensity: 0.92, interiorLeafPruning: 0.2,
      minBranchThickness: 1, leafCleanup: 0.62, symmetryAssist: 0.34, buildabilityBias: 0.76,
    },
  },
  {
    id: 'oak',
    name: 'Oak',
    description: 'Broad, decurrent oak with a stout trunk, heavy low scaffolds, and a rounded canopy wider than it is tall.',
    growthForm: 'rounded decurrent broadleaf',
    blockColors: {
      log: '#70492f',
      branch: '#7f5d37',
      leaf: '#5e8744',
      fence: '#7f5d37',
    },
    minecraftPalette: {
      log: 'oak_log',
      branch: 'stripped_oak_log',
      fence: 'oak_fence',
      leaf: 'oak_leaves',
    },
    params: {
      randomSeed: 58,
      height: 18, crownWidth: 17, crownDepth: 0.62, trunkBaseRadius: 2,
      trunkTaper: 0.46, trunkLean: 0, clearTrunkHeight: 0.26, trunkCurvature: 0.11, trunkNoise: 0.22,
      primaryBranchCount: 5, branchAngle: 52, branchAngleVariance: 12,
      branchLengthRatio: 0.82, branchOrderDepth: 3, branchDensity: 0.56,
      branchDroop: 0.1, apicalDominance: 0.18,
      crownShape: 'ovoid', crownFullness: 0.82, leafClusterRadius: 2.6,
      leafDensity: 0.84, interiorLeafPruning: 0.3,
      minBranchThickness: 1, leafCleanup: 0.58, symmetryAssist: 0.14, buildabilityBias: 0.58,
    },
  },
  {
    id: 'willow',
    name: 'Willow',
    description: 'Weeping willow with a lifted crown core and long hanging curtains that read as drooping branchwork, not a leaf sphere.',
    growthForm: 'weeping broadleaf',
    blockColors: {
      log: '#79603f',
      branch: '#8a6f49',
      leaf: '#7a9a58',
      fence: '#8a6f49',
    },
    minecraftPalette: {
      log: 'oak_log',
      branch: 'stripped_oak_log',
      fence: 'oak_fence',
      leaf: 'oak_leaves',
    },
    params: {
      randomSeed: 227,
      height: 19, crownWidth: 18, crownDepth: 0.74, trunkBaseRadius: 1.5,
      trunkTaper: 0.48, trunkLean: 2, clearTrunkHeight: 0.28, trunkCurvature: 0.18, trunkNoise: 0.24,
      primaryBranchCount: 6, branchAngle: 34, branchAngleVariance: 10,
      branchLengthRatio: 0.96, branchOrderDepth: 3, branchDensity: 0.68,
      branchDroop: 0.94, apicalDominance: 0.12,
      crownShape: 'weeping', crownFullness: 0.68, leafClusterRadius: 1.6,
      leafDensity: 0.76, interiorLeafPruning: 0.12,
      minBranchThickness: 1, leafCleanup: 0.48, symmetryAssist: 0.08, buildabilityBias: 0.44,
    },
  },
];

/** Merge a preset's params over a base parameter set. Returns a new object. */
export function applyPreset(base: TreeParams, preset: Preset): TreeParams {
  return { ...base, ...preset.params };
}

/** Merge a preset's block colors over a base palette. Returns a new object. */
export function applyPresetBlockColors(base: BlockColors, preset: Preset): BlockColors {
  return { ...base, ...DEFAULT_PRESET_COLORS, ...preset.blockColors };
}

/** Merge a preset's Minecraft palette over a base palette. Returns a new object. */
export function applyPresetMinecraftPalette(base: MinecraftPalette, preset: Preset): MinecraftPalette {
  return { ...base, ...DEFAULT_MINECRAFT_PALETTE, ...(preset.minecraftPalette ?? {}) };
}
