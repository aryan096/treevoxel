import type { SkeletonNode, TreeParams, LeafCluster, CrownShape } from './types';
import { createRng } from './rng';

/**
 * Test if a point (x, y, z) is inside the crown envelope.
 */
export function isInsideCrown(
  x: number, y: number, z: number,
  shape: CrownShape,
  crownBottomY: number,
  crownTopY: number,
  crownRadius: number,
): boolean {
  if (y < crownBottomY || y > crownTopY) return false;

  const crownHeight = crownTopY - crownBottomY;
  if (crownHeight <= 0) return false;

  const t = (y - crownBottomY) / crownHeight;
  const lateralDist = Math.sqrt(x * x + z * z);

  let allowedRadius: number;

  switch (shape) {
    case 'conical':
      allowedRadius = crownRadius * (1 - t);
      break;
    case 'spherical': {
      const centered = t * 2 - 1;
      allowedRadius = crownRadius * Math.sqrt(Math.max(0, 1 - centered * centered));
      break;
    }
    case 'ovoid':
      allowedRadius = crownRadius * Math.sqrt(Math.max(0, 1 - (t * 1.3 - 0.5) * (t * 1.3 - 0.5)));
      break;
    case 'columnar':
      allowedRadius = crownRadius * 0.7 * (1 - 0.15 * Math.abs(t * 2 - 1));
      break;
    case 'vase':
      allowedRadius = crownRadius * (0.3 + 0.7 * t);
      break;
    case 'weeping':
      allowedRadius = crownRadius * (0.5 + 0.5 * Math.sin(t * Math.PI));
      break;
    case 'irregular':
    default:
      allowedRadius = crownRadius * Math.sqrt(Math.max(0, 1.1 - (t * 2 - 1) * (t * 2 - 1)));
      break;
  }

  return lateralDist <= allowedRadius;
}

/**
 * Generate leaf clusters at terminal branch nodes within the crown envelope.
 */
export function generateLeafClusters(
  skeleton: SkeletonNode[],
  params: TreeParams,
): LeafCluster[] {
  const rng = createRng(params.randomSeed + 7919);
  const clusters: LeafCluster[] = [];

  const crownTopY = params.height;
  const crownBottomY = params.height * (1 - params.crownDepth);
  const crownRadius = params.crownWidth / 2;

  const isParent = new Set<number>();
  for (const node of skeleton) {
    if (node.parentIndex !== null) {
      isParent.add(node.parentIndex);
    }
  }

  for (let i = 0; i < skeleton.length; i++) {
    const node = skeleton[i];

    const isTerminal = !isParent.has(i);
    const isTwig = node.role === 'twig';
    if (!isTerminal && !isTwig) continue;

    const [x, y, z] = node.position;

    if (!isInsideCrown(x, y, z, params.crownShape, crownBottomY, crownTopY, crownRadius)) {
      if (rng() > 0.2) continue;
    }

    if (rng() > params.leafDensity) continue;

    clusters.push({
      center: [x, y, z],
      radius: params.leafClusterRadius * (0.7 + rng() * 0.6),
      density: params.crownFullness,
    });
  }

  if (clusters.length === 0) {
    for (let i = 0; i < skeleton.length; i++) {
      const node = skeleton[i];
      if (node.position[1] >= crownBottomY && rng() < 0.5) {
        clusters.push({
          center: node.position,
          radius: params.leafClusterRadius,
          density: params.crownFullness,
        });
      }
    }
  }

  return clusters;
}
