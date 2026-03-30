import { describe, expect, it } from 'vitest';
import { exportJSON, exportLitematic, exportTextGuide } from '../../src/core/export';
import { generateTree } from '../../src/core/generate';
import { getDefaultParams } from '../../src/core/parameters';
import type { MinecraftPalette, VoxelStore } from '../../src/core/types';
import { pack } from '../../src/core/pack';

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
      expect(['log', 'branch', 'leaf', 'fence']).toContain(block.type);
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

describe('exportLitematic', () => {
  const params = getDefaultParams();
  const { voxels } = generateTree(params);
  const palette: MinecraftPalette = {
    log: 'oak_log',
    branch: 'stripped_oak_log',
    fence: 'oak_fence',
    leaf: 'oak_leaves',
  };

  it('returns a Uint8Array', () => {
    const result = exportLitematic(voxels, palette);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('output is deterministic for the same input', () => {
    const a = exportLitematic(voxels, palette);
    const b = exportLitematic(voxels, palette);
    expect(a).toEqual(b);
  });

  it('produces different output for different palettes', () => {
    const altPalette: MinecraftPalette = {
      log: 'spruce_log',
      branch: 'stripped_spruce_log',
      fence: 'spruce_fence',
      leaf: 'spruce_leaves',
    };
    expect(exportLitematic(voxels, palette)).not.toEqual(exportLitematic(voxels, altPalette));
  });

  it('encodes axis, fence connectivity, and leaf properties in the palette strings', () => {
    const store: VoxelStore = {
      layers: new Map([
        [0, new Map([
          [pack(0, 0), 'log'],
          [pack(1, 0), 'branch'],
          [pack(2, 0), 'fence'],
          [pack(3, 0), 'leaf'],
        ])],
      ]),
      axis: new Map([
        [0, new Map([
          [pack(0, 0), 'y'],
          [pack(1, 0), 'x'],
        ])],
      ]),
      fenceConnectivity: new Map([
        [0, new Map([[pack(2, 0), 0b0101]])],
      ]),
      bounds: { minX: 0, maxX: 3, minY: 0, maxY: 0, minZ: 0, maxZ: 0 },
      count: 4,
    };

    const encodedText = new TextDecoder().decode(exportLitematic(store, palette));
    expect(encodedText).toContain('minecraft:oak_log');
    expect(encodedText).toContain('minecraft:stripped_oak_log');
    expect(encodedText).toContain('minecraft:oak_fence');
    expect(encodedText).toContain('minecraft:oak_leaves');
    expect(encodedText).toContain('axis');
    expect(encodedText).toContain('north');
    expect(encodedText).toContain('persistent');
  });
});
