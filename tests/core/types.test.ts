import { describe, it, expect } from 'vitest';
import type { Axis, BlockType, MinecraftPalette, Preset, TreeSnapshot, VoxelStore } from '../../src/core/types';

describe('v2 type definitions', () => {
  it('BlockType includes fence', () => {
    const t: BlockType = 'fence';
    expect(t).toBe('fence');
  });

  it('Axis accepts x, y, and z', () => {
    const axes: Axis[] = ['x', 'y', 'z'];
    expect(axes).toHaveLength(3);
  });

  it('MinecraftPalette has the required fields', () => {
    const palette: MinecraftPalette = {
      log: 'oak_log',
      branch: 'stripped_oak_log',
      fence: 'oak_fence',
      leaf: 'oak_leaves',
    };

    expect(palette.fence).toBe('oak_fence');
  });

  it('VoxelStore includes axis and fenceConnectivity maps', () => {
    const store: VoxelStore = {
      layers: new Map(),
      axis: new Map(),
      fenceConnectivity: new Map(),
      bounds: {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        minZ: 0,
        maxZ: 0,
      },
      count: 0,
    };

    expect(store.axis).toBeInstanceOf(Map);
    expect(store.fenceConnectivity).toBeInstanceOf(Map);
  });

  it('TreeSnapshot includes minecraftPalette', () => {
    const snapshot: TreeSnapshot = {
      presetId: 'oak',
      params: {} as TreeSnapshot['params'],
      blockColors: {
        log: '#000000',
        branch: '#000000',
        leaf: '#000000',
        fence: '#000000',
      },
      minecraftPalette: {
        log: 'oak_log',
        branch: 'stripped_oak_log',
        fence: 'oak_fence',
        leaf: 'oak_leaves',
      },
    };

    expect(snapshot.minecraftPalette.log).toBe('oak_log');
  });

  it('Preset can carry an optional minecraftPalette', () => {
    const preset: Preset = {
      id: 'oak',
      name: 'Oak',
      description: 'Test preset',
      growthForm: 'tree',
      params: {},
      blockColors: {
        log: '#111111',
        branch: '#222222',
        leaf: '#333333',
        fence: '#222222',
      },
      minecraftPalette: {
        log: 'oak_log',
        branch: 'stripped_oak_log',
        fence: 'oak_fence',
        leaf: 'oak_leaves',
      },
    };

    expect(preset.minecraftPalette?.fence).toBe('oak_fence');
  });
});
