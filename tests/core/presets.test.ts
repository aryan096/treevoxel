import { describe, it, expect } from 'vitest';
import { PRESETS, applyPreset, applyPresetBlockColors } from '../../src/core/presets';
import { getDefaultParams } from '../../src/core/parameters';
import type { BlockColors } from '../../src/core/types';

describe('presets', () => {
  it('has starter and specialty presets', () => {
    expect(PRESETS).toHaveLength(7);
    const ids = PRESETS.map(p => p.id);
    expect(ids).toContain('spruce');
    expect(ids).toContain('oak');
    expect(ids).toContain('willow');
    expect(ids).toContain('italian-cypress');
    expect(ids).toContain('baobab');
    expect(ids).toContain('monkey-puzzle');
    expect(ids).toContain('joshua-tree');
  });

  it('every preset has name, description, growthForm, and saved colors', () => {
    for (const preset of PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.growthForm.length).toBeGreaterThan(0);
      expect(preset.blockColors.log).toMatch(/^#/);
      expect(preset.blockColors.branch).toMatch(/^#/);
      expect(preset.blockColors.leaf).toMatch(/^#/);
    }
  });

  it('applyPreset merges preset params over defaults', () => {
    const defaults = getDefaultParams();
    const spruce = PRESETS.find(p => p.id === 'spruce')!;
    const result = applyPreset(defaults, spruce);
    expect(result.crownShape).toBe('conical');
    expect(result.randomSeed).toBe(defaults.randomSeed);
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
    };
    const original = { ...baseColors };
    const willow = PRESETS.find((p) => p.id === 'willow')!;
    const result = applyPresetBlockColors(baseColors, willow);

    expect(result).toEqual(willow.blockColors);
    expect(baseColors).toEqual(original);
  });
});
