# TreeVoxel v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Minecraft block palette with fence-mimic branches, litematica export, and expanded slider ranges to TreeVoxel.

**Architecture:** Extend the existing generation pipeline (types -> voxelize -> renderBuffer -> render) with per-voxel axis/connectivity metadata, a new fence block type, and a parallel MinecraftPalette alongside BlockColors. Litematica export consumes the enriched VoxelStore + MinecraftPalette to produce a binary .litematic file. UI additions are MC block dropdowns in the palette section and a new export button.

**Tech Stack:** TypeScript, React 19, Three.js (r183), Zustand 5, @react-three/fiber, Radix UI, Vitest, nbtify (new dependency for NBT encoding)

---

## File Structure

| File | Responsibility |
|---|---|
| `src/core/types.ts` | Add `'fence'` to `BlockType`, add `MinecraftPalette`, `Axis`, extend `VoxelStore` with `axis`/`fenceConnectivity`, extend `TreeSnapshot`, extend `Preset` |
| `src/core/minecraftBlocks.ts` | **New** — `MC_BLOCK_PRESETS` lookup table and helpers |
| `src/core/parameters.ts` | Expand slider ranges for 9 parameters |
| `src/core/voxelize.ts` | Axis tracking for wood voxels, `voxelizeFenceSegment()`, connectivity pass, priority rules |
| `src/core/renderBuffer.ts` | Add fence post/arm arrays to `RenderBuffer`, consume fence metadata |
| `src/core/export.ts` | Add `exportLitematic()` for .litematic binary export |
| `src/core/presets.ts` | Add `minecraftPalette` defaults per preset |
| `src/store/treeStore.ts` | Add `minecraftPalette` to store state and actions |
| `src/render/VoxelMesh.tsx` | Add fence post and arm `InstancedMesh` rendering |
| `src/ui/ParameterPanel.tsx` | Add MC block dropdowns to palette UI, add litematica export button |
| `src/ui/CommunityPanel.tsx` | Include `minecraftPalette` in submitted/loaded snapshots |
| `src/ui/LayerBrowser.tsx` | Render fence voxels with branch color in 2D layer view |
| `tests/core/voxelize.test.ts` | Axis tracking, fence generation, connectivity tests |
| `tests/core/renderBuffer.test.ts` | Fence post/arm instance count tests |
| `tests/core/export.test.ts` | Litematica palette/state generation tests |
| `tests/core/minecraftBlocks.test.ts` | **New** — preset lookup validation |

---

### Task 1: Expand Type Definitions

**Files:**
- Modify: `src/core/types.ts`

- [ ] **Step 1: Write the failing test for new types**

Create `tests/core/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { BlockType, Axis, MinecraftPalette, VoxelStore, TreeSnapshot, Preset } from '../../src/core/types';

describe('v2 type definitions', () => {
  it('BlockType includes fence', () => {
    const t: BlockType = 'fence';
    expect(t).toBe('fence');
  });

  it('Axis type accepts x, y, z', () => {
    const axes: Axis[] = ['x', 'y', 'z'];
    expect(axes).toHaveLength(3);
  });

  it('MinecraftPalette has log, branch, fence, leaf fields', () => {
    const palette: MinecraftPalette = {
      log: 'oak_log',
      branch: 'stripped_oak_log',
      fence: 'oak_fence',
      leaf: 'oak_leaves',
    };
    expect(palette.log).toBe('oak_log');
    expect(palette.fence).toBe('oak_fence');
  });

  it('VoxelStore has axis and fenceConnectivity maps', () => {
    const store: VoxelStore = {
      layers: new Map(),
      axis: new Map(),
      fenceConnectivity: new Map(),
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 },
      count: 0,
    };
    expect(store.axis).toBeInstanceOf(Map);
    expect(store.fenceConnectivity).toBeInstanceOf(Map);
  });

  it('TreeSnapshot includes minecraftPalette', () => {
    const snapshot: TreeSnapshot = {
      presetId: 'oak',
      params: {} as TreeSnapshot['params'],
      blockColors: { log: '#000', branch: '#000', leaf: '#000', fence: '#000' },
      minecraftPalette: {
        log: 'oak_log',
        branch: 'stripped_oak_log',
        fence: 'oak_fence',
        leaf: 'oak_leaves',
      },
    };
    expect(snapshot.minecraftPalette.log).toBe('oak_log');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/types.test.ts`
Expected: FAIL — types don't exist yet

- [ ] **Step 3: Update types.ts with v2 type definitions**

In `src/core/types.ts`, make these changes:

1. Change `BlockType` to include `'fence'`:
```ts
export type BlockType = 'log' | 'branch' | 'leaf' | 'fence';
```

2. Add `Axis` type after `BlockType`:
```ts
export type Axis = 'x' | 'y' | 'z';
```

3. Add `MinecraftPalette` type after `BlockColors`:
```ts
export type MinecraftBlockId = string;

export type MinecraftPalette = {
  log: MinecraftBlockId;
  branch: MinecraftBlockId;
  fence: MinecraftBlockId;
  leaf: MinecraftBlockId;
};
```

4. Extend `VoxelStore` with axis and fence connectivity:
```ts
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
```

5. Extend `BlockColors` to include fence:
```ts
export type BlockColors = Record<BlockType, string>;
```

6. Extend `TreeSnapshot` with `minecraftPalette`:
```ts
export type TreeSnapshot = {
  presetId: PresetId;
  params: TreeParams;
  blockColors: BlockColors;
  minecraftPalette: MinecraftPalette;
};
```

7. Extend `Preset` with optional `minecraftPalette`:
```ts
export type Preset = {
  id: PresetId;
  name: string;
  description: string;
  growthForm: string;
  params: Partial<TreeParams>;
  blockColors: BlockColors;
  minecraftPalette?: MinecraftPalette;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/types.test.ts`
Expected: PASS

- [ ] **Step 5: Fix compilation errors from BlockColors expansion**

Adding `'fence'` to `BlockType` means `BlockColors` now requires a `fence` key everywhere it's used. Update all `BlockColors` literals across the codebase:

In `src/core/renderBuffer.ts`, update `DEFAULT_BLOCK_COLORS`:
```ts
const DEFAULT_BLOCK_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};
```

In `src/core/renderBuffer.ts`, update `BLOCK_TYPE_INDEX`:
```ts
const BLOCK_TYPE_INDEX: Record<BlockType, number> = {
  log: 0,
  branch: 1,
  leaf: 2,
  fence: 3,
};
```

In `src/store/treeStore.ts`, update `DEFAULT_BLOCK_COLORS`:
```ts
const DEFAULT_BLOCK_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};
```

In `src/core/presets.ts`, update `DEFAULT_PRESET_COLORS` and every preset's `blockColors` to include `fence`:
```ts
const DEFAULT_PRESET_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};
```

Each preset's `blockColors` needs a `fence` entry matching its `branch` color:
- spruce: `fence: '#6b4a2e'`
- oak: `fence: '#856331'`
- willow: `fence: '#8f6c44'`
- italian-cypress: `fence: '#674330'`
- baobab: `fence: '#9c7c60'`
- monkey-puzzle: `fence: '#5d4330'`
- joshua-tree: `fence: '#806648'`

In `src/core/voxelize.ts`, add the new maps to the return value (initially empty — will be populated in Task 4):
```ts
return { layers, axis: new Map(), fenceConnectivity: new Map(), bounds, count };
```

In `src/ui/LayerBrowser.tsx`, update `BLOCK_COLORS`:
```ts
const BLOCK_COLORS: Record<BlockType, string> = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#228b22',
  fence: '#8b6914',
};
```

- [ ] **Step 6: Run full test suite to verify nothing is broken**

Run: `npx vitest run`
Expected: All existing tests PASS (some may need minor adjustments for the new VoxelStore shape)

- [ ] **Step 7: Fix any remaining test failures from VoxelStore shape change**

The existing tests that create or check `VoxelStore` may fail because they don't include `axis` and `fenceConnectivity`. The `voxelize()` function now returns these (as empty maps for now), so tests that only check `layers`, `bounds`, and `count` should still pass. If any test creates a `VoxelStore` literal, add the new fields.

In `tests/core/renderBuffer.test.ts`, the `store` variable comes from `voxelize()` which now returns the new fields, so no changes needed.

In `tests/core/export.test.ts`, same — `store` comes from `generateTree()`.

- [ ] **Step 8: Run full test suite again**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add src/core/types.ts src/core/renderBuffer.ts src/core/voxelize.ts src/core/presets.ts src/store/treeStore.ts src/ui/LayerBrowser.ts tests/core/types.test.ts
git commit -m "feat: expand type definitions for v2 (fence block type, axis, minecraft palette)"
```

---

### Task 2: Create Minecraft Block Presets Data File

**Files:**
- Create: `src/core/minecraftBlocks.ts`
- Create: `tests/core/minecraftBlocks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/core/minecraftBlocks.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  MC_BLOCK_PRESETS,
  getPresetsForCategory,
  getPresetById,
  type McBlockPreset,
} from '../../src/core/minecraftBlocks';

