import { describe, it, expect } from 'vitest';
import { PRESETS, applyPreset, applyPresetBlockColors, applyPresetMinecraftPalette } from '../../src/core/presets';
import { getDefaultParams } from '../../src/core/parameters';
import type { BlockColors, MinecraftPalette } from '../../src/core/types';

describe('presets', () => {
  it('has only the three refined starter presets', () => {
    expect(PRESETS).toHaveLength(3);
    const ids = PRESETS.map(p => p.id);
    expect(ids).toContain('spruce');
    expect(ids).toContain('oak');
    expect(ids).toContain('willow');
  });

  it('every preset has name, description, growthForm, and saved colors', () => {
    for (const preset of PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.growthForm.length).toBeGreaterThan(0);
      expect(preset.blockColors.log).toMatch(/^#/);
      expect(preset.blockColors.branch).toMatch(/^#/);
      expect(preset.blockColors.leaf).toMatch(/^#/);
      expect(preset.blockColors.fence).toMatch(/^#/);
      expect(preset.minecraftPalette?.log).toBeTruthy();
      expect(preset.minecraftPalette?.branch).toBeTruthy();
      expect(preset.minecraftPalette?.fence).toBeTruthy();
      expect(preset.minecraftPalette?.leaf).toBeTruthy();
    }
  });

  it('applyPreset merges preset params over defaults', () => {
    const defaults = getDefaultParams();
    const spruce = PRESETS.find(p => p.id === 'spruce')!;
    const result = applyPreset(defaults, spruce);
    expect(result.crownShape).toBe('conical');
    expect(result.randomSeed).toBe(spruce.params.randomSeed);
    expect(result.height).toBe(spruce.params.height);
  });

  it('applyPreset returns a new object, does not mutate input', () => {
    const defaults = getDefaultParams();
    const original = { ...defaults };
    const oak = PRESETS.find(p => p.id === 'oak')!;
    applyPreset(defaults, oak);
    expect(defaults).toEqual(original);
  });

  it('applyPresetBlockColors returns preset colors without mutating input', () => {
    const baseColors: BlockColors = {
      log: '#111111',
      branch: '#222222',
      leaf: '#333333',
      fence: '#222222',
    };
    const original = { ...baseColors };
    const willow = PRESETS.find((p) => p.id === 'willow')!;
    const result = applyPresetBlockColors(baseColors, willow);

    expect(result).toEqual(willow.blockColors);
    expect(baseColors).toEqual(original);
  });

  it('applyPresetMinecraftPalette returns preset palette without mutating input', () => {
    const basePalette: MinecraftPalette = {
      log: 'oak_log',
      branch: 'oak_log',
      fence: 'oak_fence',
      leaf: 'oak_leaves',
    };
    const original = { ...basePalette };
    const spruce = PRESETS.find((p) => p.id === 'spruce')!;
    const result = applyPresetMinecraftPalette(basePalette, spruce);

    expect(result).toEqual(spruce.minecraftPalette);
    expect(basePalette).toEqual(original);
  });

  it('preserves distinct silhouette families across presets', () => {
    const spruce = applyPreset(getDefaultParams(), PRESETS.find((p) => p.id === 'spruce')!);
    const oak = applyPreset(getDefaultParams(), PRESETS.find((p) => p.id === 'oak')!);
    const willow = applyPreset(getDefaultParams(), PRESETS.find((p) => p.id === 'willow')!);

    expect(spruce.crownWidth).toBeLessThan(oak.crownWidth);
    expect(willow.branchDroop).toBeGreaterThan(oak.branchDroop);
    expect(willow.crownWidth).toBeGreaterThan(oak.crownWidth);
    expect(oak.trunkBaseRadius).toBeGreaterThan(spruce.trunkBaseRadius);
    expect(willow.clearTrunkHeight).toBeGreaterThan(spruce.clearTrunkHeight);
    expect(spruce.apicalDominance).toBeGreaterThan(oak.apicalDominance);
    expect(willow.interiorLeafPruning).toBeLessThan(oak.interiorLeafPruning);
    expect(spruce.randomSeed).not.toBe(oak.randomSeed);
    expect(willow.randomSeed).not.toBe(oak.randomSeed);
  });
});
