import { describe, it, expect } from 'vitest';
import { PARAMETER_DEFS, CATEGORICAL_PARAMS, getDefaultParams } from '../../src/core/parameters';
import type { TreeParams } from '../../src/core/types';

describe('parameters', () => {
  it('every numeric parameter has a valid range', () => {
    for (const p of PARAMETER_DEFS) {
      expect(p.min).toBeLessThan(p.max);
      expect(p.step).toBeGreaterThan(0);
      expect(p.defaultValue).toBeGreaterThanOrEqual(p.min);
      expect(p.defaultValue).toBeLessThanOrEqual(p.max);
    }
  });

  it('every parameter has non-empty explanation fields', () => {
    for (const p of PARAMETER_DEFS) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.effectIncrease.length).toBeGreaterThan(0);
      expect(p.effectDecrease.length).toBeGreaterThan(0);
    }
  });

  it('getDefaultParams returns all required keys', () => {
    const defaults = getDefaultParams();
    const requiredKeys: (keyof TreeParams)[] = [
      'randomSeed', 'colorRandomness',
      'height', 'crownWidth', 'crownDepth', 'trunkBaseRadius', 'trunkTaper',
      'trunkLean', 'trunkLeanDirection', 'clearTrunkHeight', 'trunkCurvature', 'trunkNoise',
      'primaryBranchCount', 'branchAngle', 'branchAngleVariance',
      'branchLengthRatio', 'branchOrderDepth', 'branchDensity', 'branchDroop',
      'apicalDominance', 'crownShape', 'crownFullness', 'leafClusterRadius',
      'leafDensity', 'interiorLeafPruning', 'minBranchThickness', 'leafCleanup', 'symmetryAssist',
      'buildabilityBias',
    ];
    for (const key of requiredKeys) {
      expect(defaults).toHaveProperty(key);
    }
  });

  it('parameter ids are unique', () => {
    const ids = PARAMETER_DEFS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('categorical params have at least 2 options', () => {
    for (const p of CATEGORICAL_PARAMS) {
      expect(p.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('v2 expanded ranges', () => {
  const findParam = (id: string) => PARAMETER_DEFS.find((p) => p.id === id)!;

  it('colorRandomness defaults to 0.1', () => {
    expect(findParam('colorRandomness').defaultValue).toBe(0.1);
  });

  it('height goes up to 200', () => {
    expect(findParam('height').max).toBe(200);
  });

  it('crownWidth goes up to 120', () => {
    expect(findParam('crownWidth').max).toBe(120);
  });

  it('trunkBaseRadius goes up to 20', () => {
    expect(findParam('trunkBaseRadius').max).toBe(20);
  });

  it('primaryBranchCount goes up to 40', () => {
    expect(findParam('primaryBranchCount').max).toBe(40);
  });

  it('branchOrderDepth goes up to 6', () => {
    expect(findParam('branchOrderDepth').max).toBe(6);
  });

  it('leafClusterRadius goes up to 15', () => {
    expect(findParam('leafClusterRadius').max).toBe(15);
  });

  it('randomSeed goes up to 999999', () => {
    expect(findParam('randomSeed').max).toBe(999999);
  });

  it('crownDepth min is 0.05 and max is 1.0', () => {
    const p = findParam('crownDepth');
    expect(p.min).toBe(0.05);
    expect(p.max).toBe(1.0);
  });

  it('branchLengthRatio min is 0.1 and max is 2.0', () => {
    const p = findParam('branchLengthRatio');
    expect(p.min).toBe(0.1);
    expect(p.max).toBe(2.0);
  });
});
