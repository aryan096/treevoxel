import type { TreeParams, TreeModel, VoxelStore, RenderBuffer, BlockColors } from './types';
import { generateSkeleton } from './skeleton';
import { buildBranchSegments } from './branchSegments';
import { classifyBranchSpans } from './branchRepresentation';
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
export function generateTree(params: TreeParams, blockColors?: BlockColors): GenerationResult {
  const nodes = generateSkeleton(params);
  const segments = buildBranchSegments(nodes);
  const spans = classifyBranchSpans(segments, params.minBranchThickness);
  const leafClusters = generateLeafClusters(nodes, params, segments);
  const model: TreeModel = { nodes, segments, spans, leafClusters };
  const voxels = voxelize(model, params);
  const buffer = buildRenderBuffer(voxels, blockColors, params.colorRandomness);
  return { model, voxels, buffer };
}
