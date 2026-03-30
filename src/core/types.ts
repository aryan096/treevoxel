// --- Block Types ---
export type BlockType = 'log' | 'branch' | 'leaf' | 'fence';
export type Axis = 'x' | 'y' | 'z';

// --- Voxel Storage ---
export type VoxelStore = {
  layers: Map<number, Map<number, BlockType>>;
  axis: Map<number, Map<number, Axis>>;
  fenceConnectivity: Map<number, Map<number, number>>;
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
  fencePostMatrices: Float32Array;
  fencePostColors: Float32Array;
  fencePostCount: number;
  fenceArmMatrices: Float32Array;
  fenceArmColors: Float32Array;
  fenceArmCount: number;
};

export type BlockColors = Record<BlockType, string>;
export type MinecraftBlockId = string;
export type MinecraftPalette = {
  log: MinecraftBlockId;
  branch: MinecraftBlockId;
  fence: MinecraftBlockId;
  leaf: MinecraftBlockId;
};

export type TreeSnapshot = {
  presetId: PresetId;
  params: TreeParams;
  blockColors: BlockColors;
  minecraftPalette: MinecraftPalette;
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

export type BranchSegment = {
  id: number;
  parentSegmentId: number | null;
  fromNodeIndex: number;
  toNodeIndex: number;
  from: [number, number, number];
  to: [number, number, number];
  order: number;
  role: BranchRole;
  radiusFrom: number;
  radiusTo: number;
  length: number;
  direction: [number, number, number];
};

export type BranchSpanMaterial = 'log' | 'branch' | 'fence';

export type BranchSpan = {
  id: string;
  segmentId: number;
  parentSegmentId: number | null;
  material: BranchSpanMaterial;
  from: [number, number, number];
  to: [number, number, number];
  radiusFrom: number;
  radiusTo: number;
};

export type TreeModel = {
  nodes: SkeletonNode[];
  segments?: BranchSegment[];
  spans?: BranchSpan[];
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
  randomSeed: number;
  colorRandomness: number;
  height: number;
  crownWidth: number;
  crownDepth: number;
  trunkBaseRadius: number;
  trunkTaper: number;
  trunkLean: number;
  trunkLeanDirection: number;
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
  minBranchThickness: number;
  leafCleanup: number;
  symmetryAssist: number;
  buildabilityBias: number;
};

// --- Presets ---
export type PresetId =
  | 'spruce'
  | 'oak'
  | 'willow';

export type Preset = {
  id: PresetId;
  name: string;
  description: string;
  growthForm: string;
  params: Partial<TreeParams>;
  blockColors: BlockColors;
  minecraftPalette?: MinecraftPalette;
};
