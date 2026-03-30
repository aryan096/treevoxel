import { describe, it, expect } from 'vitest';
import {
  MC_BLOCK_PRESETS,
  getPresetsForCategory,
  getPresetById,
  type McBlockPreset,
} from '../../src/core/minecraftBlocks';

describe('MC_BLOCK_PRESETS', () => {
  it('contains presets for all four categories', () => {
    const categories = new Set(MC_BLOCK_PRESETS.map((preset) => preset.category));
    expect(categories).toEqual(new Set(['log', 'branch', 'leaf', 'fence']));
  });

  it('every preset has a non-empty id, label, and valid hex color', () => {
    for (const preset of MC_BLOCK_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.approximateHex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has no duplicate ids within the same category', () => {
    const categories = ['log', 'branch', 'leaf', 'fence'] as const;
    for (const category of categories) {
      const ids = getPresetsForCategory(category).map((preset) => preset.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('getPresetsForCategory returns only that category', () => {
    const logs = getPresetsForCategory('log');
    expect(logs.length).toBeGreaterThan(0);
    for (const preset of logs) {
      expect(preset.category).toBe('log');
    }
  });

  it('getPresetById returns the matching preset', () => {
    const preset = getPresetById('oak_log');
    expect(preset).toBeDefined();
    expect((preset as McBlockPreset).id).toBe('oak_log');
  });

  it('getPresetById returns undefined for unknown id', () => {
    expect(getPresetById('nonexistent_block')).toBeUndefined();
  });
});
