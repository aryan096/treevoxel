# Branch & Foliage Generation Overhaul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix sparse, one-sided branch generation and thin foliage so all tree presets produce full, natural-looking crowns with branches spread evenly around the trunk.

**Architecture:** Five targeted changes to the generation pipeline in `src/core/skeleton.ts` and `src/core/crown.ts`, followed by preset re-tuning. Each fix is independent and testable: (1) even azimuth spacing via `symmetryAssist`, (2) decouple scaffold count from density, (3) scale sub-branch count with length, (4) crown-fill leaf clusters, (5) re-tune presets. No new files created, no type changes, no API changes.

**Tech Stack:** TypeScript, Vitest, existing `createRng` PRNG

---

## File Map

| File | Role | Tasks |
|---|---|---|
| `src/core/skeleton.ts` | Branch generation (azimuth, counts, sub-branching) | 1, 2, 3 |
| `src/core/crown.ts` | Leaf cluster placement | 4 |
| `src/core/presets.ts` | Preset parameter values | 5 |
| `tests/core/skeleton.test.ts` | Skeleton tests | 1, 2, 3 |
| `tests/core/crown.test.ts` | Crown/leaf tests | 4 |
| `tests/core/presets.test.ts` | Preset smoke tests | 5 |
| `tests/core/generate.test.ts` | Full pipeline tests | 5 |

---

### Task 1: Implement symmetryAssist for even azimuth spacing

The `symmetryAssist` parameter (0-1) exists in `TreeParams` and all presets but is never read during generation. Scaffold branches get fully random azimuths (`rng() * Math.PI * 2`), causing them to cluster on one side of the trunk.

**Fix:** Use golden-angle base spacing with random jitter scaled by `(1 - symmetryAssist)`.

**Files:**
- Modify: `src/core/skeleton.ts:142-161` (scaffold branch loop)
- Modify: `tests/core/skeleton.test.ts`

- [ ] **Step 1: Write failing test — high symmetryAssist spreads azimuths evenly**

Add this test at the end of the `generateSkeleton` describe block in `tests/core/skeleton.test.ts`:

```typescript
it('symmetryAssist spreads scaffold branches evenly around the trunk', () => {
  const base = {
    ...params,
    randomSeed: 42,
    primaryBranchCount: 8,
    branchDensity: 1,
    branchAngle: 50,
    branchOrderDepth: 1,
  };

  const asymmetric = generateSkeleton({ ...base, symmetryAssist: 0 });
  const symmetric = generateSkeleton({ ...base, symmetryAssist: 0.9 });

  function getAzimuthSpread(nodes: typeof asymmetric): number {
    const scaffoldNodes = nodes.filter(
      (n, i) => n.role === 'scaffold' && nodes[n.parentIndex!].role === 'trunk',
    );
    const azimuths = scaffoldNodes.map((n) => {
      const parent = nodes[n.parentIndex!];
      const dx = n.position[0] - parent.position[0];
      const dz = n.position[2] - parent.position[2];
      return Math.atan2(dz, dx);
    });
    // Measure angular gaps: sort azimuths, compute gaps, return stdev
    azimuths.sort((a, b) => a - b);
    if (azimuths.length < 2) return Infinity;
    const gaps: number[] = [];
    for (let i = 1; i < azimuths.length; i++) {
      gaps.push(azimuths[i] - azimuths[i - 1]);
    }
    gaps.push(Math.PI * 2 - azimuths[azimuths.length - 1] + azimuths[0]);
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
    return Math.sqrt(variance);
  }

  const asymSpread = getAzimuthSpread(asymmetric);
  const symSpread = getAzimuthSpread(symmetric);
  expect(symSpread).toBeLessThan(asymSpread);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/skeleton.test.ts -t "symmetryAssist spreads"`
Expected: FAIL — currently `symmetryAssist` has no effect, so both spreads are similar random values.

- [ ] **Step 3: Implement golden-angle azimuth spacing**

In `src/core/skeleton.ts`, replace the scaffold branch loop (lines 142-161) with azimuth spacing logic. Find this code:

