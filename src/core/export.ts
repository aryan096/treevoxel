import type { VoxelStore, TreeParams } from './types';
import { unpack } from './pack';

type ExportBlock = { x: number; y: number; z: number; type: string };

type ExportJSON = {
  blocks: ExportBlock[];
  meta: {
    totalBlocks: number;
    height: number;
    width: number;
    depth: number;
    layerCount: number;
  };
};

/**
 * Export voxel data as a JSON string with block coordinates and metadata.
 */
export function exportJSON(store: VoxelStore, params: TreeParams): string {
  const blocks: ExportBlock[] = [];

  const sortedYs = Array.from(store.layers.keys()).sort((a, b) => a - b);
  for (const y of sortedYs) {
    const layer = store.layers.get(y)!;
    for (const [key, type] of layer) {
      const [x, z] = unpack(key);
      blocks.push({ x, y, z, type });
    }
  }

  const data: ExportJSON = {
    blocks,
    meta: {
      totalBlocks: store.count,
      height: store.bounds.maxY - store.bounds.minY + 1,
      width: store.bounds.maxX - store.bounds.minX + 1,
      depth: store.bounds.maxZ - store.bounds.minZ + 1,
      layerCount: store.layers.size,
    },
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Export a human-readable per-layer build guide.
 */
export function exportTextGuide(store: VoxelStore): string {
  const lines: string[] = [];
  lines.push('=== TreeVoxel Build Guide ===');
  lines.push(`Total blocks: ${store.count}`);
  lines.push(`Layers: ${store.layers.size}`);
  lines.push('');

  const sortedYs = Array.from(store.layers.keys()).sort((a, b) => a - b);
  for (const y of sortedYs) {
    const layer = store.layers.get(y)!;
    lines.push(`--- Layer Y=${y} (${layer.size} blocks) ---`);

    const byType: Record<string, string[]> = {};
    for (const [key, type] of layer) {
      const [x, z] = unpack(key);
      if (!byType[type]) byType[type] = [];
      byType[type].push(`(${x}, ${z})`);
    }

    for (const [type, coords] of Object.entries(byType)) {
      lines.push(`  ${type}: ${coords.join(' ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
