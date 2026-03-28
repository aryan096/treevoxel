import type { TreeParams, TreeModel, VoxelStore, RenderBuffer } from './types';
import { generateSkeleton } from './skeleton';
import { generateLeafClusters } from './crown';
import { voxelize } from './voxelize';
import { buildRenderBuffer } from './renderBuffer';

export type GenerationResult = {
  model: TreeModel;
  voxels: VoxelStore;
  buffer: RenderBuffer;
};

/**
 * Full generation pipeline: params -> skeleton -> leaf clusters -> voxels -> render buffer.
 */
export function generateTree(params: TreeParams): GenerationResult {
  const nodes = generateSkeleton(params);
  const leafClusters = generateLeafClusters(nodes, params);
  const model: TreeModel = { nodes, leafClusters };
  const voxels = voxelize(model, params);
  const buffer = buildRenderBuffer(voxels);
  return { model, voxels, buffer };
}
