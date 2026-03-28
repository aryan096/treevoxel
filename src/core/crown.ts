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
  const angle = Math.atan2(z, x);

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
    case 'weeping': {
      const upperCanopy = 0.35 + 0.8 * Math.sin(Math.min(1, t * 1.05) * Math.PI * 0.92);
      const hangingCurtain = Math.max(0, 1 - Math.abs(t - 0.38) / 0.38) * 0.22;
      allowedRadius = crownRadius * Math.max(0.22, upperCanopy + hangingCurtain);
      break;
    }
    case 'irregular': {
      const baseRadius = crownRadius * Math.sqrt(Math.max(0, 1.05 - (t * 2 - 1) * (t * 2 - 1)));
      const primaryLobes = Math.sin(angle * 2.3 + t * Math.PI * 1.4) * 0.18;
      const secondaryLobes = Math.sin(angle * 4.9 - t * Math.PI * 2.2) * 0.1;
      const angularNoise = hash01(
        Math.round((angle + Math.PI) * 1000),
        Math.round(t * 1000),
        Math.round(crownRadius * 100),
      );
      const randomLobe = (angularNoise - 0.5) * 0.16;
      const asymmetryX = x >= 0 ? 0.08 : -0.05;
      const asymmetryZ = z >= 0 ? -0.03 : 0.06;
      const distortion = 1 + primaryLobes + secondaryLobes + randomLobe + asymmetryX + asymmetryZ;
      allowedRadius = baseRadius * Math.max(0.45, distortion);
      break;
    }
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

    const clusterRadius = params.leafClusterRadius * (0.7 + rng() * 0.6);
    const weepingSag =
      params.crownShape === 'weeping'
        ? clusterRadius * (0.35 + rng() * 0.45) * (0.55 + params.branchDroop * 0.9)
        : 0;

    clusters.push({
      center: [x, y - weepingSag, z],
      radius: clusterRadius,
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

function hash01(a: number, b: number, c: number): number {
  const seed = a * 374761393 + b * 668265263 + c * 2147483647;
  const hashed = Math.imul(seed ^ (seed >>> 13), 1274126177);
  return ((hashed ^ (hashed >>> 16)) >>> 0) / 4294967295;
}
