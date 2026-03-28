# TreeVoxel V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based voxel tree authoring tool where users select species presets, adjust morphology parameters, and see results in synchronized 3D voxel and 2D layer views with real-time updates and export.

**Architecture:** Parameter-driven procedural skeleton generator produces a tree model, which is voxelized into a sparse Y-bucketed map, then rendered via InstancedMesh in a React Three Fiber scene. A layer browser shows 2D slices of the same data. All derived state (tree model, voxels, render buffer) is computed from source-of-truth parameters in a Zustand store.

**Tech Stack:** TypeScript, Vite, React, three.js, @react-three/fiber, @react-three/drei, zustand, @radix-ui/react-slider, @radix-ui/react-tooltip, @radix-ui/react-select, @radix-ui/react-scroll-area, CSS Modules, Vitest

---

## File Structure

```
treevoxel/
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  index.html
  src/
    main.tsx                          # React entry point
    App.tsx                           # Main layout: 3D viewport + layer view + parameter panel
    App.module.css                    # Top-level layout styles
    store/
      treeStore.ts                    # Zustand store: params, preset, seed, layer index, toggles
    core/
      types.ts                       # Shared types: BlockType, VoxelStore, RenderBuffer, SkeletonNode, TreeModel, etc.
      pack.ts                        # pack(x,z) and unpack helpers
      parameters.ts                  # Parameter definitions: id, label, description, range, default, group, explanations
      presets.ts                      # Species presets: spruce, oak, willow + growth form defaults
      skeleton.ts                    # Skeleton generation: trunk, scaffold branches, sub-branches
      crown.ts                       # Crown envelope shapes and leaf cluster placement
      voxelize.ts                    # Skeleton+crown → VoxelStore (rasterize segments, fill leaves)
      generate.ts                    # Top-level pipeline: params+seed → TreeModel → VoxelStore → RenderBuffer
      renderBuffer.ts                # VoxelStore → RenderBuffer (InstancedMesh matrices + types)
      export.ts                      # JSON export + per-layer text guide
    render/
      VoxelScene.tsx                 # R3F Canvas wrapper with orbit controls, grid, axes
      VoxelMesh.tsx                  # InstancedMesh renderer consuming RenderBuffer
      LayerHighlight.tsx             # Translucent plane highlighting active layer in 3D view
    ui/
      ParameterPanel.tsx             # Scrollable parameter editor grouped by category
      ParameterPanel.module.css
      ParameterGroup.tsx             # Collapsible group of parameter sliders
      ParameterGroup.module.css
      ParameterSlider.tsx            # Single parameter: slider + label + value + tooltip explanation
      ParameterSlider.module.css
      PresetSelector.tsx             # Radix Select for choosing species preset
      PresetSelector.module.css
      LayerBrowser.tsx               # 2D layer view: CSS Grid of blocks + Y slider
      LayerBrowser.module.css
      ExportPanel.tsx                # Export buttons (JSON, text guide)
      ExportPanel.module.css
      Toolbar.tsx                    # Display toggles: trunk, branches, leaves, grid, axes
      Toolbar.module.css
  tests/
    core/
      pack.test.ts
      parameters.test.ts
      presets.test.ts
      skeleton.test.ts
      crown.test.ts
      voxelize.test.ts
      generate.test.ts
      renderBuffer.test.ts
      export.test.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.module.css`

- [ ] **Step 1: Initialize project with Vite**

```bash
cd /home/arysriv/Desktop/projects/treevoxel
npm create vite@latest . -- --template react-ts
```

Select "Ignore files and continue" if prompted about existing files.

- [ ] **Step 2: Install core dependencies**

```bash
npm install three @react-three/fiber @react-three/drei zustand @radix-ui/react-slider @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-scroll-area
npm install -D @types/three vitest
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Replace App.tsx with shell layout**

Replace contents of `src/App.tsx`:

```tsx
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.layout}>
      <div className={styles.viewport}>3D Viewport</div>
      <div className={styles.sidebar}>
        <div className={styles.parameters}>Parameters</div>
        <div className={styles.layers}>Layer Browser</div>
      </div>
    </div>
  );
}
```

Create `src/App.module.css`:

```css
.layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  height: 100vh;
  overflow: hidden;
}

.viewport {
  position: relative;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
  border-left: 1px solid #2a2a3e;
  overflow: hidden;
}

.parameters {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  color: #999;
}

.layers {
  height: 280px;
  border-top: 1px solid #2a2a3e;
  padding: 16px;
  color: #999;
}
```

- [ ] **Step 6: Add global CSS reset**

Replace `src/index.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #0f0f1a;
  color: #e0e0e0;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: App renders with the two-column grid layout, dark background, placeholder text.

- [ ] **Step 8: Verify test runner works**

Create `tests/core/pack.test.ts` as a smoke test:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke test', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.config.ts index.html src/ tests/ eslint.config.js
git commit -m "feat: scaffold Vite + React + R3F project with test setup"
```

---

## Task 2: Core Types and Pack Utility

**Files:**
- Create: `src/core/types.ts`, `src/core/pack.ts`
- Test: `tests/core/pack.test.ts`

- [ ] **Step 1: Write failing tests for pack/unpack**

Replace `tests/core/pack.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pack, unpack, GRID_SIZE } from '../../src/core/pack';

