import { describe, it, expect } from 'vitest';
import { pack, unpack } from '../../src/core/pack';

describe('pack', () => {
  it('packs x=0, z=0 to 0', () => {
    expect(pack(0, 0)).toBe(0);
  });

  it('packs and unpacks round-trip', () => {
    const cases = [
      [0, 0], [1, 0], [0, 1], [5, 7], [31, 31],
      [-10, 5], [3, -8], [-15, -15],
    ];
    for (const [x, z] of cases) {
      const packed = pack(x, z);
      const [ux, uz] = unpack(packed);
      expect(ux).toBe(x);
      expect(uz).toBe(z);
    }
  });

  it('produces unique keys for distinct coordinates', () => {
    const keys = new Set<number>();
    for (let x = -20; x <= 20; x++) {
      for (let z = -20; z <= 20; z++) {
        const k = pack(x, z);
        expect(keys.has(k)).toBe(false);
        keys.add(k);
      }
    }
  });
});
