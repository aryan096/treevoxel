import type { SkeletonNode, TreeParams } from './types';
import { createRng } from './rng';

type Vec3 = [number, number, number];

function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function sampleTrunkAxisNoise(
  t: number,
  amplitude: number,
  primaryFrequency: number,
  secondaryFrequency: number,
  primaryPhase: number,
  secondaryPhase: number,
): number {
  const envelope = Math.sin(t * Math.PI);
  const primary = Math.sin(t * primaryFrequency * Math.PI * 2 + primaryPhase);
  const secondary = Math.sin(t * secondaryFrequency * Math.PI * 2 + secondaryPhase) * 0.5;
  return envelope * amplitude * (primary + secondary);
}

/**
 * Generate a tree skeleton from parameters.
 *
 * Algorithm:
 * 1. Build trunk nodes from y=0 to y=height with optional curvature and lean.
 * 2. Place scaffold branches along trunk above clearTrunkHeight.
 * 3. Recursively add sub-branches up to branchOrderDepth.
 */
export function generateSkeleton(params: TreeParams): SkeletonNode[] {
  const rng = createRng(params.randomSeed);
  const nodes: SkeletonNode[] = [];

  // --- Trunk ---
  const trunkSteps = Math.max(3, Math.round(params.height));
  const leanDirectionRad = (params.trunkLeanDirection * Math.PI) / 180;
  const leanDir: Vec3 = [Math.cos(leanDirectionRad), 0, Math.sin(leanDirectionRad)];
  const curveAngle = rng() * Math.PI * 2;
  const secondaryCurveAngle = curveAngle + (rng() - 0.5) * 1.4;
  const noiseAmplitude = params.trunkNoise * Math.max(0.75, params.trunkBaseRadius * 0.6);
  const noiseFrequencyX = 0.8 + rng() * 1.6;
  const noiseFrequencyZ = 0.8 + rng() * 1.6;
  const noiseSecondaryFrequencyX = noiseFrequencyX * (1.6 + rng() * 0.5);
  const noiseSecondaryFrequencyZ = noiseFrequencyZ * (1.6 + rng() * 0.5);
  const noisePhaseX = rng() * Math.PI * 2;
  const noisePhaseZ = rng() * Math.PI * 2;
  const noiseSecondaryPhaseX = rng() * Math.PI * 2;
  const noiseSecondaryPhaseZ = rng() * Math.PI * 2;

  for (let i = 0; i <= trunkSteps; i++) {
    const t = i / trunkSteps;
    const y = t * params.height;

    // Curvature: a smooth global bend with a smaller secondary sweep.
    const curveOffset = params.trunkCurvature * Math.sin(t * Math.PI) * 2;
    const secondaryCurveOffset = params.trunkCurvature * 0.45 * Math.sin(t * Math.PI * 2 + Math.PI * 0.15);
    const cx = (curveOffset * Math.cos(curveAngle) + secondaryCurveOffset * Math.cos(secondaryCurveAngle)) * (i === 0 ? 0 : 1);
    const cz = (curveOffset * Math.sin(curveAngle) + secondaryCurveOffset * Math.sin(secondaryCurveAngle)) * (i === 0 ? 0 : 1);

    const nx = sampleTrunkAxisNoise(
      t,
      noiseAmplitude,
      noiseFrequencyX,
      noiseSecondaryFrequencyX,
      noisePhaseX,
      noiseSecondaryPhaseX,
    );
    const nz = sampleTrunkAxisNoise(
      t,
      noiseAmplitude,
      noiseFrequencyZ,
      noiseSecondaryFrequencyZ,
      noisePhaseZ,
      noiseSecondaryPhaseZ,
    );

    // Lean accumulates with height
    const lx = leanDir[0] * t * params.trunkLean * 0.1;
    const lz = leanDir[2] * t * params.trunkLean * 0.1;

    const position: Vec3 = [lx + cx + nx, y, lz + cz + nz];
    const radius = params.trunkBaseRadius * (1 - t * params.trunkTaper);

    const direction: Vec3 = i === 0
      ? [0, 1, 0]
      : vec3Normalize([
          position[0] - nodes[nodes.length - 1].position[0],
          position[1] - nodes[nodes.length - 1].position[1],
          position[2] - nodes[nodes.length - 1].position[2],
        ]);

    const length = i === 0
      ? 0
      : vec3Length([
          position[0] - nodes[nodes.length - 1].position[0],
          position[1] - nodes[nodes.length - 1].position[1],
          position[2] - nodes[nodes.length - 1].position[2],
        ]);

    nodes.push({
      position,
      parentIndex: i === 0 ? null : nodes.length - 1,
      order: 0,
      radius: Math.max(0.5, radius),
      role: 'trunk',
      length,
      direction,
    });
  }

  // --- Scaffold branches ---
  const clearY = params.height * params.clearTrunkHeight;
  const crownTopY = params.height;
  const crownBottomY = params.height * (1 - params.crownDepth);

  const eligibleTrunkIndices: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].role === 'trunk' && nodes[i].position[1] >= clearY) {
      eligibleTrunkIndices.push(i);
    }
  }

  const branchCount = params.primaryBranchCount;
  const scaffoldAttachmentIndices = selectScaffoldAttachmentIndices(eligibleTrunkIndices, branchCount);

  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const startAzimuth = rng() * Math.PI * 2;

  for (let b = 0; b < scaffoldAttachmentIndices.length; b++) {
    const trunkIdx = scaffoldAttachmentIndices[b];
    const trunkNode = nodes[trunkIdx];

    const baseAzimuth = startAzimuth + b * GOLDEN_ANGLE;
    const jitter = (rng() - 0.5) * Math.PI * 2 * (1 - params.symmetryAssist);
    const azimuth = baseAzimuth + jitter;
    const angle = (params.branchAngle + (rng() - 0.5) * 2 * params.branchAngleVariance) * Math.PI / 180;

    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const dir: Vec3 = vec3Normalize([
      sinA * Math.cos(azimuth),
      cosA,
      sinA * Math.sin(azimuth),
    ]);

    const heightFraction = (trunkNode.position[1] - crownBottomY) / Math.max(1, crownTopY - crownBottomY);
    const apicalFactor = getApicalFactor(heightFraction, params);
    const branchLength = params.crownWidth * 0.5 * params.branchLengthRatio * apicalFactor;

    addBranch(nodes, trunkIdx, dir, branchLength, 1, 'scaffold', params, rng);
  }

  addTerminalCrownBranches(nodes, eligibleTrunkIndices, params, rng);

  return nodes;
}