describe('pack', () => {
  it('packs x=0, z=0 to 0', () => {
    expect(pack(0, 0)).toBe(0);
  });

  it('packs and unpacks round-trip', () => {
    const cases = [
      [0, 0], [1, 0], [0, 1], [5, 7], [31, 31],
      [-10, 5], [3, -8], [-15, -15],
    ];
    for (const [x, z] of cases) {
      const packed = pack(x, z);
      const [ux, uz] = unpack(packed);
      expect(ux).toBe(x);
      expect(uz).toBe(z);
    }
  });

  it('produces unique keys for distinct coordinates', () => {
    const keys = new Set<number>();
    for (let x = -20; x <= 20; x++) {
      for (let z = -20; z <= 20; z++) {
        const k = pack(x, z);
        expect(keys.has(k)).toBe(false);
        keys.add(k);
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module `../../src/core/pack` not found.

- [ ] **Step 3: Implement pack.ts**

Create `src/core/pack.ts`:

```ts
/**
 * Grid size must be large enough to contain any tree.
 * Trees up to ~128 blocks wide centered at origin need coordinates from -64 to +64.
 * We offset by HALF to make all packed values non-negative.
 */
export const GRID_SIZE = 256;
const HALF = GRID_SIZE / 2;

/** Pack (x, z) into a single integer key for Map storage. */
export function pack(x: number, z: number): number {
  return (x + HALF) * GRID_SIZE + (z + HALF);
}

/** Unpack a key back into [x, z]. */
export function unpack(key: number): [number, number] {
  const x = Math.floor(key / GRID_SIZE) - HALF;
  const z = (key % GRID_SIZE) - HALF;
  return [x, z];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All pack tests PASS.

- [ ] **Step 5: Create types.ts**

Create `src/core/types.ts`:

```ts
// --- Block Types ---

export type BlockType = 'log' | 'branch' | 'leaf';

// --- Voxel Storage ---

/** Y-bucketed sparse voxel map. Key: pack(x,z), Value: BlockType. */
export type VoxelStore = {
  layers: Map<number, Map<number, BlockType>>;
  bounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  };
  count: number;
};

/** Flat typed arrays for InstancedMesh rendering. */
export type RenderBuffer = {
  matrices: Float32Array;
  types: Uint8Array;
  count: number;
};

// --- Skeleton ---

export type BranchRole = 'trunk' | 'scaffold' | 'secondary' | 'twig';

export type SkeletonNode = {
  position: [number, number, number];
  parentIndex: number | null;
  order: number;           // 0 = trunk, 1 = scaffold, 2 = secondary, etc.
  radius: number;          // segment radius at this node
  role: BranchRole;
  length: number;          // length of segment from parent to this node
  direction: [number, number, number]; // unit vector of growth direction
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

/** All numeric parameter values keyed by parameter id. */
export type TreeParams = {
  height: number;
  crownWidth: number;
  crownDepth: number;
  trunkBaseRadius: number;
  trunkTaper: number;
  trunkLean: number;
  clearTrunkHeight: number;
  trunkCurvature: number;
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
```

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/core/pack.ts tests/core/pack.test.ts
git commit -m "feat: add core types (VoxelStore, TreeModel, TreeParams) and pack utility"
```

---

## Task 3: Parameter Definitions

**Files:**
- Create: `src/core/parameters.ts`
- Test: `tests/core/parameters.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/core/parameters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PARAMETER_DEFS, CATEGORICAL_PARAMS, getDefaultParams } from '../../src/core/parameters';
import type { TreeParams } from '../../src/core/types';

describe('parameters', () => {
  it('every numeric parameter has a valid range', () => {
    for (const p of PARAMETER_DEFS) {
      expect(p.min).toBeLessThan(p.max);
      expect(p.step).toBeGreaterThan(0);
      expect(p.defaultValue).toBeGreaterThanOrEqual(p.min);
      expect(p.defaultValue).toBeLessThanOrEqual(p.max);
    }
  });

  it('every parameter has non-empty explanation fields', () => {
    for (const p of PARAMETER_DEFS) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.effectIncrease.length).toBeGreaterThan(0);
      expect(p.effectDecrease.length).toBeGreaterThan(0);
    }
  });

  it('getDefaultParams returns all required keys', () => {
    const defaults = getDefaultParams();
    const requiredKeys: (keyof TreeParams)[] = [
      'height', 'crownWidth', 'crownDepth', 'trunkBaseRadius', 'trunkTaper',
      'trunkLean', 'clearTrunkHeight', 'trunkCurvature',
      'primaryBranchCount', 'branchAngle', 'branchAngleVariance',
      'branchLengthRatio', 'branchOrderDepth', 'branchDensity', 'branchDroop',
      'apicalDominance', 'crownShape', 'crownFullness', 'leafClusterRadius',
      'leafDensity', 'interiorLeafPruning', 'phototropism', 'windBias', 'age',
      'randomSeed', 'minBranchThickness', 'leafCleanup', 'symmetryAssist',
      'buildabilityBias',
    ];
    for (const key of requiredKeys) {
      expect(defaults).toHaveProperty(key);
    }
  });

  it('parameter ids are unique', () => {
    const ids = PARAMETER_DEFS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('categorical params have at least 2 options', () => {
    for (const p of CATEGORICAL_PARAMS) {
      expect(p.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement parameters.ts**

Create `src/core/parameters.ts`:

```ts
import type { ParameterDef, CategoricalParameterDef, TreeParams, CrownShape } from './types';

export const PARAMETER_DEFS: ParameterDef[] = [
  // --- Global Dimensions ---
  {
    id: 'height',
    label: 'Height',
    group: 'dimensions',
    description: 'Total tree height in blocks from ground to crown top.',
    effectIncrease: 'Taller tree with more vertical layers.',
    effectDecrease: 'Shorter, more compact tree.',
    min: 5, max: 80, step: 1, defaultValue: 20,
  },
  {
    id: 'crownWidth',
    label: 'Crown Width',
    group: 'dimensions',
    description: 'Maximum lateral spread of the crown in blocks.',
    effectIncrease: 'Wider, more spreading canopy.',
    effectDecrease: 'Narrower, more columnar crown.',
    min: 2, max: 40, step: 1, defaultValue: 12,
  },
  {
    id: 'crownDepth',
    label: 'Crown Depth',
    group: 'dimensions',
    description: 'Fraction of total height occupied by the crown canopy.',
    effectIncrease: 'Canopy extends further down the trunk.',
    effectDecrease: 'Canopy concentrated at the top, longer bare trunk.',
    min: 0.1, max: 0.95, step: 0.05, defaultValue: 0.6,
  },
  // --- Trunk ---
  {
    id: 'trunkBaseRadius',
    label: 'Trunk Base Radius',
    group: 'trunk',
    description: 'Trunk thickness near the ground in blocks.',
    effectIncrease: 'Thicker, more massive trunk.',
    effectDecrease: 'Thinner, more delicate trunk.',
    min: 1, max: 6, step: 0.5, defaultValue: 2,
  },
  {
    id: 'trunkTaper',
    label: 'Trunk Taper',
    group: 'trunk',
    description: 'How quickly the trunk narrows with height (0 = no taper, 1 = full taper to tip).',
    effectIncrease: 'Trunk narrows faster toward the top.',
    effectDecrease: 'Trunk stays thick higher up.',
    min: 0.1, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'trunkLean',
    label: 'Trunk Lean',
    group: 'trunk',
    description: 'Overall tilt of the trunk axis in degrees from vertical.',
    effectIncrease: 'Tree leans more to one side.',
    effectDecrease: 'Tree grows more upright.',
    min: 0, max: 30, step: 1, defaultValue: 0,
  },
  {
    id: 'clearTrunkHeight',
    label: 'Clear Trunk Height',
    group: 'trunk',
    description: 'Fraction of total height before major branches emerge.',
    effectIncrease: 'More bare trunk below the crown.',
    effectDecrease: 'Branches start lower on the trunk.',
    min: 0.05, max: 0.8, step: 0.05, defaultValue: 0.3,
  },
  {
    id: 'trunkCurvature',
    label: 'Trunk Curvature',
    group: 'trunk',
    description: 'How much the trunk bends gradually along its length.',
    effectIncrease: 'More curved, sinuous trunk.',
    effectDecrease: 'Straighter trunk.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.1,
  },
  // --- Branching ---
  {
    id: 'primaryBranchCount',
    label: 'Primary Branch Count',
    group: 'branching',
    description: 'Number of major scaffold branches emerging from the trunk.',
    effectIncrease: 'More main limbs, bushier structure.',
    effectDecrease: 'Fewer main limbs, sparser crown.',
    min: 2, max: 16, step: 1, defaultValue: 6,
  },
  {
    id: 'branchAngle',
    label: 'Branch Angle',
    group: 'branching',
    description: 'Average angle in degrees at which branches emerge from their parent.',
    effectIncrease: 'Branches spread more horizontally.',
    effectDecrease: 'Branches grow more upward, closer to trunk.',
    min: 10, max: 90, step: 5, defaultValue: 45,
  },
  {
    id: 'branchAngleVariance',
    label: 'Branch Angle Variance',
    group: 'branching',
    description: 'Random variation in branch emergence angle.',
    effectIncrease: 'More irregular, natural-looking angles.',
    effectDecrease: 'More uniform, symmetric branching.',
    min: 0, max: 30, step: 1, defaultValue: 10,
  },
  {
    id: 'branchLengthRatio',
    label: 'Branch Length Ratio',
    group: 'branching',
    description: 'Branch length as a fraction of the distance from its start to the crown edge.',
    effectIncrease: 'Longer branches, wider spread.',
    effectDecrease: 'Shorter branches, tighter crown.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'branchOrderDepth',
    label: 'Branch Order Depth',
    group: 'branching',
    description: 'How many levels of sub-branching are generated (1 = no sub-branches).',
    effectIncrease: 'More detailed, finer branching structure.',
    effectDecrease: 'Simpler branching with fewer subdivisions.',
    min: 1, max: 4, step: 1, defaultValue: 2,
  },
  {
    id: 'branchDensity',
    label: 'Branch Density',
    group: 'branching',
    description: 'How many branches appear within active branching regions.',
    effectIncrease: 'Denser, more crowded branching.',
    effectDecrease: 'Sparser, more open branching.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.6,
  },
  {
    id: 'branchDroop',
    label: 'Branch Droop',
    group: 'branching',
    description: 'Tendency for branches to curve downward as they extend.',
    effectIncrease: 'Weeping, drooping branches.',
    effectDecrease: 'Level or ascending branches.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.2,
  },
  {
    id: 'apicalDominance',
    label: 'Apical Dominance',
    group: 'branching',
    description: 'How strongly the central leader suppresses lateral branch growth.',
    effectIncrease: 'Stronger central leader, conical crown.',
    effectDecrease: 'Weaker leader, broader crown with competing branches.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.5,
  },
  // --- Crown ---
  {
    id: 'crownFullness',
    label: 'Crown Fullness',
    group: 'crown',
    description: 'How densely the crown volume is occupied by foliage.',
    effectIncrease: 'Dense, full canopy.',
    effectDecrease: 'Open, airy canopy with gaps.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'leafClusterRadius',
    label: 'Leaf Cluster Radius',
    group: 'crown',
    description: 'Typical leaf blob radius around branch tips in blocks.',
    effectIncrease: 'Larger, puffier leaf clusters.',
    effectDecrease: 'Smaller, tighter leaf clusters.',
    min: 1, max: 5, step: 0.5, defaultValue: 2,
  },
  {
    id: 'leafDensity',
    label: 'Leaf Density',
    group: 'crown',
    description: 'Amount of foliage generated per terminal branch region.',
    effectIncrease: 'More leaf blocks, denser canopy.',
    effectDecrease: 'Fewer leaf blocks, sparser canopy.',
    min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.7,
  },
  {
    id: 'interiorLeafPruning',
    label: 'Interior Leaf Pruning',
    group: 'crown',
    description: 'How aggressively shaded interior leaves are removed.',
    effectIncrease: 'Open crown shell, hollow interior.',
    effectDecrease: 'Dense canopy throughout.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.3,
  },
  // --- Environment ---
  {
    id: 'phototropism',
    label: 'Phototropism',
    group: 'environment',
    description: 'Tendency to grow upward toward light.',
    effectIncrease: 'Stronger upward growth bias.',
    effectDecrease: 'More lateral, spreading growth.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.5,
  },
  {
    id: 'windBias',
    label: 'Wind Bias',
    group: 'environment',
    description: 'Asymmetric bend as if shaped by prevailing wind.',
    effectIncrease: 'Stronger wind-shaped asymmetry.',
    effectDecrease: 'Symmetric, sheltered growth.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0,
  },
  {
    id: 'age',
    label: 'Age',
    group: 'environment',
    description: 'Growth stage bias (0 = young sapling, 1 = old growth).',
    effectIncrease: 'More mature, complex structure.',
    effectDecrease: 'Younger, simpler form.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.5,
  },
  {
    id: 'randomSeed',
    label: 'Random Seed',
    group: 'environment',
    description: 'Seed for deterministic random variation. Same seed = same tree.',
    effectIncrease: 'Different random variation.',
    effectDecrease: 'Different random variation.',
    min: 0, max: 99999, step: 1, defaultValue: 42,
  },
  // --- Minecraft Readability ---
  {
    id: 'minBranchThickness',
    label: 'Min Branch Thickness',
    group: 'minecraft',
    description: 'Minimum branch width in blocks, prevents noisy single-block artifacts.',
    effectIncrease: 'Thicker minimum branches, cleaner build.',
    effectDecrease: 'Allows thinner branches, more detail but noisier.',
    min: 1, max: 3, step: 1, defaultValue: 1,
  },
  {
    id: 'leafCleanup',
    label: 'Leaf Cleanup',
    group: 'minecraft',
    description: 'Remove floating or isolated leaf blocks.',
    effectIncrease: 'Cleaner leaf placement, fewer floaters.',
    effectDecrease: 'More organic but messier leaf scatter.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.5,
  },
  {
    id: 'symmetryAssist',
    label: 'Symmetry Assist',
    group: 'minecraft',
    description: 'Reduce awkward random noise by enforcing partial symmetry.',
    effectIncrease: 'More symmetric, tidier appearance.',
    effectDecrease: 'More natural asymmetry.',
    min: 0, max: 1.0, step: 0.05, defaultValue: 0.3,
  },
  {
    id: 'buildabilityBias',
    label: 'Buildability Bias',
    group: 'minecraft',
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All parameter tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/parameters.ts tests/core/parameters.test.ts
git commit -m "feat: add parameter definitions with explanations and defaults"
```

---

## Task 4: Species Presets

**Files:**
- Create: `src/core/presets.ts`
- Test: `tests/core/presets.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/core/presets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PRESETS, applyPreset } from '../../src/core/presets';
import { getDefaultParams } from '../../src/core/parameters';
import type { TreeParams } from '../../src/core/types';

describe('presets', () => {
  it('has three starter presets', () => {
    expect(PRESETS).toHaveLength(3);
    const ids = PRESETS.map(p => p.id);
    expect(ids).toContain('spruce');
    expect(ids).toContain('oak');
    expect(ids).toContain('willow');
  });

  it('every preset has name, description, and growthForm', () => {
    for (const preset of PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.growthForm.length).toBeGreaterThan(0);
    }
  });

  it('applyPreset merges preset params over defaults', () => {
    const defaults = getDefaultParams();
    const spruce = PRESETS.find(p => p.id === 'spruce')!;
    const result = applyPreset(defaults, spruce);

    // Spruce should have conical crown
    expect(result.crownShape).toBe('conical');
    // Non-overridden params keep defaults
    expect(result.randomSeed).toBe(defaults.randomSeed);
  });

  it('applyPreset returns a new object, does not mutate input', () => {
    const defaults = getDefaultParams();
    const original = { ...defaults };
    const oak = PRESETS.find(p => p.id === 'oak')!;
    applyPreset(defaults, oak);
    expect(defaults).toEqual(original);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement presets.ts**

Create `src/core/presets.ts`:

```ts
import type { Preset, TreeParams } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'spruce',
    name: 'Spruce',
    description: 'Tall, narrow conifer with a strong central leader and short, layered branches.',
    growthForm: 'excurrent conifer',
    params: {
      height: 25,
      crownWidth: 8,
      crownDepth: 0.7,
      trunkBaseRadius: 1.5,
      trunkTaper: 0.85,
      trunkLean: 0,
      clearTrunkHeight: 0.15,
      trunkCurvature: 0.05,
      primaryBranchCount: 10,
      branchAngle: 60,
      branchAngleVariance: 5,
      branchLengthRatio: 0.5,
      branchOrderDepth: 1,
      branchDensity: 0.8,
      branchDroop: 0.3,
      apicalDominance: 0.9,
      crownShape: 'conical',
      crownFullness: 0.85,
      leafClusterRadius: 1.5,
      leafDensity: 0.8,
      interiorLeafPruning: 0.2,
      phototropism: 0.7,
      windBias: 0,
      age: 0.5,
    },
  },
  {
    id: 'oak',
    name: 'Oak',
    description: 'Broad, rounded deciduous tree with a wide crown and thick scaffold branches.',
    growthForm: 'rounded decurrent broadleaf',
    params: {
      height: 18,
      crownWidth: 16,
      crownDepth: 0.55,
      trunkBaseRadius: 2.5,
      trunkTaper: 0.6,
      trunkLean: 0,
      clearTrunkHeight: 0.35,
      trunkCurvature: 0.15,
      primaryBranchCount: 5,
      branchAngle: 45,
      branchAngleVariance: 15,
      branchLengthRatio: 0.8,
      branchOrderDepth: 3,
      branchDensity: 0.5,
      branchDroop: 0.15,
      apicalDominance: 0.3,
      crownShape: 'spherical',
      crownFullness: 0.75,
      leafClusterRadius: 2.5,
      leafDensity: 0.7,
      interiorLeafPruning: 0.4,
      phototropism: 0.4,
      windBias: 0,
      age: 0.6,
    },
  },
  {
    id: 'willow',
    name: 'Willow',
    description: 'Graceful tree with long, drooping branches and a wide, cascading crown.',
    growthForm: 'weeping broadleaf',
    params: {
      height: 16,
      crownWidth: 18,
      crownDepth: 0.65,
      trunkBaseRadius: 2,
      trunkTaper: 0.5,
      trunkLean: 3,
      clearTrunkHeight: 0.25,
      trunkCurvature: 0.2,
      primaryBranchCount: 7,
      branchAngle: 50,
      branchAngleVariance: 12,
      branchLengthRatio: 0.9,
      branchOrderDepth: 3,
      branchDensity: 0.7,
      branchDroop: 0.85,
      apicalDominance: 0.2,
      crownShape: 'weeping',
      crownFullness: 0.6,
      leafClusterRadius: 1.5,
      leafDensity: 0.6,
      interiorLeafPruning: 0.1,
      phototropism: 0.3,
      windBias: 0.1,
      age: 0.5,
    },
  },
];

/** Merge a preset's params over a base parameter set. Returns a new object. */
export function applyPreset(base: TreeParams, preset: Preset): TreeParams {
  return { ...base, ...preset.params };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All preset tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/presets.ts tests/core/presets.test.ts
git commit -m "feat: add species presets (spruce, oak, willow) with parameter overrides"
```

---

## Task 5: Seeded RNG and Skeleton Generation

**Files:**
- Create: `src/core/rng.ts`, `src/core/skeleton.ts`
- Test: `tests/core/skeleton.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/core/skeleton.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateSkeleton } from '../../src/core/skeleton';
import { getDefaultParams } from '../../src/core/parameters';

describe('generateSkeleton', () => {
  const params = getDefaultParams();

  it('returns at least one node (the root)', () => {
    const nodes = generateSkeleton(params);
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });

  it('root node is at ground level', () => {
    const nodes = generateSkeleton(params);
    expect(nodes[0].position[1]).toBe(0);
    expect(nodes[0].parentIndex).toBeNull();
    expect(nodes[0].role).toBe('trunk');
  });

  it('trunk nodes are contiguous from ground to height', () => {
    const nodes = generateSkeleton(params);
    const trunkNodes = nodes.filter(n => n.role === 'trunk');
    expect(trunkNodes.length).toBeGreaterThanOrEqual(2);
    // First trunk node at y=0, last near tree height
    const maxTrunkY = Math.max(...trunkNodes.map(n => n.position[1]));
    expect(maxTrunkY).toBeGreaterThanOrEqual(params.height * 0.8);
  });

  it('branches have valid parent indices', () => {
    const nodes = generateSkeleton(params);
    for (let i = 1; i < nodes.length; i++) {
      const node = nodes[i];
      expect(node.parentIndex).not.toBeNull();
      expect(node.parentIndex!).toBeGreaterThanOrEqual(0);
      expect(node.parentIndex!).toBeLessThan(i);
    }
  });

  it('produces scaffold branches above clearTrunkHeight', () => {
    const nodes = generateSkeleton(params);
    const scaffolds = nodes.filter(n => n.role === 'scaffold');
    expect(scaffolds.length).toBeGreaterThan(0);
    const clearY = params.height * params.clearTrunkHeight;
    for (const s of scaffolds) {
      const parent = nodes[s.parentIndex!];
      expect(parent.position[1]).toBeGreaterThanOrEqual(clearY - 1);
    }
  });

  it('is deterministic: same seed produces same skeleton', () => {
    const a = generateSkeleton(params);
    const b = generateSkeleton(params);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].position).toEqual(b[i].position);
    }
  });

  it('different seeds produce different skeletons', () => {
    const a = generateSkeleton(params);
    const b = generateSkeleton({ ...params, randomSeed: params.randomSeed + 1 });
    // At least some positions should differ
    const differs = a.some((n, i) =>
      i < b.length &&
      (n.position[0] !== b[i].position[0] ||
       n.position[2] !== b[i].position[2])
    );
    expect(differs).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement rng.ts**

Create `src/core/rng.ts`:

```ts
/**
 * Simple seeded PRNG (mulberry32).
 * Returns a function that produces values in [0, 1) on each call.
 */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Implement skeleton.ts**

Create `src/core/skeleton.ts`:

```ts
import type { SkeletonNode, TreeParams } from './types';
import { createRng } from './rng';

type Vec3 = [number, number, number];

function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/**
 * Generate a tree skeleton from parameters.
 *
 * Algorithm:
 * 1. Build trunk nodes from y=0 to y=height with optional curvature and lean.
 * 2. Place scaffold branches along trunk above clearTrunkHeight.
 * 3. Recursively add sub-branches up to branchOrderDepth.
 */
export function generateSkeleton(params: TreeParams): SkeletonNode[] {
  const rng = createRng(params.randomSeed);
  const nodes: SkeletonNode[] = [];

  // --- Trunk ---
  const trunkSteps = Math.max(3, Math.round(params.height));
  const leanRad = (params.trunkLean * Math.PI) / 180;
  const leanDir: Vec3 = [Math.sin(leanRad), 0, 0];

  for (let i = 0; i <= trunkSteps; i++) {
    const t = i / trunkSteps;
    const y = t * params.height;

    // Curvature: sinusoidal lateral offset
    const curveOffset = params.trunkCurvature * Math.sin(t * Math.PI) * 2;
    const curveAngle = rng() * Math.PI * 2; // direction of curvature
    const cx = curveOffset * Math.cos(curveAngle) * (i === 0 ? 0 : 1);
    const cz = curveOffset * Math.sin(curveAngle) * (i === 0 ? 0 : 1);

    // Lean accumulates with height
    const lx = leanDir[0] * t * params.trunkLean * 0.1;
    const lz = leanDir[2] * t * params.trunkLean * 0.1;

    const position: Vec3 = [lx + cx, y, lz + cz];
    const radius = params.trunkBaseRadius * (1 - t * params.trunkTaper);

    const direction: Vec3 = i === 0
      ? [0, 1, 0]
      : vec3Normalize([
          position[0] - nodes[nodes.length - 1].position[0],
          position[1] - nodes[nodes.length - 1].position[1],
          position[2] - nodes[nodes.length - 1].position[2],
        ]);

    const length = i === 0
      ? 0
      : vec3Length([
          position[0] - nodes[nodes.length - 1].position[0],
          position[1] - nodes[nodes.length - 1].position[1],
          position[2] - nodes[nodes.length - 1].position[2],
        ]);

    nodes.push({
      position,
      parentIndex: i === 0 ? null : nodes.length - 1,
      order: 0,
      radius: Math.max(0.5, radius),
      role: 'trunk',
      length,
      direction,
    });
  }

  // --- Scaffold branches ---
  const clearY = params.height * params.clearTrunkHeight;
  const crownTopY = params.height;
  const crownBottomY = params.height * (1 - params.crownDepth);

  // Collect trunk node indices eligible for branching
  const eligibleTrunkIndices: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].role === 'trunk' && nodes[i].position[1] >= clearY) {
      eligibleTrunkIndices.push(i);
    }
  }

  // Distribute scaffold branches along eligible trunk
  const branchCount = Math.round(
    params.primaryBranchCount * params.branchDensity
  );
  const spacing = Math.max(1, Math.floor(eligibleTrunkIndices.length / Math.max(1, branchCount)));

  for (let b = 0; b < branchCount && b * spacing < eligibleTrunkIndices.length; b++) {
    const trunkIdx = eligibleTrunkIndices[Math.min(b * spacing, eligibleTrunkIndices.length - 1)];
    const trunkNode = nodes[trunkIdx];

    // Random azimuth angle around trunk
    const azimuth = rng() * Math.PI * 2;
    // Emergence angle from trunk with variance
    const angle = (params.branchAngle + (rng() - 0.5) * 2 * params.branchAngleVariance) * Math.PI / 180;

    // Branch direction: rotated away from trunk axis
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const dir: Vec3 = vec3Normalize([
      sinA * Math.cos(azimuth),
      cosA,
      sinA * Math.sin(azimuth),
    ]);

    // Branch length scales with crown width and position
    const heightFraction = (trunkNode.position[1] - crownBottomY) / Math.max(1, crownTopY - crownBottomY);
    const apicalFactor = 1 - params.apicalDominance * heightFraction;
    const branchLength = params.crownWidth * 0.5 * params.branchLengthRatio * apicalFactor;

    addBranch(nodes, trunkIdx, dir, branchLength, 1, 'scaffold', params, rng);
  }

  return nodes;
}

function addBranch(
  nodes: SkeletonNode[],
  parentIdx: number,
  direction: Vec3,
  length: number,
  order: number,
  role: SkeletonNode['role'],
  params: TreeParams,
  rng: () => number,
): void {
  if (length < 1) return;

  const parent = nodes[parentIdx];
  const segmentCount = Math.max(1, Math.round(length));

  let currentIdx = parentIdx;
  let currentDir = direction;

  for (let s = 1; s <= segmentCount; s++) {
    const t = s / segmentCount;

    // Apply droop: bend direction downward over the segment
    const droopAmount = params.branchDroop * t * 0.3;
    const droopedDir: Vec3 = vec3Normalize([
      currentDir[0],
      currentDir[1] - droopAmount,
      currentDir[2],
    ]);

    const stepLength = length / segmentCount;
    const position = vec3Add(nodes[currentIdx].position, vec3Scale(droopedDir, stepLength));
    const radius = Math.max(
      params.minBranchThickness * 0.5,
      parent.radius * (1 - t * 0.7) * (order === 1 ? 0.5 : 0.3)
    );

    const nodeIdx = nodes.length;
    nodes.push({
      position,
      parentIndex: currentIdx,
      order,
      radius,
      role,
      length: stepLength,
      direction: droopedDir,
    });
    currentIdx = nodeIdx;
    currentDir = droopedDir;
  }

  // Recurse for sub-branches
  if (order < params.branchOrderDepth) {
    const subCount = Math.round(2 * params.branchDensity);
    const tipIdx = nodes.length - 1;
    for (let i = 0; i < subCount; i++) {
      const azimuth = rng() * Math.PI * 2;
      const angle = (params.branchAngle * 0.8 + (rng() - 0.5) * params.branchAngleVariance) * Math.PI / 180;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      const subDir: Vec3 = vec3Normalize([
        currentDir[0] * cosA + sinA * Math.cos(azimuth),
        currentDir[1] * cosA - params.branchDroop * 0.1,
        currentDir[2] * cosA + sinA * Math.sin(azimuth),
      ]);
      const subLength = length * 0.5;
      const subRole = order + 1 >= params.branchOrderDepth ? 'twig' : 'secondary';
      addBranch(nodes, tipIdx, subDir, subLength, order + 1, subRole, params, rng);
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: All skeleton tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/rng.ts src/core/skeleton.ts tests/core/skeleton.test.ts
git commit -m "feat: add seeded RNG and rule-based skeleton generator"
```

---

## Task 6: Crown Envelope and Leaf Clusters

**Files:**
- Create: `src/core/crown.ts`
- Test: `tests/core/crown.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/core/crown.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isInsideCrown, generateLeafClusters } from '../../src/core/crown';
import { generateSkeleton } from '../../src/core/skeleton';
import { getDefaultParams } from '../../src/core/parameters';
import type { TreeParams, CrownShape } from '../../src/core/types';

describe('isInsideCrown', () => {
  it('point at center of spherical crown is inside', () => {
    const centerY = 15;
    const crownBottomY = 10;
    const crownTopY = 20;
    const crownRadius = 6;
    expect(isInsideCrown(0, centerY, 0, 'spherical', crownBottomY, crownTopY, crownRadius)).toBe(true);
  });

  it('point far outside is not inside', () => {
    expect(isInsideCrown(100, 15, 100, 'spherical', 10, 20, 6)).toBe(false);
  });

  it('conical crown is widest at bottom, narrow at top', () => {
    const bottom = 10;
    const top = 20;
    const r = 8;
    // Near bottom: wide radius allowed
    expect(isInsideCrown(6, 11, 0, 'conical', bottom, top, r)).toBe(true);
    // Near top: same x offset is outside
    expect(isInsideCrown(6, 19, 0, 'conical', bottom, top, r)).toBe(false);
  });
});

describe('generateLeafClusters', () => {
  const params = getDefaultParams();

  it('returns leaf clusters', () => {
    const skeleton = generateSkeleton(params);
    const clusters = generateLeafClusters(skeleton, params);
    expect(clusters.length).toBeGreaterThan(0);
  });

  it('clusters are within crown bounds', () => {
    const skeleton = generateSkeleton(params);
    const clusters = generateLeafClusters(skeleton, params);
    const crownTopY = params.height;
    for (const c of clusters) {
      expect(c.center[1]).toBeLessThanOrEqual(crownTopY + 2);
      expect(c.radius).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const skeleton = generateSkeleton(params);
    const a = generateLeafClusters(skeleton, params);
    const b = generateLeafClusters(skeleton, params);
    expect(a.length).toBe(b.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement crown.ts**

Create `src/core/crown.ts`:

```ts
import type { SkeletonNode, TreeParams, LeafCluster, CrownShape } from './types';
import { createRng } from './rng';

/**
 * Test if a point (x, y, z) is inside the crown envelope.
 */
export function isInsideCrown(
  x: number, y: number, z: number,
  shape: CrownShape,
  crownBottomY: number,
  crownTopY: number,
  crownRadius: number,
): boolean {
  if (y < crownBottomY || y > crownTopY) return false;

  const crownHeight = crownTopY - crownBottomY;
  if (crownHeight <= 0) return false;

  // Normalized position within crown (0 = bottom, 1 = top)
  const t = (y - crownBottomY) / crownHeight;
  const lateralDist = Math.sqrt(x * x + z * z);

  // Compute allowed radius at this height based on crown shape
  let allowedRadius: number;

  switch (shape) {
    case 'conical':
      // Widest at bottom, tapers to point at top
      allowedRadius = crownRadius * (1 - t);
      break;
    case 'spherical': {
      // Ellipsoidal: widest at center
      const centered = t * 2 - 1; // -1 to 1
      allowedRadius = crownRadius * Math.sqrt(Math.max(0, 1 - centered * centered));
      break;
    }
    case 'ovoid':
      // Widest slightly below center
      allowedRadius = crownRadius * Math.sqrt(Math.max(0, 1 - (t * 1.3 - 0.5) * (t * 1.3 - 0.5)));
      break;
    case 'columnar':
      // Nearly uniform radius
      allowedRadius = crownRadius * 0.7 * (1 - 0.15 * Math.abs(t * 2 - 1));
      break;
    case 'vase':
      // Narrow at bottom, wide at top
      allowedRadius = crownRadius * (0.3 + 0.7 * t);
      break;
    case 'weeping':
      // Wide at top-center, trails down
      allowedRadius = crownRadius * (0.5 + 0.5 * Math.sin(t * Math.PI));
      break;
    case 'irregular':
    default:
      // Similar to spherical but with rough edges (no randomness here — just a looser envelope)
      allowedRadius = crownRadius * Math.sqrt(Math.max(0, 1.1 - (t * 2 - 1) * (t * 2 - 1)));
      break;
  }

  return lateralDist <= allowedRadius;
}

/**
 * Generate leaf clusters at terminal branch nodes within the crown envelope.
 */
export function generateLeafClusters(
  skeleton: SkeletonNode[],
  params: TreeParams,
): LeafCluster[] {
  const rng = createRng(params.randomSeed + 7919); // offset seed to avoid correlation with skeleton
  const clusters: LeafCluster[] = [];

  const crownTopY = params.height;
  const crownBottomY = params.height * (1 - params.crownDepth);
  const crownRadius = params.crownWidth / 2;

  // Find terminal nodes (nodes that are not parents of any other node)
  const isParent = new Set<number>();
  for (const node of skeleton) {
    if (node.parentIndex !== null) {
      isParent.add(node.parentIndex);
    }
  }

  for (let i = 0; i < skeleton.length; i++) {
    const node = skeleton[i];

    // Only place leaves at terminal nodes or twigs
    const isTerminal = !isParent.has(i);
    const isTwig = node.role === 'twig';
    if (!isTerminal && !isTwig) continue;

    const [x, y, z] = node.position;

    // Check if within crown envelope
    if (!isInsideCrown(x, y, z, params.crownShape, crownBottomY, crownTopY, crownRadius)) {
      // Still allow some clusters slightly outside for organic look
      if (rng() > 0.2) continue;
    }

    // Density check: skip some terminals based on leafDensity
    if (rng() > params.leafDensity) continue;

    clusters.push({
      center: [x, y, z],
      radius: params.leafClusterRadius * (0.7 + rng() * 0.6),
      density: params.crownFullness,
    });
  }

  // If no terminal nodes produced clusters (e.g. simple tree), place clusters along upper trunk
  if (clusters.length === 0) {
    for (let i = 0; i < skeleton.length; i++) {
      const node = skeleton[i];
      if (node.position[1] >= crownBottomY && rng() < 0.5) {
        clusters.push({
          center: node.position,
          radius: params.leafClusterRadius,
          density: params.crownFullness,
        });
      }
    }
  }

  return clusters;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All crown tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/crown.ts tests/core/crown.test.ts
git commit -m "feat: add crown envelope shapes and leaf cluster generation"
```

---

## Task 7: Voxelizer

**Files:**
- Create: `src/core/voxelize.ts`
- Test: `tests/core/voxelize.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/core/voxelize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { voxelize } from '../../src/core/voxelize';
import { generateSkeleton } from '../../src/core/skeleton';
import { generateLeafClusters } from '../../src/core/crown';
import { getDefaultParams } from '../../src/core/parameters';
import type { VoxelStore } from '../../src/core/types';

describe('voxelize', () => {
  const params = getDefaultParams();
  const skeleton = generateSkeleton(params);
  const clusters = generateLeafClusters(skeleton, params);

  it('returns a VoxelStore with blocks', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    expect(store.count).toBeGreaterThan(0);
    expect(store.layers.size).toBeGreaterThan(0);
  });

  it('has log blocks at ground level', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    const groundLayer = store.layers.get(0);
    expect(groundLayer).toBeDefined();
    const types = Array.from(groundLayer!.values());
    expect(types).toContain('log');
  });

  it('has leaf blocks in upper layers', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    let hasLeaves = false;
    for (const [y, layer] of store.layers) {
      if (y > params.height * 0.5) {
        for (const t of layer.values()) {
          if (t === 'leaf') { hasLeaves = true; break; }
        }
      }
      if (hasLeaves) break;
    }
    expect(hasLeaves).toBe(true);
  });

  it('bounds encompass all blocks', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    expect(store.bounds.minY).toBeLessThanOrEqual(0);
    expect(store.bounds.maxY).toBeGreaterThan(0);
  });

  it('count matches actual block count', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    let actualCount = 0;
    for (const layer of store.layers.values()) {
      actualCount += layer.size;
    }
    expect(store.count).toBe(actualCount);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement voxelize.ts**

Create `src/core/voxelize.ts`:

```ts
import type { TreeModel, TreeParams, VoxelStore, BlockType } from './types';
import { pack } from './pack';
import { isInsideCrown } from './crown';
import { createRng } from './rng';

/**
 * Convert a TreeModel (skeleton + leaf clusters) into a VoxelStore.
 *
 * 1. Rasterize each skeleton segment as a cylinder of voxels.
 * 2. Fill leaf cluster spheres with leaf blocks.
 * 3. Clean up floating leaves and thin branch artifacts.
 */
export function voxelize(model: TreeModel, params: TreeParams): VoxelStore {
  const layers = new Map<number, Map<number, BlockType>>();
  const bounds = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
    minZ: Infinity, maxZ: -Infinity,
  };
  let count = 0;

  function setBlock(x: number, y: number, z: number, type: BlockType): void {
    const iy = Math.round(y);
    const ix = Math.round(x);
    const iz = Math.round(z);
    const key = pack(ix, iz);

    let layer = layers.get(iy);
    if (!layer) {
      layer = new Map();
      layers.set(iy, layer);
    }

    // Wood types (log, branch) take priority over leaf
    const existing = layer.get(key);
    if (existing && (existing === 'log' || existing === 'branch') && type === 'leaf') {
      return;
    }

    if (!existing) count++;
    layer.set(key, type);

    // Update bounds
    if (ix < bounds.minX) bounds.minX = ix;
    if (ix > bounds.maxX) bounds.maxX = ix;
    if (iy < bounds.minY) bounds.minY = iy;
    if (iy > bounds.maxY) bounds.maxY = iy;
    if (iz < bounds.minZ) bounds.minZ = iz;
    if (iz > bounds.maxZ) bounds.maxZ = iz;
  }

  // --- Rasterize skeleton segments ---
  const { nodes } = model;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.parentIndex === null) {
      // Root node: place a single block
      setBlock(node.position[0], node.position[1], node.position[2], 'log');
      continue;
    }

    const parent = nodes[node.parentIndex];
    const blockType: BlockType = node.role === 'trunk' ? 'log' : 'branch';

    // Rasterize cylinder between parent and this node
    rasterizeSegment(
      parent.position, node.position,
      parent.radius, node.radius,
      blockType, setBlock,
    );
  }

  // --- Fill leaf clusters ---
  const rng = createRng(params.randomSeed + 1301);

  for (const cluster of model.leafClusters) {
    const [cx, cy, cz] = cluster.center;
    const r = cluster.radius;
    const ri = Math.ceil(r);

    for (let dy = -ri; dy <= ri; dy++) {
      for (let dx = -ri; dx <= ri; dx++) {
        for (let dz = -ri; dz <= ri; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > r) continue;

          // Density-based fill: inner blocks more likely
          const fillProb = cluster.density * (1 - dist / r * 0.5);
          if (rng() > fillProb) continue;

          setBlock(cx + dx, cy + dy, cz + dz, 'leaf');
        }
      }
    }
  }

  // --- Cleanup: remove isolated leaf blocks ---
  if (params.leafCleanup > 0) {
    const toRemove: Array<{ y: number; key: number }> = [];

    for (const [y, layer] of layers) {
      for (const [key, type] of layer) {
        if (type !== 'leaf') continue;

        // Count neighbors (6-connected)
        let neighbors = 0;
        // Check same layer
        if (layer.has(key + 1)) neighbors++;
        if (layer.has(key - 1)) neighbors++;
        if (layer.has(key + 256)) neighbors++;   // pack offset for x+1
        if (layer.has(key - 256)) neighbors++;
        // Check above/below
        const above = layers.get(y + 1);
        if (above?.has(key)) neighbors++;
        const below = layers.get(y - 1);
        if (below?.has(key)) neighbors++;

        if (neighbors < 1 && rng() < params.leafCleanup) {
          toRemove.push({ y, key });
        }
      }
    }

    for (const { y, key } of toRemove) {
      const layer = layers.get(y);
      if (layer) {
        layer.delete(key);
        count--;
        if (layer.size === 0) layers.delete(y);
      }
    }
  }

  // Fix bounds if no blocks were placed
  if (count === 0) {
    bounds.minX = bounds.maxX = 0;
    bounds.minY = bounds.maxY = 0;
    bounds.minZ = bounds.maxZ = 0;
  }

  return { layers, bounds, count };
}

/**
 * Rasterize a tapered cylinder segment between two 3D points.
 */
function rasterizeSegment(
  from: [number, number, number],
  to: [number, number, number],
  radiusFrom: number,
  radiusTo: number,
  blockType: BlockType,
  setBlock: (x: number, y: number, z: number, type: BlockType) => void,
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) {
    setBlock(from[0], from[1], from[2], blockType);
    return;
  }

  const steps = Math.max(1, Math.ceil(len * 2));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = from[0] + dx * t;
    const y = from[1] + dy * t;
    const z = from[2] + dz * t;
    const r = radiusFrom + (radiusTo - radiusFrom) * t;
    const ri = Math.ceil(r);

    // Fill a disc perpendicular to the segment at this point
    for (let ox = -ri; ox <= ri; ox++) {
      for (let oz = -ri; oz <= ri; oz++) {
        if (ox * ox + oz * oz <= r * r) {
          setBlock(x + ox, y, z + oz, blockType);
        }
      }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All voxelize tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/voxelize.ts tests/core/voxelize.test.ts
git commit -m "feat: add voxelizer (skeleton rasterization + leaf cluster fill + cleanup)"
```

---

## Task 8: RenderBuffer and Generation Pipeline

**Files:**
- Create: `src/core/renderBuffer.ts`, `src/core/generate.ts`
- Test: `tests/core/renderBuffer.test.ts`, `tests/core/generate.test.ts`

- [ ] **Step 1: Write failing tests for renderBuffer**

Create `tests/core/renderBuffer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRenderBuffer } from '../../src/core/renderBuffer';
import { voxelize } from '../../src/core/voxelize';
import { generateSkeleton } from '../../src/core/skeleton';
import { generateLeafClusters } from '../../src/core/crown';
import { getDefaultParams } from '../../src/core/parameters';

describe('buildRenderBuffer', () => {
  const params = getDefaultParams();
  const skeleton = generateSkeleton(params);
  const clusters = generateLeafClusters(skeleton, params);
  const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);

  it('returns correct count matching VoxelStore', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.count).toBe(store.count);
  });

  it('matrices array has 16 floats per instance', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.matrices.length).toBe(buffer.count * 16);
  });

  it('types array has one byte per instance', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.types.length).toBe(buffer.count);
  });

  it('types are valid enum values (0=log, 1=branch, 2=leaf)', () => {
    const buffer = buildRenderBuffer(store);
    for (let i = 0; i < buffer.count; i++) {
      expect(buffer.types[i]).toBeGreaterThanOrEqual(0);
      expect(buffer.types[i]).toBeLessThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 2: Write failing tests for generate**

Create `tests/core/generate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateTree } from '../../src/core/generate';
import { getDefaultParams } from '../../src/core/parameters';
import { applyPreset } from '../../src/core/presets';
import { PRESETS } from '../../src/core/presets';

describe('generateTree', () => {
  it('produces a complete pipeline result', () => {
    const params = getDefaultParams();
    const result = generateTree(params);
    expect(result.model.nodes.length).toBeGreaterThan(0);
    expect(result.voxels.count).toBeGreaterThan(0);
    expect(result.buffer.count).toBe(result.voxels.count);
  });

  it('works with each preset', () => {
    for (const preset of PRESETS) {
      const params = applyPreset(getDefaultParams(), preset);
      const result = generateTree(params);
      expect(result.voxels.count).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const params = getDefaultParams();
    const a = generateTree(params);
    const b = generateTree(params);
    expect(a.voxels.count).toBe(b.voxels.count);
    expect(a.buffer.count).toBe(b.buffer.count);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement renderBuffer.ts**

Create `src/core/renderBuffer.ts`:

```ts
import type { VoxelStore, RenderBuffer, BlockType } from './types';
import { unpack } from './pack';

const BLOCK_TYPE_INDEX: Record<BlockType, number> = {
  log: 0,
  branch: 1,
  leaf: 2,
};

/**
 * Convert a VoxelStore into a flat RenderBuffer for InstancedMesh rendering.
 * Each instance gets a 4x4 identity-translation matrix and a type byte.
 */
export function buildRenderBuffer(store: VoxelStore): RenderBuffer {
  const { count } = store;
  const matrices = new Float32Array(count * 16);
  const types = new Uint8Array(count);

  let idx = 0;
  for (const [y, layer] of store.layers) {
    for (const [key, blockType] of layer) {
      const [x, z] = unpack(key);
      const offset = idx * 16;

      // 4x4 identity matrix with translation
      matrices[offset + 0] = 1;  // m00
      matrices[offset + 1] = 0;
      matrices[offset + 2] = 0;
      matrices[offset + 3] = 0;
      matrices[offset + 4] = 0;
      matrices[offset + 5] = 1;  // m11
      matrices[offset + 6] = 0;
      matrices[offset + 7] = 0;
      matrices[offset + 8] = 0;
      matrices[offset + 9] = 0;
      matrices[offset + 10] = 1; // m22
      matrices[offset + 11] = 0;
      matrices[offset + 12] = x; // tx
      matrices[offset + 13] = y; // ty
      matrices[offset + 14] = z; // tz
      matrices[offset + 15] = 1; // m33

      types[idx] = BLOCK_TYPE_INDEX[blockType];
      idx++;
    }
  }

  return { matrices, types, count };
}
```

- [ ] **Step 5: Implement generate.ts**

Create `src/core/generate.ts`:

```ts
import type { TreeParams, TreeModel, VoxelStore, RenderBuffer } from './types';
import { generateSkeleton } from './skeleton';
import { generateLeafClusters } from './crown';
import { voxelize } from './voxelize';
import { buildRenderBuffer } from './renderBuffer';

export type GenerationResult = {
  model: TreeModel;
  voxels: VoxelStore;
  buffer: RenderBuffer;
};

/**
 * Full generation pipeline: params → skeleton → leaf clusters → voxels → render buffer.
 */
export function generateTree(params: TreeParams): GenerationResult {
  const nodes = generateSkeleton(params);
  const leafClusters = generateLeafClusters(nodes, params);
  const model: TreeModel = { nodes, leafClusters };
  const voxels = voxelize(model, params);
  const buffer = buildRenderBuffer(voxels);
  return { model, voxels, buffer };
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test
```

Expected: All renderBuffer and generate tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/core/renderBuffer.ts src/core/generate.ts tests/core/renderBuffer.test.ts tests/core/generate.test.ts
git commit -m "feat: add render buffer builder and full generation pipeline"
```

---

## Task 9: Export Functionality

**Files:**
- Create: `src/core/export.ts`
- Test: `tests/core/export.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/core/export.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { exportJSON, exportTextGuide } from '../../src/core/export';
import { generateTree } from '../../src/core/generate';
import { getDefaultParams } from '../../src/core/parameters';

describe('exportJSON', () => {
  const params = getDefaultParams();
  const { voxels } = generateTree(params);

  it('returns valid JSON string with blocks array', () => {
    const json = exportJSON(voxels, params);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed.blocks)).toBe(true);
    expect(parsed.blocks.length).toBe(voxels.count);
  });

  it('each block has x, y, z, type', () => {
    const parsed = JSON.parse(exportJSON(voxels, params));
    for (const block of parsed.blocks.slice(0, 10)) {
      expect(typeof block.x).toBe('number');
      expect(typeof block.y).toBe('number');
      expect(typeof block.z).toBe('number');
      expect(['log', 'branch', 'leaf']).toContain(block.type);
    }
  });

  it('includes meta with dimensions and count', () => {
    const parsed = JSON.parse(exportJSON(voxels, params));
    expect(parsed.meta.totalBlocks).toBe(voxels.count);
    expect(typeof parsed.meta.height).toBe('number');
    expect(typeof parsed.meta.width).toBe('number');
  });
});

describe('exportTextGuide', () => {
  const params = getDefaultParams();
  const { voxels } = generateTree(params);

  it('returns a non-empty string', () => {
    const guide = exportTextGuide(voxels);
    expect(guide.length).toBeGreaterThan(0);
  });

  it('contains layer headers for each Y level', () => {
    const guide = exportTextGuide(voxels);
    for (const y of voxels.layers.keys()) {
      expect(guide).toContain(`Layer Y=${y}`);
    }
  });

  it('contains block coordinate entries', () => {
    const guide = exportTextGuide(voxels);
    // Should have at least some coordinate entries like "(x, z)"
    expect(guide).toMatch(/\(-?\d+,\s*-?\d+\)/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement export.ts**

Create `src/core/export.ts`:

```ts
import type { VoxelStore, TreeParams } from './types';
import { unpack } from './pack';

type ExportBlock = { x: number; y: number; z: number; type: string };

type ExportJSON = {
  blocks: ExportBlock[];
  meta: {
    totalBlocks: number;
    height: number;
    width: number;
    depth: number;
    layerCount: number;
  };
};

/**
 * Export voxel data as a JSON string with block coordinates and metadata.
 */
export function exportJSON(store: VoxelStore, params: TreeParams): string {
  const blocks: ExportBlock[] = [];

  const sortedYs = Array.from(store.layers.keys()).sort((a, b) => a - b);
  for (const y of sortedYs) {
    const layer = store.layers.get(y)!;
    for (const [key, type] of layer) {
      const [x, z] = unpack(key);
      blocks.push({ x, y, z, type });
    }
  }

  const data: ExportJSON = {
    blocks,
    meta: {
      totalBlocks: store.count,
      height: store.bounds.maxY - store.bounds.minY + 1,
      width: store.bounds.maxX - store.bounds.minX + 1,
      depth: store.bounds.maxZ - store.bounds.minZ + 1,
      layerCount: store.layers.size,
    },
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Export a human-readable per-layer build guide.
 * Each layer shows block positions grouped by type.
 */
export function exportTextGuide(store: VoxelStore): string {
  const lines: string[] = [];
  lines.push('=== TreeVoxel Build Guide ===');
  lines.push(`Total blocks: ${store.count}`);
  lines.push(`Layers: ${store.layers.size}`);
  lines.push('');

  const sortedYs = Array.from(store.layers.keys()).sort((a, b) => a - b);
  for (const y of sortedYs) {
    const layer = store.layers.get(y)!;
    lines.push(`--- Layer Y=${y} (${layer.size} blocks) ---`);

    const byType: Record<string, string[]> = {};
    for (const [key, type] of layer) {
      const [x, z] = unpack(key);
      if (!byType[type]) byType[type] = [];
      byType[type].push(`(${x}, ${z})`);
    }

    for (const [type, coords] of Object.entries(byType)) {
      lines.push(`  ${type}: ${coords.join(' ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All export tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/export.ts tests/core/export.test.ts
git commit -m "feat: add JSON and text guide export"
```

---

## Task 10: Zustand Store

**Files:**
- Create: `src/store/treeStore.ts`

- [ ] **Step 1: Implement treeStore.ts**

Create `src/store/treeStore.ts`:

```ts
import { create } from 'zustand';
import type { TreeParams, PresetId, VoxelStore, RenderBuffer, TreeModel } from '../core/types';
import { getDefaultParams } from '../core/parameters';
import { PRESETS, applyPreset } from '../core/presets';
import { generateTree, type GenerationResult } from '../core/generate';

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

  // Derived (computed eagerly on param change)
  model: TreeModel;
  voxels: VoxelStore;
  buffer: RenderBuffer;

  // Actions
  setParam: (id: string, value: number | string) => void;
  setPreset: (id: PresetId) => void;
  setActiveLayer: (y: number) => void;
  toggleDisplay: (key: keyof DisplayToggles) => void;
  randomizeSeed: () => void;
};

function regenerate(params: TreeParams): GenerationResult {
  return generateTree(params);
}

const initialParams = applyPreset(getDefaultParams(), PRESETS[0]);
const initialResult = regenerate(initialParams);

export const useTreeStore = create<TreeState>((set) => ({
  presetId: PRESETS[0].id,
  params: initialParams,
  activeLayerIndex: 0,
  display: {
    showLog: true,
    showBranch: true,
    showLeaf: true,
    showGrid: true,
    showAxes: false,
  },

  model: initialResult.model,
  voxels: initialResult.voxels,
  buffer: initialResult.buffer,

  setParam: (id, value) =>
    set((state) => {
      const params = { ...state.params, [id]: value };
      const result = regenerate(params);
      return {
        params,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
      };
    }),

  setPreset: (id) =>
    set(() => {
      const preset = PRESETS.find((p) => p.id === id);
      if (!preset) return {};
      const params = applyPreset(getDefaultParams(), preset);
      const result = regenerate(params);
      return {
        presetId: id,
        params,
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

  randomizeSeed: () =>
    set((state) => {
      const params = { ...state.params, randomSeed: Math.floor(Math.random() * 99999) };
      const result = regenerate(params);
      return {
        params,
        model: result.model,
        voxels: result.voxels,
        buffer: result.buffer,
      };
    }),
}));
```

- [ ] **Step 2: Verify the app still compiles**

```bash
cd /home/arysriv/Desktop/projects/treevoxel && npx tsc --noEmit
```

Expected: No type errors (or only pre-existing Vite template warnings).

- [ ] **Step 3: Commit**

```bash
git add src/store/treeStore.ts
git commit -m "feat: add Zustand store with generation pipeline integration"
```

---

## Task 11: 3D Voxel Renderer

**Files:**
- Create: `src/render/VoxelScene.tsx`, `src/render/VoxelMesh.tsx`, `src/render/LayerHighlight.tsx`

- [ ] **Step 1: Implement VoxelMesh.tsx**

Create `src/render/VoxelMesh.tsx`:

```tsx
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTreeStore } from '../store/treeStore';

const BLOCK_COLORS: Record<number, THREE.Color> = {
  0: new THREE.Color(0x6b4226), // log - brown
  1: new THREE.Color(0x8b6914), // branch - dark gold
  2: new THREE.Color(0x228b22), // leaf - green
};

export default function VoxelMesh() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const buffer = useTreeStore((s) => s.buffer);
  const display = useTreeStore((s) => s.display);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.95, 0.95, 0.95), []);
  const material = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true }), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let visibleCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];

      // Skip hidden block types
      if (typeIdx === 0 && !display.showLog) continue;
      if (typeIdx === 1 && !display.showBranch) continue;
      if (typeIdx === 2 && !display.showLeaf) continue;

      matrix.fromArray(buffer.matrices, i * 16);
      mesh.setMatrixAt(visibleCount, matrix);

      color.copy(BLOCK_COLORS[typeIdx]);
      mesh.setColorAt(visibleCount, color);

      visibleCount++;
    }

    mesh.count = visibleCount;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [buffer, display]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(1, buffer.count)]}
      frustumCulled={false}
    />
  );
}
```

- [ ] **Step 2: Implement LayerHighlight.tsx**

Create `src/render/LayerHighlight.tsx`:

```tsx
import { useTreeStore } from '../store/treeStore';

export default function LayerHighlight() {
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const voxels = useTreeStore((s) => s.voxels);

  // Only show if there are layers and a valid active layer
  if (voxels.layers.size === 0) return null;

  const width = voxels.bounds.maxX - voxels.bounds.minX + 2;
  const depth = voxels.bounds.maxZ - voxels.bounds.minZ + 2;
  const centerX = (voxels.bounds.minX + voxels.bounds.maxX) / 2;
  const centerZ = (voxels.bounds.minZ + voxels.bounds.maxZ) / 2;

  return (
    <mesh
      position={[centerX, activeLayer + 0.5, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color={0x4488ff} transparent opacity={0.15} side={2} />
    </mesh>
  );
}
```

- [ ] **Step 3: Implement VoxelScene.tsx**

Create `src/render/VoxelScene.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import VoxelMesh from './VoxelMesh';
import LayerHighlight from './LayerHighlight';
import { useTreeStore } from '../store/treeStore';

export default function VoxelScene() {
  const display = useTreeStore((s) => s.display);
  const height = useTreeStore((s) => s.params.height);

  return (
    <Canvas
      frameloop="demand"
      camera={{ position: [30, 20, 30], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 40, 20]} intensity={0.8} />
      <directionalLight position={[-10, 20, -10]} intensity={0.3} />

      <VoxelMesh />
      <LayerHighlight />

      {display.showGrid && (
        <Grid
          args={[60, 60]}
          position={[0, -0.01, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#2a2a4a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#3a3a5a"
          fadeDistance={80}
          fadeStrength={1}
          infiniteGrid
        />
      )}

      {display.showAxes && (
        <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
          <GizmoViewport labelColor="white" axisHeadScale={0.8} />
        </GizmoHelper>
      )}

      <OrbitControls
        target={[0, height / 2, 0]}
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={200}
      />
    </Canvas>
  );
}
```

- [ ] **Step 4: Wire VoxelScene into App.tsx**

Replace `src/App.tsx`:

```tsx
import styles from './App.module.css';
import VoxelScene from './render/VoxelScene';

export default function App() {
  return (
    <div className={styles.layout}>
      <div className={styles.viewport}>
        <VoxelScene />
      </div>
      <div className={styles.sidebar}>
        <div className={styles.parameters}>Parameters (coming next)</div>
        <div className={styles.layers}>Layer Browser (coming next)</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify the 3D scene renders**

```bash
npm run dev
```

Expected: Browser shows a 3D voxel tree with orbit controls. Brown trunk, green leaves visible. Grid on ground plane.

- [ ] **Step 6: Commit**

```bash
git add src/render/VoxelScene.tsx src/render/VoxelMesh.tsx src/render/LayerHighlight.tsx src/App.tsx
git commit -m "feat: add 3D voxel renderer with InstancedMesh, orbit controls, and layer highlight"
```

---

## Task 12: Parameter Panel UI

**Files:**
- Create: `src/ui/ParameterSlider.tsx`, `src/ui/ParameterSlider.module.css`, `src/ui/ParameterGroup.tsx`, `src/ui/ParameterGroup.module.css`, `src/ui/ParameterPanel.tsx`, `src/ui/ParameterPanel.module.css`, `src/ui/PresetSelector.tsx`, `src/ui/PresetSelector.module.css`

- [ ] **Step 1: Implement ParameterSlider.tsx**

Create `src/ui/ParameterSlider.tsx`:

```tsx
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { ParameterDef } from '../core/types';
import styles from './ParameterSlider.module.css';

type Props = {
  param: ParameterDef;
  value: number;
  onChange: (value: number) => void;
};

export default function ParameterSlider({ param, value, onChange }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tooltip.Provider delayDuration={300}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <label className={styles.label}>{param.label}</label>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className={styles.tooltip} side="left" sideOffset={8}>
                <p className={styles.tooltipDesc}>{param.description}</p>
                <p className={styles.tooltipEffect}>
                  <span className={styles.up}>+</span> {param.effectIncrease}
                </p>
                <p className={styles.tooltipEffect}>
                  <span className={styles.down}>-</span> {param.effectDecrease}
                </p>
                <Tooltip.Arrow className={styles.tooltipArrow} />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        <span className={styles.value}>{Number.isInteger(param.step) ? value : value.toFixed(2)}</span>
      </div>
      <Slider.Root
        className={styles.slider}
        min={param.min}
        max={param.max}
        step={param.step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      >
        <Slider.Track className={styles.track}>
          <Slider.Range className={styles.range} />
        </Slider.Track>
        <Slider.Thumb className={styles.thumb} />
      </Slider.Root>
    </div>
  );
}
```

Create `src/ui/ParameterSlider.module.css`:

```css
.container {
  margin-bottom: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.label {
  font-size: 12px;
  color: #c0c0d0;
  cursor: help;
  border-bottom: 1px dotted #555;
}

.value {
  font-size: 11px;
  color: #8888aa;
  font-variant-numeric: tabular-nums;
}

.slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 16px;
  touch-action: none;
}

.track {
  position: relative;
  flex-grow: 1;
  height: 3px;
  background: #2a2a3e;
  border-radius: 2px;
}

.range {
  position: absolute;
  height: 100%;
  background: #4488cc;
  border-radius: 2px;
}

.thumb {
  display: block;
  width: 12px;
  height: 12px;
  background: #6699dd;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: grab;
}

.thumb:hover {
  background: #88bbff;
}

.thumb:focus-visible {
  box-shadow: 0 0 0 2px #4488cc;
}

.tooltip {
  background: #1e1e30;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 10px 12px;
  max-width: 260px;
  font-size: 12px;
  color: #c0c0d0;
  z-index: 100;
}

.tooltipDesc {
  margin-bottom: 6px;
  line-height: 1.4;
}

.tooltipEffect {
  font-size: 11px;
  color: #8888aa;
  margin-top: 2px;
}

.up {
  color: #66cc88;
  font-weight: bold;
}

.down {
  color: #cc6666;
  font-weight: bold;
}

.tooltipArrow {
  fill: #3a3a5a;
}
```

- [ ] **Step 2: Implement ParameterGroup.tsx**

Create `src/ui/ParameterGroup.tsx`:

```tsx
import { useState } from 'react';
import type { ParameterDef } from '../core/types';
import ParameterSlider from './ParameterSlider';
import styles from './ParameterGroup.module.css';

const GROUP_LABELS: Record<string, string> = {
  dimensions: 'Dimensions',
  trunk: 'Trunk',
  branching: 'Branching',
  crown: 'Crown & Canopy',
  environment: 'Environment',
  minecraft: 'Minecraft Readability',
};

type Props = {
  group: string;
  params: ParameterDef[];
  values: Record<string, number>;
  onChange: (id: string, value: number) => void;
};

export default function ParameterGroup({ group, params, values, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className={styles.chevron}>{collapsed ? '\u25b6' : '\u25bc'}</span>
        <span className={styles.title}>{GROUP_LABELS[group] || group}</span>
        <span className={styles.count}>{params.length}</span>
      </button>
      {!collapsed && (
        <div className={styles.body}>
          {params.map((p) => (
            <ParameterSlider
              key={p.id}
              param={p}
              value={values[p.id] ?? p.defaultValue}
              onChange={(v) => onChange(p.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `src/ui/ParameterGroup.module.css`:

```css
.container {
  margin-bottom: 4px;
}

.header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  background: none;
  border: none;
  border-bottom: 1px solid #2a2a3e;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
}

.header:hover {
  color: #88bbff;
}

.chevron {
  font-size: 10px;
  width: 16px;
  color: #666;
}

.title {
  flex: 1;
}

.count {
  font-size: 11px;
  color: #555;
  font-weight: 400;
}

.body {
  padding: 8px 0 4px 4px;
}
```

- [ ] **Step 3: Implement PresetSelector.tsx**

Create `src/ui/PresetSelector.tsx`:

```tsx
import * as Select from '@radix-ui/react-select';
import { PRESETS } from '../core/presets';
import { useTreeStore } from '../store/treeStore';
import type { PresetId } from '../core/types';
import styles from './PresetSelector.module.css';

export default function PresetSelector() {
  const presetId = useTreeStore((s) => s.presetId);
  const setPreset = useTreeStore((s) => s.setPreset);

  return (
    <div className={styles.container}>
      <label className={styles.label}>Species Preset</label>
      <Select.Root value={presetId} onValueChange={(v) => setPreset(v as PresetId)}>
        <Select.Trigger className={styles.trigger}>
          <Select.Value />
          <Select.Icon className={styles.icon}>{'\u25bc'}</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={styles.content} position="popper" sideOffset={4}>
            <Select.Viewport>
              {PRESETS.map((preset) => (
                <Select.Item key={preset.id} value={preset.id} className={styles.item}>
                  <Select.ItemText>{preset.name}</Select.ItemText>
                  <div className={styles.itemDesc}>{preset.description}</div>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
```

Create `src/ui/PresetSelector.module.css`:

```css
.container {
  margin-bottom: 16px;
}

.label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: #1e1e30;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;
}

.trigger:hover {
  border-color: #4488cc;
}

.icon {
  font-size: 10px;
  color: #666;
}

.content {
  background: #1e1e30;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 4px;
  z-index: 100;
  min-width: var(--radix-select-trigger-width);
}

.item {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  font-size: 13px;
  color: #e0e0e0;
}

.item:hover,
.item[data-highlighted] {
  background: #2a2a4a;
}

.itemDesc {
  font-size: 11px;
  color: #777;
  margin-top: 2px;
}
```

- [ ] **Step 4: Implement ParameterPanel.tsx**

Create `src/ui/ParameterPanel.tsx`:

```tsx
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { PARAMETER_DEFS } from '../core/parameters';
import { useTreeStore } from '../store/treeStore';
import PresetSelector from './PresetSelector';
import ParameterGroup from './ParameterGroup';
import styles from './ParameterPanel.module.css';

const GROUP_ORDER = ['dimensions', 'trunk', 'branching', 'crown', 'environment', 'minecraft'];

export default function ParameterPanel() {
  const params = useTreeStore((s) => s.params);
  const setParam = useTreeStore((s) => s.setParam);
  const randomizeSeed = useTreeStore((s) => s.randomizeSeed);
  const voxels = useTreeStore((s) => s.voxels);

  const grouped = new Map<string, typeof PARAMETER_DEFS>();
  for (const p of PARAMETER_DEFS) {
    const list = grouped.get(p.group) || [];
    list.push(p);
    grouped.set(p.group, list);
  }

  return (
    <ScrollArea.Root className={styles.root}>
      <ScrollArea.Viewport className={styles.viewport}>
        <div className={styles.inner}>
          <PresetSelector />

          <button className={styles.seedButton} onClick={randomizeSeed}>
            Randomize Seed
          </button>

          {GROUP_ORDER.map((group) => {
            const groupParams = grouped.get(group);
            if (!groupParams) return null;
            return (
              <ParameterGroup
                key={group}
                group={group}
                params={groupParams}
                values={params as unknown as Record<string, number>}
                onChange={setParam}
              />
            );
          })}

          <div className={styles.stats}>
            <span>Blocks: {voxels.count}</span>
            <span>Layers: {voxels.layers.size}</span>
          </div>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={styles.scrollbar} orientation="vertical">
        <ScrollArea.Thumb className={styles.thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
```

Create `src/ui/ParameterPanel.module.css`:

```css
.root {
  flex: 1;
  overflow: hidden;
}

.viewport {
  height: 100%;
  width: 100%;
}

.inner {
  padding: 16px;
}

.seedButton {
  width: 100%;
  padding: 8px;
  margin-bottom: 16px;
  background: #2a2a4a;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  color: #c0c0d0;
  font-size: 12px;
  cursor: pointer;
}

.seedButton:hover {
  background: #3a3a5a;
  border-color: #4488cc;
}

.stats {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 11px;
  color: #666;
  border-top: 1px solid #2a2a3e;
  margin-top: 8px;
}

.scrollbar {
  display: flex;
  width: 6px;
  padding: 2px;
  background: transparent;
  touch-action: none;
}

.thumb {
  flex: 1;
  background: #3a3a5a;
  border-radius: 3px;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/
git commit -m "feat: add parameter panel with grouped sliders, tooltips, and preset selector"
```

---

## Task 13: Layer Browser

**Files:**
- Create: `src/ui/LayerBrowser.tsx`, `src/ui/LayerBrowser.module.css`

- [ ] **Step 1: Implement LayerBrowser.tsx**

Create `src/ui/LayerBrowser.tsx`:

```tsx
import * as Slider from '@radix-ui/react-slider';
import { useMemo } from 'react';
import { useTreeStore } from '../store/treeStore';
import { unpack } from '../core/pack';
import type { BlockType } from '../core/types';
import styles from './LayerBrowser.module.css';

const BLOCK_COLORS: Record<BlockType, string> = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#228b22',
};

export default function LayerBrowser() {
  const voxels = useTreeStore((s) => s.voxels);
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const setActiveLayer = useTreeStore((s) => s.setActiveLayer);

  const sortedYs = useMemo(
    () => Array.from(voxels.layers.keys()).sort((a, b) => a - b),
    [voxels],
  );

  const minY = sortedYs[0] ?? 0;
  const maxY = sortedYs[sortedYs.length - 1] ?? 0;

  // Clamp active layer to valid range
  const clampedLayer = Math.max(minY, Math.min(maxY, activeLayer));

  const layerData = voxels.layers.get(clampedLayer);

  // Compute grid bounds for this layer
  const cells = useMemo(() => {
    if (!layerData) return [];
    const result: Array<{ x: number; z: number; type: BlockType }> = [];
    for (const [key, type] of layerData) {
      const [x, z] = unpack(key);
      result.push({ x, z, type });
    }
    return result;
  }, [layerData]);

  const gridMinX = cells.length > 0 ? Math.min(...cells.map((c) => c.x)) : 0;
  const gridMaxX = cells.length > 0 ? Math.max(...cells.map((c) => c.x)) : 0;
  const gridMinZ = cells.length > 0 ? Math.min(...cells.map((c) => c.z)) : 0;
  const gridMaxZ = cells.length > 0 ? Math.max(...cells.map((c) => c.z)) : 0;
  const gridW = gridMaxX - gridMinX + 1;
  const gridH = gridMaxZ - gridMinZ + 1;

  // Build a lookup for fast rendering
  const cellMap = useMemo(() => {
    const m = new Map<string, BlockType>();
    for (const c of cells) {
      m.set(`${c.x},${c.z}`, c.type);
    }
    return m;
  }, [cells]);

  // Cell size: fit grid into available space
  const maxDim = Math.max(gridW, gridH, 1);
  const cellSize = Math.min(10, Math.floor(220 / maxDim));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Layer View</span>
        <span className={styles.layerInfo}>
          Y={clampedLayer} ({layerData?.size ?? 0} blocks)
        </span>
      </div>

      <Slider.Root
        className={styles.slider}
        min={minY}
        max={maxY}
        step={1}
        value={[clampedLayer]}
        onValueChange={([v]) => setActiveLayer(v)}
        orientation="horizontal"
      >
        <Slider.Track className={styles.track}>
          <Slider.Range className={styles.range} />
        </Slider.Track>
        <Slider.Thumb className={styles.thumb} />
      </Slider.Root>

      <div className={styles.gridContainer}>
        {cells.length === 0 ? (
          <div className={styles.empty}>Empty layer</div>
        ) : (
          <div
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${gridW}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridH}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: gridH }, (_, row) =>
              Array.from({ length: gridW }, (_, col) => {
                const x = gridMinX + col;
                const z = gridMinZ + row;
                const type = cellMap.get(`${x},${z}`);
                return (
                  <div
                    key={`${x},${z}`}
                    className={styles.cell}
                    style={{
                      backgroundColor: type ? BLOCK_COLORS[type] : 'transparent',
                      border: type ? 'none' : '1px solid #1a1a2e',
                    }}
                    title={type ? `(${x}, ${z}) ${type}` : ''}
                  />
                );
              }),
            )}
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.navBtn}
          onClick={() => setActiveLayer(Math.max(minY, clampedLayer - 1))}
          disabled={clampedLayer <= minY}
        >
          Down
        </button>
        <button
          className={styles.navBtn}
          onClick={() => setActiveLayer(Math.min(maxY, clampedLayer + 1))}
          disabled={clampedLayer >= maxY}
        >
          Up
        </button>
      </div>
    </div>
  );
}
```

Create `src/ui/LayerBrowser.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
}

.layerInfo {
  font-size: 11px;
  color: #888;
  font-variant-numeric: tabular-nums;
}

.slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 16px;
  margin-bottom: 8px;
  touch-action: none;
}

.track {
  position: relative;
  flex-grow: 1;
  height: 3px;
  background: #2a2a3e;
  border-radius: 2px;
}

.range {
  position: absolute;
  height: 100%;
  background: #4488cc;
  border-radius: 2px;
}

.thumb {
  display: block;
  width: 14px;
  height: 14px;
  background: #6699dd;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: grab;
}

.gridContainer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.grid {
  display: grid;
  gap: 0;
}

.cell {
  width: 100%;
  height: 100%;
}

.empty {
  color: #555;
  font-size: 12px;
}

.controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.navBtn {
  flex: 1;
  padding: 6px;
  background: #2a2a4a;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  color: #c0c0d0;
  font-size: 12px;
  cursor: pointer;
}

.navBtn:hover:not(:disabled) {
  background: #3a3a5a;
}

.navBtn:disabled {
  opacity: 0.3;
  cursor: default;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/LayerBrowser.tsx src/ui/LayerBrowser.module.css
git commit -m "feat: add 2D layer browser with grid view and Y-level slider"
```

---

## Task 14: Toolbar (Display Toggles)

**Files:**
- Create: `src/ui/Toolbar.tsx`, `src/ui/Toolbar.module.css`

- [ ] **Step 1: Implement Toolbar.tsx**

Create `src/ui/Toolbar.tsx`:

```tsx
import { useTreeStore } from '../store/treeStore';
import styles from './Toolbar.module.css';

const TOGGLE_LABELS: Record<string, string> = {
  showLog: 'Trunk',
  showBranch: 'Branches',
  showLeaf: 'Leaves',
  showGrid: 'Grid',
  showAxes: 'Axes',
};

export default function Toolbar() {
  const display = useTreeStore((s) => s.display);
  const toggleDisplay = useTreeStore((s) => s.toggleDisplay);

  return (
    <div className={styles.toolbar}>
      {Object.entries(TOGGLE_LABELS).map(([key, label]) => (
        <button
          key={key}
          className={`${styles.toggle} ${display[key as keyof typeof display] ? styles.active : ''}`}
          onClick={() => toggleDisplay(key as keyof typeof display)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

Create `src/ui/Toolbar.module.css`:

```css
.toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.toggle {
  padding: 6px 10px;
  font-size: 11px;
  background: rgba(15, 15, 26, 0.8);
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  color: #777;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.toggle:hover {
  border-color: #4488cc;
  color: #aaa;
}

.active {
  color: #e0e0e0;
  background: rgba(40, 40, 70, 0.9);
  border-color: #4488cc;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/Toolbar.tsx src/ui/Toolbar.module.css
git commit -m "feat: add display toggle toolbar (trunk, branches, leaves, grid, axes)"
```

---

## Task 15: Export Panel

**Files:**
- Create: `src/ui/ExportPanel.tsx`, `src/ui/ExportPanel.module.css`

- [ ] **Step 1: Implement ExportPanel.tsx**

Create `src/ui/ExportPanel.tsx`:

```tsx
import { useTreeStore } from '../store/treeStore';
import { exportJSON, exportTextGuide } from '../core/export';
import styles from './ExportPanel.module.css';

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPanel() {
  const voxels = useTreeStore((s) => s.voxels);
  const params = useTreeStore((s) => s.params);

  const handleExportJSON = () => {
    const json = exportJSON(voxels, params);
    downloadFile(json, 'treevoxel-export.json', 'application/json');
  };

  const handleExportText = () => {
    const guide = exportTextGuide(voxels);
    downloadFile(guide, 'treevoxel-build-guide.txt', 'text/plain');
  };

  return (
    <div className={styles.container}>
      <span className={styles.title}>Export</span>
      <div className={styles.buttons}>
        <button className={styles.btn} onClick={handleExportJSON}>
          JSON
        </button>
        <button className={styles.btn} onClick={handleExportText}>
          Build Guide
        </button>
      </div>
    </div>
  );
}
```

Create `src/ui/ExportPanel.module.css`:

```css
.container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #2a2a3e;
}

.title {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.buttons {
  display: flex;
  gap: 6px;
  flex: 1;
}

.btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 11px;
  background: #2a2a4a;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  color: #c0c0d0;
  cursor: pointer;
}

.btn:hover {
  background: #3a3a5a;
  border-color: #4488cc;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/ExportPanel.tsx src/ui/ExportPanel.module.css
git commit -m "feat: add export panel with JSON and text guide download"
```

---

## Task 16: Final App Integration

**Files:**
- Modify: `src/App.tsx`, `src/App.module.css`

- [ ] **Step 1: Wire all components into App.tsx**

Replace `src/App.tsx`:

```tsx
import styles from './App.module.css';
import VoxelScene from './render/VoxelScene';
import ParameterPanel from './ui/ParameterPanel';
import LayerBrowser from './ui/LayerBrowser';
import Toolbar from './ui/Toolbar';
import ExportPanel from './ui/ExportPanel';

export default function App() {
  return (
    <div className={styles.layout}>
      <div className={styles.viewport}>
        <Toolbar />
        <VoxelScene />
      </div>
      <div className={styles.sidebar}>
        <ParameterPanel />
        <LayerBrowser />
        <ExportPanel />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update App.module.css**

Replace `src/App.module.css`:

```css
.layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  height: 100vh;
  overflow: hidden;
}

.viewport {
  position: relative;
  background: #1a1a2e;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
  border-left: 1px solid #2a2a3e;
  overflow: hidden;
}
```

- [ ] **Step 3: Add keyboard navigation for layers**

Add keyboard event handler. Modify `src/App.tsx`:

```tsx
import { useEffect } from 'react';
import styles from './App.module.css';
import VoxelScene from './render/VoxelScene';
import ParameterPanel from './ui/ParameterPanel';
import LayerBrowser from './ui/LayerBrowser';
import Toolbar from './ui/Toolbar';
import ExportPanel from './ui/ExportPanel';
import { useTreeStore } from './store/treeStore';

export default function App() {
  const voxels = useTreeStore((s) => s.voxels);
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const setActiveLayer = useTreeStore((s) => s.setActiveLayer);

  useEffect(() => {
    const sortedYs = Array.from(voxels.layers.keys()).sort((a, b) => a - b);
    const minY = sortedYs[0] ?? 0;
    const maxY = sortedYs[sortedYs.length - 1] ?? 0;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveLayer(Math.min(maxY, activeLayer + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveLayer(Math.max(minY, activeLayer - 1));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [voxels, activeLayer, setActiveLayer]);

  return (
    <div className={styles.layout}>
      <div className={styles.viewport}>
        <Toolbar />
        <VoxelScene />
      </div>
      <div className={styles.sidebar}>
        <ParameterPanel />
        <LayerBrowser />
        <ExportPanel />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the full app works**

```bash
npm run dev
```

Expected:
- 3D voxel tree renders in the viewport with orbit controls
- Parameter panel on the right with grouped sliders and preset selector
- Changing any parameter updates the tree immediately
- Switching presets (Spruce, Oak, Willow) shows distinctly different trees
- Layer browser shows 2D slice, slider and arrow keys navigate Y levels
- Toolbar toggles hide/show trunk, branches, leaves, grid, axes
- Export buttons download JSON and text guide files
- Translucent layer highlight plane visible in 3D view

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.module.css
git commit -m "feat: integrate all components into final app layout with keyboard navigation"
```

---

## Task 17: R3F frameloop demand invalidation

**Files:**
- Modify: `src/render/VoxelMesh.tsx`, `src/render/LayerHighlight.tsx`

The `Canvas` uses `frameloop="demand"`, so we need to explicitly invalidate the frame when data changes.

- [ ] **Step 1: Add invalidation to VoxelMesh**

In `src/render/VoxelMesh.tsx`, add `useThree` import and invalidate call:

```tsx
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTreeStore } from '../store/treeStore';

const BLOCK_COLORS: Record<number, THREE.Color> = {
  0: new THREE.Color(0x6b4226),
  1: new THREE.Color(0x8b6914),
  2: new THREE.Color(0x228b22),
};

export default function VoxelMesh() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const buffer = useTreeStore((s) => s.buffer);
  const display = useTreeStore((s) => s.display);
  const invalidate = useThree((s) => s.invalidate);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.95, 0.95, 0.95), []);
  const material = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true }), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let visibleCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];

      if (typeIdx === 0 && !display.showLog) continue;
      if (typeIdx === 1 && !display.showBranch) continue;
      if (typeIdx === 2 && !display.showLeaf) continue;

      matrix.fromArray(buffer.matrices, i * 16);
      mesh.setMatrixAt(visibleCount, matrix);

      color.copy(BLOCK_COLORS[typeIdx]);
      mesh.setColorAt(visibleCount, color);

      visibleCount++;
    }

    mesh.count = visibleCount;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    invalidate();
  }, [buffer, display, invalidate]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(1, buffer.count)]}
      frustumCulled={false}
    />
  );
}
```

- [ ] **Step 2: Add invalidation to LayerHighlight**

In `src/render/LayerHighlight.tsx`:

```tsx
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useTreeStore } from '../store/treeStore';

export default function LayerHighlight() {
  const activeLayer = useTreeStore((s) => s.activeLayerIndex);
  const voxels = useTreeStore((s) => s.voxels);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
  }, [activeLayer, invalidate]);

  if (voxels.layers.size === 0) return null;

  const width = voxels.bounds.maxX - voxels.bounds.minX + 2;
  const depth = voxels.bounds.maxZ - voxels.bounds.minZ + 2;
  const centerX = (voxels.bounds.minX + voxels.bounds.maxX) / 2;
  const centerZ = (voxels.bounds.minZ + voxels.bounds.maxZ) / 2;

  return (
    <mesh
      position={[centerX, activeLayer + 0.5, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color={0x4488ff} transparent opacity={0.15} side={2} />
    </mesh>
  );
}
```

- [ ] **Step 3: Verify demand rendering works**

```bash
npm run dev
```

Expected: Scene only re-renders when parameters change, layer changes, or orbit controls move. CPU usage is low when idle.

- [ ] **Step 4: Commit**

```bash
git add src/render/VoxelMesh.tsx src/render/LayerHighlight.tsx
git commit -m "fix: add frame invalidation for demand-mode rendering"
```

---

## Task 18: Crown Shape Selector

**Files:**
- Modify: `src/ui/ParameterPanel.tsx`

The crown shape is a categorical parameter, not a slider. We need a dropdown for it.

- [ ] **Step 1: Add crown shape select to ParameterPanel**

In `src/ui/ParameterPanel.tsx`, add the categorical parameter handling after the import section:

```tsx
import * as Select from '@radix-ui/react-select';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { PARAMETER_DEFS, CATEGORICAL_PARAMS } from '../core/parameters';
import { useTreeStore } from '../store/treeStore';
import PresetSelector from './PresetSelector';
import ParameterGroup from './ParameterGroup';
import styles from './ParameterPanel.module.css';

const GROUP_ORDER = ['dimensions', 'trunk', 'branching', 'crown', 'environment', 'minecraft'];

export default function ParameterPanel() {
  const params = useTreeStore((s) => s.params);
  const setParam = useTreeStore((s) => s.setParam);
  const randomizeSeed = useTreeStore((s) => s.randomizeSeed);
  const voxels = useTreeStore((s) => s.voxels);

  const grouped = new Map<string, typeof PARAMETER_DEFS>();
  for (const p of PARAMETER_DEFS) {
    const list = grouped.get(p.group) || [];
    list.push(p);
    grouped.set(p.group, list);
  }

  return (
    <ScrollArea.Root className={styles.root}>
      <ScrollArea.Viewport className={styles.viewport}>
        <div className={styles.inner}>
          <PresetSelector />

          <button className={styles.seedButton} onClick={randomizeSeed}>
            Randomize Seed
          </button>

          {GROUP_ORDER.map((group) => {
            const groupParams = grouped.get(group);
            if (!groupParams) return null;
            return (
              <div key={group}>
                <ParameterGroup
                  group={group}
                  params={groupParams}
                  values={params as unknown as Record<string, number>}
                  onChange={setParam}
                />
                {/* Render categorical params for this group */}
                {CATEGORICAL_PARAMS
                  .filter((cp) => cp.group === group)
                  .map((cp) => (
                    <div key={cp.id} className={styles.categoricalParam}>
                      <label className={styles.categoricalLabel}>{cp.label}</label>
                      <Select.Root
                        value={params[cp.id] as string}
                        onValueChange={(v) => setParam(cp.id, v)}
                      >
                        <Select.Trigger className={styles.categoricalTrigger}>
                          <Select.Value />
                          <Select.Icon>{'\u25bc'}</Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className={styles.categoricalContent} position="popper" sideOffset={4}>
                            <Select.Viewport>
                              {cp.options.map((opt) => (
                                <Select.Item key={opt} value={opt} className={styles.categoricalItem}>
                                  <Select.ItemText>{opt}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  ))}
              </div>
            );
          })}

          <div className={styles.stats}>
            <span>Blocks: {voxels.count}</span>
            <span>Layers: {voxels.layers.size}</span>
          </div>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={styles.scrollbar} orientation="vertical">
        <ScrollArea.Thumb className={styles.thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
```

- [ ] **Step 2: Add CSS for categorical params**

Append to `src/ui/ParameterPanel.module.css`:

```css
.categoricalParam {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-left: 4px;
}

.categoricalLabel {
  font-size: 12px;
  color: #c0c0d0;
}

.categoricalTrigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #1e1e30;
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
}

.categoricalContent {
  background: #1e1e30;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 4px;
  z-index: 100;
}

.categoricalItem {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  font-size: 12px;
  color: #e0e0e0;
  text-transform: capitalize;
}

.categoricalItem:hover,
.categoricalItem[data-highlighted] {
  background: #2a2a4a;
}
```

- [ ] **Step 3: Verify crown shape selector works**

```bash
npm run dev
```

Expected: Crown & Canopy group shows a dropdown for crown shape. Changing the shape regenerates the tree.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ParameterPanel.tsx src/ui/ParameterPanel.module.css
git commit -m "feat: add crown shape categorical selector to parameter panel"
```

---

## Task 19: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests PASS (pack, parameters, presets, skeleton, crown, voxelize, renderBuffer, generate, export).

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Verify all items from RESEARCH.md section 14:

1. React + R3F app with orbit controls and instanced cube renderer
2. Sparse voxel storage with log, branch, and leaf block types
3. Rule-based tree generator with editable archetype
4. Parameter panel with explanations for: height, trunk base radius, clear trunk height, branch angle, branch density, crown width, crown shape, leaf density, branch droop, randomSeed
5. Layer viewer with vertical slider for Y level selection
6. Three starter presets: spruce (excurrent), oak (rounded broadleaf), willow (drooping)
7. Export in JSON and per-layer text guide formats

- [ ] **Step 5: Commit any final fixes if needed**

```bash
git add -A && git status
```

Only commit if there are actual changes to commit.
