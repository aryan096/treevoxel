import type { BranchSegment, SkeletonNode, TreeParams, LeafCluster, CrownShape } from './types';
import { createRng } from './rng';

type LeafAnchor = {
  position: [number, number, number];
  importance: number;
};

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
  segments: BranchSegment[] = [],
): LeafCluster[] {
  const rng = createRng(params.randomSeed + 7919);
  const clusters: LeafCluster[] = [];

  const crownTopY = params.height;
  const crownBottomY = params.height * (1 - params.crownDepth);
  const crownRadius = params.crownWidth / 2;

  const anchors = segments.length > 0
    ? collectLeafAnchorsFromSegments(segments)
    : collectLeafAnchorsFromNodes(skeleton);

  for (const anchor of anchors) {
    const [x, y, z] = anchor.position;
    const insideCrown = isInsideCrown(x, y, z, params.crownShape, crownBottomY, crownTopY, crownRadius);

    if (!insideCrown) {
      const outsideAllowance = Math.min(0.42, 0.08 + anchor.importance * 0.28);
      if (rng() > outsideAllowance) continue;
    }

    const spawnChance = Math.min(1, params.leafDensity * (0.72 + anchor.importance * 0.4));
    if (rng() > spawnChance) continue;

    const clusterRadius = params.leafClusterRadius * (0.72 + rng() * 0.55) * (0.84 + anchor.importance * 0.22);
    const weepingSag =
      params.crownShape === 'weeping'
        ? clusterRadius * (0.5 + rng() * 0.55) * (0.7 + params.branchDroop * 0.9)
        : 0;
    const centerY = Math.min(y - weepingSag, crownTopY + 2);

    clusters.push({
      center: [x, centerY, z],
      radius: clusterRadius,
      density: Math.min(1, params.crownFullness * (0.92 + anchor.importance * 0.14)),
    });
  }

  addCrownFillerClusters(clusters, params, rng);

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

function addCrownFillerClusters(
  clusters: LeafCluster[],
  params: TreeParams,
  rng: () => number,
): void {
  if (params.crownFullness < 0.4) return;

  const crownTopY = params.height;
  const crownBottomY = params.height * (1 - params.crownDepth);
  const crownRadius = params.crownWidth / 2;
  const crownHeight = crownTopY - crownBottomY;
  if (crownHeight <= 0 || crownRadius <= 0) return;

  const crownVolume = crownRadius * crownRadius * crownHeight;
  const fillerAttempts = Math.round(crownVolume * 0.02 * params.crownFullness);
  if (fillerAttempts <= 0) return;

  const fillerRadius = params.leafClusterRadius * 0.7;
  const minDistSq = (params.leafClusterRadius * 1.2) ** 2;

  for (let i = 0; i < fillerAttempts; i++) {
    const verticalBias = params.crownShape === 'weeping'
      ? Math.pow(rng(), 2.2) * 0.72
      : rng();
    const y = crownBottomY + verticalBias * crownHeight;
    const angle = rng() * Math.PI * 2;
    const radialOffset = Math.sqrt(rng()) * crownRadius;
    const x = Math.cos(angle) * radialOffset;
    const z = Math.sin(angle) * radialOffset;

    if (!isInsideCrown(x, y, z, params.crownShape, crownBottomY, crownTopY, crownRadius)) {
      continue;
    }

    let tooClose = false;
    for (const cluster of clusters) {
      const dx = cluster.center[0] - x;
      const dy = cluster.center[1] - y;
      const dz = cluster.center[2] - z;
      if (dx * dx + dy * dy + dz * dz < minDistSq) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    const edgeDist = radialOffset / crownRadius;
    const placementChance = params.crownFullness * (1 - edgeDist * 0.4);
    if (rng() > placementChance) continue;
    const fillerSag =
      params.crownShape === 'weeping'
        ? fillerRadius * (0.95 + rng() * 0.55) * (0.85 + params.branchDroop * 0.9)
        : 0;
    const centerY = Math.min(y - fillerSag, crownTopY + 2);

    clusters.push({
      center: [x, centerY, z],
      radius: fillerRadius * (0.8 + rng() * 0.4),
      density: params.crownFullness * 0.75,
    });
  }
}

function collectLeafAnchorsFromSegments(
  segments: BranchSegment[],
): LeafAnchor[] {
  const childCount = new Map<number, number>();
  for (const segment of segments) {
    if (segment.parentSegmentId !== null) {
      childCount.set(segment.parentSegmentId, (childCount.get(segment.parentSegmentId) ?? 0) + 1);
    }
  }

  const anchors: LeafAnchor[] = [];

  for (const segment of segments) {
    if (segment.role === 'trunk') continue;

    const childSegments = childCount.get(segment.id) ?? 0;
    const terminal = childSegments === 0;
    const roleImportance = getRoleImportance(segment.role, terminal);

    if (segment.role === 'twig' || terminal || segment.role === 'secondary') {
      anchors.push({
        position: segment.to,
        importance: roleImportance,
      });
    }

    if (segment.role !== 'scaffold') {
      anchors.push({
        position: interpolatePosition(segment.from, segment.to, terminal ? 0.68 : 0.78),
        importance: Math.max(0.48, roleImportance - 0.14),
      });
    }
  }

  return anchors;
}

function collectLeafAnchorsFromNodes(
  skeleton: SkeletonNode[],
): LeafAnchor[] {
  const childCount = new Map<number, number>();
  for (const node of skeleton) {
    if (node.parentIndex !== null) {
      childCount.set(node.parentIndex, (childCount.get(node.parentIndex) ?? 0) + 1);
    }
  }

  return skeleton
    .filter((node, index) => {
      const children = childCount.get(index) ?? 0;
      return node.role === 'twig' || node.role === 'secondary' || (node.role !== 'trunk' && children === 0);
    })
    .map((node, index) => ({
      position: node.position,
      importance: getRoleImportance(node.role, (childCount.get(index) ?? 0) === 0),
    }));
}

function interpolatePosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

function getRoleImportance(
  role: BranchSegment['role'] | SkeletonNode['role'],
  terminal: boolean,
): number {
  switch (role) {
    case 'twig':
      return terminal ? 1 : 0.88;
    case 'secondary':
      return terminal ? 0.86 : 0.72;
    case 'scaffold':
      return terminal ? 0.7 : 0.54;
    default:
      return terminal ? 0.64 : 0.5;
  }
}

function hash01(a: number, b: number, c: number): number {
  const seed = a * 374761393 + b * 668265263 + c * 2147483647;
  const hashed = Math.imul(seed ^ (seed >>> 13), 1274126177);
  return ((hashed ^ (hashed >>> 16)) >>> 0) / 4294967295;
}
