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
  const leanRad = (params.trunkLean * Math.PI) / 180;
  const leanDir: Vec3 = [Math.sin(leanRad), 0, 0];
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

  const branchCount = Math.round(params.primaryBranchCount * params.branchDensity);
  const spacing = Math.max(1, Math.floor(eligibleTrunkIndices.length / Math.max(1, branchCount)));

  for (let b = 0; b < branchCount && b * spacing < eligibleTrunkIndices.length; b++) {
    const trunkIdx = eligibleTrunkIndices[Math.min(b * spacing, eligibleTrunkIndices.length - 1)];
    const trunkNode = nodes[trunkIdx];

    const azimuth = rng() * Math.PI * 2;
    const angle = (params.branchAngle + (rng() - 0.5) * 2 * params.branchAngleVariance) * Math.PI / 180;

    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const dir: Vec3 = vec3Normalize([
      sinA * Math.cos(azimuth),
      cosA,
      sinA * Math.sin(azimuth),
    ]);

    const heightFraction = (trunkNode.position[1] - crownBottomY) / Math.max(1, crownTopY - crownBottomY);
    const apicalFactor = 1 - params.apicalDominance * heightFraction;
    const branchLength = params.crownWidth * 0.5 * params.branchLengthRatio * apicalFactor;

    addBranch(nodes, trunkIdx, dir, branchLength, 1, 'scaffold', params, rng);
  }

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

  let currentIdx = parentIdx;
  let currentDir = direction;

  for (let s = 1; s <= segmentCount; s++) {
    const t = s / segmentCount;

    const droopAmount = params.branchDroop * t * 0.3;
    const droopedDir: Vec3 = vec3Normalize([
      currentDir[0],
      currentDir[1] - droopAmount,
      currentDir[2],
    ]);

    const stepLength = length / segmentCount;
    const position = vec3Add(nodes[currentIdx].position, vec3Scale(droopedDir, stepLength));
    const radius = Math.max(
      params.minBranchThickness * 0.5,
      parent.radius * (1 - t * 0.7) * (order === 1 ? 0.5 : 0.3)
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
    currentIdx = nodeIdx;
    currentDir = droopedDir;
  }

  // Recurse for sub-branches
  if (order < params.branchOrderDepth) {
    const subCount = Math.round(2 * params.branchDensity);
    const tipIdx = nodes.length - 1;
    for (let i = 0; i < subCount; i++) {
      const azimuth = rng() * Math.PI * 2;
      const angle = (params.branchAngle * 0.8 + (rng() - 0.5) * params.branchAngleVariance) * Math.PI / 180;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      const subDir: Vec3 = vec3Normalize([
        currentDir[0] * cosA + sinA * Math.cos(azimuth),
        currentDir[1] * cosA - params.branchDroop * 0.1,
        currentDir[2] * cosA + sinA * Math.sin(azimuth),
      ]);
      const subLength = length * 0.5;
      const subRole = order + 1 >= params.branchOrderDepth ? 'twig' : 'secondary';
      addBranch(nodes, tipIdx, subDir, subLength, order + 1, subRole, params, rng);
    }
  }
}
