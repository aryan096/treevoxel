import type { VoxelStore, RenderBuffer, BlockType } from './types';
import { unpack } from './pack';

const BLOCK_TYPE_INDEX: Record<BlockType, number> = {
  log: 0,
  branch: 1,
  leaf: 2,
};

/**
 * Convert a VoxelStore into a flat RenderBuffer for InstancedMesh rendering.
 */
export function buildRenderBuffer(store: VoxelStore): RenderBuffer {
  const { count } = store;
  const matrices = new Float32Array(count * 16);
  const types = new Uint8Array(count);

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
      idx++;
    }
  }

  return { matrices, types, count };
}