describe('MC_BLOCK_PRESETS', () => {
  it('contains presets for all four categories', () => {
    const categories = new Set(MC_BLOCK_PRESETS.map((p) => p.category));
    expect(categories).toEqual(new Set(['log', 'branch', 'leaf', 'fence']));
  });

  it('every preset has a non-empty id, label, and valid hex color', () => {
    for (const preset of MC_BLOCK_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.approximateHex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has no duplicate ids within the same category', () => {
    const categories = ['log', 'branch', 'leaf', 'fence'] as const;
    for (const cat of categories) {
      const ids = getPresetsForCategory(cat).map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('getPresetsForCategory returns only that category', () => {
    const logs = getPresetsForCategory('log');
    expect(logs.length).toBeGreaterThan(0);
    for (const p of logs) {
      expect(p.category).toBe('log');
    }
  });

  it('getPresetById returns the matching preset', () => {
    const preset = getPresetById('oak_log');
    expect(preset).toBeDefined();
    expect(preset!.id).toBe('oak_log');
  });

  it('getPresetById returns undefined for unknown id', () => {
    expect(getPresetById('nonexistent_block')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/minecraftBlocks.test.ts`
Expected: FAIL — module doesn't exist

- [ ] **Step 3: Create the minecraft blocks data file**

Create `src/core/minecraftBlocks.ts`:

```ts
import type { MinecraftBlockId } from './types';

export type McBlockPreset = {
  id: MinecraftBlockId;
  label: string;
  approximateHex: string;
  category: 'log' | 'branch' | 'leaf' | 'fence';
};

export const MC_BLOCK_PRESETS: McBlockPreset[] = [
  // --- Logs ---
  { id: 'oak_log', label: 'Oak Log', approximateHex: '#6b5229', category: 'log' },
  { id: 'spruce_log', label: 'Spruce Log', approximateHex: '#3b2712', category: 'log' },
  { id: 'birch_log', label: 'Birch Log', approximateHex: '#d5cdb4', category: 'log' },
  { id: 'jungle_log', label: 'Jungle Log', approximateHex: '#564419', category: 'log' },
  { id: 'acacia_log', label: 'Acacia Log', approximateHex: '#676157', category: 'log' },
  { id: 'dark_oak_log', label: 'Dark Oak Log', approximateHex: '#3e2912', category: 'log' },
  { id: 'mangrove_log', label: 'Mangrove Log', approximateHex: '#6b4535', category: 'log' },
  { id: 'cherry_log', label: 'Cherry Log', approximateHex: '#3b1e1a', category: 'log' },
  { id: 'bamboo_block', label: 'Bamboo Block', approximateHex: '#8c9f2a', category: 'log' },
  { id: 'stripped_oak_log', label: 'Stripped Oak Log', approximateHex: '#b29157', category: 'log' },
  { id: 'stripped_spruce_log', label: 'Stripped Spruce Log', approximateHex: '#725a36', category: 'log' },
  { id: 'stripped_birch_log', label: 'Stripped Birch Log', approximateHex: '#c8b77d', category: 'log' },
  { id: 'stripped_jungle_log', label: 'Stripped Jungle Log', approximateHex: '#ac8850', category: 'log' },
  { id: 'stripped_acacia_log', label: 'Stripped Acacia Log', approximateHex: '#b05d3b', category: 'log' },
  { id: 'stripped_dark_oak_log', label: 'Stripped Dark Oak Log', approximateHex: '#5a4428', category: 'log' },
  { id: 'stripped_mangrove_log', label: 'Stripped Mangrove Log', approximateHex: '#7b3a36', category: 'log' },
  { id: 'stripped_cherry_log', label: 'Stripped Cherry Log', approximateHex: '#d9a1a1', category: 'log' },

  // --- Branch (same wood set — builders often use stripped logs for branches) ---
  { id: 'oak_log', label: 'Oak Log', approximateHex: '#6b5229', category: 'branch' },
  { id: 'spruce_log', label: 'Spruce Log', approximateHex: '#3b2712', category: 'branch' },
  { id: 'birch_log', label: 'Birch Log', approximateHex: '#d5cdb4', category: 'branch' },
  { id: 'jungle_log', label: 'Jungle Log', approximateHex: '#564419', category: 'branch' },
  { id: 'acacia_log', label: 'Acacia Log', approximateHex: '#676157', category: 'branch' },
  { id: 'dark_oak_log', label: 'Dark Oak Log', approximateHex: '#3e2912', category: 'branch' },
  { id: 'mangrove_log', label: 'Mangrove Log', approximateHex: '#6b4535', category: 'branch' },
  { id: 'cherry_log', label: 'Cherry Log', approximateHex: '#3b1e1a', category: 'branch' },
  { id: 'bamboo_block', label: 'Bamboo Block', approximateHex: '#8c9f2a', category: 'branch' },
  { id: 'stripped_oak_log', label: 'Stripped Oak Log', approximateHex: '#b29157', category: 'branch' },
  { id: 'stripped_spruce_log', label: 'Stripped Spruce Log', approximateHex: '#725a36', category: 'branch' },
  { id: 'stripped_birch_log', label: 'Stripped Birch Log', approximateHex: '#c8b77d', category: 'branch' },
  { id: 'stripped_jungle_log', label: 'Stripped Jungle Log', approximateHex: '#ac8850', category: 'branch' },
  { id: 'stripped_acacia_log', label: 'Stripped Acacia Log', approximateHex: '#b05d3b', category: 'branch' },
  { id: 'stripped_dark_oak_log', label: 'Stripped Dark Oak Log', approximateHex: '#5a4428', category: 'branch' },
  { id: 'stripped_mangrove_log', label: 'Stripped Mangrove Log', approximateHex: '#7b3a36', category: 'branch' },
  { id: 'stripped_cherry_log', label: 'Stripped Cherry Log', approximateHex: '#d9a1a1', category: 'branch' },

  // --- Leaves ---
  { id: 'oak_leaves', label: 'Oak Leaves', approximateHex: '#4a7a32', category: 'leaf' },
  { id: 'spruce_leaves', label: 'Spruce Leaves', approximateHex: '#3b5e30', category: 'leaf' },
  { id: 'birch_leaves', label: 'Birch Leaves', approximateHex: '#5a8c3c', category: 'leaf' },
  { id: 'jungle_leaves', label: 'Jungle Leaves', approximateHex: '#30801a', category: 'leaf' },
  { id: 'acacia_leaves', label: 'Acacia Leaves', approximateHex: '#4a7a32', category: 'leaf' },
  { id: 'dark_oak_leaves', label: 'Dark Oak Leaves', approximateHex: '#4a7a32', category: 'leaf' },
  { id: 'mangrove_leaves', label: 'Mangrove Leaves', approximateHex: '#4d8b28', category: 'leaf' },
  { id: 'cherry_leaves', label: 'Cherry Leaves', approximateHex: '#e8b4c8', category: 'leaf' },
  { id: 'azalea_leaves', label: 'Azalea Leaves', approximateHex: '#5a8c3c', category: 'leaf' },
  { id: 'flowering_azalea_leaves', label: 'Flowering Azalea Leaves', approximateHex: '#7b9847', category: 'leaf' },

  // --- Fences ---
  { id: 'oak_fence', label: 'Oak Fence', approximateHex: '#b29157', category: 'fence' },
  { id: 'spruce_fence', label: 'Spruce Fence', approximateHex: '#725a36', category: 'fence' },
  { id: 'birch_fence', label: 'Birch Fence', approximateHex: '#c8b77d', category: 'fence' },
  { id: 'jungle_fence', label: 'Jungle Fence', approximateHex: '#ac8850', category: 'fence' },
  { id: 'acacia_fence', label: 'Acacia Fence', approximateHex: '#b05d3b', category: 'fence' },
  { id: 'dark_oak_fence', label: 'Dark Oak Fence', approximateHex: '#5a4428', category: 'fence' },
  { id: 'mangrove_fence', label: 'Mangrove Fence', approximateHex: '#7b3a36', category: 'fence' },
  { id: 'cherry_fence', label: 'Cherry Fence', approximateHex: '#d9a1a1', category: 'fence' },
  { id: 'bamboo_fence', label: 'Bamboo Fence', approximateHex: '#8c9f2a', category: 'fence' },
];

export function getPresetsForCategory(category: McBlockPreset['category']): McBlockPreset[] {
  return MC_BLOCK_PRESETS.filter((p) => p.category === category);
}

export function getPresetById(id: string): McBlockPreset | undefined {
  return MC_BLOCK_PRESETS.find((p) => p.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/minecraftBlocks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/minecraftBlocks.ts tests/core/minecraftBlocks.test.ts
git commit -m "feat: add Minecraft block presets data file"
```

---

### Task 3: Expand Slider Ranges

**Files:**
- Modify: `src/core/parameters.ts`
- Modify: `tests/core/parameters.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/core/parameters.test.ts`:

```ts
describe('v2 expanded ranges', () => {
  const findParam = (id: string) => PARAMETER_DEFS.find((p) => p.id === id)!;

  it('height goes up to 200', () => {
    expect(findParam('height').max).toBe(200);
  });

  it('crownWidth goes up to 120', () => {
    expect(findParam('crownWidth').max).toBe(120);
  });

  it('trunkBaseRadius goes up to 20', () => {
    expect(findParam('trunkBaseRadius').max).toBe(20);
  });

  it('primaryBranchCount goes up to 40', () => {
    expect(findParam('primaryBranchCount').max).toBe(40);
  });

  it('branchOrderDepth goes up to 6', () => {
    expect(findParam('branchOrderDepth').max).toBe(6);
  });

  it('leafClusterRadius goes up to 15', () => {
    expect(findParam('leafClusterRadius').max).toBe(15);
  });

  it('randomSeed goes up to 999999', () => {
    expect(findParam('randomSeed').max).toBe(999999);
  });

  it('crownDepth min is 0.05 and max is 1.0', () => {
    const p = findParam('crownDepth');
    expect(p.min).toBe(0.05);
    expect(p.max).toBe(1.0);
  });

  it('branchLengthRatio min is 0.1 and max is 2.0', () => {
    const p = findParam('branchLengthRatio');
    expect(p.min).toBe(0.1);
    expect(p.max).toBe(2.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/parameters.test.ts`
Expected: FAIL — ranges don't match yet

- [ ] **Step 3: Update parameter ranges**

In `src/core/parameters.ts`, update these entries in `PARAMETER_DEFS`:

| Parameter | Field | Old | New |
|---|---|---|---|
| `randomSeed` | `max` | `99999` | `999999` |
| `height` | `max` | `80` | `200` |
| `crownWidth` | `max` | `40` | `120` |
| `crownDepth` | `min` | `0.1` | `0.05` |
| `crownDepth` | `max` | `0.95` | `1.0` |
| `trunkBaseRadius` | `max` | `6` | `20` |
| `primaryBranchCount` | `max` | `16` | `40` |
| `branchLengthRatio` | `min` | `0.2` | `0.1` |
| `branchLengthRatio` | `max` | `1.0` | `2.0` |
| `branchOrderDepth` | `max` | `4` | `6` |
| `leafClusterRadius` | `max` | `5` | `15` |

Also update `randomizeSeed` in `src/store/treeStore.ts` to use the new max:
```ts
randomizeSeed: () =>
  set((state) => {
    const params = { ...state.params, randomSeed: Math.floor(Math.random() * 999999) };
    // ...rest unchanged
  }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/parameters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/parameters.ts src/store/treeStore.ts tests/core/parameters.test.ts
git commit -m "feat: expand slider ranges for v2 (taller trees, wider crowns, more branches)"
```

---

### Task 4: Voxelization — Axis Tracking for Wood Voxels

**Files:**
- Modify: `src/core/voxelize.ts`
- Modify: `tests/core/voxelize.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/core/voxelize.test.ts`:

```ts
import { pack } from '../../src/core/pack';

describe('axis tracking', () => {
  const params = getDefaultParams();
  const skeleton = generateSkeleton(params);
  const clusters = generateLeafClusters(skeleton, params);
  const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);

  it('axis map is populated for wood voxels', () => {
    let woodCount = 0;
    let axisCount = 0;
    for (const [y, layer] of store.layers) {
      const axisLayer = store.axis.get(y);
      for (const [key, type] of layer) {
        if (type === 'log' || type === 'branch') {
          woodCount++;
          if (axisLayer?.has(key)) axisCount++;
        }
      }
    }
    expect(woodCount).toBeGreaterThan(0);
    expect(axisCount).toBe(woodCount);
  });

  it('axis values are x, y, or z', () => {
    for (const [, axisLayer] of store.axis) {
      for (const [, axis] of axisLayer) {
        expect(['x', 'y', 'z']).toContain(axis);
      }
    }
  });

  it('trunk voxels have predominantly y axis', () => {
    const groundLayer = store.layers.get(0);
    const axisLayer = store.axis.get(0);
    if (!groundLayer || !axisLayer) return;

    let yAxisCount = 0;
    let totalWood = 0;
    for (const [key, type] of groundLayer) {
      if (type === 'log') {
        totalWood++;
        if (axisLayer.get(key) === 'y') yAxisCount++;
      }
    }
    expect(yAxisCount).toBe(totalWood);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/voxelize.test.ts`
Expected: FAIL — axis map is empty

- [ ] **Step 3: Add axis tracking to voxelize.ts**

In `src/core/voxelize.ts`:

1. Import the `Axis` type:
```ts
import type { TreeModel, TreeParams, VoxelStore, BlockType, Axis } from './types';
```

2. Add axis map initialization alongside layers:
```ts
const axis = new Map<number, Map<number, Axis>>();
```

3. Add a helper function to derive the dominant axis from a segment direction:
```ts
function dominantAxis(dx: number, dy: number, dz: number): Axis {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const az = Math.abs(dz);
  if (ay >= ax && ay >= az) return 'y';
  if (ax >= az) return 'x';
  return 'z';
}
```

4. Modify `setBlock` to accept an optional axis parameter and store it:
```ts
function setBlock(x: number, y: number, z: number, type: BlockType, blockAxis?: Axis): void {
  const iy = Math.round(y);
  const ix = Math.round(x);
  const iz = Math.round(z);
  const key = pack(ix, iz);

  let layer = layers.get(iy);
  if (!layer) {
    layer = new Map();
    layers.set(iy, layer);
  }

  const existing = layer.get(key);
  if (existing && (existing === 'log' || existing === 'branch') && type === 'leaf') {
    return;
  }

  if (!existing) count++;
  layer.set(key, type);

  // Store axis for wood voxels
  if (blockAxis && (type === 'log' || type === 'branch')) {
    let axisLayer = axis.get(iy);
    if (!axisLayer) {
      axisLayer = new Map();
      axis.set(iy, axisLayer);
    }
    axisLayer.set(key, blockAxis);
  }

  // Update bounds
  if (ix < bounds.minX) bounds.minX = ix;
  if (ix > bounds.maxX) bounds.maxX = ix;
  if (iy < bounds.minY) bounds.minY = iy;
  if (iy > bounds.maxY) bounds.maxY = iy;
  if (iz < bounds.minZ) bounds.minZ = iz;
  if (iz > bounds.maxZ) bounds.maxZ = iz;
}
```

5. Update `rasterizeSegment` to accept and pass through an axis:
```ts
function rasterizeSegment(
  from: [number, number, number],
  to: [number, number, number],
  radiusFrom: number,
  radiusTo: number,
  blockType: BlockType,
  setBlock: (x: number, y: number, z: number, type: BlockType, axis?: Axis) => void,
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const segmentAxis = dominantAxis(dx, dy, dz);
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) {
    setBlock(from[0], from[1], from[2], blockType, segmentAxis);
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

    for (let ox = -ri; ox <= ri; ox++) {
      for (let oz = -ri; oz <= ri; oz++) {
        if (ox * ox + oz * oz <= r * r) {
          setBlock(x + ox, y, z + oz, blockType, segmentAxis);
        }
      }
    }
  }
}
```

6. Update the root node block set call to include 'y' axis:
```ts
setBlock(node.position[0], node.position[1], node.position[2], 'log', 'y');
```

7. Update the return to include the axis map:
```ts
return { layers, axis, fenceConnectivity: new Map(), bounds, count };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/voxelize.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/voxelize.ts tests/core/voxelize.test.ts
git commit -m "feat: add per-voxel axis tracking during wood segment rasterization"
```

---

### Task 5: Voxelization — Fence Segment Generation and Connectivity

**Files:**
- Modify: `src/core/voxelize.ts`
- Modify: `tests/core/voxelize.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/core/voxelize.test.ts`:

```ts
describe('fence voxels', () => {
  it('generates fence voxels when branch radius is below minBranchThickness', () => {
    // Use params that produce thin twigs
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    const store = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

    let fenceCount = 0;
    for (const layer of store.layers.values()) {
      for (const type of layer.values()) {
        if (type === 'fence') fenceCount++;
      }
    }
    expect(fenceCount).toBeGreaterThan(0);
  });

  it('fence voxels have connectivity entries', () => {
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    const store = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

    let fenceCount = 0;
    let connectivityCount = 0;
    for (const [y, layer] of store.layers) {
      const connLayer = store.fenceConnectivity.get(y);
      for (const [key, type] of layer) {
        if (type === 'fence') {
          fenceCount++;
          if (connLayer?.has(key)) connectivityCount++;
        }
      }
    }
    expect(fenceCount).toBeGreaterThan(0);
    expect(connectivityCount).toBe(fenceCount);
  });

  it('connectivity mask is a 4-bit value (0-15)', () => {
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    const store = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

    for (const connLayer of store.fenceConnectivity.values()) {
      for (const mask of connLayer.values()) {
        expect(mask).toBeGreaterThanOrEqual(0);
        expect(mask).toBeLessThanOrEqual(15);
      }
    }
  });

  it('wood voxels override fence voxels', () => {
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    const store = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

    // No fence voxel should share a position with a log or branch voxel
    for (const [y, layer] of store.layers) {
      for (const [key, type] of layer) {
        if (type === 'fence') {
          // This fence voxel should not have an axis entry (only wood gets axis)
          const axisLayer = store.axis.get(y);
          expect(axisLayer?.has(key)).toBeFalsy();
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/voxelize.test.ts`
Expected: FAIL — no fence voxels are generated

- [ ] **Step 3: Add fence segment voxelization**

In `src/core/voxelize.ts`:

1. Add the fence connectivity map initialization:
```ts
const fenceConnectivity = new Map<number, Map<number, number>>();
```

2. Update the `setBlock` function to handle fence priority rules:
```ts
function setBlock(x: number, y: number, z: number, type: BlockType, blockAxis?: Axis): void {
  const iy = Math.round(y);
  const ix = Math.round(x);
  const iz = Math.round(z);
  const key = pack(ix, iz);

  let layer = layers.get(iy);
  if (!layer) {
    layer = new Map();
    layers.set(iy, layer);
  }

  const existing = layer.get(key);

  // Priority: log/branch > fence > leaf
  if (existing === 'log' || existing === 'branch') {
    if (type === 'leaf' || type === 'fence') return;
  }
  if (existing === 'fence' && type === 'leaf') return;

  // When wood replaces fence, remove fence connectivity
  if ((type === 'log' || type === 'branch') && existing === 'fence') {
    const connLayer = fenceConnectivity.get(iy);
    if (connLayer) {
      connLayer.delete(key);
      if (connLayer.size === 0) fenceConnectivity.delete(iy);
    }
  }

  if (!existing) count++;
  layer.set(key, type);

  // Store axis for wood voxels, remove for non-wood
  if (type === 'log' || type === 'branch') {
    let axisLayer = axis.get(iy);
    if (!axisLayer) {
      axisLayer = new Map();
      axis.set(iy, axisLayer);
    }
    axisLayer.set(key, blockAxis ?? 'y');
  } else {
    // If overwriting wood with something else (shouldn't happen given priority), clean up
    const axisLayer = axis.get(iy);
    if (axisLayer) {
      axisLayer.delete(key);
      if (axisLayer.size === 0) axis.delete(iy);
    }
  }

  if (ix < bounds.minX) bounds.minX = ix;
  if (ix > bounds.maxX) bounds.maxX = ix;
  if (iy < bounds.minY) bounds.minY = iy;
  if (iy > bounds.maxY) bounds.maxY = iy;
  if (iz < bounds.minZ) bounds.minZ = iz;
  if (iz > bounds.maxZ) bounds.maxZ = iz;
}
```

3. Add the `voxelizeFenceSegment` function:
```ts
function voxelizeFenceSegment(
  from: [number, number, number],
  to: [number, number, number],
  setBlock: (x: number, y: number, z: number, type: BlockType, axis?: Axis) => void,
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) {
    setBlock(from[0], from[1], from[2], 'fence');
    return;
  }

  const steps = Math.max(1, Math.ceil(len));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = from[0] + dx * t;
    const y = from[1] + dy * t;
    const z = from[2] + dz * t;
    setBlock(x, y, z, 'fence');
  }
}
```

4. Update the segment rasterization loop to use fence for thin branches:
```ts
for (let i = 0; i < nodes.length; i++) {
  const node = nodes[i];
  if (node.parentIndex === null) {
    setBlock(node.position[0], node.position[1], node.position[2], 'log', 'y');
    continue;
  }

  const parent = nodes[node.parentIndex];
  const blockType: BlockType = node.role === 'trunk' ? 'log' : 'branch';

  // Thin branches become fence voxels
  if (blockType === 'branch' && node.radius < params.minBranchThickness) {
    voxelizeFenceSegment(parent.position, node.position, setBlock);
  } else {
    rasterizeSegment(
      parent.position, node.position,
      parent.radius, node.radius,
      blockType, setBlock,
    );
  }
}
```

5. Add the connectivity pass after all fence voxels are placed (after leaf filling and before cleanup):

```ts
// --- Fence connectivity pass ---
// Directions: North (+Z), South (-Z), East (+X), West (-X)
const NORTH = GRID_SIZE;  // pack offset for +Z
const SOUTH = -GRID_SIZE; // pack offset for -Z
const EAST = 1;           // pack offset for +X (note: pack uses x*GRID_SIZE + z, so +x = +GRID_SIZE, +z = +1)
const WEST = -1;
```

Wait — let's check the pack function. `pack(x, z) = (x + 128) * 256 + (z + 128) - offset`. So incrementing x by 1 adds `GRID_SIZE` to the key, and incrementing z by 1 adds `1`. So:

```ts
// Connectivity directions as pack offsets:
// +X → key + GRID_SIZE, -X → key - GRID_SIZE
// +Z → key + 1, -Z → key - 1
for (const [y, layer] of layers) {
  for (const [key, type] of layer) {
    if (type !== 'fence') continue;

    let mask = 0;
    // North = +Z = key+1, South = -Z = key-1, East = +X = key+GRID_SIZE, West = -X = key-GRID_SIZE
    if (layer.get(key + 1) === 'fence') mask |= 0b0001;         // North (+Z)
    if (layer.get(key - 1) === 'fence') mask |= 0b0010;         // South (-Z)
    if (layer.get(key + GRID_SIZE) === 'fence') mask |= 0b0100; // East (+X)
    if (layer.get(key - GRID_SIZE) === 'fence') mask |= 0b1000; // West (-X)

    let connLayer = fenceConnectivity.get(y);
    if (!connLayer) {
      connLayer = new Map();
      fenceConnectivity.set(y, connLayer);
    }
    connLayer.set(key, mask);
  }
}
```

6. Update the return:
```ts
return { layers, axis, fenceConnectivity, bounds, count };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/voxelize.test.ts`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS — verify no regressions

- [ ] **Step 6: Commit**

```bash
git add src/core/voxelize.ts tests/core/voxelize.test.ts
git commit -m "feat: add fence segment voxelization with connectivity masks"
```

---

### Task 6: Render Buffer — Fence Post and Arm Arrays

**Files:**
- Modify: `src/core/renderBuffer.ts`
- Modify: `src/core/types.ts`
- Modify: `tests/core/renderBuffer.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/core/renderBuffer.test.ts`:

```ts
describe('fence render buffer', () => {
  it('produces fence post instances for fence voxels', () => {
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    const thinStore = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

    let fenceVoxelCount = 0;
    for (const layer of thinStore.layers.values()) {
      for (const type of layer.values()) {
        if (type === 'fence') fenceVoxelCount++;
      }
    }

    const buffer = buildRenderBuffer(thinStore);
    expect(buffer.fencePostCount).toBe(fenceVoxelCount);
    expect(buffer.fencePostMatrices.length).toBe(fenceVoxelCount * 16);
    expect(buffer.fencePostColors.length).toBe(fenceVoxelCount * 3);
  });

  it('produces fence arm instances for connected fence voxels', () => {
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    const thinStore = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

    let totalArms = 0;
    for (const connLayer of thinStore.fenceConnectivity.values()) {
      for (const mask of connLayer.values()) {
        for (let bit = 0; bit < 4; bit++) {
          if (mask & (1 << bit)) totalArms++;
        }
      }
    }

    const buffer = buildRenderBuffer(thinStore);
    // Each arm direction gets 2 instances (at 3/8 and 3/4 height)
    expect(buffer.fenceArmCount).toBe(totalArms * 2);
  });

  it('fence voxels are excluded from the main cube buffer', () => {
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    const thinStore = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

    let nonFenceCount = 0;
    for (const layer of thinStore.layers.values()) {
      for (const type of layer.values()) {
        if (type !== 'fence') nonFenceCount++;
      }
    }

    const buffer = buildRenderBuffer(thinStore);
    expect(buffer.count).toBe(nonFenceCount);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/renderBuffer.test.ts`
Expected: FAIL — `fencePostCount` etc. don't exist on RenderBuffer

- [ ] **Step 3: Extend RenderBuffer type**

In `src/core/types.ts`, update `RenderBuffer`:

```ts
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
```

- [ ] **Step 4: Update buildRenderBuffer to produce fence arrays**

In `src/core/renderBuffer.ts`:

```ts
import type { VoxelStore, RenderBuffer, BlockType, BlockColors, Axis } from './types';
import { unpack, GRID_SIZE } from './pack';

// ...existing code...

export function buildRenderBuffer(
  store: VoxelStore,
  blockColors: BlockColors = DEFAULT_BLOCK_COLORS,
  colorRandomness = 1,
): RenderBuffer {
  // Count non-fence voxels for the main buffer
  let cubeCount = 0;
  let fenceVoxelCount = 0;
  let totalArms = 0;

  for (const [y, layer] of store.layers) {
    for (const [key, blockType] of layer) {
      if (blockType === 'fence') {
        fenceVoxelCount++;
        const connLayer = store.fenceConnectivity.get(y);
        const mask = connLayer?.get(key) ?? 0;
        for (let bit = 0; bit < 4; bit++) {
          if (mask & (1 << bit)) totalArms++;
        }
      } else {
        cubeCount++;
      }
    }
  }

  // Main cube buffer (log, branch, leaf only)
  const matrices = new Float32Array(cubeCount * 16);
  const types = new Uint8Array(cubeCount);
  const colors = new Float32Array(cubeCount * 3);

  // Fence post buffer
  const fencePostMatrices = new Float32Array(fenceVoxelCount * 16);
  const fencePostColors = new Float32Array(fenceVoxelCount * 3);

  // Fence arm buffer (2 bars per active arm direction: at 3/8 and 3/4 height)
  const fenceArmCount = totalArms * 2;
  const fenceArmMatrices = new Float32Array(fenceArmCount * 16);
  const fenceArmColors = new Float32Array(fenceArmCount * 3);

  let cubeIdx = 0;
  let postIdx = 0;
  let armIdx = 0;

  const branchColor = hexToRgb(blockColors.branch ?? blockColors.fence ?? '#8b6914');

  for (const [y, layer] of store.layers) {
    for (const [key, blockType] of layer) {
      const [x, z] = unpack(key);

      if (blockType === 'fence') {
        // Fence post: narrow box 0.25 x 1.0 x 0.25, centered at voxel position
        const postOffset = postIdx * 16;
        // Scale matrix: sx=0.25, sy=1.0, sz=0.25
        fencePostMatrices[postOffset + 0] = 0.25;
        fencePostMatrices[postOffset + 1] = 0;
        fencePostMatrices[postOffset + 2] = 0;
        fencePostMatrices[postOffset + 3] = 0;
        fencePostMatrices[postOffset + 4] = 0;
        fencePostMatrices[postOffset + 5] = 1;
        fencePostMatrices[postOffset + 6] = 0;
        fencePostMatrices[postOffset + 7] = 0;
        fencePostMatrices[postOffset + 8] = 0;
        fencePostMatrices[postOffset + 9] = 0;
        fencePostMatrices[postOffset + 10] = 0.25;
        fencePostMatrices[postOffset + 11] = 0;
        fencePostMatrices[postOffset + 12] = x;
        fencePostMatrices[postOffset + 13] = y;
        fencePostMatrices[postOffset + 14] = z;
        fencePostMatrices[postOffset + 15] = 1;

        const postColorOff = postIdx * 3;
        const postColor = getVoxelColor('branch', x, y, z, blockColors.branch, colorRandomness);
        fencePostColors[postColorOff + 0] = postColor[0];
        fencePostColors[postColorOff + 1] = postColor[1];
        fencePostColors[postColorOff + 2] = postColor[2];
        postIdx++;

        // Arms
        const connLayer = store.fenceConnectivity.get(y);
        const mask = connLayer?.get(key) ?? 0;

        // Direction offsets: [dx, dz] for each bit
        const directions: [number, number][] = [
          [0, 0.5],   // North (+Z) bit 0
          [0, -0.5],  // South (-Z) bit 1
          [0.5, 0],   // East (+X) bit 2
          [-0.5, 0],  // West (-X) bit 3
        ];

        for (let bit = 0; bit < 4; bit++) {
          if (!(mask & (1 << bit))) continue;

          const [adx, adz] = directions[bit];
          // Two bars at y+3/8-0.5 and y+3/4-0.5 relative to block center
          const armYs = [y - 0.5 + 3 / 8, y - 0.5 + 3 / 4];

          for (const armY of armYs) {
            const armOffset = armIdx * 16;
            // Arm geometry: 0.5 along direction, 0.25 tall, 0.125 wide perpendicular
            const isZDirection = adx === 0;
            const sx = isZDirection ? 0.125 : 0.5;
            const sy = 0.25;
            const sz = isZDirection ? 0.5 : 0.125;

            fenceArmMatrices[armOffset + 0] = sx;
            fenceArmMatrices[armOffset + 1] = 0;
            fenceArmMatrices[armOffset + 2] = 0;
            fenceArmMatrices[armOffset + 3] = 0;
            fenceArmMatrices[armOffset + 4] = 0;
            fenceArmMatrices[armOffset + 5] = sy;
            fenceArmMatrices[armOffset + 6] = 0;
            fenceArmMatrices[armOffset + 7] = 0;
            fenceArmMatrices[armOffset + 8] = 0;
            fenceArmMatrices[armOffset + 9] = 0;
            fenceArmMatrices[armOffset + 10] = sz;
            fenceArmMatrices[armOffset + 11] = 0;
            fenceArmMatrices[armOffset + 12] = x + adx;
            fenceArmMatrices[armOffset + 13] = armY;
            fenceArmMatrices[armOffset + 14] = z + adz;
            fenceArmMatrices[armOffset + 15] = 1;

            const armColorOff = armIdx * 3;
            const armColor = getVoxelColor('branch', x, y, z, blockColors.branch, colorRandomness);
            fenceArmColors[armColorOff + 0] = armColor[0];
            fenceArmColors[armColorOff + 1] = armColor[1];
            fenceArmColors[armColorOff + 2] = armColor[2];
            armIdx++;
          }
        }
      } else {
        // Existing cube voxel logic
        const offset = cubeIdx * 16;
        matrices[offset + 0] = 1;
        matrices[offset + 1] = 0;
        matrices[offset + 2] = 0;
        matrices[offset + 3] = 0;
        matrices[offset + 4] = 0;
        matrices[offset + 5] = 1;
        matrices[offset + 6] = 0;
        matrices[offset + 7] = 0;
        matrices[offset + 8] = 0;
        matrices[offset + 9] = 0;
        matrices[offset + 10] = 1;
        matrices[offset + 11] = 0;
        matrices[offset + 12] = x;
        matrices[offset + 13] = y;
        matrices[offset + 14] = z;
        matrices[offset + 15] = 1;

        types[cubeIdx] = BLOCK_TYPE_INDEX[blockType];
        const colorOffset = cubeIdx * 3;
        const color = getVoxelColor(blockType, x, y, z, blockColors[blockType], colorRandomness);
        colors[colorOffset + 0] = color[0];
        colors[colorOffset + 1] = color[1];
        colors[colorOffset + 2] = color[2];
        cubeIdx++;
      }
    }
  }

  return {
    matrices, types, colors, count: cubeCount,
    fencePostMatrices, fencePostColors, fencePostCount: fenceVoxelCount,
    fenceArmMatrices, fenceArmColors, fenceArmCount,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/core/renderBuffer.test.ts`
Expected: PASS

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/core/types.ts src/core/renderBuffer.ts tests/core/renderBuffer.test.ts
git commit -m "feat: add fence post and arm arrays to render buffer"
```

---

### Task 7: VoxelMesh — Fence Rendering

**Files:**
- Modify: `src/render/VoxelMesh.tsx`

- [ ] **Step 1: Add fence post and arm InstancedMesh rendering**

Update `src/render/VoxelMesh.tsx`:

```tsx
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useTreeStore } from '../store/treeStore';

type MeshRefs = {
  log: THREE.InstancedMesh | null;
  branch: THREE.InstancedMesh | null;
  leaf: THREE.InstancedMesh | null;
  fencePost: THREE.InstancedMesh | null;
  fenceArm: THREE.InstancedMesh | null;
};

export default function VoxelMesh() {
  const meshRefs = useRef<MeshRefs>({
    log: null, branch: null, leaf: null,
    fencePost: null, fenceArm: null,
  });
  const buffer = useTreeStore((s) => s.buffer);
  const display = useTreeStore((s) => s.display);
  const invalidate = useThree((s) => s.invalidate);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.97, 0.97, 0.97), []);
  const fencePostGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const fenceArmGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const logMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 }),
    [],
  );
  const branchMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 }),
    [],
  );
  const leafMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 }),
    [],
  );
  const fenceMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 }),
    [],
  );

  useEffect(() => {
    const { log: logMesh, branch: branchMesh, leaf: leafMesh, fencePost, fenceArm } = meshRefs.current;
    if (!logMesh || !branchMesh || !leafMesh || !fencePost || !fenceArm) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    let logCount = 0;
    let branchCount = 0;
    let leafCount = 0;

    for (let i = 0; i < buffer.count; i++) {
      const typeIdx = buffer.types[i];
      matrix.fromArray(buffer.matrices, i * 16);
      color.fromArray(buffer.colors, i * 3);

      if (typeIdx === 0 && display.showLog) {
        logMesh.setMatrixAt(logCount, matrix);
        logMesh.setColorAt(logCount, color);
        logCount++;
      } else if (typeIdx === 1 && display.showBranch) {
        branchMesh.setMatrixAt(branchCount, matrix);
        branchMesh.setColorAt(branchCount, color);
        branchCount++;
      } else if (typeIdx === 2 && display.showLeaf) {
        leafMesh.setMatrixAt(leafCount, matrix);
        leafMesh.setColorAt(leafCount, color);
        leafCount++;
      }
    }

    logMesh.count = logCount;
    branchMesh.count = branchCount;
    leafMesh.count = leafCount;

    logMesh.instanceMatrix.needsUpdate = true;
    branchMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    if (logMesh.instanceColor) logMesh.instanceColor.needsUpdate = true;
    if (branchMesh.instanceColor) branchMesh.instanceColor.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;

    // Fence posts (shown with branch toggle)
    if (display.showBranch) {
      for (let i = 0; i < buffer.fencePostCount; i++) {
        matrix.fromArray(buffer.fencePostMatrices, i * 16);
        color.fromArray(buffer.fencePostColors, i * 3);
        fencePost.setMatrixAt(i, matrix);
        fencePost.setColorAt(i, color);
      }
      fencePost.count = buffer.fencePostCount;
    } else {
      fencePost.count = 0;
    }

    fencePost.instanceMatrix.needsUpdate = true;
    if (fencePost.instanceColor) fencePost.instanceColor.needsUpdate = true;

    // Fence arms (shown with branch toggle)
    if (display.showBranch) {
      for (let i = 0; i < buffer.fenceArmCount; i++) {
        matrix.fromArray(buffer.fenceArmMatrices, i * 16);
        color.fromArray(buffer.fenceArmColors, i * 3);
        fenceArm.setMatrixAt(i, matrix);
        fenceArm.setColorAt(i, color);
      }
      fenceArm.count = buffer.fenceArmCount;
    } else {
      fenceArm.count = 0;
    }

    fenceArm.instanceMatrix.needsUpdate = true;
    if (fenceArm.instanceColor) fenceArm.instanceColor.needsUpdate = true;

    invalidate();
  }, [buffer, display, invalidate]);

  const maxInstances = Math.max(1, buffer.count);
  const maxFencePosts = Math.max(1, buffer.fencePostCount);
  const maxFenceArms = Math.max(1, buffer.fenceArmCount);

  return (
    <>
      <instancedMesh
        ref={(mesh) => { meshRefs.current.log = mesh; }}
        args={[geometry, logMaterial, maxInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => { meshRefs.current.branch = mesh; }}
        args={[geometry, branchMaterial, maxInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => { meshRefs.current.leaf = mesh; }}
        args={[geometry, leafMaterial, maxInstances]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => { meshRefs.current.fencePost = mesh; }}
        args={[fencePostGeometry, fenceMaterial, maxFencePosts]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={(mesh) => { meshRefs.current.fenceArm = mesh; }}
        args={[fenceArmGeometry, fenceMaterial, maxFenceArms]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
    </>
  );
}
```

- [ ] **Step 2: Run the app to visually verify fence rendering**

Run: `npm run dev`
Expected: Trees with `branchOrderDepth >= 3` and `minBranchThickness >= 2` show thin fence posts instead of full cubes for small branches.

- [ ] **Step 3: Commit**

```bash
git add src/render/VoxelMesh.tsx
git commit -m "feat: add fence post and arm InstancedMesh rendering"
```

---

### Task 8: Store — MinecraftPalette State and Actions

**Files:**
- Modify: `src/store/treeStore.ts`
- Modify: `src/core/presets.ts`

- [ ] **Step 1: Define default minecraft palettes per preset**

In `src/core/presets.ts`, add `MinecraftPalette` import and default palettes:

```ts
import type { BlockColors, MinecraftPalette, Preset, TreeParams } from './types';
```

Add a default palette constant:
```ts
export const DEFAULT_MINECRAFT_PALETTE: MinecraftPalette = {
  log: 'oak_log',
  branch: 'stripped_oak_log',
  fence: 'oak_fence',
  leaf: 'oak_leaves',
};
```

Add `minecraftPalette` to each preset:
```ts
// spruce preset:
minecraftPalette: { log: 'spruce_log', branch: 'stripped_spruce_log', fence: 'spruce_fence', leaf: 'spruce_leaves' },

// oak preset:
minecraftPalette: { log: 'oak_log', branch: 'stripped_oak_log', fence: 'oak_fence', leaf: 'oak_leaves' },

// willow preset:
minecraftPalette: { log: 'oak_log', branch: 'stripped_oak_log', fence: 'oak_fence', leaf: 'oak_leaves' },

// italian-cypress preset:
minecraftPalette: { log: 'spruce_log', branch: 'stripped_spruce_log', fence: 'spruce_fence', leaf: 'spruce_leaves' },

// baobab preset:
minecraftPalette: { log: 'acacia_log', branch: 'stripped_acacia_log', fence: 'acacia_fence', leaf: 'acacia_leaves' },

// monkey-puzzle preset:
minecraftPalette: { log: 'dark_oak_log', branch: 'stripped_dark_oak_log', fence: 'dark_oak_fence', leaf: 'dark_oak_leaves' },

// joshua-tree preset:
minecraftPalette: { log: 'jungle_log', branch: 'stripped_jungle_log', fence: 'jungle_fence', leaf: 'jungle_leaves' },
```

Add a helper to apply preset minecraft palette:
```ts
export function applyPresetMinecraftPalette(base: MinecraftPalette, preset: Preset): MinecraftPalette {
  return preset.minecraftPalette ? { ...base, ...preset.minecraftPalette } : base;
}
```

- [ ] **Step 2: Add minecraftPalette to the Zustand store**

In `src/store/treeStore.ts`:

1. Import the new types and helpers:
```ts
import type {
  TreeParams, PresetId, VoxelStore, RenderBuffer, TreeModel,
  BlockColors, BlockType, TreeSnapshot, MinecraftPalette,
} from '../core/types';
import { PRESETS, applyPreset, applyPresetBlockColors, applyPresetMinecraftPalette, DEFAULT_MINECRAFT_PALETTE } from '../core/presets';
```

2. Add to `TreeState`:
```ts
minecraftPalette: MinecraftPalette;
setMinecraftPaletteEntry: (type: keyof MinecraftPalette, blockId: string, color: string) => void;
```

3. Initialize:
```ts
const initialMinecraftPalette = applyPresetMinecraftPalette(DEFAULT_MINECRAFT_PALETTE, PRESETS[0]);
```

4. Add to store state:
```ts
minecraftPalette: initialMinecraftPalette,
```

5. Add the action:
```ts
setMinecraftPaletteEntry: (type, blockId, color) =>
  set((state) => {
    const minecraftPalette = { ...state.minecraftPalette, [type]: blockId };
    const blockColors = { ...state.blockColors, [type === 'fence' ? 'branch' : type]: color };
    return {
      minecraftPalette,
      blockColors,
      buffer: buildRenderBuffer(state.voxels, blockColors, state.params.colorRandomness),
    };
  }),
```

Note: For fence, the color is applied to `branch` in blockColors since fence inherits branch color.

Wait — actually per the spec: "Fence voxels inherit the branch color in the viewport". The `setMinecraftPaletteEntry` for `fence` should only update the `minecraftPalette.fence` value without changing any color. Let me correct:

```ts
setMinecraftPaletteEntry: (type, blockId, color) =>
  set((state) => {
    const minecraftPalette = { ...state.minecraftPalette, [type]: blockId };
    // Fence doesn't get its own color — it inherits branch color
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
```

6. Update `setPreset` to also apply minecraft palette:
```ts
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
```

7. Update `loadSnapshot` to load minecraft palette:
```ts
loadSnapshot: (snapshot) =>
  set(() => {
    const params = { ...getDefaultParams(), ...snapshot.params };
    const result = regenerate(params, snapshot.blockColors);
    return {
      presetId: snapshot.presetId,
      params,
      blockColors: snapshot.blockColors,
      minecraftPalette: snapshot.minecraftPalette,
      model: result.model,
      voxels: result.voxels,
      buffer: result.buffer,
      activeLayerIndex: 0,
    };
  }),
```

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add src/core/presets.ts src/store/treeStore.ts
git commit -m "feat: add minecraftPalette to store state with preset defaults"
```

---

### Task 9: Install nbtify and Implement Litematica Export

**Files:**
- Modify: `src/core/export.ts`
- Modify: `tests/core/export.test.ts`

- [ ] **Step 1: Install nbtify**

Run: `npm install nbtify`

- [ ] **Step 2: Write the failing test**

Add to `tests/core/export.test.ts`:

```ts
import { exportLitematic } from '../../src/core/export';
import type { MinecraftPalette } from '../../src/core/types';

describe('exportLitematic', () => {
  const params = getDefaultParams();
  const { voxels } = generateTree(params);
  const palette: MinecraftPalette = {
    log: 'oak_log',
    branch: 'stripped_oak_log',
    fence: 'oak_fence',
    leaf: 'oak_leaves',
  };

  it('returns a Uint8Array', () => {
    const result = exportLitematic(voxels, palette);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('output is deterministic for the same input', () => {
    const a = exportLitematic(voxels, palette);
    const b = exportLitematic(voxels, palette);
    expect(a).toEqual(b);
  });

  it('produces different output for different palettes', () => {
    const altPalette: MinecraftPalette = {
      log: 'spruce_log',
      branch: 'stripped_spruce_log',
      fence: 'spruce_fence',
      leaf: 'spruce_leaves',
    };
    const a = exportLitematic(voxels, palette);
    const b = exportLitematic(voxels, altPalette);
    // They should differ because palette entries differ
    const aStr = Array.from(a).join(',');
    const bStr = Array.from(b).join(',');
    expect(aStr).not.toBe(bStr);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/core/export.test.ts`
Expected: FAIL — `exportLitematic` doesn't exist

- [ ] **Step 4: Implement exportLitematic**

In `src/core/export.ts`:

```ts
import type { VoxelStore, TreeParams, MinecraftPalette, BlockType, Axis } from './types';
import { unpack } from './pack';
import { write, type NBTData, type RootTagLike, Int32 } from 'nbtify';

// ...existing exportJSON and exportTextGuide unchanged...

/**
 * Build a block state string for a given voxel.
 */
function buildBlockState(
  blockType: BlockType,
  palette: MinecraftPalette,
  voxelAxis?: Axis,
  connectivity?: number,
): string {
  if (blockType === 'log' || blockType === 'branch') {
    const blockId = blockType === 'log' ? palette.log : palette.branch;
    const axis = voxelAxis ?? 'y';
    return `minecraft:${blockId}[axis=${axis}]`;
  }

  if (blockType === 'fence') {
    const mask = connectivity ?? 0;
    const north = !!(mask & 0b0001);
    const south = !!(mask & 0b0010);
    const east = !!(mask & 0b0100);
    const west = !!(mask & 0b1000);
    return `minecraft:${palette.fence}[north=${north},south=${south},east=${east},west=${west}]`;
  }

  // leaf
  return `minecraft:${palette.leaf}[persistent=true,distance=1]`;
}

/**
 * Export voxel data as a Litematica .litematic binary file.
 */
export function exportLitematic(store: VoxelStore, palette: MinecraftPalette): Uint8Array {
  const { bounds } = store;
  const sizeX = bounds.maxX - bounds.minX + 1;
  const sizeY = bounds.maxY - bounds.minY + 1;
  const sizeZ = bounds.maxZ - bounds.minZ + 1;
  const volume = sizeX * sizeY * sizeZ;

  // Build block state palette (deduplicated by full string)
  const paletteMap = new Map<string, number>();
  const paletteEntries: string[] = [];

  // Air is always index 0
  paletteMap.set('minecraft:air', 0);
  paletteEntries.push('minecraft:air');

  // First pass: collect all unique block states
  const sortedYs = Array.from(store.layers.keys()).sort((a, b) => a - b);
  for (const y of sortedYs) {
    const layer = store.layers.get(y)!;
    const axisLayer = store.axis.get(y);
    const connLayer = store.fenceConnectivity.get(y);

    for (const [key, blockType] of layer) {
      const voxelAxis = axisLayer?.get(key);
      const connectivity = connLayer?.get(key);
      const stateStr = buildBlockState(blockType, palette, voxelAxis, connectivity);

      if (!paletteMap.has(stateStr)) {
        paletteMap.set(stateStr, paletteEntries.length);
        paletteEntries.push(stateStr);
      }
    }
  }

  // Determine bits per block
  const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(paletteEntries.length)));

  // Pack block states into long array
  const blocksPerLong = Math.floor(64 / bitsPerBlock);
  const numLongs = Math.ceil(volume / blocksPerLong);
  const blockStates = new BigInt64Array(numLongs);

  for (const y of sortedYs) {
    const layer = store.layers.get(y)!;
    const axisLayer = store.axis.get(y);
    const connLayer = store.fenceConnectivity.get(y);

    for (const [key, blockType] of layer) {
      const [x, z] = unpack(key);
      const localX = x - bounds.minX;
      const localY = y - bounds.minY;
      const localZ = z - bounds.minZ;
      const blockIndex = localY * sizeX * sizeZ + localZ * sizeX + localX;

      const voxelAxis = axisLayer?.get(key);
      const connectivity = connLayer?.get(key);
      const stateStr = buildBlockState(blockType, palette, voxelAxis, connectivity);
      const paletteIndex = paletteMap.get(stateStr)!;

      const longIndex = Math.floor(blockIndex / blocksPerLong);
      const bitOffset = (blockIndex % blocksPerLong) * bitsPerBlock;
      blockStates[longIndex] |= BigInt(paletteIndex) << BigInt(bitOffset);
    }
  }

  // Build NBT structure
  const now = BigInt(Date.now());

  const blockStatePalette = paletteEntries.map((stateStr) => {
    // Parse "minecraft:block_id[prop=val,...]" into Name and Properties
    const bracketIdx = stateStr.indexOf('[');
    if (bracketIdx === -1) {
      return { Name: stateStr };
    }
    const name = stateStr.substring(0, bracketIdx);
    const propsStr = stateStr.substring(bracketIdx + 1, stateStr.length - 1);
    const properties: Record<string, string> = {};
    for (const pair of propsStr.split(',')) {
      const [k, v] = pair.split('=');
      properties[k] = v;
    }
    return { Name: name, Properties: properties };
  });

  const root: RootTagLike = {
    Version: new Int32(6),
    SubVersion: new Int32(1),
    MinecraftDataVersion: new Int32(3955),
    Metadata: {
      Name: 'TreeVoxel Export',
      Author: 'TreeVoxel',
      Description: '',
      EnclosingSize: {
        x: new Int32(sizeX),
        y: new Int32(sizeY),
        z: new Int32(sizeZ),
      },
      TotalBlocks: new Int32(store.count),
      TotalVolume: new Int32(volume),
      RegionCount: new Int32(1),
      TimeCreated: now,
      TimeModified: now,
    },
    Regions: {
      tree: {
        Position: {
          x: new Int32(0),
          y: new Int32(0),
          z: new Int32(0),
        },
        Size: {
          x: new Int32(sizeX),
          y: new Int32(sizeY),
          z: new Int32(sizeZ),
        },
        BlockStatePalette: blockStatePalette,
        BlockStates: blockStates,
        Entities: [],
        TileEntities: [],
        PendingBlockTicks: [],
        PendingFluidTicks: [],
      },
    },
  };

  const nbtData = new NBTData(root, { rootName: '' });
  return write(nbtData);
}
```

**Important:** The nbtify API may differ slightly. If `write` returns a `Uint8Array` directly, this works as-is. If it returns an `ArrayBuffer`, wrap with `new Uint8Array(result)`. Check the nbtify docs during implementation and adjust.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/core/export.test.ts`
Expected: PASS

If nbtify API doesn't match (e.g. different import names or constructor), adjust the import and usage. Key nbtify exports to try:
- `import { write, NBTData } from 'nbtify'`
- Or `import { encode } from 'nbtify'`

Consult `node_modules/nbtify/dist/index.d.ts` for the actual API if tests fail on import.

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/core/export.ts tests/core/export.test.ts
git commit -m "feat: add Litematica .litematic export with NBT encoding"
```

---

### Task 10: Palette UI — MC Block Dropdowns

**Files:**
- Modify: `src/ui/ParameterPanel.tsx`
- Modify: `src/ui/ParameterPanel.module.css`

- [ ] **Step 1: Add MC block dropdown to each palette row**

In `src/ui/ParameterPanel.tsx`:

1. Add imports:
```ts
import type { BlockType, MinecraftPalette } from '../core/types';
import { getPresetsForCategory, type McBlockPreset } from '../core/minecraftBlocks';
import { exportLitematic } from '../core/export';
```

2. Add store selectors:
```ts
const minecraftPalette = useTreeStore((s) => s.minecraftPalette);
const setMinecraftPaletteEntry = useTreeStore((s) => s.setMinecraftPaletteEntry);
```

3. Replace the color section with one that includes MC block dropdowns:

```tsx
<section className={styles.colorSection}>
  <div className={styles.colorSectionHeader}>
    <span className={styles.colorSectionTitle}>Block Colors</span>
    <span className={styles.colorSectionCount}>3</span>
  </div>
  <div className={styles.colorGrid}>
    {(['log', 'branch', 'leaf'] as const).map((type) => {
      const mcPresets = getPresetsForCategory(type);
      const paletteKey = type as keyof MinecraftPalette;
      return (
        <div key={type} className={styles.colorField}>
          <span className={styles.colorLabel}>{BLOCK_TYPE_LABELS[type]}</span>
          <Select.Root
            value={minecraftPalette[paletteKey]}
            onValueChange={(blockId) => {
              const preset = mcPresets.find((p) => p.id === blockId);
              if (preset) {
                setMinecraftPaletteEntry(paletteKey, blockId, preset.approximateHex);
              }
            }}
          >
            <Select.Trigger className={styles.mcBlockTrigger}>
              <Select.Value />
              <Select.Icon>{'\u25bc'}</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className={styles.mcBlockContent} position="popper" sideOffset={4}>
                <Select.Viewport>
                  {mcPresets.map((preset) => (
                    <Select.Item key={preset.id} value={preset.id} className={styles.mcBlockItem}>
                      <span
                        className={styles.mcBlockSwatch}
                        style={{ backgroundColor: preset.approximateHex }}
                      />
                      <Select.ItemText>{preset.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          <div className={styles.colorControl}>
            <input
              className={styles.colorInput}
              type="color"
              value={blockColors[type]}
              aria-label={`${BLOCK_TYPE_LABELS[type]} color`}
              onChange={(event) => setBlockColor(type, event.target.value)}
            />
            <span className={styles.colorValue}>{blockColors[type].toUpperCase()}</span>
          </div>
          {type === 'branch' && (
            <details className={styles.branchDetails}>
              <summary className={styles.branchDetailsSummary}>Branch details</summary>
              <div className={styles.fenceRow}>
                <span className={styles.colorLabel}>Fence block</span>
                <Select.Root
                  value={minecraftPalette.fence}
                  onValueChange={(blockId) => {
                    setMinecraftPaletteEntry('fence', blockId, '');
                  }}
                >
                  <Select.Trigger className={styles.mcBlockTrigger}>
                    <Select.Value />
                    <Select.Icon>{'\u25bc'}</Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className={styles.mcBlockContent} position="popper" sideOffset={4}>
                      <Select.Viewport>
                        {getPresetsForCategory('fence').map((preset) => (
                          <Select.Item key={preset.id} value={preset.id} className={styles.mcBlockItem}>
                            <span
                              className={styles.mcBlockSwatch}
                              style={{ backgroundColor: preset.approximateHex }}
                            />
                            <Select.ItemText>{preset.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </details>
          )}
        </div>
      );
    })}
  </div>
</section>
```

4. Add litematica export button to the export section:

```tsx
const handleExportLitematic = () => {
  const data = exportLitematic(voxels, minecraftPalette);
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'treevoxel-export.litematic';
  link.click();
  URL.revokeObjectURL(url);
};
```

Update the export buttons section:
```tsx
<section className={styles.exportSection}>
  <span className={styles.exportTitle}>Export</span>
  <div className={styles.exportButtons}>
    <button type="button" className={styles.exportButton} onClick={handleExportJSON}>
      JSON
    </button>
    <button type="button" className={styles.exportButton} onClick={handleExportText}>
      Build Guide
    </button>
    <button type="button" className={styles.exportButton} onClick={handleExportLitematic}>
      Litematica (.litematic)
    </button>
  </div>
</section>
```

- [ ] **Step 2: Add CSS styles for MC block dropdowns**

In `src/ui/ParameterPanel.module.css`, add:

```css
.mcBlockTrigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 32px;
  padding: 4px 10px;
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: 'Fraunces', Georgia, serif;
  font-size: 11px;
  cursor: pointer;
  width: 100%;
}

.mcBlockContent {
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  padding: 4px;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.mcBlockItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  font-size: 11px;
  color: var(--text-primary);
}

.mcBlockItem:hover,
.mcBlockItem[data-highlighted] {
  background: #3a3025;
}

.mcBlockSwatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(138, 125, 106, 0.3);
  flex-shrink: 0;
}

.branchDetails {
  margin-top: 4px;
}

.branchDetailsSummary {
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

.fenceRow {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}
```

Update `.exportButtons` to accommodate 3 buttons:
```css
.exportButtons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
```

- [ ] **Step 3: Run the app to visually verify**

Run: `npm run dev`
Expected: Each palette row has a MC block dropdown above its color picker. Branch row has a disclosure with fence block selector. Export section has 3 buttons.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ParameterPanel.tsx src/ui/ParameterPanel.module.css
git commit -m "feat: add Minecraft block dropdowns to palette UI and litematica export button"
```

---

### Task 11: Community Panel — Include MinecraftPalette in Snapshots

**Files:**
- Modify: `src/ui/CommunityPanel.tsx`

- [ ] **Step 1: Update community panel to include minecraftPalette in submissions**

In `src/ui/CommunityPanel.tsx`:

1. Add store selector:
```ts
const minecraftPalette = useTreeStore((state) => state.minecraftPalette);
```

2. Update the `handleSubmit` to include `minecraftPalette` in the snapshot:
```ts
const submission = await submitCreation({
  creationName,
  authorName,
  snapshot: {
    presetId,
    params,
    blockColors,
    minecraftPalette,
  },
});
```

3. Keep `PalettePreview` showing only log/branch/leaf (no changes needed since `BLOCK_TYPE_LABELS` only has those three, but we need to update it for the new `BlockType` that includes `fence`). Update `BLOCK_TYPE_LABELS` to only show the three user-facing types:

```ts
const PALETTE_PREVIEW_TYPES = ['log', 'branch', 'leaf'] as const;
```

And in `PalettePreview`:
```tsx
function PalettePreview({ colors }: { colors: Record<string, string> }) {
  return (
    <div className={styles.palette}>
      {PALETTE_PREVIEW_TYPES.map((type) => (
        <div key={type} className={styles.paletteItem}>
          <span
            className={styles.paletteSwatch}
            style={{ backgroundColor: colors[type] }}
            aria-hidden="true"
          />
          <span>{type.charAt(0).toUpperCase() + type.slice(1)} {(colors[type] ?? '').toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run the app, verify submission flow**

Run: `npm run dev`
Expected: Submitting a creation includes the minecraft palette data. Loading a creation restores it.

- [ ] **Step 3: Commit**

```bash
git add src/ui/CommunityPanel.tsx
git commit -m "feat: include minecraftPalette in community snapshot submissions"
```

---

### Task 12: Layer Browser — Fence Display

**Files:**
- Modify: `src/ui/LayerBrowser.tsx`

- [ ] **Step 1: Update LayerBrowser to render fence voxels with branch color**

The `BLOCK_COLORS` map was already updated in Task 1 to include `fence: '#8b6914'` (branch color). The `LayerBrowser` component iterates over `layerData` which includes fence voxels, and uses `BLOCK_COLORS[type]` to color cells. Since fence is now in the map, fence voxels will render automatically with the branch color.

Verify by reading the file — if the `BLOCK_COLORS` update from Task 1 is in place, no additional changes are needed here.

- [ ] **Step 2: Run the app with a tree that has fence voxels**

Run: `npm run dev`
Set `branchOrderDepth` to 3+ and `minBranchThickness` to 2. Navigate the layer browser and verify fence voxels appear in the branch color.

- [ ] **Step 3: Commit (if any changes were needed)**

```bash
git add src/ui/LayerBrowser.tsx
git commit -m "feat: display fence voxels in layer browser with branch color"
```

---

### Task 13: Final Integration Test and Cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Run type checker**

Run: `npx tsc -b`
Expected: No errors

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors (fix any that appear)

- [ ] **Step 4: Run the app end-to-end**

Run: `npm run dev`

Manual verification checklist:
1. Select each preset — MC block dropdowns update to match preset defaults
2. Change a MC block dropdown — color picker updates to approximate hex
3. Override the color manually after selecting a block — works without resetting
4. Open "Branch details" disclosure — fence block dropdown visible
5. Generate a tree with thin branches (`branchOrderDepth: 3`, `minBranchThickness: 2`) — fence posts visible in 3D
6. Toggle branch visibility — fence posts hide/show with branches
7. Layer browser shows fence voxels in branch color
8. Export JSON — works as before
9. Export Build Guide — works as before, includes fence blocks in output
10. Export Litematica — downloads a .litematic file
11. Slider ranges: height slider goes to 200, crownWidth to 120, etc.
12. Submit to community — works, includes minecraft palette
13. Load from community — restores minecraft palette

- [ ] **Step 5: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete TreeVoxel v2 — minecraft palette, fence branches, litematica export, expanded ranges"
```