function addBranch(
  nodes: SkeletonNode[],
  parentIdx: number,
  direction: Vec3,
  length: number,
  order: number,
  role: SkeletonNode['role'],
  params: TreeParams,
  rng: () => number,
): void {
  if (length < 1) return;

  const parent = nodes[parentIdx];
  const segmentCount = Math.max(1, Math.round(length));
  const weepingFactor = params.crownShape === 'weeping' ? 1.85 : 1;
  const branchNodeIndices: number[] = [];
  const baseRadius = getBranchBaseRadius(parent.radius, order);
  const branchTaper = getBranchTaper(order);

  let currentIdx = parentIdx;
  let currentDir = direction;

  for (let s = 1; s <= segmentCount; s++) {
    const t = s / segmentCount;

    const droopAmount = params.branchDroop * weepingFactor * t * (0.3 + order * 0.06);
    const droopedDir: Vec3 = vec3Normalize([
      currentDir[0],
      currentDir[1] - droopAmount,
      currentDir[2],
    ]);

    const stepLength = length / segmentCount;
    const position = vec3Add(nodes[currentIdx].position, vec3Scale(droopedDir, stepLength));
    const radius = Math.max(
      0.18,
      baseRadius * (1 - t * branchTaper),
    );

    const nodeIdx = nodes.length;
    nodes.push({
      position,
      parentIndex: currentIdx,
      order,
      radius,
      role,
      length: stepLength,
      direction: droopedDir,
    });
    branchNodeIndices.push(nodeIdx);
    currentIdx = nodeIdx;
    currentDir = droopedDir;
  }

  // Recurse for sub-branches
  if (order < params.branchOrderDepth && branchNodeIndices.length > 0) {
    const lengthFactor = Math.max(1, length / 3);
    const orderFactor = Math.max(0.5, 1 - (order - 1) * 0.25);
    const subCount = Math.max(1, Math.round(lengthFactor * orderFactor * params.branchDensity * 2));
    for (let i = 0; i < subCount; i++) {
      const attachmentNodeIdx = sampleAttachmentNode(branchNodeIndices, rng);
      const attachmentNode = nodes[attachmentNodeIdx];
      const parentDirection = attachmentNode.direction;
      const azimuth = rng() * Math.PI * 2;
      const angle = (params.branchAngle * 0.8 + (rng() - 0.5) * params.branchAngleVariance) * Math.PI / 180;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      const descendantDroop = params.branchDroop * (params.crownShape === 'weeping' ? 0.32 : 0.1);
      const subDir: Vec3 = vec3Normalize([
        parentDirection[0] * cosA + sinA * Math.cos(azimuth),
        parentDirection[1] * cosA - descendantDroop,
        parentDirection[2] * cosA + sinA * Math.sin(azimuth),
      ]);
      const subLength = length * (0.4 + rng() * 0.18);
      const subRole = order + 1 >= params.branchOrderDepth ? 'twig' : 'secondary';
      addBranch(nodes, attachmentNodeIdx, subDir, subLength, order + 1, subRole, params, rng);
    }
  }
}

