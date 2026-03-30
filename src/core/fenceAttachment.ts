import type { BlockType } from './types';
import { GRID_SIZE, pack, unpack } from './pack';

type Layers = Map<number, Map<number, BlockType>>;
type SetBlock = (x: number, y: number, z: number, type: BlockType) => void;

export function repairFenceAttachments(
  layers: Layers,
  setBlock: SetBlock,
): void {
  const originalFenceLayers = new Map<number, Set<number>>();
  for (const [y, layer] of layers) {
    const fenceKeys = new Set<number>();
    for (const [key, type] of layer) {
      if (type === 'fence') {
        fenceKeys.add(key);
      }
    }
    if (fenceKeys.size > 0) {
      originalFenceLayers.set(y, fenceKeys);
    }
  }

  for (const [y, fenceKeys] of originalFenceLayers) {
    const layer = layers.get(y);
    if (!layer) continue;

    for (const key of fenceKeys) {
      const [x, z] = unpack(key);
      fillSameLayerDiagonalBridge(layer, x, y, z, setBlock);
      fillSteppedLayerBridges(layers, originalFenceLayers, x, y, z, setBlock);
    }
  }
}

export function buildFenceAttachmentMask(
  layers: Layers,
): Map<number, Map<number, number>> {
  const fenceConnectivity = new Map<number, Map<number, number>>();

  for (const [y, layer] of layers) {
    for (const [key, type] of layer) {
      if (type !== 'fence') continue;

      let mask = 0;
      if (isFenceAttachable(layer.get(key + 1))) mask |= 0b0001;
      if (isFenceAttachable(layer.get(key - 1))) mask |= 0b0010;
      if (isFenceAttachable(layer.get(key + GRID_SIZE))) mask |= 0b0100;
      if (isFenceAttachable(layer.get(key - GRID_SIZE))) mask |= 0b1000;

      let connectivityLayer = fenceConnectivity.get(y);
      if (!connectivityLayer) {
        connectivityLayer = new Map();
        fenceConnectivity.set(y, connectivityLayer);
      }
      connectivityLayer.set(key, mask);
    }
  }

  return fenceConnectivity;
}

export function isFenceAttachable(blockType: BlockType | undefined): boolean {
  return blockType === 'fence' || blockType === 'branch' || blockType === 'log' || blockType === 'leaf';
}

function fillSameLayerDiagonalBridge(
  layer: Map<number, BlockType>,
  x: number,
  y: number,
  z: number,
  setBlock: SetBlock,
): void {
  const diagonalOffsets = [
    { dx: 1, dz: 1 },
    { dx: 1, dz: -1 },
    { dx: -1, dz: 1 },
    { dx: -1, dz: -1 },
  ];

  for (const { dx, dz } of diagonalOffsets) {
    const diagonalKey = pack(x + dx, z + dz);
    if (!isFenceAttachable(layer.get(diagonalKey))) continue;

    const sideA = { x: x + dx, z, key: pack(x + dx, z) };
    const sideB = { x, z: z + dz, key: pack(x, z + dz) };

    if (isFenceAttachable(layer.get(sideA.key)) || isFenceAttachable(layer.get(sideB.key))) {
      continue;
    }

    const bridge = chooseFenceBridgeCandidate(layer, x, y, z, sideA, sideB);
    if (!bridge) continue;

    tryPlaceFenceBridge(layer, bridge.x, y, bridge.z, bridge.key, setBlock);
  }
}

function fillSteppedLayerBridges(
  layers: Layers,
  originalFenceLayers: Map<number, Set<number>>,
  x: number,
  y: number,
  z: number,
  setBlock: SetBlock,
): void {
  const sourceOriginalFences = originalFenceLayers.get(y);
  if (!sourceOriginalFences) return;
  const sourceNeighborCount = countOriginalFenceNeighbors(sourceOriginalFences, x, z);
  if (sourceNeighborCount > 1) return;

  const horizontalOffsets = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 },
  ];
  const verticalOffsets = [-1, 1];

  for (const { dx, dz } of horizontalOffsets) {
    for (const dy of verticalOffsets) {
      const targetOriginalFences = originalFenceLayers.get(y + dy);
      if (!targetOriginalFences) continue;

      const targetKey = pack(x + dx, z + dz);
      if (!targetOriginalFences.has(targetKey)) continue;
      if (countOriginalFenceNeighbors(targetOriginalFences, x + dx, z + dz) > 1) continue;

      const sameLayerBridgeKey = pack(x + dx, z + dz);
      const upperLayerBridgeKey = pack(x, z);
      const sameLayer = layers.get(y);
      const upperLayer = layers.get(y + dy);

      if (!isFenceBlock(sameLayer?.get(sameLayerBridgeKey))) {
        tryPlaceFenceBridge(sameLayer, x + dx, y, z + dz, sameLayerBridgeKey, setBlock);
      }

      if (!isFenceBlock(upperLayer?.get(upperLayerBridgeKey))) {
        tryPlaceFenceBridge(upperLayer, x, y + dy, z, upperLayerBridgeKey, setBlock);
      }
    }
  }
}

function countOriginalFenceNeighbors(originalFenceKeys: Set<number>, x: number, z: number): number {
  let neighbors = 0;
  if (originalFenceKeys.has(pack(x + 1, z))) neighbors++;
  if (originalFenceKeys.has(pack(x - 1, z))) neighbors++;
  if (originalFenceKeys.has(pack(x, z + 1))) neighbors++;
  if (originalFenceKeys.has(pack(x, z - 1))) neighbors++;
  return neighbors;
}

function chooseFenceBridgeCandidate(
  layer: Map<number, BlockType>,
  x: number,
  y: number,
  z: number,
  sideA: { x: number; z: number; key: number },
  sideB: { x: number; z: number; key: number },
) : { x: number; y: number; z: number; key: number } | null {
  const candidates = [
    { x: sideA.x, y, z: sideA.z, key: sideA.key },
    { x: sideB.x, y, z: sideB.z, key: sideB.key },
  ]
    .filter(({ key }) => {
      const existing = layer.get(key);
      return existing === undefined || existing === 'leaf';
    })
    .map((candidate) => ({
      candidate,
      score: countNearbyFenceConnections(layer, candidate.x, y, candidate.z, x, z),
    }))
    .sort((a, b) => b.score - a.score || a.candidate.x - b.candidate.x || a.candidate.z - b.candidate.z);

  return candidates[0]?.candidate ?? null;
}

function tryPlaceFenceBridge(
  layer: Map<number, BlockType> | undefined,
  x: number,
  y: number,
  z: number,
  key: number,
  setBlock: SetBlock,
): boolean {
  const existing = layer?.get(key);
  if (existing === 'log' || existing === 'branch' || existing === 'fence') return false;
  if (existing !== undefined && existing !== 'leaf') return false;
  setBlock(x, y, z, 'fence');
  return true;
}

function countNearbyFenceConnections(
  layer: Map<number, BlockType>,
  x: number,
  y: number,
  z: number,
  sourceX: number,
  sourceZ: number,
): number {
  void y;
  let score = 0;
  const neighbors = [
    pack(x + 1, z),
    pack(x - 1, z),
    pack(x, z + 1),
    pack(x, z - 1),
  ];

  for (const neighborKey of neighbors) {
    if (isFenceAttachable(layer.get(neighborKey))) {
      score++;
    }
  }

  if (x === sourceX || z === sourceZ) {
    score++;
  }

  return score;
}

function isFenceBlock(blockType: BlockType | undefined): boolean {
  return blockType === 'fence';
}
