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
    description: 'Tall, narrow conifer with a strong central leader and short, layered branches.',
    growthForm: 'excurrent conifer',
    blockColors: {
      log: '#5b3a24',
      branch: '#6b4a2e',
      leaf: '#355f36',
    },
    params: {
      height: 25, crownWidth: 8, crownDepth: 0.7, trunkBaseRadius: 1.5,
      trunkTaper: 0.85, trunkLean: 0, clearTrunkHeight: 0.15, trunkCurvature: 0.05, trunkNoise: 0.08,
      primaryBranchCount: 10, branchAngle: 60, branchAngleVariance: 5,
      branchLengthRatio: 0.5, branchOrderDepth: 1, branchDensity: 0.8,
      branchDroop: 0.3, apicalDominance: 0.9,
      crownShape: 'conical', crownFullness: 0.85, leafClusterRadius: 1.5,
      leafDensity: 0.8, interiorLeafPruning: 0.2,
    },
  },
  {
    id: 'oak',
    name: 'Oak',
    description: 'Broad, rounded deciduous tree with a wide crown and thick scaffold branches.',
    growthForm: 'rounded decurrent broadleaf',
    blockColors: {
      log: '#6e4a2f',
      branch: '#856331',
      leaf: '#5f8f41',
    },
    params: {
      height: 18, crownWidth: 16, crownDepth: 0.55, trunkBaseRadius: 2.5,
      trunkTaper: 0.6, trunkLean: 0, clearTrunkHeight: 0.35, trunkCurvature: 0.15, trunkNoise: 0.32,
      primaryBranchCount: 5, branchAngle: 45, branchAngleVariance: 15,
      branchLengthRatio: 0.8, branchOrderDepth: 3, branchDensity: 0.5,
      branchDroop: 0.15, apicalDominance: 0.3,
      crownShape: 'spherical', crownFullness: 0.75, leafClusterRadius: 2.5,
      leafDensity: 0.7, interiorLeafPruning: 0.4,
    },
  },
  {
    id: 'willow',
    name: 'Willow',
    description: 'Graceful tree with long, drooping branches and a wide, cascading crown.',
    growthForm: 'weeping broadleaf',
    blockColors: {
      log: '#7a5a3b',
      branch: '#8f6c44',
      leaf: '#7ea05a',
    },
    params: {
      height: 16, crownWidth: 18, crownDepth: 0.65, trunkBaseRadius: 2,
      trunkTaper: 0.5, trunkLean: 3, clearTrunkHeight: 0.25, trunkCurvature: 0.2, trunkNoise: 0.38,
      primaryBranchCount: 7, branchAngle: 50, branchAngleVariance: 12,
      branchLengthRatio: 0.9, branchOrderDepth: 3, branchDensity: 0.7,
      branchDroop: 0.85, apicalDominance: 0.2,
      crownShape: 'weeping', crownFullness: 0.6, leafClusterRadius: 1.5,
      leafDensity: 0.6, interiorLeafPruning: 0.1,
    },
  },
  {
    id: 'italian-cypress',
    name: 'Italian Cypress',
    description: 'Very narrow, columnar evergreen with dense upward branching and a formal silhouette.',
    growthForm: 'fastigiate conifer',
    blockColors: {
      log: '#5d3b28',
      branch: '#674330',
      leaf: '#2f5b35',
    },
    params: {
      height: 32, crownWidth: 6, crownDepth: 0.92, trunkBaseRadius: 1.5,
      trunkTaper: 0.9, trunkLean: 0, clearTrunkHeight: 0.08, trunkCurvature: 0.03, trunkNoise: 0.04,
      primaryBranchCount: 11, branchAngle: 20, branchAngleVariance: 4,
      branchLengthRatio: 0.38, branchOrderDepth: 1, branchDensity: 0.95,
      branchDroop: 0.02, apicalDominance: 0.98,
      crownShape: 'columnar', crownFullness: 0.92, leafClusterRadius: 1.2,
      leafDensity: 0.88, interiorLeafPruning: 0.15,
    },
  },
  {
    id: 'baobab',
    name: 'Baobab',
    description: 'Massive bottle trunk with sparse, heavy limbs supporting a broad, high canopy.',
    growthForm: 'bottle-trunk savanna tree',
    blockColors: {
      log: '#8a6a53',
      branch: '#9c7c60',
      leaf: '#7f944f',
    },
    params: {
      height: 20, crownWidth: 18, crownDepth: 0.38, trunkBaseRadius: 4.5,
      trunkTaper: 0.25, trunkLean: 0, clearTrunkHeight: 0.55, trunkCurvature: 0.08, trunkNoise: 0.15,
      primaryBranchCount: 6, branchAngle: 58, branchAngleVariance: 10,
      branchLengthRatio: 0.68, branchOrderDepth: 2, branchDensity: 0.35,
      branchDroop: 0.08, apicalDominance: 0.12,
      crownShape: 'vase', crownFullness: 0.35, leafClusterRadius: 2.2,
      leafDensity: 0.32, interiorLeafPruning: 0.72,
    },
  },
  {
    id: 'monkey-puzzle',
    name: 'Monkey Puzzle',
    description: 'Architectural conifer with whorled, candelabra-like branches and a bold spiky outline.',
    growthForm: 'candelabra conifer',
    blockColors: {
      log: '#4b3427',
      branch: '#5d4330',
      leaf: '#4a6b39',
    },
    params: {
      height: 26, crownWidth: 14, crownDepth: 0.68, trunkBaseRadius: 2.2,
      trunkTaper: 0.58, trunkLean: 0, clearTrunkHeight: 0.18, trunkCurvature: 0.08, trunkNoise: 0.12,
      primaryBranchCount: 8, branchAngle: 34, branchAngleVariance: 8,
      branchLengthRatio: 0.72, branchOrderDepth: 2, branchDensity: 0.72,
      branchDroop: 0.04, apicalDominance: 0.7,
      crownShape: 'ovoid', crownFullness: 0.78, leafClusterRadius: 1.4,
      leafDensity: 0.7, interiorLeafPruning: 0.25,
    },
  },
  {
    id: 'joshua-tree',
    name: 'Joshua Tree',
    description: 'Desert tree with twisted branching arms and clustered leaf pom-poms at the tips.',
    growthForm: 'desert yucca tree',
    blockColors: {
      log: '#705840',
      branch: '#806648',
      leaf: '#71854d',
    },
    params: {
      height: 15, crownWidth: 13, crownDepth: 0.76, trunkBaseRadius: 1.8,
      trunkTaper: 0.55, trunkLean: 4, clearTrunkHeight: 0.16, trunkCurvature: 0.42, trunkNoise: 0.32,
      primaryBranchCount: 5, branchAngle: 56, branchAngleVariance: 24,
      branchLengthRatio: 0.58, branchOrderDepth: 2, branchDensity: 0.45,
      branchDroop: 0.02, apicalDominance: 0.2,
      crownShape: 'irregular', crownFullness: 0.48, leafClusterRadius: 1.2,
      leafDensity: 0.62, interiorLeafPruning: 0.58,
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
