import { describe, it, expect } from 'vitest';
import { MINECRAFT_ATLAS_DEFINITION } from '../../src/textures/minecraftAtlas';

describe('fenceTextures', () => {
  it('oak_fence resolves to oak_planks cell (44)', () => {
    expect(MINECRAFT_ATLAS_DEFINITION.fenceTextures['oak_fence']?.texture).toBe(44);
  });

  it('bamboo_fence resolves to its dedicated cell (52)', () => {
    expect(MINECRAFT_ATLAS_DEFINITION.fenceTextures['bamboo_fence']?.texture).toBe(52);
  });

  it('all 9 fence types have entries', () => {
    const fenceIds = [
      'oak_fence', 'spruce_fence', 'birch_fence', 'jungle_fence',
      'acacia_fence', 'dark_oak_fence', 'mangrove_fence', 'cherry_fence', 'bamboo_fence',
    ];
    for (const id of fenceIds) {
      expect(MINECRAFT_ATLAS_DEFINITION.fenceTextures[id]).toBeDefined();
    }
  });
});

describe('blockTextures for planks', () => {
  it('oak_planks resolves to cell 44 on all faces', () => {
    const t = MINECRAFT_ATLAS_DEFINITION.blockTextures['oak_planks'];
    expect(t?.top).toBe(44);
    expect(t?.bottom).toBe(44);
    expect(t?.side).toBe(44);
  });

  it('bamboo_planks resolves to cell 53 on all faces', () => {
    const t = MINECRAFT_ATLAS_DEFINITION.blockTextures['bamboo_planks'];
    expect(t?.top).toBe(53);
    expect(t?.bottom).toBe(53);
    expect(t?.side).toBe(53);
  });

  it('no fence IDs in blockTextures', () => {
    const keys = Object.keys(MINECRAFT_ATLAS_DEFINITION.blockTextures);
    expect(keys.some(k => k.endsWith('_fence'))).toBe(false);
  });
});
