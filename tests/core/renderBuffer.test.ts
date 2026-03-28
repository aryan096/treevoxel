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
