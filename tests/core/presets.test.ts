import { describe, it, expect } from 'vitest';
import { PRESETS, applyPreset, applyPresetBlockColors, applyPresetMinecraftPalette } from '../../src/core/presets';
import { generateTree } from '../../src/core/generate';
import { getDefaultParams } from '../../src/core/parameters';
import type { BlockColors, MinecraftPalette } from '../../src/core/types';

describe('presets', () => {
  it('matches the Minecraft-first preset catalog plus the two extras', () => {
    expect(PRESETS).toHaveLength(9);
    const ids = PRESETS.map(p => p.id);
    expect(ids).toContain('oak');
    expect(ids).toContain('dark_oak');
    expect(ids).toContain('spruce');
    expect(ids).toContain('birch');
    expect(ids).toContain('acacia');
    expect(ids).toContain('jungle');
    expect(ids).toContain('cherry_blossom');
    expect(ids).toContain('baobab');
    expect(ids).toContain('crazy');
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

  it('keeps all presets except crazy at or below the 20-block build target', () => {
    for (const preset of PRESETS) {
      if (preset.id === 'crazy') {
        expect(preset.params.height).toBe(40);
        continue;
      }

      expect((preset.params.height ?? Infinity)).toBeLessThanOrEqual(20);
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
    const baobab = PRESETS.find((p) => p.id === 'baobab')!;
    const result = applyPresetBlockColors(baseColors, baobab);

    expect(result).toEqual(baobab.blockColors);
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
    const birch = applyPreset(getDefaultParams(), PRESETS.find((p) => p.id === 'birch')!);
    const acacia = applyPreset(getDefaultParams(), PRESETS.find((p) => p.id === 'acacia')!);
    const darkOak = applyPreset(getDefaultParams(), PRESETS.find((p) => p.id === 'dark_oak')!);
    const baobab = applyPreset(getDefaultParams(), PRESETS.find((p) => p.id === 'baobab')!);

    expect(spruce.crownWidth).toBeLessThan(oak.crownWidth);
    expect(birch.clearTrunkHeight).toBeGreaterThan(oak.clearTrunkHeight);
    expect(acacia.branchAngle).toBeGreaterThan(oak.branchAngle);
    expect(darkOak.crownFullness).toBeGreaterThan(oak.crownFullness);
    expect(baobab.trunkBaseRadius).toBeGreaterThan(darkOak.trunkBaseRadius);
    expect(oak.trunkBaseRadius).toBeGreaterThan(spruce.trunkBaseRadius);
    expect(spruce.apicalDominance).toBeGreaterThan(oak.apicalDominance);
    expect(acacia.trunkLean).toBeGreaterThan(oak.trunkLean);
    expect(spruce.randomSeed).not.toBe(darkOak.randomSeed);
    expect(baobab.randomSeed).not.toBe(acacia.randomSeed);
  });

  describe('preset quality gates', () => {
    const minimumLeafClusters: Record<string, number> = {
      oak: 20,
      dark_oak: 25,
      spruce: 26,
      birch: 10,
      acacia: 15,
      jungle: 20,
      cherry_blossom: 20,
      baobab: 12,
      crazy: 20,
    };

    for (const preset of PRESETS) {
      it(`${preset.id} produces at least ${minimumLeafClusters[preset.id] ?? 10} leaf clusters`, () => {
        const params = applyPreset(getDefaultParams(), preset);
        const result = generateTree(params);

        expect(result.model.leafClusters.length).toBeGreaterThanOrEqual(
          minimumLeafClusters[preset.id] ?? 10,
        );
      });
    }

    for (const preset of PRESETS) {
      it(`${preset.id} scaffold branches span at least 3 azimuth quadrants`, () => {
        const params = applyPreset(getDefaultParams(), preset);
        const result = generateTree(params);
        const nodes = result.model.nodes;
        const scaffoldRoots = nodes.filter(
          (n) => n.role === 'scaffold' && nodes[n.parentIndex!]?.role === 'trunk',
        );
        const quadrants = new Set<number>();

        for (const n of scaffoldRoots) {
          const parent = nodes[n.parentIndex!];
          const dx = n.position[0] - parent.position[0];
          const dz = n.position[2] - parent.position[2];
          const azimuth = Math.atan2(dz, dx);
          const q = Math.floor(((azimuth + Math.PI) / (Math.PI * 2)) * 4) % 4;
          quadrants.add(q);
        }

        expect(quadrants.size).toBeGreaterThanOrEqual(3);
      });
    }
  });
});
