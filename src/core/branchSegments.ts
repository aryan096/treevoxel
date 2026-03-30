import type { BranchSegment, SkeletonNode } from './types';

export function buildBranchSegments(nodes: SkeletonNode[]): BranchSegment[] {
  const segments: BranchSegment[] = [];
  const segmentIdByNode = new Map<number, number>();

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
    const node = nodes[nodeIndex];
    if (node.parentIndex === null) {
      continue;
    }

    const parent = nodes[node.parentIndex];
    const dx = node.position[0] - parent.position[0];
    const dy = node.position[1] - parent.position[1];
    const dz = node.position[2] - parent.position[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const segmentId = segments.length;

    segments.push({
      id: segmentId,
      parentSegmentId: segmentIdByNode.get(node.parentIndex) ?? null,
      fromNodeIndex: node.parentIndex,
      toNodeIndex: nodeIndex,
      from: parent.position,
      to: node.position,
      order: node.order,
      role: node.role,
      radiusFrom: parent.radius,
      radiusTo: node.radius,
      length,
      direction: node.direction,
    });

    segmentIdByNode.set(nodeIndex, segmentId);
  }

  return segments;
}
