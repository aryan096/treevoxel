import { describe, it, expect } from 'vitest';
import { generateTree } from '../../src/core/generate';
import { getDefaultParams } from '../../src/core/parameters';
import { applyPreset } from '../../src/core/presets';
import { PRESETS } from '../../src/core/presets';

describe('generateTree', () => {
  it('produces a complete pipeline result', () => {
    const params = getDefaultParams();
    const result = generateTree(params);
    let nonFenceCount = 0;
    for (const layer of result.voxels.layers.values()) {
      for (const type of layer.values()) {
        if (type !== 'fence') {
          nonFenceCount++;
        }
      }
    }

    expect(result.model.nodes.length).toBeGreaterThan(0);
    expect(result.model.segments?.length ?? 0).toBeGreaterThan(0);
    expect(result.model.spans?.length ?? 0).toBeGreaterThan(0);
    expect(result.voxels.count).toBeGreaterThan(0);
    expect(result.buffer.count).toBe(nonFenceCount);
  });

  it('works with each preset', () => {
    for (const preset of PRESETS) {
      const params = applyPreset(getDefaultParams(), preset);
      const result = generateTree(params);
      expect(result.voxels.count).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const params = getDefaultParams();
    const a = generateTree(params);
    const b = generateTree(params);
    expect(a.voxels.count).toBe(b.voxels.count);
    expect(a.buffer.count).toBe(b.buffer.count);
  });
});
