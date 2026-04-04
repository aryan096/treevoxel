import type { VoxelStore, RenderBuffer, BlockType, BlockColors } from './types';
import { unpack } from './pack';

const BLOCK_TYPE_INDEX: Record<Exclude<BlockType, 'fence'>, number> = {
  log: 0,
  branch: 1,
  leaf: 2,
};

const DEFAULT_BLOCK_COLORS: BlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};

const AXIS_TO_INDEX = {
  y: 0,
  x: 1,
  z: 2,
} as const;

/**
 * Convert a VoxelStore into a flat RenderBuffer for InstancedMesh rendering.
 */
export function buildRenderBuffer(
  store: VoxelStore,
  blockColors: BlockColors = DEFAULT_BLOCK_COLORS,
  colorRandomness = 0.1,
): RenderBuffer {
  let cubeCount = 0;
  let fencePostCount = 0;
  let fenceNSDirections = 0;
  let fenceEWDirections = 0;

  for (const [y, layer] of store.layers) {
    const connLayer = store.fenceConnectivity.get(y);
    for (const [key, blockType] of layer) {
      if (blockType === 'fence') {
        fencePostCount++;
        const mask = connLayer?.get(key) ?? 0;
        // bits 0,1 = N,S (dz≠0); bits 2,3 = E,W (dx≠0)
        if (mask & 0b0001) fenceNSDirections++;
        if (mask & 0b0010) fenceNSDirections++;
        if (mask & 0b0100) fenceEWDirections++;
        if (mask & 0b1000) fenceEWDirections++;
      } else {
        cubeCount++;
      }
    }
  }

  const matrices = new Float32Array(cubeCount * 16);
  const types = new Uint8Array(cubeCount);
  const colors = new Float32Array(cubeCount * 3);
  const axes = new Uint8Array(cubeCount);
  const fencePostMatrices = new Float32Array(fencePostCount * 16);
  const fencePostColors = new Float32Array(fencePostCount * 3);
  const fenceNSRailCount = fenceNSDirections * 2;
  const fenceNSRailMatrices = new Float32Array(fenceNSRailCount * 16);
  const fenceNSRailColors = new Float32Array(fenceNSRailCount * 3);
  const fenceEWRailCount = fenceEWDirections * 2;
  const fenceEWRailMatrices = new Float32Array(fenceEWRailCount * 16);
  const fenceEWRailColors = new Float32Array(fenceEWRailCount * 3);

  let cubeIdx = 0;
  let postIdx = 0;
  let nsIdx = 0;
  let ewIdx = 0;

  for (const [y, layer] of store.layers) {
    const axisLayer = store.axis.get(y);
    const connLayer = store.fenceConnectivity.get(y);
    for (const [key, blockType] of layer) {
      const [x, z] = unpack(key);

      if (blockType === 'fence') {
        writeMatrix(fencePostMatrices, postIdx * 16, 1, 1, 1, x, y + 0.5, z);
        writeColor(
          fencePostColors,
          postIdx * 3,
          getVoxelColor('fence', x, y, z, blockColors.fence, colorRandomness),
        );
        postIdx++;

        const mask = connLayer?.get(key) ?? 0;
        const directions: Array<{ dx: number; dz: number; bit: number }> = [
          { dx: 0, dz: 1, bit: 0 },
          { dx: 0, dz: -1, bit: 1 },
          { dx: 1, dz: 0, bit: 2 },
          { dx: -1, dz: 0, bit: 3 },
        ];
        const armHeights = [3 / 8, 3 / 4];

        for (const direction of directions) {
          if ((mask & (1 << direction.bit)) === 0) continue;

          const isNS = direction.dx === 0;
          for (const height of armHeights) {
            const fenceColor = getVoxelColor('fence', x, y, z, blockColors.fence, colorRandomness);
            if (isNS) {
              writeMatrix(
                fenceNSRailMatrices,
                nsIdx * 16,
                1,
                1,
                1,
                x,
                y + height,
                z + direction.dz * 0.25,
              );
              writeColor(fenceNSRailColors, nsIdx * 3, fenceColor);
              nsIdx++;
            } else {
              writeMatrix(
                fenceEWRailMatrices,
                ewIdx * 16,
                1,
                1,
                1,
                x + direction.dx * 0.25,
                y + height,
                z,
              );
              writeColor(fenceEWRailColors, ewIdx * 3, fenceColor);
              ewIdx++;
            }
          }
        }
        continue;
      }

      writeMatrix(matrices, cubeIdx * 16, 1, 1, 1, x, y + 0.5, z);
      types[cubeIdx] = BLOCK_TYPE_INDEX[blockType];
      writeColor(colors, cubeIdx * 3, getVoxelColor(blockType, x, y, z, blockColors[blockType], colorRandomness));
      axes[cubeIdx] = blockType === 'leaf' ? AXIS_TO_INDEX.y : AXIS_TO_INDEX[axisLayer?.get(key) ?? 'y'];
      cubeIdx++;
    }
  }

  return {
    matrices,
    types,
    colors,
    axes,
    count: cubeCount,
    fencePostMatrices,
    fencePostColors,
    fencePostCount,
    fenceNSRailMatrices,
    fenceNSRailColors,
    fenceNSRailCount,
    fenceEWRailMatrices,
    fenceEWRailColors,
    fenceEWRailCount,
  };
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

  if (type === 'branch' || type === 'fence') {
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

function writeMatrix(
  target: Float32Array,
  offset: number,
  scaleX: number,
  scaleY: number,
  scaleZ: number,
  translateX: number,
  translateY: number,
  translateZ: number,
): void {
  target[offset + 0] = scaleX;
  target[offset + 1] = 0;
  target[offset + 2] = 0;
  target[offset + 3] = 0;
  target[offset + 4] = 0;
  target[offset + 5] = scaleY;
  target[offset + 6] = 0;
  target[offset + 7] = 0;
  target[offset + 8] = 0;
  target[offset + 9] = 0;
  target[offset + 10] = scaleZ;
  target[offset + 11] = 0;
  target[offset + 12] = translateX;
  target[offset + 13] = translateY;
  target[offset + 14] = translateZ;
  target[offset + 15] = 1;
}

function writeColor(target: Float32Array, offset: number, color: [number, number, number]): void {
  target[offset + 0] = color[0];
  target[offset + 1] = color[1];
  target[offset + 2] = color[2];
}

function countBits(mask: number): number {
  let bits = 0;
  for (let i = 0; i < 4; i++) {
    if (mask & (1 << i)) bits++;
  }
  return bits;
}
