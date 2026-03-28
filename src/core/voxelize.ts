import type { TreeModel, TreeParams, VoxelStore, BlockType } from './types';
import { pack, GRID_SIZE } from './pack';
import { createRng } from './rng';

/**
 * Convert a TreeModel (skeleton + leaf clusters) into a VoxelStore.
 *
 * 1. Rasterize each skeleton segment as a cylinder of voxels.
 * 2. Fill leaf cluster spheres with leaf blocks.
 * 3. Clean up floating leaves and thin branch artifacts.
 */
export function voxelize(model: TreeModel, params: TreeParams): VoxelStore {
  const layers = new Map<number, Map<number, BlockType>>();
  const bounds = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
    minZ: Infinity, maxZ: -Infinity,
  };
  let count = 0;

  function setBlock(x: number, y: number, z: number, type: BlockType): void {
    const iy = Math.round(y);
    const ix = Math.round(x);
    const iz = Math.round(z);
    const key = pack(ix, iz);

    let layer = layers.get(iy);
    if (!layer) {
      layer = new Map();
      layers.set(iy, layer);
    }

    // Wood types (log, branch) take priority over leaf
    const existing = layer.get(key);
    if (existing && (existing === 'log' || existing === 'branch') && type === 'leaf') {
      return;
    }

    if (!existing) count++;
    layer.set(key, type);

    // Update bounds
    if (ix < bounds.minX) bounds.minX = ix;
    if (ix > bounds.maxX) bounds.maxX = ix;
    if (iy < bounds.minY) bounds.minY = iy;
    if (iy > bounds.maxY) bounds.maxY = iy;
    if (iz < bounds.minZ) bounds.minZ = iz;
    if (iz > bounds.maxZ) bounds.maxZ = iz;
  }

  // --- Rasterize skeleton segments ---
  const { nodes } = model;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.parentIndex === null) {
      setBlock(node.position[0], node.position[1], node.position[2], 'log');
      continue;
    }

    const parent = nodes[node.parentIndex];
    const blockType: BlockType = node.role === 'trunk' ? 'log' : 'branch';

    rasterizeSegment(
      parent.position, node.position,
      parent.radius, node.radius,
      blockType, setBlock,
    );
  }

  // --- Fill leaf clusters ---
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

  // --- Cleanup: remove isolated leaf blocks ---
  if (params.leafCleanup > 0) {
    const toRemove: Array<{ y: number; key: number }> = [];

    for (const [y, layer] of layers) {
      for (const [key, type] of layer) {
        if (type !== 'leaf') continue;

        let neighbors = 0;
        if (layer.has(key + 1)) neighbors++;
        if (layer.has(key - 1)) neighbors++;
        if (layer.has(key + GRID_SIZE)) neighbors++;
        if (layer.has(key - GRID_SIZE)) neighbors++;
        const above = layers.get(y + 1);
        if (above?.has(key)) neighbors++;
        const below = layers.get(y - 1);
        if (below?.has(key)) neighbors++;

        if (neighbors < 1 && rng() < params.leafCleanup) {
          toRemove.push({ y, key });
        }
      }
    }

    for (const { y, key } of toRemove) {
      const layer = layers.get(y);
      if (layer) {
        layer.delete(key);
        count--;
        if (layer.size === 0) layers.delete(y);
      }
    }
  }

  if (count === 0) {
    bounds.minX = bounds.maxX = 0;
    bounds.minY = bounds.maxY = 0;
    bounds.minZ = bounds.maxZ = 0;
  }

  return { layers, bounds, count };
}

function rasterizeSegment(
  from: [number, number, number],
  to: [number, number, number],
  radiusFrom: number,
  radiusTo: number,
  blockType: BlockType,
  setBlock: (x: number, y: number, z: number, type: BlockType) => void,
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len === 0) {
    setBlock(from[0], from[1], from[2], blockType);
    return;
  }

  const steps = Math.max(1, Math.ceil(len * 2));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = from[0] + dx * t;
    const y = from[1] + dy * t;
    const z = from[2] + dz * t;
    const r = radiusFrom + (radiusTo - radiusFrom) * t;
    const ri = Math.ceil(r);

    for (let ox = -ri; ox <= ri; ox++) {
      for (let oz = -ri; oz <= ri; oz++) {
        if (ox * ox + oz * oz <= r * r) {
          setBlock(x + ox, y, z + oz, blockType);
        }
      }
    }
  }
}
