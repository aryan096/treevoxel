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

  it('interior leaf pruning removes sheltered canopy leaves', () => {
    const denseParams = {
      ...params,
      randomSeed: 4242,
      crownFullness: 1,
      leafDensity: 1,
      leafClusterRadius: 3.5,
      interiorLeafPruning: 0,
      leafCleanup: 0,
    };
    const denseSkeleton = generateSkeleton(denseParams);
    const denseClusters = generateLeafClusters(denseSkeleton, denseParams);

    const unpruned = voxelize({ nodes: denseSkeleton, leafClusters: denseClusters }, denseParams);
    const pruned = voxelize(
      { nodes: denseSkeleton, leafClusters: denseClusters },
      { ...denseParams, interiorLeafPruning: 1 },
    );

    expect(countLeafBlocks(pruned)).toBeLessThan(countLeafBlocks(unpruned));
  });
});

function countLeafBlocks(store: VoxelStore): number {
  let leafCount = 0;
  for (const layer of store.layers.values()) {
    for (const type of layer.values()) {
      if (type === 'leaf') leafCount++;
    }
  }
  return leafCount;
}
