import { describe, expect, it } from 'vitest';
import { generateLeafClusters } from '../../src/core/crown';
import { getDefaultParams } from '../../src/core/parameters';
import { buildRenderBuffer } from '../../src/core/renderBuffer';
import type { VoxelStore } from '../../src/core/types';
import { pack } from '../../src/core/pack';
import { generateSkeleton } from '../../src/core/skeleton';
import { voxelize } from '../../src/core/voxelize';

describe('buildRenderBuffer', () => {
  const params = getDefaultParams();
  const skeleton = generateSkeleton(params);
  const clusters = generateLeafClusters(skeleton, params);
  const store = voxelize({ nodes: skeleton, leafClusters: clusters }, params);

  it('returns correct cube count excluding fences', () => {
    const buffer = buildRenderBuffer(store);
    let nonFenceCount = 0;
    for (const layer of store.layers.values()) {
      for (const type of layer.values()) {
        if (type !== 'fence') {
          nonFenceCount++;
        }
      }
    }
    expect(buffer.count).toBe(nonFenceCount);
  });

  it('matrices array has 16 floats per cube instance', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.matrices.length).toBe(buffer.count * 16);
  });

  it('types array has one byte per cube instance', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.types.length).toBe(buffer.count);
  });

  it('colors array has rgb triplets per cube instance', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.colors.length).toBe(buffer.count * 3);
  });

  it('axes array has one byte per cube instance', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.axes.length).toBe(buffer.count);
  });

  it('types are valid enum values (0=log, 1=branch, 2=leaf)', () => {
    const buffer = buildRenderBuffer(store);
    for (let i = 0; i < buffer.count; i++) {
      expect(buffer.types[i]).toBeGreaterThanOrEqual(0);
      expect(buffer.types[i]).toBeLessThanOrEqual(2);
    }
  });

  it('colors are normalized rgb values', () => {
    const buffer = buildRenderBuffer(store);
    for (let i = 0; i < buffer.colors.length; i++) {
      expect(buffer.colors[i]).toBeGreaterThanOrEqual(0);
      expect(buffer.colors[i]).toBeLessThanOrEqual(1);
    }
  });

  it('uses custom block colors as the base palette', () => {
    const buffer = buildRenderBuffer(store, {
      log: '#ff0000',
      branch: '#00ff00',
      leaf: '#0000ff',
      fence: '#00ff00',
    });

    const seen = new Set<number>();
    for (let i = 0; i < buffer.count; i++) {
      const type = buffer.types[i];
      if (seen.has(type)) continue;

      const colorOffset = i * 3;
      const dominant = buffer.colors[colorOffset + type];
      const others = [
        buffer.colors[colorOffset + ((type + 1) % 3)],
        buffer.colors[colorOffset + ((type + 2) % 3)],
      ];

      expect(dominant).toBeGreaterThan(0.45);
      expect(Math.max(...others)).toBeLessThan(dominant);
      seen.add(type);
    }

    expect(seen.has(0)).toBe(true);
    expect(seen.has(2)).toBe(true);
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('can disable color variation completely', () => {
    const baseColors = {
      log: '#804020',
      branch: '#208040',
      leaf: '#204080',
      fence: '#208040',
    } as const;
    const buffer = buildRenderBuffer(store, baseColors, 0);

    for (let i = 0; i < buffer.count; i++) {
      const type = buffer.types[i];
      const colorOffset = i * 3;
      const expected =
        type === 0 ? [128 / 255, 64 / 255, 32 / 255]
          : type === 1 ? [32 / 255, 128 / 255, 64 / 255]
            : [32 / 255, 64 / 255, 128 / 255];

      expect(buffer.colors[colorOffset + 0]).toBeCloseTo(expected[0], 5);
      expect(buffer.colors[colorOffset + 1]).toBeCloseTo(expected[1], 5);
      expect(buffer.colors[colorOffset + 2]).toBeCloseTo(expected[2], 5);
    }
  });

  it('increases per-block variation when color randomness is higher', () => {
    const baseColors = {
      log: '#6b4226',
      branch: '#8b6914',
      leaf: '#4d9a45',
      fence: '#8b6914',
    };
    const flatBuffer = buildRenderBuffer(store, baseColors, 0);
    const variedBuffer = buildRenderBuffer(store, baseColors, 1.5);

    let totalDifference = 0;
    for (let i = 0; i < flatBuffer.colors.length; i++) {
      totalDifference += Math.abs(variedBuffer.colors[i] - flatBuffer.colors[i]);
    }

    expect(totalDifference).toBeGreaterThan(1);
  });

  it('positions block instances so y=0 is the bottom of the first layer', () => {
    const simpleStore: VoxelStore = {
      layers: new Map([[0, new Map([[pack(0, 0), 'log']])]]),
      axis: new Map([[0, new Map([[pack(0, 0), 'y']])]]),
      fenceConnectivity: new Map(),
      bounds: {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        minZ: 0,
        maxZ: 0,
      },
      count: 1,
    };

    const buffer = buildRenderBuffer(simpleStore, undefined, 0);
    expect(buffer.matrices[13]).toBeCloseTo(0.5, 5);
  });

  it('encodes voxel axes as y=0, x=1, z=2 and defaults leaves to y', () => {
    const axisStore: VoxelStore = {
      layers: new Map([
        [0, new Map([
          [pack(0, 0), 'log'],
          [pack(1, 0), 'branch'],
          [pack(2, 0), 'leaf'],
        ])],
      ]),
      axis: new Map([
        [0, new Map([
          [pack(0, 0), 'x'],
          [pack(1, 0), 'z'],
        ])],
      ]),
      fenceConnectivity: new Map(),
      bounds: {
        minX: 0,
        maxX: 2,
        minY: 0,
        maxY: 0,
        minZ: 0,
        maxZ: 0,
      },
      count: 3,
    };

    const buffer = buildRenderBuffer(axisStore, undefined, 0);
    expect(Array.from(buffer.axes)).toEqual([1, 2, 0]);
  });
});

