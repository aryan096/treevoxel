import { describe, expect, it } from 'vitest';
import { generateLeafClusters } from '../../src/core/crown';
import { pack } from '../../src/core/pack';
import { getDefaultParams } from '../../src/core/parameters';
import { PRESETS, applyPreset } from '../../src/core/presets';
import type { TreeModel, VoxelStore } from '../../src/core/types';
import { generateSkeleton } from '../../src/core/skeleton';
import { voxelize } from '../../src/core/voxelize';

describe('voxelize', () => {
  const params = getDefaultParams();
  const skeleton = generateSkeleton(params);
  const clusters = generateLeafClusters(skeleton, params);

  it('returns a VoxelStore with blocks', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    expect(store.count).toBeGreaterThan(0);
    expect(store.layers.size).toBeGreaterThan(0);
    expect(store.axis).toBeInstanceOf(Map);
    expect(store.fenceConnectivity).toBeInstanceOf(Map);
  });

  it('has log blocks at ground level', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    const groundLayer = store.layers.get(0);
    expect(groundLayer).toBeDefined();
    expect(Array.from(groundLayer!.values())).toContain('log');
  });

  it('has leaf blocks in upper layers', () => {
    const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);
    let hasLeaves = false;
    for (const [y, layer] of store.layers) {
      if (y <= params.height * 0.5) continue;
      if (Array.from(layer.values()).includes('leaf')) {
        hasLeaves = true;
        break;
      }
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

  it('does not emit voxels below y=0', () => {
    const store = voxelize(
      {
        nodes: [
          {
            position: [0, 0, 0],
            parentIndex: null,
            order: 0,
            radius: 1,
            role: 'trunk',
            length: 0,
            direction: [0, 1, 0],
          },
          {
            position: [0, -2, 0],
            parentIndex: 0,
            order: 1,
            radius: 0.5,
            role: 'twig',
            length: 2,
            direction: [0, -1, 0],
          },
        ],
        leafClusters: [
          {
            center: [0, -0.6, 0],
            radius: 1.2,
            density: 1,
          },
        ],
      },
      {
        ...params,
        leafCleanup: 0,
        interiorLeafPruning: 0,
      },
    );

    expect(store.bounds.minY).toBeGreaterThanOrEqual(0);
    expect(Array.from(store.layers.keys()).every((y) => y >= 0)).toBe(true);
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

  it('removes detached multi-block leaf clumps during cleanup', () => {
    const store = voxelize(
      {
        nodes: [
          {
            position: [0, 0, 0],
            parentIndex: null,
            order: 0,
            radius: 1,
            role: 'trunk',
            length: 0,
            direction: [0, 1, 0],
          },
        ],
        leafClusters: [
          {
            center: [1, 0, 0],
            radius: 0.1,
            density: 1,
          },
          {
            center: [4, 0, 0],
            radius: 0.1,
            density: 1,
          },
          {
            center: [5, 0, 0],
            radius: 0.1,
            density: 1,
          },
        ],
      },
      {
        ...params,
        randomSeed: 99,
        leafCleanup: 1,
        interiorLeafPruning: 0,
      },
    );

    const layer = store.layers.get(0);
    expect(layer?.get(pack(1, 0))).toBe('leaf');
    expect(layer?.get(pack(4, 0))).toBeUndefined();
    expect(layer?.get(pack(5, 0))).toBeUndefined();
  });

  it('preset trees retain some full-block branch voxels instead of only fences', () => {
    const presetIds = new Set(['spruce', 'oak', 'dark_oak']);

    for (const preset of PRESETS.filter((entry) => presetIds.has(entry.id))) {
      const params = applyPreset(getDefaultParams(), preset);
      const skeleton = generateSkeleton(params);
      const clusters = generateLeafClusters(skeleton, params);
      const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);

      let branchCount = 0;
      for (const layer of store.layers.values()) {
        for (const type of layer.values()) {
          if (type === 'branch') {
            branchCount++;
          }
        }
      }

      expect(branchCount).toBeGreaterThan(0);
    }
  });
});

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
        if (type !== 'log' && type !== 'branch') continue;
        woodCount++;
        if (axisLayer?.has(key)) {
          axisCount++;
        }
      }
    }

    expect(woodCount).toBeGreaterThan(0);
    expect(axisCount).toBe(woodCount);
  });

  it('axis values are x, y, or z', () => {
    for (const axisLayer of store.axis.values()) {
      for (const axis of axisLayer.values()) {
        expect(['x', 'y', 'z']).toContain(axis);
      }
    }
  });

  it('ground-level trunk voxels keep y axis', () => {
    const groundLayer = store.layers.get(0);
    const axisLayer = store.axis.get(0);
    expect(groundLayer).toBeDefined();
    expect(axisLayer).toBeDefined();

    let totalLogs = 0;
    let yAxisLogs = 0;
    for (const [key, type] of groundLayer!) {
      if (type !== 'log') continue;
      totalLogs++;
      if (axisLayer?.get(key) === 'y') {
        yAxisLogs++;
      }
    }

    expect(totalLogs).toBeGreaterThan(0);
    expect(yAxisLogs).toBe(totalLogs);
  });
});

