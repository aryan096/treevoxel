import { describe, expect, it } from 'vitest';
import { getLeafTintColor } from '../../src/render/leafTint';
import {
  DEFAULT_DIORAMA_GRASS_TINT,
  MINECRAFT_BLOCK_TINTS,
  MINECRAFT_BIOME_TINTS,
  getMinecraftGrassTintColor,
} from '../../src/render/minecraftTints';

describe('getLeafTintColor', () => {
  it('uses the plains foliage tint for oak leaves', () => {
    expect(getLeafTintColor('oak_leaves')?.getHexString()).toBe('77ab2f');
  });

  it('uses the exact spruce leaves tint', () => {
    expect(getLeafTintColor('spruce_leaves')?.getHexString()).toBe('619961');
    expect(MINECRAFT_BLOCK_TINTS.spruce_leaves).toBe('#619961');
  });

  it('uses the mangrove swamp foliage tint for mangrove leaves', () => {
    expect(getLeafTintColor('mangrove_leaves')?.getHexString()).toBe('8db127');
    expect(MINECRAFT_BIOME_TINTS.mangroveSwamp.foliage).toBe('#8DB127');
  });

  it('leaves untinted blocks alone', () => {
    expect(getLeafTintColor('cherry_leaves')).toBeUndefined();
  });

  it('uses the plains grass tint for the diorama ground', () => {
    expect(DEFAULT_DIORAMA_GRASS_TINT).toBe('#91BD59');
    expect(getMinecraftGrassTintColor().getHexString()).toBe('91bd59');
  });
});
