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

  it('colors array has rgb triplets per instance', () => {
    const buffer = buildRenderBuffer(store);
    expect(buffer.colors.length).toBe(buffer.count * 3);
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

    expect(seen).toEqual(new Set([0, 1, 2]));
  });

  it('can disable color variation completely', () => {
    const baseColors = {
      log: '#804020',
      branch: '#208040',
      leaf: '#204080',
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
    };
    const flatBuffer = buildRenderBuffer(store, baseColors, 0);
    const variedBuffer = buildRenderBuffer(store, baseColors, 1.5);

    let totalDifference = 0;
    for (let i = 0; i < flatBuffer.colors.length; i++) {
      totalDifference += Math.abs(variedBuffer.colors[i] - flatBuffer.colors[i]);
    }

    expect(totalDifference).toBeGreaterThan(1);
  });
});
