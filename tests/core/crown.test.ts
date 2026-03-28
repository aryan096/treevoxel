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
    expect(isInsideCrown(6, 11, 0, 'conical', bottom, top, r)).toBe(true);
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
