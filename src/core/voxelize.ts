import type { Axis, BlockType, BranchSpan, TreeModel, TreeParams, VoxelStore } from './types';
import { pack, unpack } from './pack';
import { buildBranchSegments } from './branchSegments';
import { classifyBranchSpans } from './branchRepresentation';
import { buildFenceAttachmentMask, repairFenceAttachments } from './fenceAttachment';
import { createRng } from './rng';

/**
 * Convert a TreeModel (skeleton + leaf clusters) into a VoxelStore.
 *
 * 1. Rasterize each skeleton segment as a cylinder of voxels.
 * 2. Convert thin branch tips to fence voxels for Minecraft-like twig detail.
 * 3. Fill leaf cluster spheres with leaf blocks.
 * 4. Remove overly dense interior leaves and isolated floaters.
 */
export function voxelize(model: TreeModel, params: TreeParams): VoxelStore {
  const layers = new Map<number, Map<number, BlockType>>();
  const axis = new Map<number, Map<number, Axis>>();
  const bounds = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
    minZ: Infinity, maxZ: -Infinity,
  };
  let count = 0;

  function clearAxisEntry(y: number, key: number): void {
    const axisLayer = axis.get(y);
    if (!axisLayer) return;
    axisLayer.delete(key);
    if (axisLayer.size === 0) {
      axis.delete(y);
    }
  }

  function setAxisEntry(y: number, key: number, blockAxis: Axis): void {
    let axisLayer = axis.get(y);
    if (!axisLayer) {
      axisLayer = new Map();
      axis.set(y, axisLayer);
    }
    axisLayer.set(key, blockAxis);
  }

  function setBlock(x: number, y: number, z: number, type: BlockType, blockAxis?: Axis): void {
    const iy = Math.round(y);
    const ix = Math.round(x);
    const iz = Math.round(z);
    if (iy < 0) return;
    const key = pack(ix, iz);

    let layer = layers.get(iy);
    if (!layer) {
      layer = new Map();
      layers.set(iy, layer);
    }

    const existing = layer.get(key);

    // Priority: wood > fence > leaf.
    if ((existing === 'log' || existing === 'branch') && (type === 'leaf' || type === 'fence')) {
      return;
    }
    if (existing === 'fence' && type === 'leaf') {
      return;
    }

    if (!existing) {
      count++;
    }
    layer.set(key, type);

    if (type === 'log' || type === 'branch') {
      setAxisEntry(iy, key, blockAxis ?? 'y');
    } else {
      clearAxisEntry(iy, key);
    }

    if (ix < bounds.minX) bounds.minX = ix;
    if (ix > bounds.maxX) bounds.maxX = ix;
    if (iy < bounds.minY) bounds.minY = iy;
    if (iy > bounds.maxY) bounds.maxY = iy;
    if (iz < bounds.minZ) bounds.minZ = iz;
    if (iz > bounds.maxZ) bounds.maxZ = iz;
  }

  const spans = model.spans
    ?? classifyBranchSpans(model.segments ?? buildBranchSegments(model.nodes), params.minBranchThickness);

  for (const node of model.nodes) {
    if (node.parentIndex === null) {
      setBlock(node.position[0], node.position[1], node.position[2], 'log', 'y');
    }
  }

  for (const span of spans) {
    voxelizeBranchSpan(span, setBlock);
  }

  const rng = createRng(params.randomSeed + 1301);
  for (const cluster of model.leafClusters) {
    const [cx, cy, cz] = cluster.center;
    const r = cluster.radius;
    const ri = Math.ceil(r);

    for (let dy = -ri; dy <= ri; dy++) {
      for (let dx = -ri; dx <= ri; dx++) {
        for (let dz = -ri; dz <= ri; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > r) continue;

          const fillProb = cluster.density * (1 - dist / r * 0.5);
          if (rng() > fillProb) continue;

          setBlock(cx + dx, cy + dy, cz + dz, 'leaf');
        }
      }
    }
  }

  if (params.interiorLeafPruning > 0) {
    const toRemove: Array<{ y: number; key: number }> = [];

    for (const [y, layer] of layers) {
      for (const [key, type] of layer) {
        if (type !== 'leaf') continue;

        const [x, z] = unpack(key);
        const leafNeighbors = countLeafNeighbors(layers, x, y, z);
        const exposedFaces = countExposedFaces(layers, x, y, z);

        if (leafNeighbors < 14 || exposedFaces > 1) continue;

        const interiorStrength = (leafNeighbors - 13) / 13;
        const shelteredStrength = 1 - exposedFaces / 6;
        const pruneChance = params.interiorLeafPruning * 0.85 * interiorStrength * shelteredStrength;

        if (rng() < pruneChance) {
          toRemove.push({ y, key });
        }
      }
    }

    for (const { y, key } of toRemove) {
      const layer = layers.get(y);
      if (!layer || layer.get(key) !== 'leaf') continue;
      layer.delete(key);
      count--;
      if (layer.size === 0) {
        layers.delete(y);
      }
    }
  }

  if (params.leafCleanup > 0) {
    const toRemove: Array<{ y: number; key: number }> = [];
    const visited = new Set<string>();

    for (const [y, layer] of layers) {
      for (const [key, type] of layer) {
        if (type !== 'leaf') continue;

        const leafId = makeLeafId(y, key);
        if (visited.has(leafId)) continue;

        const component = collectLeafComponent(layers, y, key, visited);
        if (!component.touchesWood && rng() < params.leafCleanup) {
          toRemove.push(...component.voxels);
        }
      }
    }

    for (const { y, key } of toRemove) {
      const layer = layers.get(y);
      if (!layer || layer.get(key) !== 'leaf') continue;
      layer.delete(key);
      count--;
      if (layer.size === 0) {
        layers.delete(y);
      }
    }
  }

  repairFenceAttachments(layers, (x, y, z, type) => setBlock(x, y, z, type));
  const fenceConnectivity = buildFenceAttachmentMask(layers);

  if (count === 0) {
    bounds.minX = bounds.maxX = 0;
    bounds.minY = bounds.maxY = 0;
    bounds.minZ = bounds.maxZ = 0;
  }

  return { layers, axis, fenceConnectivity, bounds, count };
}

