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
});