describe('fence render buffer', () => {
  const thinParams = {
    ...getDefaultParams(),
    randomSeed: 42,
    branchOrderDepth: 3,
    minBranchThickness: 2,
  };
  const thinSkeleton = generateSkeleton(thinParams);
  const thinClusters = generateLeafClusters(thinSkeleton, thinParams);
  const thinStore = voxelize({ nodes: thinSkeleton, leafClusters: thinClusters }, thinParams);

  it('produces fence post instances for fence voxels', () => {
    let fenceVoxelCount = 0;
    for (const layer of thinStore.layers.values()) {
      for (const type of layer.values()) {
        if (type === 'fence') {
          fenceVoxelCount++;
        }
      }
    }

    const buffer = buildRenderBuffer(thinStore);
    expect(buffer.fencePostCount).toBe(fenceVoxelCount);
    expect(buffer.fencePostMatrices.length).toBe(fenceVoxelCount * 16);
    expect(buffer.fencePostColors.length).toBe(fenceVoxelCount * 3);
  });

  it('produces two rail instances per active connectivity direction split into NS and EW', () => {
    let nsDirectionCount = 0;
    let ewDirectionCount = 0;
    for (const connectivityLayer of thinStore.fenceConnectivity.values()) {
      for (const mask of connectivityLayer.values()) {
        // bits 0,1 = N,S; bits 2,3 = E,W
        if (mask & 0b0001) nsDirectionCount++;
        if (mask & 0b0010) nsDirectionCount++;
        if (mask & 0b0100) ewDirectionCount++;
        if (mask & 0b1000) ewDirectionCount++;
      }
    }

    const buffer = buildRenderBuffer(thinStore);
    expect(buffer.fenceNSRailCount).toBe(nsDirectionCount * 2);
    expect(buffer.fenceEWRailCount).toBe(ewDirectionCount * 2);
  });

  it('uses the fence color palette for fence instances', () => {
    const customColors = {
      log: '#6b4226',
      branch: '#00ff00',
      leaf: '#4d9a45',
      fence: '#ff0000',
    } as const;

    const buffer = buildRenderBuffer(thinStore, customColors, 0);

    expect(buffer.fencePostCount).toBeGreaterThan(0);
    expect(buffer.fencePostColors[0]).toBeCloseTo(1, 5);
    expect(buffer.fencePostColors[1]).toBeCloseTo(0, 5);
    expect(buffer.fencePostColors[2]).toBeCloseTo(0, 5);

    const totalRailCount = buffer.fenceNSRailCount + buffer.fenceEWRailCount;
    expect(totalRailCount).toBeGreaterThan(0);
    if (buffer.fenceNSRailCount > 0) {
      expect(buffer.fenceNSRailColors[0]).toBeCloseTo(1, 5);
      expect(buffer.fenceNSRailColors[1]).toBeCloseTo(0, 5);
      expect(buffer.fenceNSRailColors[2]).toBeCloseTo(0, 5);
    }
    if (buffer.fenceEWRailCount > 0) {
      expect(buffer.fenceEWRailColors[0]).toBeCloseTo(1, 5);
      expect(buffer.fenceEWRailColors[1]).toBeCloseTo(0, 5);
      expect(buffer.fenceEWRailColors[2]).toBeCloseTo(0, 5);
    }
  });

  it('excludes fence voxels from the main cube buffer', () => {
    let nonFenceCount = 0;
    for (const layer of thinStore.layers.values()) {
      for (const type of layer.values()) {
        if (type !== 'fence') {
          nonFenceCount++;
        }
      }
    }

    const buffer = buildRenderBuffer(thinStore);
    expect(buffer.count).toBe(nonFenceCount);
  });
});