function countLeafNeighbors(
  layers: Map<number, Map<number, BlockType>>,
  x: number,
  y: number,
  z: number,
): number {
  let neighbors = 0;

  for (let dy = -1; dy <= 1; dy++) {
    const layer = layers.get(y + dy);
    if (!layer) continue;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        if (layer.get(pack(x + dx, z + dz)) === 'leaf') {
          neighbors++;
        }
      }
    }
  }

  return neighbors;
}

function countExposedFaces(
  layers: Map<number, Map<number, BlockType>>,
  x: number,
  y: number,
  z: number,
): number {
  let exposed = 0;

  if (!layers.get(y)?.has(pack(x + 1, z))) exposed++;
  if (!layers.get(y)?.has(pack(x - 1, z))) exposed++;
  if (!layers.get(y)?.has(pack(x, z + 1))) exposed++;
  if (!layers.get(y)?.has(pack(x, z - 1))) exposed++;
  if (!layers.get(y + 1)?.has(pack(x, z))) exposed++;
  if (!layers.get(y - 1)?.has(pack(x, z))) exposed++;

  return exposed;
}

function collectLeafComponent(
  layers: Map<number, Map<number, BlockType>>,
  startY: number,
  startKey: number,
  visited: Set<string>,
): {
  voxels: Array<{ y: number; key: number }>;
  touchesWood: boolean;
} {
  const voxels: Array<{ y: number; key: number }> = [];
  const queue: Array<{ y: number; key: number }> = [{ y: startY, key: startKey }];
  visited.add(makeLeafId(startY, startKey));
  let touchesWood = false;

  for (let i = 0; i < queue.length; i++) {
    const voxel = queue[i];
    voxels.push(voxel);
    const [x, z] = unpack(voxel.key);

    for (const neighbor of getOrthogonalNeighbors(x, voxel.y, z)) {
      const neighborType = layers.get(neighbor.y)?.get(neighbor.key);
      if (!neighborType) continue;

      if (neighborType === 'log' || neighborType === 'branch' || neighborType === 'fence') {
        touchesWood = true;
        continue;
      }

      if (neighborType !== 'leaf') continue;

      const neighborId = makeLeafId(neighbor.y, neighbor.key);
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      queue.push(neighbor);
    }
  }

  return { voxels, touchesWood };
}

