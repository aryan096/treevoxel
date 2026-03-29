import type { BlockColors, Preset, TreeParams } from './types';

const DEFAULT_PRESET_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
};

export const PRESETS: Preset[] = [
  {
    id: 'spruce',
    name: 'Spruce',
    description: 'Narrow conifer calibrated for small voxel builds, with layered boughs and a clean central leader.',
    growthForm: 'excurrent conifer',
    blockColors: {
      log: '#5b3a24',
      branch: '#6b4a2e',
      leaf: '#355f36',
    },
    params: {
      randomSeed: 109,
      height: 20, crownWidth: 9, crownDepth: 0.8, trunkBaseRadius: 1.25,
      trunkTaper: 0.86, trunkLean: 0, clearTrunkHeight: 0.12, trunkCurvature: 0.03, trunkNoise: 0.06,
      primaryBranchCount: 10, branchAngle: 68, branchAngleVariance: 5,
      branchLengthRatio: 0.62, branchOrderDepth: 2, branchDensity: 0.88,
      branchDroop: 0.22, apicalDominance: 0.95,
      crownShape: 'conical', crownFullness: 0.9, leafClusterRadius: 1.7,
      leafDensity: 0.86, interiorLeafPruning: 0.2,
      minBranchThickness: 1, leafCleanup: 0.55, symmetryAssist: 0.35, buildabilityBias: 0.72,
    },
  },
  {
    id: 'oak',
    name: 'Oak',
    description: 'Compact broadleaf oak with heavy scaffold limbs and a rounded canopy that still reads cleanly in voxels.',
    growthForm: 'rounded decurrent broadleaf',
    blockColors: {
      log: '#6e4a2f',
      branch: '#856331',
      leaf: '#5f8f41',
    },
    params: {
      randomSeed: 50,
      height: 18, crownWidth: 15, crownDepth: 0.58, trunkBaseRadius: 1.75,
      trunkTaper: 0.5, trunkLean: 0, clearTrunkHeight: 0.32, trunkCurvature: 0.12, trunkNoise: 0.24,
      primaryBranchCount: 6, branchAngle: 44, branchAngleVariance: 14,
      branchLengthRatio: 0.74, branchOrderDepth: 3, branchDensity: 0.62,
      branchDroop: 0.14, apicalDominance: 0.22,
      crownShape: 'spherical', crownFullness: 0.76, leafClusterRadius: 2.3,
      leafDensity: 0.76, interiorLeafPruning: 0.34,
      minBranchThickness: 1, leafCleanup: 0.52, symmetryAssist: 0.16, buildabilityBias: 0.56,
    },
  },
  {
    id: 'willow',
    name: 'Willow',
    description: 'Weeping willow tuned for a hanging curtain silhouette instead of a giant leaf blob.',
    growthForm: 'weeping broadleaf',
    blockColors: {
      log: '#7a5a3b',
      branch: '#8f6c44',
      leaf: '#7ea05a',
    },
    params: {
      randomSeed: 218,
      height: 17, crownWidth: 16, crownDepth: 0.72, trunkBaseRadius: 1.5,
      trunkTaper: 0.5, trunkLean: 2, clearTrunkHeight: 0.24, trunkCurvature: 0.16, trunkNoise: 0.28,
      primaryBranchCount: 7, branchAngle: 42, branchAngleVariance: 12,
      branchLengthRatio: 0.88, branchOrderDepth: 3, branchDensity: 0.76,
      branchDroop: 0.88, apicalDominance: 0.16,
      crownShape: 'weeping', crownFullness: 0.66, leafClusterRadius: 1.7,
      leafDensity: 0.72, interiorLeafPruning: 0.08,
      minBranchThickness: 1, leafCleanup: 0.42, symmetryAssist: 0.1, buildabilityBias: 0.42,
    },
  },
  {
    id: 'italian-cypress',
    name: 'Italian Cypress',
    description: 'Tall, formal columnar evergreen kept narrow enough to stay crisp on a small grid.',
    growthForm: 'fastigiate conifer',
    blockColors: {
      log: '#5d3b28',
      branch: '#674330',
      leaf: '#2f5b35',
    },
    params: {
      randomSeed: 173,
      height: 21, crownWidth: 7, crownDepth: 0.98, trunkBaseRadius: 1,
      trunkTaper: 0.94, trunkLean: 0, clearTrunkHeight: 0.02, trunkCurvature: 0.01, trunkNoise: 0.02,
      primaryBranchCount: 16, branchAngle: 24, branchAngleVariance: 4,
      branchLengthRatio: 0.72, branchOrderDepth: 2, branchDensity: 1,
      branchDroop: 0.03, apicalDominance: 0.92,
      crownShape: 'columnar', crownFullness: 0.98, leafClusterRadius: 1.8,
      leafDensity: 0.98, interiorLeafPruning: 0.06,
      minBranchThickness: 1, leafCleanup: 0.5, symmetryAssist: 0.56, buildabilityBias: 0.82,
    },
  },
  {
    id: 'baobab',
    name: 'Baobab',
    description: 'Bottle-trunk savanna form with a massive base and sparse crown sized for a 15-20 block build.',
    growthForm: 'bottle-trunk savanna tree',
    blockColors: {
      log: '#8a6a53',
      branch: '#9c7c60',
      leaf: '#7f944f',
    },
    params: {
      randomSeed: 204,
      height: 16, crownWidth: 16, crownDepth: 0.32, trunkBaseRadius: 2.25,
      trunkTaper: 0.18, trunkLean: 0, clearTrunkHeight: 0.44, trunkCurvature: 0.04, trunkNoise: 0.08,
      primaryBranchCount: 6, branchAngle: 62, branchAngleVariance: 12,
      branchLengthRatio: 0.92, branchOrderDepth: 2, branchDensity: 0.44,
      branchDroop: 0.04, apicalDominance: 0.08,
      crownShape: 'vase', crownFullness: 0.34, leafClusterRadius: 2,
      leafDensity: 0.42, interiorLeafPruning: 0.72,
      minBranchThickness: 2, leafCleanup: 0.64, symmetryAssist: 0.18, buildabilityBias: 0.72,
    },
  },
  {
    id: 'monkey-puzzle',
    name: 'Monkey Puzzle',
    description: 'Architectural conifer with separated whorls and a spiky outline that stays legible in voxels.',
    growthForm: 'candelabra conifer',
    blockColors: {
      log: '#4b3427',
      branch: '#5d4330',
      leaf: '#4a6b39',
    },
    params: {
      randomSeed: 104,
      height: 19, crownWidth: 12, crownDepth: 0.72, trunkBaseRadius: 1.5,
      trunkTaper: 0.58, trunkLean: 0, clearTrunkHeight: 0.18, trunkCurvature: 0.05, trunkNoise: 0.1,
      primaryBranchCount: 8, branchAngle: 32, branchAngleVariance: 8,
      branchLengthRatio: 0.74, branchOrderDepth: 2, branchDensity: 0.72,
      branchDroop: 0.03, apicalDominance: 0.72,
      crownShape: 'ovoid', crownFullness: 0.72, leafClusterRadius: 1.7,
      leafDensity: 0.76, interiorLeafPruning: 0.24,
      minBranchThickness: 1, leafCleanup: 0.62, symmetryAssist: 0.4, buildabilityBias: 0.64,
    },
  },
  {
    id: 'joshua-tree',
    name: 'Joshua Tree',
    description: 'Desert yucca form with twisted arms and sparse pom-pom tips instead of a full canopy mass.',
    growthForm: 'desert yucca tree',
    blockColors: {
      log: '#705840',
      branch: '#806648',
      leaf: '#71854d',
    },
    params: {
      randomSeed: 120,
      height: 15, crownWidth: 11, crownDepth: 0.8, trunkBaseRadius: 1.35,
      trunkTaper: 0.52, trunkLean: 4, clearTrunkHeight: 0.18, trunkCurvature: 0.42, trunkNoise: 0.28,
      primaryBranchCount: 5, branchAngle: 54, branchAngleVariance: 22,
      branchLengthRatio: 0.62, branchOrderDepth: 2, branchDensity: 0.48,
      branchDroop: 0.02, apicalDominance: 0.14,
      crownShape: 'irregular', crownFullness: 0.44, leafClusterRadius: 1.6,
      leafDensity: 0.78, interiorLeafPruning: 0.6,
      minBranchThickness: 1, leafCleanup: 0.72, symmetryAssist: 0.06, buildabilityBias: 0.46,
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
