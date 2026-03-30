import { describe, expect, it } from 'vitest';
import { buildBranchSegments } from '../../src/core/branchSegments';
import { classifyBranchSpans } from '../../src/core/branchRepresentation';
import type { SkeletonNode } from '../../src/core/types';

describe('buildBranchSegments', () => {
  it('builds parent-linked segments from skeleton nodes', () => {
    const nodes: SkeletonNode[] = [
      {
        position: [0, 0, 0],
        parentIndex: null,
        order: 0,
        radius: 3,
        role: 'trunk',
        length: 0,
        direction: [0, 1, 0],
      },
      {
        position: [0, 1, 0],
        parentIndex: 0,
        order: 0,
        radius: 2.5,
        role: 'trunk',
        length: 1,
        direction: [0, 1, 0],
      },
      {
        position: [1, 2, 0],
        parentIndex: 1,
        order: 1,
        radius: 1.2,
        role: 'scaffold',
        length: 1.4,
        direction: [1, 1, 0],
      },
      {
        position: [2, 3, 0],
        parentIndex: 2,
        order: 2,
        radius: 0.6,
        role: 'twig',
        length: 1.4,
        direction: [1, 1, 0],
      },
    ];

    const segments = buildBranchSegments(nodes);

    expect(segments).toHaveLength(3);
    expect(segments[0].role).toBe('trunk');
    expect(segments[1].parentSegmentId).toBe(0);
    expect(segments[2].parentSegmentId).toBe(1);
    expect(segments[2].from).toEqual([1, 2, 0]);
    expect(segments[2].to).toEqual([2, 3, 0]);
  });
});

describe('classifyBranchSpans', () => {
  it('keeps trunk spans as logs and splits tapering branches at the threshold', () => {
    const spans = classifyBranchSpans([
      {
        id: 0,
        parentSegmentId: null,
        fromNodeIndex: 0,
        toNodeIndex: 1,
        from: [0, 0, 0],
        to: [0, 1, 0],
        order: 0,
        role: 'trunk',
        radiusFrom: 3,
        radiusTo: 2.4,
        length: 1,
        direction: [0, 1, 0],
      },
      {
        id: 1,
        parentSegmentId: 0,
        fromNodeIndex: 1,
        toNodeIndex: 2,
        from: [0, 1, 0],
        to: [4, 1, 0],
        order: 1,
        role: 'twig',
        radiusFrom: 2.2,
        radiusTo: 0.8,
        length: 4,
        direction: [1, 0, 0],
      },
    ], 2);

    expect(spans[0].material).toBe('log');
    expect(spans[1].material).toBe('branch');
    expect(spans[2].material).toBe('fence');
    expect(spans[2].from[0]).toBeGreaterThan(0);
    expect(spans[2].to).toEqual([4, 1, 0]);
  });
});
