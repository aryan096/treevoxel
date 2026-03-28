// --- Block Types ---
export type BlockType = 'log' | 'branch' | 'leaf';

// --- Voxel Storage ---
export type VoxelStore = {
  layers: Map<number, Map<number, BlockType>>;
  bounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  };
  count: number;
};

export type RenderBuffer = {
  matrices: Float32Array;
  types: Uint8Array;
  colors: Float32Array;
  count: number;
};

export type BlockColors = Record<BlockType, string>;

export type TreeSnapshot = {
  presetId: PresetId;
  params: TreeParams;
  blockColors: BlockColors;
};

// --- Skeleton ---
export type BranchRole = 'trunk' | 'scaffold' | 'secondary' | 'twig';

export type SkeletonNode = {
  position: [number, number, number];
  parentIndex: number | null;
  order: number;
  radius: number;
  role: BranchRole;
  length: number;
  direction: [number, number, number];
};

export type TreeModel = {
  nodes: SkeletonNode[];
  leafClusters: LeafCluster[];
};

export type LeafCluster = {
  center: [number, number, number];
  radius: number;
  density: number;
};

// --- Crown Shapes ---
export type CrownShape =
  | 'conical'
  | 'spherical'
  | 'ovoid'
  | 'columnar'
  | 'vase'
  | 'weeping'
  | 'irregular';

// --- Parameters ---
export type ParameterGroup =
  | 'dimensions'
  | 'trunk'
  | 'branching'
  | 'crown'
  | 'environment'
  | 'minecraft';

export type ParameterDef = {
  id: string;
  label: string;
  group: ParameterGroup;
  description: string;
  effectIncrease: string;
  effectDecrease: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export type CategoricalParameterDef = {
  id: 'crownShape';
  label: string;
  group: ParameterGroup;
  description: string;
  options: CrownShape[];
  defaultValue: CrownShape;
};

export type TreeParams = {
  height: number;
  crownWidth: number;
  crownDepth: number;
  trunkBaseRadius: number;
  trunkTaper: number;
  trunkLean: number;
  clearTrunkHeight: number;
  trunkCurvature: number;
  trunkNoise: number;
  primaryBranchCount: number;
  branchAngle: number;
  branchAngleVariance: number;
  branchLengthRatio: number;
  branchOrderDepth: number;
  branchDensity: number;
  branchDroop: number;
  apicalDominance: number;
  crownShape: CrownShape;
  crownFullness: number;
  leafClusterRadius: number;
  leafDensity: number;
  interiorLeafPruning: number;
  phototropism: number;
  windBias: number;
  age: number;
  randomSeed: number;
  colorRandomness: number;
  minBranchThickness: number;
  leafCleanup: number;
  symmetryAssist: number;
  buildabilityBias: number;
};

// --- Presets ---
export type PresetId = 'spruce' | 'oak' | 'willow';

export type Preset = {
  id: PresetId;
  name: string;
  description: string;
  growthForm: string;
  params: Partial<TreeParams>;
};