```typescript
  for (const trunkIdx of scaffoldAttachmentIndices) {
    const trunkNode = nodes[trunkIdx];

    const azimuth = rng() * Math.PI * 2;
    const angle = (params.branchAngle + (rng() - 0.5) * 2 * params.branchAngleVariance) * Math.PI / 180;

    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const dir: Vec3 = vec3Normalize([
      sinA * Math.cos(azimuth),
      cosA,
      sinA * Math.sin(azimuth),
    ]);

    const heightFraction = (trunkNode.position[1] - crownBottomY) / Math.max(1, crownTopY - crownBottomY);
    const apicalFactor = getApicalFactor(heightFraction, params);
    const branchLength = params.crownWidth * 0.5 * params.branchLengthRatio * apicalFactor;

    addBranch(nodes, trunkIdx, dir, branchLength, 1, 'scaffold', params, rng);
  }
```

Replace with:

```typescript
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const startAzimuth = rng() * Math.PI * 2;

  for (let b = 0; b < scaffoldAttachmentIndices.length; b++) {
    const trunkIdx = scaffoldAttachmentIndices[b];
    const trunkNode = nodes[trunkIdx];

    const baseAzimuth = startAzimuth + b * GOLDEN_ANGLE;
    const jitter = (rng() - 0.5) * Math.PI * 2 * (1 - params.symmetryAssist);
    const azimuth = baseAzimuth + jitter;

    const angle = (params.branchAngle + (rng() - 0.5) * 2 * params.branchAngleVariance) * Math.PI / 180;

    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const dir: Vec3 = vec3Normalize([
      sinA * Math.cos(azimuth),
      cosA,
      sinA * Math.sin(azimuth),
    ]);

    const heightFraction = (trunkNode.position[1] - crownBottomY) / Math.max(1, crownTopY - crownBottomY);
    const apicalFactor = getApicalFactor(heightFraction, params);
    const branchLength = params.crownWidth * 0.5 * params.branchLengthRatio * apicalFactor;

    addBranch(nodes, trunkIdx, dir, branchLength, 1, 'scaffold', params, rng);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/skeleton.test.ts -t "symmetryAssist spreads"`
Expected: PASS

- [ ] **Step 5: Run full skeleton test suite for regressions**

Run: `npx vitest run tests/core/skeleton.test.ts`
Expected: All 14 tests pass. If the determinism test fails, that's expected since we changed the RNG call sequence — update the determinism test to use two fresh calls with the same params (it already does this, so it should still pass since both runs go through the same new code path).

- [ ] **Step 6: Commit**

```bash
git add src/core/skeleton.ts tests/core/skeleton.test.ts
git commit -m "feat: implement symmetryAssist for even scaffold azimuth spacing

Uses golden-angle base spacing with jitter scaled by (1 - symmetryAssist).
Fixes branches clustering on one side of the trunk."
```

---

### Task 2: Decouple scaffold branch count from branchDensity

Currently `branchCount = Math.round(primaryBranchCount * branchDensity)`, which halves the configured count for typical density values. Oak configured with 5 branches only gets 3.

**Fix:** Use `primaryBranchCount` directly for scaffold count. `branchDensity` should only affect sub-branch generation (Task 3).

**Files:**
- Modify: `src/core/skeleton.ts:139`
- Modify: `tests/core/skeleton.test.ts`

- [ ] **Step 1: Write failing test — scaffold count matches primaryBranchCount**

Add to `tests/core/skeleton.test.ts`:

```typescript
it('scaffold branch count matches primaryBranchCount', () => {
  const testParams = {
    ...params,
    randomSeed: 55,
    primaryBranchCount: 8,
    branchDensity: 0.5,
    branchOrderDepth: 1,
    clearTrunkHeight: 0.2,
  };
  const nodes = generateSkeleton(testParams);
  const scaffoldRoots = nodes.filter(
    (n, i) => n.role === 'scaffold' && nodes[n.parentIndex!].role === 'trunk',
  );
  // Should get at least primaryBranchCount scaffolds (plus terminal whorl)
  expect(scaffoldRoots.length).toBeGreaterThanOrEqual(testParams.primaryBranchCount);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/skeleton.test.ts -t "scaffold branch count"`
Expected: FAIL — currently `round(8 * 0.5) = 4` scaffold branches, less than 8.

- [ ] **Step 3: Change scaffold count to use primaryBranchCount directly**

In `src/core/skeleton.ts`, find line 139:

```typescript
  const branchCount = Math.round(params.primaryBranchCount * params.branchDensity);
```

Replace with:

```typescript
  const branchCount = params.primaryBranchCount;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/skeleton.test.ts -t "scaffold branch count"`
Expected: PASS