function sampleAttachmentNode(
  branchNodeIndices: number[],
  rng: () => number,
): number {
  if (branchNodeIndices.length === 1) {
    return branchNodeIndices[0];
  }

  const minT = branchNodeIndices.length > 2 ? 0.35 : 0.5;
  const maxT = 0.9;
  const attachmentT = minT + (maxT - minT) * rng();
  const scaledIndex = attachmentT * (branchNodeIndices.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(branchNodeIndices.length - 1, Math.ceil(scaledIndex));
  const blend = scaledIndex - lowerIndex;

  return blend < 0.5
    ? branchNodeIndices[lowerIndex]
    : branchNodeIndices[upperIndex];
}

function getBranchBaseRadius(
  parentRadius: number,
  order: number,
): number {
  if (order <= 1) {
    const scaled = parentRadius * 0.8;
    const visibleBase = Math.min(parentRadius * 0.97, 1.14);
    return Math.max(scaled, visibleBase);
  }

  if (order === 2) {
    return parentRadius * 0.6;
  }

  return parentRadius * Math.max(0.22, 0.42 - (order - 3) * 0.05);
}

function getBranchTaper(order: number): number {
  if (order <= 1) return 0.24;
  if (order === 2) return 0.42;
  return Math.min(0.72, 0.56 + (order - 3) * 0.06);
}

function selectScaffoldAttachmentIndices(
  eligibleTrunkIndices: number[],
  branchCount: number,
): number[] {
  if (eligibleTrunkIndices.length === 0 || branchCount <= 0) {
    return [];
  }

  if (branchCount === 1) {
    return [eligibleTrunkIndices[eligibleTrunkIndices.length - 1]];
  }

  const selected = new Set<number>();
  for (let b = 0; b < branchCount; b++) {
    const t = b / (branchCount - 1);
    const sampledIndex = Math.round(t * (eligibleTrunkIndices.length - 1));
    selected.add(eligibleTrunkIndices[sampledIndex]);
  }

  return Array.from(selected).sort((a, b) => a - b);
}

function getApicalFactor(
  heightFraction: number,
  params: TreeParams,
): number {
  const unclampedFraction = 1 - params.apicalDominance * heightFraction;
  const floor = 0.28 + params.branchDensity * 0.24;
  return Math.max(floor, unclampedFraction);
}

function addTerminalCrownBranches(
  nodes: SkeletonNode[],
  eligibleTrunkIndices: number[],
  params: TreeParams,
  rng: () => number,
): void {
  if (eligibleTrunkIndices.length === 0) return;

  const trunkIdx = eligibleTrunkIndices[eligibleTrunkIndices.length - 1];
  const whorlCount = params.crownShape === 'conical' || params.crownShape === 'columnar' ? 4 : 3;
  const startAzimuth = rng() * Math.PI * 2;
  const terminalAngle = Math.max(18, params.branchAngle * 0.68);
  const terminalLength = Math.max(
    1.2,
    params.crownWidth * (params.crownShape === 'conical' ? 0.22 : 0.18) * params.branchLengthRatio,
  );

  for (let i = 0; i < whorlCount; i++) {
    const azimuth = startAzimuth + (i / whorlCount) * Math.PI * 2;
    const angleVariance = (rng() - 0.5) * params.branchAngleVariance * 0.45;
    const angle = (terminalAngle + angleVariance) * Math.PI / 180;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const dir: Vec3 = vec3Normalize([
      sinA * Math.cos(azimuth),
      cosA,
      sinA * Math.sin(azimuth),
    ]);

    addBranch(nodes, trunkIdx, dir, terminalLength, 1, 'scaffold', params, rng);
  }
}
