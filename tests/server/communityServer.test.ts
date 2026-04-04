import { describe, expect, it } from 'vitest';
import { handleRequest, normalizeSnapshot, serializeSubmission } from '../../server/community-server.mjs';

async function request(pathname: string, options: { method?: string; headers?: Record<string, string> } = {}, body = '') {
  let status = 0;
  let headers: Record<string, string | string[] | undefined> = {};
  let responseBody = '';

  const request = {
    url: pathname,
    method: options.method ?? 'GET',
    headers: {
      host: 'localhost',
      ...options.headers,
    },
    async *[Symbol.asyncIterator]() {
      if (body) {
        yield Buffer.from(body, 'utf8');
      }
    },
  };

  const response = {
    writeHead(nextStatus: number, nextHeaders: Record<string, string>) {
      status = nextStatus;
      headers = Object.fromEntries(
        Object.entries(nextHeaders).map(([key, value]) => [key.toLowerCase(), value]),
      );
      return this;
    },
    end(chunk?: Buffer | string) {
      if (typeof chunk === 'string') {
        responseBody = chunk;
      } else if (chunk) {
        responseBody = chunk.toString('utf8');
      }
      return this;
    },
  };

  await handleRequest(request, response);

  return {
    status,
    headers,
    body: responseBody,
  };
}

describe('community server snapshot contract', () => {
  it('accepts the current v2 community snapshot shape', () => {
    expect(normalizeSnapshot({
      presetId: 'oak',
      params: {
        randomSeed: 58,
        colorRandomness: 0.2,
        height: 18,
        crownWidth: 17,
        crownDepth: 0.62,
        trunkBaseRadius: 2,
        trunkTaper: 0.46,
        trunkLean: 0,
        trunkLeanDirection: 0,
        clearTrunkHeight: 0.26,
        trunkCurvature: 0.11,
        trunkNoise: 0.22,
        primaryBranchCount: 5,
        branchAngle: 52,
        branchAngleVariance: 12,
        branchLengthRatio: 0.82,
        branchOrderDepth: 3,
        branchDensity: 0.56,
        branchDroop: 0.1,
        apicalDominance: 0.18,
        crownShape: 'ovoid',
        crownFullness: 0.82,
        leafClusterRadius: 2.6,
        leafDensity: 0.84,
        interiorLeafPruning: 0.3,
        minBranchThickness: 1,
        leafCleanup: 0.58,
        symmetryAssist: 0.14,
        buildabilityBias: 0.58,
      },
      blockColors: {
        log: '#70492f',
        branch: '#7f5d37',
        leaf: '#5e8744',
        fence: '#7f5d37',
      },
      minecraftPalette: {
        log: 'oak_log',
        branch: 'stripped_oak_log',
        fence: 'oak_fence',
        leaf: 'oak_leaves',
      },
    })).toEqual({
      presetId: 'oak',
      params: {
        randomSeed: 58,
        colorRandomness: 0.2,
        height: 18,
        crownWidth: 17,
        crownDepth: 0.62,
        trunkBaseRadius: 2,
        trunkTaper: 0.46,
        trunkLean: 0,
        trunkLeanDirection: 0,
        clearTrunkHeight: 0.26,
        trunkCurvature: 0.11,
        trunkNoise: 0.22,
        primaryBranchCount: 5,
        branchAngle: 52,
        branchAngleVariance: 12,
        branchLengthRatio: 0.82,
        branchOrderDepth: 3,
        branchDensity: 0.56,
        branchDroop: 0.1,
        apicalDominance: 0.18,
        crownShape: 'ovoid',
        crownFullness: 0.82,
        leafClusterRadius: 2.6,
        leafDensity: 0.84,
        interiorLeafPruning: 0.3,
        minBranchThickness: 1,
        leafCleanup: 0.58,
        symmetryAssist: 0.14,
        buildabilityBias: 0.58,
      },
      blockColors: {
        log: '#70492f',
        branch: '#7f5d37',
        leaf: '#5e8744',
        fence: '#7f5d37',
      },
      minecraftPalette: {
        log: 'oak_log',
        branch: 'stripped_oak_log',
        fence: 'oak_fence',
        leaf: 'oak_leaves',
      },
    });
  });

  it('serializes submissions with the full snapshot payload', () => {
    const submission = serializeSubmission({
      id: 'submission-1',
      creationName: 'Canopy Oak',
      authorName: 'Ari',
      status: 'approved',
      createdAt: '2026-03-30T00:00:00.000Z',
      reviewedAt: '2026-03-30T01:00:00.000Z',
      snapshot: {
        presetId: 'spruce',
        params: {
          randomSeed: 131,
          colorRandomness: 0.12,
          height: 19,
          crownWidth: 7,
          crownDepth: 0.84,
          trunkBaseRadius: 1.25,
          trunkTaper: 0.9,
          trunkLean: 0,
          trunkLeanDirection: 0,
          clearTrunkHeight: 0.08,
          trunkCurvature: 0.02,
          trunkNoise: 0.04,
          primaryBranchCount: 11,
          branchAngle: 62,
          branchAngleVariance: 4,
          branchLengthRatio: 0.54,
          branchOrderDepth: 2,
          branchDensity: 0.9,
          branchDroop: 0.16,
          apicalDominance: 0.98,
          crownShape: 'conical',
          crownFullness: 0.9,
          leafClusterRadius: 1.6,
          leafDensity: 0.92,
          interiorLeafPruning: 0.24,
          minBranchThickness: 1,
          leafCleanup: 0.7,
          symmetryAssist: 0.36,
          buildabilityBias: 0.82,
        },
        blockColors: {
          log: '#5a3925',
          branch: '#66462f',
          leaf: '#2f5632',
          fence: '#66462f',
        },
        minecraftPalette: {
          log: 'spruce_log',
          branch: 'stripped_spruce_log',
          fence: 'spruce_fence',
          leaf: 'spruce_leaves',
        },
      },
    });

    expect(submission.snapshot.blockColors.fence).toBe('#66462f');
    expect(submission.snapshot.minecraftPalette.fence).toBe('spruce_fence');
  });
});

describe('community server hardening', () => {
  it('returns 404 for scanner-style extensionless paths instead of the app shell', async () => {
    const response = await request('/phpinfo');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(JSON.parse(response.body)).toEqual({ error: 'Not found.' });
  });

  it('still serves the app shell from the root path', async () => {
    const response = await request('/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.body).toContain('<div id="root"></div>');
  });

  it('rejects oversized JSON request bodies', async () => {
    const tooLargeName = 'a'.repeat(70_000);
    const response = await request('/api/community/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, JSON.stringify({ creationName: tooLargeName }));

    expect(response.status).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ error: 'Request body must be 64 KB or smaller.' });
  });
});
