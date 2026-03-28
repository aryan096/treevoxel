import type { VoxelStore, RenderBuffer, BlockType, BlockColors } from './types';
import { unpack } from './pack';

const BLOCK_TYPE_INDEX: Record<BlockType, number> = {
  log: 0,
  branch: 1,
  leaf: 2,
};

const DEFAULT_BLOCK_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
};

/**
 * Convert a VoxelStore into a flat RenderBuffer for InstancedMesh rendering.
 */
export function buildRenderBuffer(
  store: VoxelStore,
  blockColors: BlockColors = DEFAULT_BLOCK_COLORS,
  colorRandomness = 1,
): RenderBuffer {
  const { count } = store;
  const matrices = new Float32Array(count * 16);
  const types = new Uint8Array(count);
  const colors = new Float32Array(count * 3);

  let idx = 0;
  for (const [y, layer] of store.layers) {
    for (const [key, blockType] of layer) {
      const [x, z] = unpack(key);
      const offset = idx * 16;

      // 4x4 identity matrix with translation
      matrices[offset + 0] = 1;
      matrices[offset + 1] = 0;
      matrices[offset + 2] = 0;
      matrices[offset + 3] = 0;
      matrices[offset + 4] = 0;
      matrices[offset + 5] = 1;
      matrices[offset + 6] = 0;
      matrices[offset + 7] = 0;
      matrices[offset + 8] = 0;
      matrices[offset + 9] = 0;
      matrices[offset + 10] = 1;
      matrices[offset + 11] = 0;
      matrices[offset + 12] = x;
      matrices[offset + 13] = y;
      matrices[offset + 14] = z;
      matrices[offset + 15] = 1;

      types[idx] = BLOCK_TYPE_INDEX[blockType];
      const colorOffset = idx * 3;
      const color = getVoxelColor(blockType, x, y, z, blockColors[blockType], colorRandomness);
      colors[colorOffset + 0] = color[0];
      colors[colorOffset + 1] = color[1];
      colors[colorOffset + 2] = color[2];
      idx++;
    }
  }

  return { matrices, types, colors, count };
}

function getVoxelColor(
  type: BlockType,
  x: number,
  y: number,
  z: number,
  baseHex: string,
  randomness: number,
): [number, number, number] {
  const baseColor = hexToRgb(baseHex);

  if (type === 'log') {
    return varyColor(baseColor, {
      x,
      y,
      z,
      hueShift: 0.018,
      saturationShift: 0.08,
      brightnessShift: 0.16,
      verticalWeight: -0.03,
      grainScale: 0.08,
      randomness,
    });
  }

  if (type === 'branch') {
    return varyColor(baseColor, {
      x,
      y,
      z,
      hueShift: 0.02,
      saturationShift: 0.09,
      brightnessShift: 0.14,
      verticalWeight: -0.015,
      grainScale: 0.06,
      randomness,
    });
  }

  return varyColor(baseColor, {
    x,
    y,
    z,
    hueShift: 0.03,
    saturationShift: 0.12,
    brightnessShift: 0.18,
    verticalWeight: 0.02,
    grainScale: 0.05,
    randomness,
  });
}

type ColorVariationOptions = {
  x: number;
  y: number;
  z: number;
  hueShift: number;
  saturationShift: number;
  brightnessShift: number;
  verticalWeight: number;
  grainScale: number;
  randomness: number;
};

function varyColor(
  base: [number, number, number],
  options: ColorVariationOptions,
): [number, number, number] {
  const { x, y, z, hueShift, saturationShift, brightnessShift, verticalWeight, grainScale, randomness } =
    options;
  const [h, s, l] = rgbToHsl(base[0], base[1], base[2]);
  const patchNoise = hashNoise(x, y, z, 0);
  const detailNoise = hashNoise(x, y, z, 1);
  const scaledHueShift = hueShift * randomness;
  const scaledSaturationShift = saturationShift * randomness;
  const scaledBrightnessShift = brightnessShift * randomness;
  const scaledVerticalWeight = verticalWeight * randomness;
  const grain = Math.sin((x * 0.9 + y * 1.7 + z * 0.65) * Math.PI) * grainScale * randomness;
  const variedHue = wrap01(h + (patchNoise - 0.5) * scaledHueShift);
  const variedSaturation = clamp01(s + (detailNoise - 0.5) * scaledSaturationShift + grain * 0.35);
  const variedLightness = clamp01(
    l +
      (patchNoise - 0.5) * scaledBrightnessShift +
      scaledVerticalWeight * (y / 32) +
      grain,
  );
  return hslToRgb(variedHue, variedSaturation, variedLightness);
}

function hashNoise(x: number, y: number, z: number, salt: number): number {
  const seed = x * 374761393 + y * 668265263 + z * 2147483647 + salt * 1274126177;
  const hashed = Math.imul(seed ^ (seed >>> 13), 1274126177);
  return ((hashed ^ (hashed >>> 16)) >>> 0) / 4294967295;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return [0, 0, lightness];
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return [hue / 6, saturation, lightness];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    return [l, l, l];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    hueToRgb(p, q, h + 1 / 3),
    hueToRgb(p, q, h),
    hueToRgb(p, q, h - 1 / 3),
  ];
}

function hueToRgb(p: number, q: number, t: number): number {
  let wrapped = t;
  if (wrapped < 0) wrapped += 1;
  if (wrapped > 1) wrapped -= 1;
  if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
  if (wrapped < 1 / 2) return q;
  if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
  return p;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function wrap01(value: number): number {
  return value - Math.floor(value);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  if (!/^[\da-fA-F]{6}$/.test(expanded)) {
    return [1, 1, 1];
  }

  const value = Number.parseInt(expanded, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}
