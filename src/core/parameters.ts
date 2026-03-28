import type { ParameterDef, CategoricalParameterDef, TreeParams } from './types';

export const PARAMETER_DEFS: ParameterDef[] = [
  {
    id: 'randomSeed', label: 'Random Seed', group: 'environment',
    description: 'Seed for deterministic random variation. Same seed = same tree.',
    effectIncrease: 'Different random variation.',
    effectDecrease: 'Different random variation.',
    min: 0, max: 99999, step: 1, defaultValue: 42,
  },
  {
    id: 'colorRandomness', label: 'Color Randomness', group: 'environment',
    description: 'How much per-block color variation is applied to logs, branches, and leaves.',
    effectIncrease: 'More mottled, varied block colors.',
    effectDecrease: 'Flatter, more uniform block colors.',
    min: 0, max: 2, step: 0.05, defaultValue: 1,
  },
  // --- Global Dimensions ---
  {
    id: 'height', label: 'Height', group: 'dimensions',
    description: 'Total tree height in blocks from ground to crown top.',
    effectIncrease: 'Taller tree with more vertical layers.',
    effectDecrease: 'Shorter, more compact tree.',
    min: 5, max: 80, step: 1, defaultValue: 20,
  },
  {
    id: 'crownWidth', label: 'Crown Width', group: 'dimensions',
    description: 'Maximum lateral spread of the crown in blocks.',
    effectIncrease: 'Wider, more spreading canopy.',
    effectDecrease: 'Narrower, more columnar crown.',
    min: 2, max: 40, step: 1, defaultValue: 12,
  },
  {
    id: 'crownDepth', label: 'Crown Depth', group: 'dimensions',
    description: 'Fraction of total height occupied by the crown canopy.',
    effectIncrease: 'Canopy extends further down the trunk.',
    effectDecrease: 'Canopy concentrated at the top, longer bare trunk.',
    min: 0.1, max: 0.95, step: 0.05, defaultValue: 0.6,
  },
  // --- Trunk ---
  {
    id: 'trunkBaseRadius', label: 'Trunk Base Radius', group: 'trunk',
    description: 'Trunk thickness near the ground in blocks.',
    effectIncrease: 'Thicker, more massive trunk.',
    effectDecrease: 'Thinner, more delicate trunk.',
    min: 1, max: 6, step: 0.5, defaultValue: 2,
  },
  {
    id: 'trunkTaper', label: 'Trunk Taper', group: 'trunk',
    description: 'How quickly the trunk narrows with height (0 = no taper, 1 = full taper to tip).',
    effectIncrease: 'Trunk narrows faster toward the top.',
    effectDecrease: 'Trunk stays thick higher up.',
    min: 0.1, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'trunkLean', label: 'Trunk Lean', group: 'trunk',
    description: 'Overall tilt of the trunk axis in degrees from vertical.',
    effectIncrease: 'Tree leans more to one side.',
    effectDecrease: 'Tree grows more upright.',
    min: 0, max: 30, step: 1, defaultValue: 0,
  },
  {
    id: 'trunkLeanDirection', label: 'Trunk Lean Direction', group: 'trunk',
    description: 'Compass-like direction of the trunk lean around the vertical axis in degrees.',
    effectIncrease: 'Lean rotates clockwise around the tree.',
    effectDecrease: 'Lean rotates counterclockwise around the tree.',
    min: 0, max: 360, step: 5, defaultValue: 0,
  },
  {
    id: 'clearTrunkHeight', label: 'Clear Trunk Height', group: 'trunk',
    description: 'Fraction of total height before major branches emerge.',
    effectIncrease: 'More bare trunk below the crown.',
    effectDecrease: 'Branches start lower on the trunk.',
    min: 0.05, max: 0.8, step: 0.05, defaultValue: 0.3,
  },
  {
    id: 'trunkCurvature', label: 'Trunk Curvature', group: 'trunk',
    description: 'How much the trunk bends gradually along its length.',
    effectIncrease: 'More curved, sinuous trunk.',
    effectDecrease: 'Straighter trunk.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.1,
  },
  {
    id: 'trunkNoise', label: 'Trunk Noise', group: 'trunk',
    description: 'Seeded wobble that deforms the trunk axis so it feels less perfectly centered.',
    effectIncrease: 'More knotted, irregular trunk deformation.',
    effectDecrease: 'Cleaner, more symmetrical trunk.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.2,
  },
  // --- Branching ---
  {
    id: 'primaryBranchCount', label: 'Primary Branch Count', group: 'branching',
    description: 'Number of major scaffold branches emerging from the trunk.',
    effectIncrease: 'More main limbs, bushier structure.',
    effectDecrease: 'Fewer main limbs, sparser crown.',
    min: 2, max: 16, step: 1, defaultValue: 6,
  },
  {
    id: 'branchAngle', label: 'Branch Angle', group: 'branching',
    description: 'Average angle in degrees at which branches emerge from their parent.',
    effectIncrease: 'Branches spread more horizontally.',
    effectDecrease: 'Branches grow more upward, closer to trunk.',
    min: 10, max: 90, step: 5, defaultValue: 45,
  },
  {
    id: 'branchAngleVariance', label: 'Branch Angle Variance', group: 'branching',
    description: 'Random variation in branch emergence angle.',
    effectIncrease: 'More irregular, natural-looking angles.',
    effectDecrease: 'More uniform, symmetric branching.',
    min: 0, max: 30, step: 1, defaultValue: 10,
  },
  {
    id: 'branchLengthRatio', label: 'Branch Length Ratio', group: 'branching',
    description: 'Branch length as a fraction of the distance from its start to the crown edge.',
    effectIncrease: 'Longer branches, wider spread.',
    effectDecrease: 'Shorter branches, tighter crown.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'branchOrderDepth', label: 'Branch Order Depth', group: 'branching',
    description: 'How many levels of sub-branching are generated (1 = no sub-branches).',
    effectIncrease: 'More detailed, finer branching structure.',
    effectDecrease: 'Simpler branching with fewer subdivisions.',
    min: 1, max: 4, step: 1, defaultValue: 2,
  },
  {
    id: 'branchDensity', label: 'Branch Density', group: 'branching',
    description: 'How many branches appear within active branching regions.',
    effectIncrease: 'Denser, more crowded branching.',
    effectDecrease: 'Sparser, more open branching.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.6,
  },
  {
    id: 'branchDroop', label: 'Branch Droop', group: 'branching',
    description: 'Tendency for branches to curve downward as they extend.',
    effectIncrease: 'Weeping, drooping branches.',
    effectDecrease: 'Level or ascending branches.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.2,
  },
  {
    id: 'apicalDominance', label: 'Apical Dominance', group: 'branching',
    description: 'How strongly the central leader suppresses lateral branch growth.',
    effectIncrease: 'Stronger central leader, conical crown.',
    effectDecrease: 'Weaker leader, broader crown with competing branches.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.5,
  },
  // --- Crown ---
  {
    id: 'crownFullness', label: 'Crown Fullness', group: 'crown',
    description: 'How densely the crown volume is occupied by foliage.',
    effectIncrease: 'Dense, full canopy.',
    effectDecrease: 'Open, airy canopy with gaps.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'leafClusterRadius', label: 'Leaf Cluster Radius', group: 'crown',
    description: 'Typical leaf blob radius around branch tips in blocks.',
    effectIncrease: 'Larger, puffier leaf clusters.',
    effectDecrease: 'Smaller, tighter leaf clusters.',
    min: 1, max: 5, step: 0.5, defaultValue: 2,
  },
  {
    id: 'leafDensity', label: 'Leaf Density', group: 'crown',
    description: 'Amount of foliage generated per terminal branch region.',
    effectIncrease: 'More leaf blocks, denser canopy.',
    effectDecrease: 'Fewer leaf blocks, sparser canopy.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'interiorLeafPruning', label: 'Interior Leaf Pruning', group: 'crown',
    description: 'How aggressively shaded interior leaves are removed.',
    effectIncrease: 'Open crown shell, hollow interior.',
    effectDecrease: 'Dense canopy throughout.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.3,
  },
  // --- Minecraft Readability ---
  {
    id: 'minBranchThickness', label: 'Min Branch Thickness', group: 'minecraft',
    description: 'Minimum branch width in blocks, prevents noisy single-block artifacts.',
    effectIncrease: 'Thicker minimum branches, cleaner build.',
    effectDecrease: 'Allows thinner branches, more detail but noisier.',
    min: 1, max: 3, step: 1, defaultValue: 1,
  },
  {
    id: 'leafCleanup', label: 'Leaf Cleanup', group: 'minecraft',
    description: 'Remove floating or isolated leaf blocks.',
    effectIncrease: 'Cleaner leaf placement, fewer floaters.',
    effectDecrease: 'More organic but messier leaf scatter.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.5,
  },
  {
    id: 'symmetryAssist', label: 'Symmetry Assist', group: 'minecraft',
    description: 'Reduce awkward random noise by enforcing partial symmetry.',
    effectIncrease: 'More symmetric, tidier appearance.',
    effectDecrease: 'More natural asymmetry.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.3,
  },
  {
    id: 'buildabilityBias', label: 'Buildability Bias', group: 'minecraft',
    description: 'Prioritize clearer silhouettes over botanical detail.',
    effectIncrease: 'Simpler, easier to build shapes.',
    effectDecrease: 'More complex, botanically detailed shapes.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.5,
  },
];

export const CATEGORICAL_PARAMS: CategoricalParameterDef[] = [
  {
    id: 'crownShape',
    label: 'Crown Shape',
    group: 'crown',
    description: 'Overall shape of the crown envelope.',
    options: ['conical', 'spherical', 'ovoid', 'columnar', 'vase', 'weeping', 'irregular'],
    defaultValue: 'ovoid',
  },
];

/** Build a full TreeParams object from all parameter defaults. */
export function getDefaultParams(): TreeParams {
  const params: Record<string, number | string> = {};
  for (const p of PARAMETER_DEFS) {
    params[p.id] = p.defaultValue;
  }
  for (const p of CATEGORICAL_PARAMS) {
    params[p.id] = p.defaultValue;
  }
  return params as unknown as TreeParams;
}