describe('fence voxels', () => {
  function voxelizeModel(model: TreeModel): VoxelStore {
    const params = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
      leafCleanup: 0,
      interiorLeafPruning: 0,
    };

    return voxelize(model, params);
  }

  function makeThinBranchStore(): VoxelStore {
    const thinParams = {
      ...getDefaultParams(),
      randomSeed: 42,
      branchOrderDepth: 3,
      minBranchThickness: 2,
    };
    const thinSkeleton = generateSkeleton(thinParams);
    const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
    return voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);
  }

  it('generates fence voxels when branch radius is below minBranchThickness', () => {
    const store = makeThinBranchStore();
    let fenceCount = 0;
    for (const layer of store.layers.values()) {
      for (const type of layer.values()) {
        if (type === 'fence') {
          fenceCount++;
        }
      }
    }
    expect(fenceCount).toBeGreaterThan(0);
  });

  it('keeps thicker branch sections as full blocks before tapering to fences', () => {
    const store = voxelizeModel({
      nodes: [
        {
          position: [0, 0, 0],
          parentIndex: null,
          order: 0,
          radius: 2.1,
          role: 'trunk',
          length: 0,
          direction: [0, 1, 0],
        },
        {
          position: [4, 0, 0],
          parentIndex: 0,
          order: 1,
          radius: 1,
          role: 'twig',
          length: 4,
          direction: [1, 0, 0],
        },
      ],
      leafClusters: [],
    });

    const layer = store.layers.get(0);
    expect(layer?.get(pack(1, 0))).toBe('branch');
    expect(layer?.get(pack(4, 0))).toBe('fence');
  });

  it('fence voxels have connectivity entries', () => {
    const store = makeThinBranchStore();
    let fenceCount = 0;
    let connectivityCount = 0;

    for (const [y, layer] of store.layers) {
      const connectivityLayer = store.fenceConnectivity.get(y);
      for (const [key, type] of layer) {
        if (type !== 'fence') continue;
        fenceCount++;
        if (connectivityLayer?.has(key)) {
          connectivityCount++;
        }
      }
    }

    expect(fenceCount).toBeGreaterThan(0);
    expect(connectivityCount).toBe(fenceCount);
  });

  it('connects fence voxels to horizontal wood blocks', () => {
    const store = voxelizeModel({
      nodes: [
        {
          position: [0, 0, 0],
          parentIndex: null,
          order: 0,
          radius: 3,
          role: 'trunk',
          length: 0,
          direction: [0, 1, 0],
        },
        {
          position: [1, 0, 0],
          parentIndex: 0,
          order: 1,
          radius: 1,
          role: 'twig',
          length: 1,
          direction: [1, 0, 0],
        },
      ],
      leafClusters: [],
    });

    const connectivity = store.fenceConnectivity.get(0)?.get(pack(1, 0));
    expect(connectivity).toBe(0b1000);
  });

  it('connects fence voxels to adjacent leaves', () => {
    const store = voxelizeModel({
      nodes: [
        {
          position: [0, 0, 0],
          parentIndex: null,
          order: 0,
          radius: 3,
          role: 'trunk',
          length: 0,
          direction: [0, 1, 0],
        },
        {
          position: [1, 0, 0],
          parentIndex: 0,
          order: 1,
          radius: 1,
          role: 'twig',
          length: 1,
          direction: [1, 0, 0],
        },
      ],
      leafClusters: [
        {
          center: [1, 0, 1],
          radius: 0.1,
          density: 1,
        },
      ],
    });

    const connectivity = store.fenceConnectivity.get(0)?.get(pack(1, 0));
    expect(connectivity).toBe(0b0001 | 0b1000);
  });

  it('fills diagonal fence gaps with a bridge fence voxel', () => {
    const store = voxelizeModel({
      nodes: [
        {
          position: [0, 0, 0],
          parentIndex: null,
          order: 0,
          radius: 3,
          role: 'trunk',
          length: 0,
          direction: [0, 1, 0],
        },
        {
          position: [1, 0, 0],
          parentIndex: 0,
          order: 1,
          radius: 1,
          role: 'twig',
          length: 1,
          direction: [1, 0, 0],
        },
        {
          position: [2, 0, 1],
          parentIndex: 1,
          order: 2,
          radius: 1,
          role: 'twig',
          length: Math.sqrt(2),
          direction: [1, 0, 1],
        },
      ],
      leafClusters: [],
    });

    const layer = store.layers.get(0);
    expect(layer?.get(pack(1, 1))).toBe('fence');
    expect(store.fenceConnectivity.get(0)?.get(pack(1, 0))).toBe(0b1001);
    expect(store.fenceConnectivity.get(0)?.get(pack(1, 1))).toBe(0b0110);
    expect(store.fenceConnectivity.get(0)?.get(pack(2, 1))).toBe(0b1000);
  });

  it('fills diagonal fence gaps toward diagonal wood blocks', () => {
    const store = voxelizeModel({
      nodes: [
        {
          position: [0, 0, 0],
          parentIndex: null,
          order: 0,
          radius: 3,
          role: 'trunk',
          length: 0,
          direction: [0, 1, 0],
        },
        {
          position: [1, 0, 0],
          parentIndex: 0,
          order: 1,
          radius: 1,
          role: 'twig',
          length: 1,
          direction: [1, 0, 0],
        },
        {
          position: [2, 0, 1],
          parentIndex: null,
          order: 0,
          radius: 3,
          role: 'trunk',
          length: 0,
          direction: [0, 1, 0],
        },
      ],
      leafClusters: [],
    });

    const layer = store.layers.get(0);
    expect(layer?.get(pack(1, 1))).toBe('fence');
    expect(layer?.get(pack(2, 1))).toBe('log');
    expect(store.fenceConnectivity.get(0)?.get(pack(1, 0))).toBe(0b1001);
    expect(store.fenceConnectivity.get(0)?.get(pack(1, 1))).toBe(0b0110);
  });

  it('fills stepped x-y fence gaps with bridge fences on both layers', () => {
    const store = voxelizeModel({
      nodes: [
        {
          position: [0, 0, 0],
          parentIndex: null,
          order: 0,
          radius: 3,
          role: 'trunk',
          length: 0,
          direction: [0, 1, 0],
        },
        {
          position: [1, 0, 0],
          parentIndex: 0,
          order: 1,
          radius: 1,
          role: 'twig',
          length: 1,
          direction: [1, 0, 0],
        },
        {
          position: [2, 1, 0],
          parentIndex: 1,
          order: 2,
          radius: 1,
          role: 'twig',
          length: Math.sqrt(2),
          direction: [1, 1, 0],
        },
      ],
      leafClusters: [],
    });

    expect(store.layers.get(0)?.get(pack(2, 0))).toBe('fence');
    expect(store.layers.get(1)?.get(pack(1, 0))).toBe('fence');
    expect(store.fenceConnectivity.get(0)?.get(pack(1, 0))).toBe(0b1100);
    expect(store.fenceConnectivity.get(0)?.get(pack(2, 0))).toBe(0b1000);
    expect(store.fenceConnectivity.get(1)?.get(pack(1, 0))).toBe(0b0100);
    expect(store.fenceConnectivity.get(1)?.get(pack(2, 0))).toBe(0b1000);
  });

  it('connectivity masks stay within 4-bit range', () => {
    const store = makeThinBranchStore();
    for (const connectivityLayer of store.fenceConnectivity.values()) {
      for (const mask of connectivityLayer.values()) {
        expect(mask).toBeGreaterThanOrEqual(0);
        expect(mask).toBeLessThanOrEqual(15);
      }
    }
  });

  it('fence voxels do not carry wood axis metadata', () => {
    const store = makeThinBranchStore();
    for (const [y, layer] of store.layers) {
      const axisLayer = store.axis.get(y);
      for (const [key, type] of layer) {
        if (type === 'fence') {
          expect(axisLayer?.has(key)).toBeFalsy();
        }
      }
    }
  });
});

function countLeafBlocks(store: VoxelStore): number {
  let leafCount = 0;
  for (const layer of store.layers.values()) {
    for (const type of layer.values()) {
      if (type === 'leaf') {
        leafCount++;
      }
    }
  }
  return leafCount;
}
