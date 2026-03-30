import { describe, it, expect } from 'vitest';
import { generateSkeleton } from '../../src/core/skeleton';
import { getDefaultParams } from '../../src/core/parameters';
import { PRESETS, applyPreset } from '../../src/core/presets';

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
    const differs = a.some((n, i) =>
      i < b.length &&
      (n.position[0] !== b[i].position[0] ||
       n.position[2] !== b[i].position[2])
    );
    expect(differs).toBe(true);
  });

  it('skeleton geometry is independent of minBranchThickness', () => {
    const thinThreshold = generateSkeleton({ ...params, randomSeed: 77, minBranchThickness: 1 });
    const thickThreshold = generateSkeleton({ ...params, randomSeed: 77, minBranchThickness: 3 });

    expect(thinThreshold).toEqual(thickThreshold);
  });

  it('trunk noise deforms the trunk centerline laterally', () => {
    const straight = generateSkeleton({ ...params, trunkCurvature: 0, trunkLean: 0, trunkNoise: 0 });
    const noisy = generateSkeleton({ ...params, trunkCurvature: 0, trunkLean: 0, trunkNoise: 0.8 });

    const straightTrunk = straight.filter((n) => n.role === 'trunk');
    const noisyTrunk = noisy.filter((n) => n.role === 'trunk');

    const straightMaxOffset = Math.max(
      ...straightTrunk.map((n) => Math.hypot(n.position[0], n.position[2]))
    );
    const noisyMaxOffset = Math.max(
      ...noisyTrunk.map((n) => Math.hypot(n.position[0], n.position[2]))
    );

    expect(straightMaxOffset).toBe(0);
    expect(noisyMaxOffset).toBeGreaterThan(0.25);
  });

  it('trunk lean direction rotates the lateral displacement axis', () => {
    const eastLeaning = generateSkeleton({
      ...params,
      trunkCurvature: 0,
      trunkNoise: 0,
      trunkLean: 20,
      trunkLeanDirection: 0,
    });
    const northLeaning = generateSkeleton({
      ...params,
      trunkCurvature: 0,
      trunkNoise: 0,
      trunkLean: 20,
      trunkLeanDirection: 90,
    });

    const eastTip = eastLeaning.filter((n) => n.role === 'trunk').at(-1)!;
    const northTip = northLeaning.filter((n) => n.role === 'trunk').at(-1)!;

    expect(Math.abs(eastTip.position[0])).toBeGreaterThan(0.5);
    expect(Math.abs(eastTip.position[2])).toBeLessThan(0.0001);
    expect(Math.abs(northTip.position[2])).toBeGreaterThan(0.5);
    expect(Math.abs(northTip.position[0])).toBeLessThan(0.0001);
  });

  it('weeping crown shape drives branches downward more strongly', () => {
    const base = {
      ...params,
      randomSeed: 1234,
      branchDroop: 0.45,
      branchOrderDepth: 3,
      branchDensity: 0.8,
      branchLengthRatio: 0.9,
    };

    const upright = generateSkeleton({ ...base, crownShape: 'ovoid' });
    const weeping = generateSkeleton({ ...base, crownShape: 'weeping' });

    const uprightTips = upright.filter((n) => n.role === 'twig');
    const weepingTips = weeping.filter((n) => n.role === 'twig');

    const uprightAvgDirectionY =
      uprightTips.reduce((sum, node) => sum + node.direction[1], 0) / uprightTips.length;
    const weepingAvgDirectionY =
      weepingTips.reduce((sum, node) => sum + node.direction[1], 0) / weepingTips.length;

    expect(weepingAvgDirectionY).toBeLessThan(uprightAvgDirectionY);
  });

  it('sub-branches can spawn from interior scaffold nodes instead of only branch tips', () => {
    const distributed = generateSkeleton({
      ...params,
      randomSeed: 901,
      branchOrderDepth: 3,
      branchDensity: 1,
      branchLengthRatio: 1,
    });

    const childCount = new Map<number, number>();
    for (const node of distributed) {
      if (node.parentIndex !== null) {
        childCount.set(node.parentIndex, (childCount.get(node.parentIndex) ?? 0) + 1);
      }
    }

    const secondaryParents = distributed
      .filter((node) => node.role === 'secondary')
      .map((node) => node.parentIndex)
      .filter((parentIndex): parentIndex is number => parentIndex !== null);

    expect(secondaryParents.length).toBeGreaterThan(0);
    expect(
      secondaryParents.some((parentIndex) => (childCount.get(parentIndex) ?? 0) > 1),
    ).toBe(true);
  });

  it('preset crowns attach scaffold branches to the top trunk node', () => {
    for (const presetId of ['spruce', 'oak'] as const) {
      const preset = PRESETS.find((entry) => entry.id === presetId)!;
      const nodes = generateSkeleton(applyPreset(getDefaultParams(), preset));
      const trunkIndices = nodes
        .map((node, index) => ({ node, index }))
        .filter(({ node }) => node.role === 'trunk')
        .map(({ index }) => index);
      const topTrunkIndex = trunkIndices.at(-1)!;
      const topChildren = nodes.filter(
        (node) => node.parentIndex === topTrunkIndex && node.role === 'scaffold',
      );

      expect(topChildren.length).toBeGreaterThanOrEqual(2);
    }
  });
});