function getOrthogonalNeighbors(
  x: number,
  y: number,
  z: number,
): Array<{ y: number; key: number }> {
  return [
    { y, key: pack(x + 1, z) },
    { y, key: pack(x - 1, z) },
    { y, key: pack(x, z + 1) },
    { y, key: pack(x, z - 1) },
    { y: y + 1, key: pack(x, z) },
    { y: y - 1, key: pack(x, z) },
  ];
}

function makeLeafId(y: number, key: number): string {
  return `${y}:${key}`;
}

function dominantAxis(dx: number, dy: number, dz: number): Axis {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const az = Math.abs(dz);
  if (ay >= ax && ay >= az) return 'y';
  if (ax >= az) return 'x';
  return 'z';
}

function rasterizeSegment(
  from: [number, number, number],
  to: [number, number, number],
  radiusFrom: number,
  radiusTo: number,
  blockType: BlockType,
  setBlock: (x: number, y: number, z: number, type: BlockType, blockAxis?: Axis) => void,
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const segmentAxis = dominantAxis(dx, dy, dz);
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) {
    setBlock(from[0], from[1], from[2], blockType, segmentAxis);
    return;
  }

  const maxRadius = Math.max(radiusFrom, radiusTo);
  const minX = Math.floor(Math.min(from[0], to[0]) - maxRadius);
  const maxX = Math.ceil(Math.max(from[0], to[0]) + maxRadius);
  const minY = Math.floor(Math.min(from[1], to[1]) - maxRadius);
  const maxY = Math.ceil(Math.max(from[1], to[1]) + maxRadius);
  const minZ = Math.floor(Math.min(from[2], to[2]) - maxRadius);
  const maxZ = Math.ceil(Math.max(from[2], to[2]) + maxRadius);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const t = closestPointTOnSegment(x, y, z, from, dx, dy, dz, len);
        const nearestX = from[0] + dx * t;
        const nearestY = from[1] + dy * t;
        const nearestZ = from[2] + dz * t;
        const radius = radiusFrom + (radiusTo - radiusFrom) * t;
        const distX = x - nearestX;
        const distY = y - nearestY;
        const distZ = z - nearestZ;

        if (distX * distX + distY * distY + distZ * distZ <= radius * radius) {
          setBlock(x, y, z, blockType, segmentAxis);
        }
      }
    }
  }
}

function closestPointTOnSegment(
  x: number,
  y: number,
  z: number,
  from: [number, number, number],
  dx: number,
  dy: number,
  dz: number,
  len: number,
): number {
  const px = x - from[0];
  const py = y - from[1];
  const pz = z - from[2];
  const dot = px * dx + py * dy + pz * dz;
  const t = dot / (len * len);
  return Math.max(0, Math.min(1, t));
}

function voxelizeBranchSpan(
  span: BranchSpan,
  setBlock: (x: number, y: number, z: number, type: BlockType, blockAxis?: Axis) => void,
): void {
  if (span.material === 'fence') {
    voxelizeFenceSegment(span.from, span.to, setBlock);
    return;
  }
  rasterizeSegment(
    span.from,
    span.to,
    span.radiusFrom,
    span.radiusTo,
    span.material,
    setBlock,
  );
}

function voxelizeFenceSegment(
  from: [number, number, number],
  to: [number, number, number],
  setBlock: (x: number, y: number, z: number, type: BlockType, blockAxis?: Axis) => void,
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) {
    setBlock(from[0], from[1], from[2], 'fence');
    return;
  }

  const steps = Math.max(1, Math.ceil(len));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    setBlock(
      from[0] + dx * t,
      from[1] + dy * t,
      from[2] + dz * t,
      'fence',
    );
  }
}
