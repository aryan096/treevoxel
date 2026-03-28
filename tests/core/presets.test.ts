import { describe, it, expect } from 'vitest';
import { PRESETS, applyPreset } from '../../src/core/presets';
import { getDefaultParams } from '../../src/core/parameters';
import type { TreeParams } from '../../src/core/types';

describe('presets', () => {
  it('has three starter presets', () => {
    expect(PRESETS).toHaveLength(3);
    const ids = PRESETS.map(p => p.id);
    expect(ids).toContain('spruce');
    expect(ids).toContain('oak');
    expect(ids).toContain('willow');
  });

  it('every preset has name, description, and growthForm', () => {
    for (const preset of PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
      expect(preset.growthForm.length).toBeGreaterThan(0);
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
});
