import { describe, it, expect } from 'vitest';
import { exportJSON, exportTextGuide } from '../../src/core/export';
import { generateTree } from '../../src/core/generate';
import { getDefaultParams } from '../../src/core/parameters';

describe('exportJSON', () => {
  const params = getDefaultParams();
  const { voxels } = generateTree(params);

  it('returns valid JSON string with blocks array', () => {
    const json = exportJSON(voxels, params);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed.blocks)).toBe(true);
    expect(parsed.blocks.length).toBe(voxels.count);
  });

  it('each block has x, y, z, type', () => {
    const parsed = JSON.parse(exportJSON(voxels, params));
    for (const block of parsed.blocks.slice(0, 10)) {
      expect(typeof block.x).toBe('number');
      expect(typeof block.y).toBe('number');
      expect(typeof block.z).toBe('number');
      expect(['log', 'branch', 'leaf']).toContain(block.type);
    }
  });

  it('includes meta with dimensions and count', () => {
    const parsed = JSON.parse(exportJSON(voxels, params));
    expect(parsed.meta.totalBlocks).toBe(voxels.count);
    expect(typeof parsed.meta.height).toBe('number');
    expect(typeof parsed.meta.width).toBe('number');
  });
});

describe('exportTextGuide', () => {
  const params = getDefaultParams();
  const { voxels } = generateTree(params);

  it('returns a non-empty string', () => {
    const guide = exportTextGuide(voxels);
    expect(guide.length).toBeGreaterThan(0);
  });

  it('contains layer headers for each Y level', () => {
    const guide = exportTextGuide(voxels);
    for (const y of voxels.layers.keys()) {
      expect(guide).toContain(`Layer Y=${y}`);
    }
  });

  it('contains block coordinate entries', () => {
    const guide = exportTextGuide(voxels);
    expect(guide).toMatch(/\(-?\d+,\s*-?\d+\)/);
  });
});