- [ ] **Step 5: Run full skeleton test suite**

Run: `npx vitest run tests/core/skeleton.test.ts`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/core/skeleton.ts tests/core/skeleton.test.ts
git commit -m "fix: use primaryBranchCount directly for scaffold branches

branchDensity no longer halves the configured scaffold count.
Oak with 5 primary branches now gets 5, not 3."
```

---

### Task 3: Scale sub-branch count with parent branch length

Currently sub-branch count is `Math.round(2 * branchDensity)`, which is 1 for most presets regardless of how long the parent branch is. A 10-block branch and a 2-block branch both get 1 sub-branch.

**Fix:** Scale sub-branch count with parent branch length and reduce with order depth.

**Files:**
- Modify: `src/core/skeleton.ts:223-224` (inside `addBranch`)
- Modify: `tests/core/skeleton.test.ts`

- [ ] **Step 1: Write failing test — longer branches produce more sub-branches**

Add to `tests/core/skeleton.test.ts`:

```typescript
it('longer branches produce more sub-branches than shorter ones', () => {
  const base = {
    ...params,
    randomSeed: 100,
    primaryBranchCount: 4,
    branchOrderDepth: 2,
    branchDensity: 0.7,
    symmetryAssist: 0.5,
  };

  const short = generateSkeleton({ ...base, branchLengthRatio: 0.3, crownWidth: 6 });
  const long = generateSkeleton({ ...base, branchLengthRatio: 1.2, crownWidth: 16 });

  const shortSecondary = short.filter((n) => n.role === 'secondary' || n.role === 'twig');
  const longSecondary = long.filter((n) => n.role === 'secondary' || n.role === 'twig');

  expect(longSecondary.length).toBeGreaterThan(shortSecondary.length * 1.5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/skeleton.test.ts -t "longer branches produce"`
Expected: FAIL — both get the same flat sub-branch count.

- [ ] **Step 3: Scale sub-branch count with length and order**

In `src/core/skeleton.ts`, find the sub-branch generation block inside `addBranch` (around line 223):

```typescript
  if (order < params.branchOrderDepth && branchNodeIndices.length > 0) {
    const subCount = Math.round(2 * params.branchDensity);
    for (let i = 0; i < subCount; i++) {
```

Replace with:

```typescript
  if (order < params.branchOrderDepth && branchNodeIndices.length > 0) {
    const lengthFactor = Math.max(1, length / 3);
    const orderFactor = Math.max(0.5, 1 - (order - 1) * 0.25);
    const subCount = Math.max(1, Math.round(lengthFactor * orderFactor * params.branchDensity * 2));
    for (let i = 0; i < subCount; i++) {
```

This means:
- A 3-block branch with density 0.7 gets `round(1 * 1 * 0.7 * 2) = 1` sub-branch (same as before for short branches).
- A 9-block branch with density 0.7 gets `round(3 * 1 * 0.7 * 2) = 4` sub-branches.
- Order 2 branches get 75% as many as order 1, order 3 gets 50%.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/skeleton.test.ts -t "longer branches produce"`
Expected: PASS

- [ ] **Step 5: Run full skeleton test suite**

Run: `npx vitest run tests/core/skeleton.test.ts`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/core/skeleton.ts tests/core/skeleton.test.ts
git commit -m "feat: scale sub-branch count with parent branch length

Longer branches now produce proportionally more sub-branches.
A 9-block branch gets ~4 sub-branches instead of 1."
```

---

### Task 4: Add crown-filling leaf clusters

Currently leaf clusters only appear at branch endpoints and mid-branch interpolation points. With few branches, this produces sparse spherical blobs.

**Fix:** After placing branch-tip clusters, do a second pass that samples additional points inside the crown envelope, placing smaller filler clusters in areas not already covered by existing clusters.

**Files:**
- Modify: `src/core/crown.ts:81-136` (inside `generateLeafClusters`)
- Modify: `tests/core/crown.test.ts`

- [ ] **Step 1: Write failing test — crownFullness increases leaf cluster count beyond branch tips**

Add to the `generateLeafClusters` describe block in `tests/core/crown.test.ts`:

```typescript
it('high crownFullness adds filler clusters beyond branch endpoints', () => {
  const base = {
    ...params,
    randomSeed: 200,
    primaryBranchCount: 3,
    branchOrderDepth: 1,
    branchDensity: 0.5,
    leafDensity: 0.8,
  };

  const sparse = generateLeafClusters(
    generateSkeleton({ ...base, crownFullness: 0.3 }),
    { ...base, crownFullness: 0.3 },
  );
  const full = generateLeafClusters(
    generateSkeleton({ ...base, crownFullness: 0.95 }),
    { ...base, crownFullness: 0.95 },
  );

  expect(full.length).toBeGreaterThan(sparse.length * 1.3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/crown.test.ts -t "high crownFullness adds filler"`
Expected: FAIL — `crownFullness` currently only affects cluster density, not cluster count.

- [ ] **Step 3: Implement crown-fill pass in generateLeafClusters**

In `src/core/crown.ts`, add a helper function before `generateLeafClusters`:

```typescript
function addCrownFillerClusters(
  clusters: LeafCluster[],
  params: TreeParams,
  rng: () => number,
): void {
  if (params.crownFullness < 0.4) return;

  const crownTopY = params.height;
  const crownBottomY = params.height * (1 - params.crownDepth);
  const crownRadius = params.crownWidth / 2;
  const crownHeight = crownTopY - crownBottomY;
  if (crownHeight <= 0 || crownRadius <= 0) return;

  // How many filler samples to attempt, scaled by crown volume and fullness
  const volume = crownRadius * crownRadius * crownHeight;
  const fillerAttempts = Math.round(volume * 0.02 * params.crownFullness);
  const fillerRadius = params.leafClusterRadius * 0.7;

  // Build a quick spatial check: skip if too close to an existing cluster
  const minDistSq = (params.leafClusterRadius * 1.2) ** 2;

  for (let i = 0; i < fillerAttempts; i++) {
    const y = crownBottomY + rng() * crownHeight;
    const angle = rng() * Math.PI * 2;
    const dist = rng() * crownRadius;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    if (!isInsideCrown(x, y, z, params.crownShape, crownBottomY, crownTopY, crownRadius)) {
      continue;
    }

    // Skip if too close to an existing cluster
    let tooClose = false;
    for (const c of clusters) {
      const dx = c.center[0] - x;
      const dy = c.center[1] - y;
      const dz = c.center[2] - z;
      if (dx * dx + dy * dy + dz * dz < minDistSq) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    // Probabilistic placement — sparser toward edges
    const edgeDist = dist / crownRadius;
    const placementChance = params.crownFullness * (1 - edgeDist * 0.4);
    if (rng() > placementChance) continue;

    clusters.push({
      center: [x, y, z],
      radius: fillerRadius * (0.8 + rng() * 0.4),
      density: params.crownFullness * 0.75,
    });
  }
}
```

Then at the end of `generateLeafClusters`, just before the fallback `if (clusters.length === 0)` block (line 122), add:

```typescript
  addCrownFillerClusters(clusters, params, rng);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/crown.test.ts -t "high crownFullness adds filler"`
Expected: PASS

- [ ] **Step 5: Run full crown test suite**

Run: `npx vitest run tests/core/crown.test.ts`
Expected: All tests pass.

- [ ] **Step 6: Run full pipeline tests to check nothing broke**

Run: `npx vitest run tests/core/generate.test.ts`
Expected: All tests pass. The determinism test passes because both runs go through the same new code path.

- [ ] **Step 7: Commit**

```bash
git add src/core/crown.ts tests/core/crown.test.ts
git commit -m "feat: add crown-filling leaf clusters for denser canopies

High crownFullness now samples additional leaf clusters throughout
the crown envelope, not just at branch endpoints."
```

---

### Task 5: Re-tune preset parameters

With the structural fixes in place, preset parameters need updating. The main changes:
- Increase `primaryBranchCount` (since it's no longer halved by density)
- Increase `branchDensity` for sub-branch richness
- Increase `crownWidth` where trees looked too narrow
- Increase `symmetryAssist` for trees that should look balanced
- Adjust `branchLengthRatio` for species-appropriate reach

**Files:**
- Modify: `src/core/presets.ts`
- Modify: `tests/core/presets.test.ts`
- Run: `tests/core/generate.test.ts`

- [ ] **Step 1: Write test — all presets produce minimum branch and leaf counts**

Add to `tests/core/presets.test.ts` (or create a new describe block):

```typescript
import { generateTree } from '../../src/core/generate';

describe('preset quality gates', () => {
  const minimumLeafClusters: Record<string, number> = {
    oak: 20,
    dark_oak: 25,
    spruce: 30,
    birch: 12,
    acacia: 15,
    jungle: 20,
    cherry_blossom: 20,
    mangrove: 20,
    baobab: 12,
    crazy: 20,
  };

  for (const preset of PRESETS) {
    it(`${preset.id} produces at least ${minimumLeafClusters[preset.id] ?? 10} leaf clusters`, () => {
      const params = applyPreset(getDefaultParams(), preset);
      const result = generateTree(params);
      expect(result.model.leafClusters.length).toBeGreaterThanOrEqual(
        minimumLeafClusters[preset.id] ?? 10,
      );
    });
  }

  for (const preset of PRESETS) {
    it(`${preset.id} scaffold branches span at least 3 azimuth quadrants`, () => {
      const params = applyPreset(getDefaultParams(), preset);
      const result = generateTree(params);
      const nodes = result.model.nodes;
      const scaffoldRoots = nodes.filter(
        (n) => n.role === 'scaffold' && nodes[n.parentIndex!]?.role === 'trunk',
      );
      const quadrants = new Set<number>();
      for (const n of scaffoldRoots) {
        const parent = nodes[n.parentIndex!];
        const dx = n.position[0] - parent.position[0];
        const dz = n.position[2] - parent.position[2];
        const azimuth = Math.atan2(dz, dx);
        const q = Math.floor(((azimuth + Math.PI) / (Math.PI * 2)) * 4) % 4;
        quadrants.add(q);
      }
      expect(quadrants.size).toBeGreaterThanOrEqual(3);
    });
  }
});
```

- [ ] **Step 2: Run tests to see which presets fail**

Run: `npx vitest run tests/core/presets.test.ts -t "preset quality"`
Expected: Several presets fail the leaf cluster and azimuth quadrant checks.

- [ ] **Step 3: Update preset parameters**

In `src/core/presets.ts`, update each preset's `params` object. Here are the new values — replace the full `params` block for each preset:

**Oak** — more branches, wider crown, higher symmetry:
```typescript
params: {
  randomSeed: 58,
  colorRandomness: 0.18,
  height: 16, crownWidth: 16, crownDepth: 0.62, trunkBaseRadius: 2,
  trunkTaper: 0.44, trunkLean: 0, trunkLeanDirection: 0, clearTrunkHeight: 0.24, trunkCurvature: 0.08, trunkNoise: 0.18,
  primaryBranchCount: 8, branchAngle: 50, branchAngleVariance: 10,
  branchLengthRatio: 0.8, branchOrderDepth: 3, branchDensity: 0.7,
  branchDroop: 0.08, apicalDominance: 0.18,
  crownShape: 'ovoid', crownFullness: 0.85, leafClusterRadius: 2.4,
  leafDensity: 0.82, interiorLeafPruning: 0.3,
  minBranchThickness: 1, leafCleanup: 0.62, symmetryAssist: 0.55, buildabilityBias: 0.72,
},
```

**Dark Oak** — denser, wider, more branches:
```typescript
params: {
  randomSeed: 184,
  colorRandomness: 0.16,
  height: 17, crownWidth: 20, crownDepth: 0.64, trunkBaseRadius: 2.5,
  trunkTaper: 0.4, trunkLean: 0, trunkLeanDirection: 0, clearTrunkHeight: 0.22, trunkCurvature: 0.1, trunkNoise: 0.2,
  primaryBranchCount: 10, branchAngle: 48, branchAngleVariance: 14,
  branchLengthRatio: 0.92, branchOrderDepth: 3, branchDensity: 0.8,
  branchDroop: 0.14, apicalDominance: 0.12,
  crownShape: 'irregular', crownFullness: 0.92, leafClusterRadius: 2.7,
  leafDensity: 0.9, interiorLeafPruning: 0.22,
  minBranchThickness: 1, leafCleanup: 0.66, symmetryAssist: 0.45, buildabilityBias: 0.76,
},
```

**Spruce** — many short tiered branches forming a cone:
```typescript
params: {
  randomSeed: 131,
  colorRandomness: 0.12,
  height: 19, crownWidth: 9, crownDepth: 0.84, trunkBaseRadius: 1.25,
  trunkTaper: 0.9, trunkLean: 0, trunkLeanDirection: 0, clearTrunkHeight: 0.08, trunkCurvature: 0.02, trunkNoise: 0.04,
  primaryBranchCount: 18, branchAngle: 62, branchAngleVariance: 4,
  branchLengthRatio: 0.54, branchOrderDepth: 2, branchDensity: 0.8,
  branchDroop: 0.16, apicalDominance: 0.98,
  crownShape: 'conical', crownFullness: 0.92, leafClusterRadius: 1.6,
  leafDensity: 0.92, interiorLeafPruning: 0.24,
  minBranchThickness: 1, leafCleanup: 0.7, symmetryAssist: 0.7, buildabilityBias: 0.82,
},
```

**Birch** — more branches for a fuller but still airy crown:
```typescript
params: {
  randomSeed: 71,
  colorRandomness: 0.14,
  height: 17, crownWidth: 9, crownDepth: 0.45, trunkBaseRadius: 1.25,
  trunkTaper: 0.72, trunkLean: 0, trunkLeanDirection: 0, clearTrunkHeight: 0.42, trunkCurvature: 0.03, trunkNoise: 0.06,
  primaryBranchCount: 7, branchAngle: 34, branchAngleVariance: 7,
  branchLengthRatio: 0.55, branchOrderDepth: 2, branchDensity: 0.65,
  branchDroop: 0.04, apicalDominance: 0.68,
  crownShape: 'ovoid', crownFullness: 0.72, leafClusterRadius: 1.8,
  leafDensity: 0.7, interiorLeafPruning: 0.42,
  minBranchThickness: 1, leafCleanup: 0.72, symmetryAssist: 0.6, buildabilityBias: 0.84,
},
```

**Acacia** — wider spread, more horizontal branches:
```typescript
params: {
  randomSeed: 219,
  colorRandomness: 0.16,
  height: 14, crownWidth: 18, crownDepth: 0.42, trunkBaseRadius: 1.6,
  trunkTaper: 0.5, trunkLean: 7, trunkLeanDirection: 35, clearTrunkHeight: 0.34, trunkCurvature: 0.2, trunkNoise: 0.18,
  primaryBranchCount: 6, branchAngle: 72, branchAngleVariance: 12,
  branchLengthRatio: 1.1, branchOrderDepth: 2, branchDensity: 0.7,
  branchDroop: 0.04, apicalDominance: 0.12,
  crownShape: 'vase', crownFullness: 0.78, leafClusterRadius: 2.4,
  leafDensity: 0.75, interiorLeafPruning: 0.36,
  minBranchThickness: 1, leafCleanup: 0.7, symmetryAssist: 0.4, buildabilityBias: 0.8,
},
```

**Jungle** — taller with richer sub-branching:
```typescript
params: {
  randomSeed: 304,
  colorRandomness: 0.18,
  height: 20, crownWidth: 14, crownDepth: 0.5, trunkBaseRadius: 1.75,
  trunkTaper: 0.56, trunkLean: 2, trunkLeanDirection: 95, clearTrunkHeight: 0.42, trunkCurvature: 0.09, trunkNoise: 0.12,
  primaryBranchCount: 7, branchAngle: 42, branchAngleVariance: 10,
  branchLengthRatio: 0.86, branchOrderDepth: 3, branchDensity: 0.7,
  branchDroop: 0.12, apicalDominance: 0.46,
  crownShape: 'ovoid', crownFullness: 0.85, leafClusterRadius: 2.3,
  leafDensity: 0.84, interiorLeafPruning: 0.26,
  minBranchThickness: 1, leafCleanup: 0.62, symmetryAssist: 0.4, buildabilityBias: 0.7,
},
```

**Cherry Blossom** — wider with more branches:
```typescript
params: {
  randomSeed: 417,
  colorRandomness: 0.14,
  height: 15, crownWidth: 18, crownDepth: 0.58, trunkBaseRadius: 1.8,
  trunkTaper: 0.48, trunkLean: 1, trunkLeanDirection: 150, clearTrunkHeight: 0.28, trunkCurvature: 0.11, trunkNoise: 0.12,
  primaryBranchCount: 8, branchAngle: 44, branchAngleVariance: 10,
  branchLengthRatio: 0.88, branchOrderDepth: 3, branchDensity: 0.75,
  branchDroop: 0.18, apicalDominance: 0.16,
  crownShape: 'vase', crownFullness: 0.88, leafClusterRadius: 2.4,
  leafDensity: 0.88, interiorLeafPruning: 0.24,
  minBranchThickness: 1, leafCleanup: 0.64, symmetryAssist: 0.5, buildabilityBias: 0.74,
},
```

**Mangrove** — more branches, denser sub-branching:
```typescript
params: {
  randomSeed: 522,
  colorRandomness: 0.18,
  height: 16, crownWidth: 16, crownDepth: 0.64, trunkBaseRadius: 2,
  trunkTaper: 0.46, trunkLean: 4, trunkLeanDirection: 220, clearTrunkHeight: 0.24, trunkCurvature: 0.22, trunkNoise: 0.26,
  primaryBranchCount: 8, branchAngle: 40, branchAngleVariance: 16,
  branchLengthRatio: 0.9, branchOrderDepth: 3, branchDensity: 0.75,
  branchDroop: 0.3, apicalDominance: 0.14,
  crownShape: 'irregular', crownFullness: 0.82, leafClusterRadius: 2.3,
  leafDensity: 0.82, interiorLeafPruning: 0.18,
  minBranchThickness: 1, leafCleanup: 0.56, symmetryAssist: 0.35, buildabilityBias: 0.68,
},
```

**Baobab** — more branches spreading from thick trunk:
```typescript
params: {
  randomSeed: 611,
  colorRandomness: 0.14,
  height: 17, crownWidth: 18, crownDepth: 0.34, trunkBaseRadius: 3,
  trunkTaper: 0.28, trunkLean: 0, trunkLeanDirection: 0, clearTrunkHeight: 0.5, trunkCurvature: 0.06, trunkNoise: 0.08,
  primaryBranchCount: 7, branchAngle: 58, branchAngleVariance: 9,
  branchLengthRatio: 0.75, branchOrderDepth: 2, branchDensity: 0.6,
  branchDroop: 0.02, apicalDominance: 0.1,
  crownShape: 'vase', crownFullness: 0.65, leafClusterRadius: 2,
  leafDensity: 0.65, interiorLeafPruning: 0.48,
  minBranchThickness: 1, leafCleanup: 0.74, symmetryAssist: 0.5, buildabilityBias: 0.86,
},
```

**Crazy** — keep mostly the same, bump branches slightly:
```typescript
params: {
  randomSeed: 777,
  colorRandomness: 0.22,
  height: 18, crownWidth: 17, crownDepth: 0.66, trunkBaseRadius: 1.75,
  trunkTaper: 0.52, trunkLean: 10, trunkLeanDirection: 305, clearTrunkHeight: 0.2, trunkCurvature: 0.3, trunkNoise: 0.34,
  primaryBranchCount: 7, branchAngle: 54, branchAngleVariance: 18,
  branchLengthRatio: 1, branchOrderDepth: 3, branchDensity: 0.78,
  branchDroop: 0.24, apicalDominance: 0.08,
  crownShape: 'irregular', crownFullness: 0.82, leafClusterRadius: 2.4,
  leafDensity: 0.82, interiorLeafPruning: 0.22,
  minBranchThickness: 1, leafCleanup: 0.54, symmetryAssist: 0.02, buildabilityBias: 0.66,
},
```

- [ ] **Step 4: Run preset quality gate tests**

Run: `npx vitest run tests/core/presets.test.ts -t "preset quality"`
Expected: All presets pass leaf cluster and azimuth quadrant checks. If any preset still fails, adjust its `primaryBranchCount`, `symmetryAssist`, or `crownFullness` up.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass. Some snapshot/determinism tests may need updating since voxel counts will change — update the expected counts if the tests compare exact values.

- [ ] **Step 6: Commit**

```bash
git add src/core/presets.ts tests/core/presets.test.ts
git commit -m "feat: re-tune all presets for fuller branching and foliage

Increases primaryBranchCount, crownWidth, symmetryAssist, and
branchDensity across presets to take advantage of structural fixes."
```

---

## Summary of changes

| What changed | Where | Why |
|---|---|---|
| Golden-angle azimuth spacing | `skeleton.ts` scaffold loop | Branches spread 360 degrees instead of clustering |
| Scaffold count = primaryBranchCount | `skeleton.ts:139` | Trees get configured number of branches, not half |
| Length-scaled sub-branching | `skeleton.ts` addBranch | Longer branches get proportionally more children |
| Crown-fill leaf clusters | `crown.ts` new pass | Canopy fills uniformly, not just at branch tips |
| Preset re-tuning | `presets.ts` all presets | Parameters updated for new generation behavior |
