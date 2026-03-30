import type { BranchSegment, BranchSpan } from './types';

export function classifyBranchSpans(
  segments: BranchSegment[],
  minBranchThickness: number,
): BranchSpan[] {
  const spans: BranchSpan[] = [];

  for (const segment of segments) {
    if (segment.role === 'trunk') {
      spans.push({
        id: `${segment.id}:log`,
        segmentId: segment.id,
        parentSegmentId: segment.parentSegmentId,
        material: 'log',
        from: segment.from,
        to: segment.to,
        radiusFrom: segment.radiusFrom,
        radiusTo: segment.radiusTo,
      });
      continue;
    }

    for (const span of classifyBranchSegment(segment, minBranchThickness)) {
      spans.push(span);
    }
  }

  return spans;
}

function classifyBranchSegment(
  segment: BranchSegment,
  minBranchThickness: number,
): BranchSpan[] {
  const branchThreshold =
    segment.role === 'scaffold'
      ? minBranchThickness * 0.82
      : minBranchThickness;

  if (segment.length <= 2 && segment.radiusTo < branchThreshold) {
    return [makeSpan(segment, 'fence', segment.from, segment.to, segment.radiusFrom, segment.radiusTo)];
  }

  if (segment.radiusFrom < branchThreshold && segment.radiusTo < branchThreshold) {
    return [makeSpan(segment, 'fence', segment.from, segment.to, segment.radiusFrom, segment.radiusTo)];
  }

  if (segment.radiusFrom >= branchThreshold && segment.radiusTo >= branchThreshold) {
    return [makeSpan(segment, 'branch', segment.from, segment.to, segment.radiusFrom, segment.radiusTo)];
  }

  const thicknessRange = segment.radiusTo - segment.radiusFrom;
  if (thicknessRange === 0) {
    return [makeSpan(segment, 'branch', segment.from, segment.to, segment.radiusFrom, segment.radiusTo)];
  }

  const splitT = Math.min(1, Math.max(0, (branchThreshold - segment.radiusFrom) / thicknessRange));
  const splitPoint: [number, number, number] = [
    segment.from[0] + (segment.to[0] - segment.from[0]) * splitT,
    segment.from[1] + (segment.to[1] - segment.from[1]) * splitT,
    segment.from[2] + (segment.to[2] - segment.from[2]) * splitT,
  ];

  if (segment.radiusFrom >= branchThreshold) {
    const spans: BranchSpan[] = [
      makeSpan(segment, 'branch', segment.from, splitPoint, segment.radiusFrom, branchThreshold),
    ];
    if (splitT < 1) {
      spans.push(makeSpan(segment, 'fence', splitPoint, segment.to, branchThreshold, segment.radiusTo));
    }
    return spans;
  }

  const spans: BranchSpan[] = [
    makeSpan(segment, 'fence', segment.from, splitPoint, segment.radiusFrom, branchThreshold),
  ];
  if (splitT < 1) {
    spans.push(makeSpan(segment, 'branch', splitPoint, segment.to, branchThreshold, segment.radiusTo));
  }
  return spans;
}

function makeSpan(
  segment: BranchSegment,
  material: BranchSpan['material'],
  from: [number, number, number],
  to: [number, number, number],
  radiusFrom: number,
  radiusTo: number,
): BranchSpan {
  return {
    id: `${segment.id}:${material}:${from.join(',')}:${to.join(',')}`,
    segmentId: segment.id,
    parentSegmentId: segment.parentSegmentId,
    material,
    from,
    to,
    radiusFrom,
    radiusTo,
  };
}
