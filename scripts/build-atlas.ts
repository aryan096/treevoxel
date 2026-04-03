/**
 * Build the Minecraft texture atlas for Treevoxel.
 *
 * Usage:
 *   node --experimental-strip-types scripts/build-atlas.ts
 *
 * Source textures should be copied into `scripts/source-textures/` from:
 * https://faithfulpack.net/
 *
 * If any required source texture is missing, this script writes a placeholder
 * atlas so the rendering pipeline can still be developed and verified.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { deflateSync, inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import {
  MINECRAFT_ATLAS_DEFINITION,
  MINECRAFT_ATLAS_RESERVED_CELLS,
  MINECRAFT_ATLAS_SOURCE_FILES,
} from '../src/textures/minecraftAtlas.ts';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, '..');
const SOURCE_DIR = path.join(SCRIPT_DIR, 'source-textures');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'textures', 'minecraft', 'atlas.png');
const DIORAMA_GRASS_OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'textures', 'minecraft', 'grass_block_top.png');
const DEFAULT_CELL_SIZE = 16;
const REQUIRED_SOURCE_FILES = Object.keys(MINECRAFT_ATLAS_SOURCE_FILES).sort();

type DecodedImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

type SourceAtlasInputs = {
  cellSize: number;
  images: Map<string, DecodedImage>;
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const sourceInputs = await readSourceImages();

  if (!sourceInputs) {
    const placeholderSize = DEFAULT_CELL_SIZE * MINECRAFT_ATLAS_DEFINITION.atlasGridSize;
    await fs.writeFile(
      OUTPUT_PATH,
      encodePng(
        placeholderSize,
        placeholderSize,
        buildPlaceholderAtlas(DEFAULT_CELL_SIZE, placeholderSize),
      ),
    );
    await writeStandaloneGrassTexture(DEFAULT_CELL_SIZE);
    console.log(`Wrote placeholder atlas to ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
    return;
  }

  const atlasSize = sourceInputs.cellSize * MINECRAFT_ATLAS_DEFINITION.atlasGridSize;
  const atlas = buildPlaceholderAtlas(sourceInputs.cellSize, atlasSize);
  for (const [fileName, cellIndex] of Object.entries(MINECRAFT_ATLAS_SOURCE_FILES)) {
    const image = sourceInputs.images.get(fileName);
    if (!image || cellIndex == null) {
      continue;
    }

    blitCell(atlas, atlasSize, sourceInputs.cellSize, cellIndex, image.data, image.width);
  }

  await fs.writeFile(OUTPUT_PATH, encodePng(atlasSize, atlasSize, atlas));
  await copyStandaloneGrassTexture();
  console.log(`Wrote atlas to ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
}

async function copyStandaloneGrassTexture(): Promise<void> {
  const grassSource = path.join(SOURCE_DIR, sourceFileName('grass_block_top'));
  const grassTexture = await fs.readFile(grassSource).catch(() => null);

  if (!grassTexture) {
    await writeStandaloneGrassTexture(DEFAULT_CELL_SIZE);
    return;
  }

  await fs.writeFile(DIORAMA_GRASS_OUTPUT_PATH, grassTexture);
}

async function writeStandaloneGrassTexture(cellSize: number): Promise<void> {
  const texture = new Uint8Array(cellSize * cellSize * 4);
  const tint = [145, 189, 89, 255] as const;

  for (let y = 0; y < cellSize; y++) {
    for (let x = 0; x < cellSize; x++) {
      const offset = (y * cellSize + x) * 4;
      texture[offset + 0] = tint[0];
      texture[offset + 1] = tint[1];
      texture[offset + 2] = tint[2];
      texture[offset + 3] = tint[3];
    }
  }

  await fs.writeFile(DIORAMA_GRASS_OUTPUT_PATH, encodePng(cellSize, cellSize, texture));
}

async function readSourceImages(): Promise<SourceAtlasInputs | null> {
  const names = await fs.readdir(SOURCE_DIR).catch(() => null);
  if (!names) {
    return null;
  }

  const available = new Set(names);
  for (const fileName of REQUIRED_SOURCE_FILES) {
    if (!available.has(sourceFileName(fileName))) {
      return null;
    }
  }

  const images = new Map<string, DecodedImage>();
  let cellSize: number | null = null;

  for (const fileName of REQUIRED_SOURCE_FILES) {
    const image = decodePng(await fs.readFile(path.join(SOURCE_DIR, sourceFileName(fileName))));
    if (image.width !== image.height) {
      throw new Error(`Expected ${sourceFileName(fileName)} to be square, got ${image.width}x${image.height}`);
    }

    if (cellSize == null) {
      cellSize = image.width;
    } else if (image.width !== cellSize) {
      throw new Error(
        `Expected ${sourceFileName(fileName)} to be ${cellSize}x${cellSize}, got ${image.width}x${image.height}`,
      );
    }

    images.set(fileName, image);
  }

  if (cellSize == null) {
    return null;
  }

  return { cellSize, images };
}

function sourceFileName(textureId: string): string {
  return `${textureId}.png`;
}

function buildPlaceholderAtlas(cellSize: number, atlasSize: number): Uint8Array {
  const atlas = new Uint8Array(atlasSize * atlasSize * 4);

  for (let cellIndex = 0; cellIndex < MINECRAFT_ATLAS_DEFINITION.atlasGridSize ** 2; cellIndex++) {
    const x = (cellIndex % MINECRAFT_ATLAS_DEFINITION.atlasGridSize) * cellSize;
    const y = Math.floor(cellIndex / MINECRAFT_ATLAS_DEFINITION.atlasGridSize) * cellSize;
    const hue = (cellIndex * 37) % 360;
    const fill = hslToRgb(hue / 360, 0.45, 0.56);
    const border = [28, 28, 28, 255] as const;

    for (let py = 0; py < cellSize; py++) {
      for (let px = 0; px < cellSize; px++) {
        const isBorder = px === 0 || py === 0 || px === cellSize - 1 || py === cellSize - 1;
        const offset = ((y + py) * atlasSize + (x + px)) * 4;
        const color = isBorder ? border : fill;
        atlas[offset + 0] = color[0];
        atlas[offset + 1] = color[1];
        atlas[offset + 2] = color[2];
        atlas[offset + 3] = color[3];
      }
    }
  }

  for (const cellIndex of MINECRAFT_ATLAS_RESERVED_CELLS) {
    const x = (cellIndex % MINECRAFT_ATLAS_DEFINITION.atlasGridSize) * cellSize;
    const y = Math.floor(cellIndex / MINECRAFT_ATLAS_DEFINITION.atlasGridSize) * cellSize;
    paintReservedCell(atlas, atlasSize, cellSize, x, y);
  }

  return atlas;
}

function paintReservedCell(atlas: Uint8Array, atlasWidth: number, cellSize: number, x: number, y: number): void {
  for (let py = 0; py < cellSize; py++) {
    for (let px = 0; px < cellSize; px++) {
      const offset = ((y + py) * atlasWidth + (x + px)) * 4;
      const isBorder = px === 0 || py === 0 || px === cellSize - 1 || py === cellSize - 1;
      const value = isBorder ? 16 : 96;
      atlas[offset + 0] = value;
      atlas[offset + 1] = value;
      atlas[offset + 2] = value;
      atlas[offset + 3] = 255;
    }
  }
}

function blitCell(
  atlas: Uint8Array,
  atlasWidth: number,
  cellSize: number,
  cellIndex: number,
  source: Uint8Array,
  sourceWidth: number,
): void {
  const cellX = (cellIndex % MINECRAFT_ATLAS_DEFINITION.atlasGridSize) * cellSize;
  const cellY = Math.floor(cellIndex / MINECRAFT_ATLAS_DEFINITION.atlasGridSize) * cellSize;

  for (let y = 0; y < cellSize; y++) {
    for (let x = 0; x < cellSize; x++) {
      const srcOffset = (y * sourceWidth + x) * 4;
      const dstOffset = ((cellY + y) * atlasWidth + (cellX + x)) * 4;
      atlas[dstOffset + 0] = source[srcOffset + 0];
      atlas[dstOffset + 1] = source[srcOffset + 1];
      atlas[dstOffset + 2] = source[srcOffset + 2];
      atlas[dstOffset + 3] = source[srcOffset + 3];
    }
  }
}

function decodePng(buffer: Buffer): DecodedImage {
  const signature = buffer.subarray(0, 8);
  const expectedSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!signature.equals(expectedSignature)) {
    throw new Error('Input is not a PNG file');
  }

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatParts: Buffer[] = [];
  let palette: Buffer | null = null;
  let transparency: Buffer | null = null;

  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
      interlace = data.readUInt8(12);
    } else if (type === 'PLTE') {
      palette = Buffer.from(data);
    } else if (type === 'tRNS') {
      transparency = Buffer.from(data);
    } else if (type === 'IDAT') {
      idatParts.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
  }

  if (interlace !== 0 && interlace !== 1) {
    throw new Error(`Unsupported PNG interlace method: ${interlace}`);
  }

  const bytesPerPixel = bytesPerPixelForFilter(colorType, bitDepth);
  if (bytesPerPixel === null) {
    throw new Error(`Unsupported PNG color type/bit depth combination: colorType=${colorType}, bitDepth=${bitDepth}`);
  }
  if (colorType === 3 && !palette) {
    throw new Error('Indexed PNG is missing a palette');
  }

  const inflated = inflateSync(Buffer.concat(idatParts));
  const raw = new Uint8Array(width * height * 4);
  let inputOffset = 0;

  if (interlace === 0) {
    inputOffset = decodeScanlinesIntoRgba({
      inflated,
      inputOffset,
      passWidth: width,
      passHeight: height,
      dstWidth: width,
      xStart: 0,
      yStart: 0,
      xStep: 1,
      yStep: 1,
      colorType,
      bitDepth,
      bytesPerPixel,
      palette,
      transparency,
      raw,
    });
  } else if (interlace === 1) {
    const adam7Passes = [
      { xStart: 0, yStart: 0, xStep: 8, yStep: 8 },
      { xStart: 4, yStart: 0, xStep: 8, yStep: 8 },
      { xStart: 0, yStart: 4, xStep: 4, yStep: 8 },
      { xStart: 2, yStart: 0, xStep: 4, yStep: 4 },
      { xStart: 0, yStart: 2, xStep: 2, yStep: 4 },
      { xStart: 1, yStart: 0, xStep: 2, yStep: 2 },
      { xStart: 0, yStart: 1, xStep: 1, yStep: 2 },
    ] as const;

    for (const pass of adam7Passes) {
      const passWidth = adam7Dimension(width, pass.xStart, pass.xStep);
      const passHeight = adam7Dimension(height, pass.yStart, pass.yStep);
      if (passWidth === 0 || passHeight === 0) {
        continue;
      }

      inputOffset = decodeScanlinesIntoRgba({
        inflated,
        inputOffset,
        passWidth,
        passHeight,
        dstWidth: width,
        xStart: pass.xStart,
        yStart: pass.yStart,
        xStep: pass.xStep,
        yStep: pass.yStep,
        colorType,
        bitDepth,
        bytesPerPixel,
        palette,
        transparency,
        raw,
      });
    }
  }

  return { width, height, data: raw };
}

type DecodeScanlinesOptions = {
  inflated: Buffer;
  inputOffset: number;
  passWidth: number;
  passHeight: number;
  dstWidth: number;
  xStart: number;
  yStart: number;
  xStep: number;
  yStep: number;
  colorType: number;
  bitDepth: number;
  bytesPerPixel: number;
  palette: Buffer | null;
  transparency: Buffer | null;
  raw: Uint8Array;
};

function decodeScanlinesIntoRgba(options: DecodeScanlinesOptions): number {
  const {
    inflated,
    inputOffset: initialOffset,
    passWidth,
    passHeight,
    dstWidth,
    xStart,
    yStart,
    xStep,
    yStep,
    colorType,
    bitDepth,
    bytesPerPixel,
    palette,
    transparency,
    raw,
  } = options;
  const stride = scanlineStride(passWidth, colorType, bitDepth);
  const rowSize = stride + 1;
  let inputOffset = initialOffset;
  let previousRow = new Uint8Array(stride);
  let currentRow = new Uint8Array(stride);

  for (let rowIndex = 0; rowIndex < passHeight; rowIndex++) {
    const filter = inflated[inputOffset];
    const rowData = inflated.subarray(inputOffset + 1, inputOffset + rowSize);
    inputOffset += rowSize;

    unfilterRow(filter, rowData, previousRow, currentRow, bytesPerPixel);

    const dstY = yStart + rowIndex * yStep;
    for (let x = 0; x < passWidth; x++) {
      const dstX = xStart + x * xStep;
      writeDecodedPixel(raw, dstWidth, dstX, dstY, currentRow, x, colorType, bitDepth, palette, transparency);
    }

    previousRow = currentRow;
    currentRow = new Uint8Array(stride);
  }

  return inputOffset;
}

function writeDecodedPixel(
  raw: Uint8Array,
  imageWidth: number,
  x: number,
  y: number,
  row: Uint8Array,
  pixelIndex: number,
  colorType: number,
  bitDepth: number,
  palette: Buffer | null,
  transparency: Buffer | null,
): void {
  const dstOffset = (y * imageWidth + x) * 4;

  if (colorType === 6) {
    const srcOffset = pixelIndex * 4;
    raw[dstOffset + 0] = row[srcOffset + 0];
    raw[dstOffset + 1] = row[srcOffset + 1];
    raw[dstOffset + 2] = row[srcOffset + 2];
    raw[dstOffset + 3] = row[srcOffset + 3];
    return;
  }

  if (colorType === 2) {
    const srcOffset = pixelIndex * 3;
    raw[dstOffset + 0] = row[srcOffset + 0];
    raw[dstOffset + 1] = row[srcOffset + 1];
    raw[dstOffset + 2] = row[srcOffset + 2];
    raw[dstOffset + 3] = 255;
    return;
  }

  if (colorType === 3 && palette) {
    const paletteIndex = readPackedSample(row, pixelIndex, bitDepth);
    const paletteOffset = paletteIndex * 3;
    if (paletteOffset + 2 >= palette.length) {
      throw new Error(`Palette index out of range: ${paletteIndex}`);
    }

    raw[dstOffset + 0] = palette[paletteOffset + 0];
    raw[dstOffset + 1] = palette[paletteOffset + 1];
    raw[dstOffset + 2] = palette[paletteOffset + 2];
    raw[dstOffset + 3] = transparency?.[paletteIndex] ?? 255;
    return;
  }

  const value = row[pixelIndex];
  raw[dstOffset + 0] = value;
  raw[dstOffset + 1] = value;
  raw[dstOffset + 2] = value;
  raw[dstOffset + 3] = 255;
}

function adam7Dimension(size: number, start: number, step: number): number {
  if (size <= start) {
    return 0;
  }
  return Math.floor((size - start + step - 1) / step);
}

function bytesPerPixelForFilter(colorType: number, bitDepth: number): number | null {
  if (colorType === 6 && bitDepth === 8) {
    return 4;
  }
  if (colorType === 2 && bitDepth === 8) {
    return 3;
  }
  if (colorType === 0 && bitDepth === 8) {
    return 1;
  }
  if (colorType === 3 && [1, 2, 4, 8].includes(bitDepth)) {
    return 1;
  }
  return null;
}

function scanlineStride(width: number, colorType: number, bitDepth: number): number {
  if (colorType === 6) {
    return width * 4;
  }
  if (colorType === 2) {
    return width * 3;
  }
  if (colorType === 0) {
    return width;
  }
  if (colorType === 3) {
    return Math.ceil((width * bitDepth) / 8);
  }
  throw new Error(`Unsupported PNG color type: ${colorType}`);
}

function readPackedSample(row: Uint8Array, pixelIndex: number, bitDepth: number): number {
  if (bitDepth === 8) {
    return row[pixelIndex];
  }

  const bitOffset = pixelIndex * bitDepth;
  const byteOffset = Math.floor(bitOffset / 8);
  const shift = 8 - bitDepth - (bitOffset % 8);
  const mask = (1 << bitDepth) - 1;
  return (row[byteOffset] >> shift) & mask;
}

function unfilterRow(
  filter: number,
  row: Uint8Array,
  previousRow: Uint8Array,
  output: Uint8Array,
  bytesPerPixel: number,
): void {
  switch (filter) {
    case 0:
      output.set(row);
      return;
    case 1:
      for (let i = 0; i < row.length; i++) {
        const left = i >= bytesPerPixel ? output[i - bytesPerPixel] : 0;
        output[i] = (row[i] + left) & 0xff;
      }
      return;
    case 2:
      for (let i = 0; i < row.length; i++) {
        output[i] = (row[i] + previousRow[i]) & 0xff;
      }
      return;
    case 3:
      for (let i = 0; i < row.length; i++) {
        const left = i >= bytesPerPixel ? output[i - bytesPerPixel] : 0;
        const up = previousRow[i];
        output[i] = (row[i] + Math.floor((left + up) / 2)) & 0xff;
      }
      return;
    case 4:
      for (let i = 0; i < row.length; i++) {
        const left = i >= bytesPerPixel ? output[i - bytesPerPixel] : 0;
        const up = previousRow[i];
        const upLeft = i >= bytesPerPixel ? previousRow[i - bytesPerPixel] : 0;
        output[i] = (row[i] + paethPredictor(left, up, upLeft)) & 0xff;
      }
      return;
    default:
      throw new Error(`Unsupported PNG filter type: ${filter}`);
  }
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);

  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    raw[rowOffset] = 0;
    const srcOffset = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      raw[rowOffset + 1 + x] = rgba[srcOffset + x];
    }
  }

  const chunks = [
    createChunk('IHDR', buildIhdrData(width, height)),
    createChunk('IDAT', deflateSync(raw)),
    createChunk('IEND', Buffer.alloc(0)),
  ];

  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]);
}

function buildIhdrData(width: number, height: number): Buffer {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8);
  data.writeUInt8(6, 9);
  data.writeUInt8(0, 10);
  data.writeUInt8(0, 11);
  data.writeUInt8(0, 12);
  return data;
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number, number] {
  const hue = ((h % 1) + 1) % 1;
  const saturation = Math.max(0, Math.min(1, s));
  const lightness = Math.max(0, Math.min(1, l));

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return [value, value, value, 255];
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  const r = hueToRgb(p, q, hue + 1 / 3);
  const g = hueToRgb(p, q, hue);
  const b = hueToRgb(p, q, hue - 1 / 3);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255];
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
