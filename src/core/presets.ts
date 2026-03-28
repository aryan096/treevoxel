import type { Preset, TreeParams } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'spruce',
    name: 'Spruce',
    description: 'Tall, narrow conifer with a strong central leader and short, layered branches.',
    growthForm: 'excurrent conifer',
    params: {
      height: 25, crownWidth: 8, crownDepth: 0.7, trunkBaseRadius: 1.5,
      trunkTaper: 0.85, trunkLean: 0, clearTrunkHeight: 0.15, trunkCurvature: 0.05, trunkNoise: 0.08,
      primaryBranchCount: 10, branchAngle: 60, branchAngleVariance: 5,
      branchLengthRatio: 0.5, branchOrderDepth: 1, branchDensity: 0.8,
      branchDroop: 0.3, apicalDominance: 0.9,
      crownShape: 'conical', crownFullness: 0.85, leafClusterRadius: 1.5,
      leafDensity: 0.8, interiorLeafPruning: 0.2, phototropism: 0.7,
      windBias: 0, age: 0.5,
    },
  },
  {
    id: 'oak',
    name: 'Oak',
    description: 'Broad, rounded deciduous tree with a wide crown and thick scaffold branches.',
    growthForm: 'rounded decurrent broadleaf',
    params: {
      height: 18, crownWidth: 16, crownDepth: 0.55, trunkBaseRadius: 2.5,
      trunkTaper: 0.6, trunkLean: 0, clearTrunkHeight: 0.35, trunkCurvature: 0.15, trunkNoise: 0.32,
      primaryBranchCount: 5, branchAngle: 45, branchAngleVariance: 15,
      branchLengthRatio: 0.8, branchOrderDepth: 3, branchDensity: 0.5,
      branchDroop: 0.15, apicalDominance: 0.3,
      crownShape: 'spherical', crownFullness: 0.75, leafClusterRadius: 2.5,
      leafDensity: 0.7, interiorLeafPruning: 0.4, phototropism: 0.4,
      windBias: 0, age: 0.6,
    },
  },
  {
    id: 'willow',
    name: 'Willow',
    description: 'Graceful tree with long, drooping branches and a wide, cascading crown.',
    growthForm: 'weeping broadleaf',
    params: {
      height: 16, crownWidth: 18, crownDepth: 0.65, trunkBaseRadius: 2,
      trunkTaper: 0.5, trunkLean: 3, clearTrunkHeight: 0.25, trunkCurvature: 0.2, trunkNoise: 0.38,
      primaryBranchCount: 7, branchAngle: 50, branchAngleVariance: 12,
      branchLengthRatio: 0.9, branchOrderDepth: 3, branchDensity: 0.7,
      branchDroop: 0.85, apicalDominance: 0.2,
      crownShape: 'weeping', crownFullness: 0.6, leafClusterRadius: 1.5,
      leafDensity: 0.6, interiorLeafPruning: 0.1, phototropism: 0.3,
      windBias: 0.1, age: 0.5,
    },
  },
];

/** Merge a preset's params over a base parameter set. Returns a new object. */
export function applyPreset(base: TreeParams, preset: Preset): TreeParams {
  return { ...base, ...preset.params };
}
