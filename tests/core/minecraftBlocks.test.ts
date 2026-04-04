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

describe('plank presets', () => {
  it('oak_planks is selectable for log', () => {
    const logPresets = getPresetsForCategory('log');
    expect(logPresets.some(p => p.id === 'oak_planks')).toBe(true);
  });

  it('bamboo_planks is selectable for branch', () => {
    const branchPresets = getPresetsForCategory('branch');
    expect(branchPresets.some(p => p.id === 'bamboo_planks')).toBe(true);
  });

  it('bamboo_planks is distinct from bamboo_block', () => {
    const logPresets = getPresetsForCategory('log');
    const bambooBlock = logPresets.find(p => p.id === 'bamboo_block');
    const bambooPlank = logPresets.find(p => p.id === 'bamboo_planks');
    expect(bambooBlock).toBeDefined();
    expect(bambooPlank).toBeDefined();
    expect(bambooBlock?.id).not.toBe(bambooPlank?.id);
  });

  it('all 9 plank types are selectable for log', () => {
    const logPresets = getPresetsForCategory('log');
    const plankIds = [
      'oak_planks', 'spruce_planks', 'birch_planks', 'jungle_planks',
      'acacia_planks', 'dark_oak_planks', 'mangrove_planks', 'cherry_planks', 'bamboo_planks',
    ];
    for (const id of plankIds) {
      expect(logPresets.some(p => p.id === id), `${id} missing from log presets`).toBe(true);
    }
  });

  it('all 9 plank types are selectable for branch', () => {
    const branchPresets = getPresetsForCategory('branch');
    const plankIds = [
      'oak_planks', 'spruce_planks', 'birch_planks', 'jungle_planks',
      'acacia_planks', 'dark_oak_planks', 'mangrove_planks', 'cherry_planks', 'bamboo_planks',
    ];
    for (const id of plankIds) {
      expect(branchPresets.some(p => p.id === id), `${id} missing from branch presets`).toBe(true);
    }
  });
});
