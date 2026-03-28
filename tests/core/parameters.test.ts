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
      'height', 'crownWidth', 'crownDepth', 'trunkBaseRadius', 'trunkTaper',
      'trunkLean', 'clearTrunkHeight', 'trunkCurvature',
      'primaryBranchCount', 'branchAngle', 'branchAngleVariance',
      'branchLengthRatio', 'branchOrderDepth', 'branchDensity', 'branchDroop',
      'apicalDominance', 'crownShape', 'crownFullness', 'leafClusterRadius',
      'leafDensity', 'interiorLeafPruning', 'phototropism', 'windBias', 'age',
      'randomSeed', 'minBranchThickness', 'leafCleanup', 'symmetryAssist',
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
