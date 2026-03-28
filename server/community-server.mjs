import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const dataFile = path.join(dataDir, 'community-creations.json');
const port = Number(process.env.PORT ?? 8787);
const adminKeys = new Set(
  (process.env.TREEVOXEL_ADMIN_KEYS ?? process.env.TREEVOXEL_ADMIN_KEY ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const allowedPresets = new Set(['spruce', 'oak', 'willow']);
const allowedCrownShapes = new Set(['conical', 'spherical', 'ovoid', 'columnar', 'vase', 'weeping', 'irregular']);
const allowedBlockTypes = new Set(['log', 'branch', 'leaf']);

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

function normalizeName(value, fieldName, maxLength) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} is required.`);
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return normalized;
}

function normalizeHexColor(value, fieldName) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`${fieldName} must be a hex color.`);
  }
  return value.toLowerCase();
}

function normalizeParams(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Submission params are invalid.');
  }

  const numericKeys = [
    'height',
    'crownWidth',
    'crownDepth',
    'trunkBaseRadius',
    'trunkTaper',
    'trunkLean',
    'clearTrunkHeight',
    'trunkCurvature',
    'primaryBranchCount',
    'branchAngle',
    'branchAngleVariance',
    'branchLengthRatio',
    'branchOrderDepth',
    'branchDensity',
    'branchDroop',
    'apicalDominance',
    'crownFullness',
    'leafClusterRadius',
    'leafDensity',
    'interiorLeafPruning',
    'phototropism',
    'windBias',
    'age',
    'randomSeed',
    'colorRandomness',
    'minBranchThickness',
    'leafCleanup',
    'symmetryAssist',
    'buildabilityBias',
  ];

  const params = {};
  for (const key of numericKeys) {
    const raw = value[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      throw new Error(`Param "${key}" is invalid.`);
    }
    params[key] = raw;
  }

  if (typeof value.crownShape !== 'string' || !allowedCrownShapes.has(value.crownShape)) {
    throw new Error('Param "crownShape" is invalid.');
  }
  params.crownShape = value.crownShape;

  return params;
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('Submission snapshot is invalid.');
  }

  if (typeof snapshot.presetId !== 'string' || !allowedPresets.has(snapshot.presetId)) {
    throw new Error('Submission preset is invalid.');
  }

  if (!snapshot.blockColors || typeof snapshot.blockColors !== 'object' || Array.isArray(snapshot.blockColors)) {
    throw new Error('Submission block colors are invalid.');
  }

  const blockColors = {};
  for (const type of allowedBlockTypes) {
    blockColors[type] = normalizeHexColor(snapshot.blockColors[type], `${type} color`);
  }

  return {
    presetId: snapshot.presetId,
    params: normalizeParams(snapshot.params),
    blockColors,
  };
}

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, 'utf8');
  } catch {
    await writeFile(dataFile, JSON.stringify({ submissions: [] }, null, 2));
  }
}

async function readDb() {
  await ensureDataFile();
  const raw = await readFile(dataFile, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.submissions)) {
    return { submissions: [] };
  }
  return parsed;
}

async function writeDb(db) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(db, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

function isAuthorized(request) {
  if (adminKeys.size === 0) {
    return false;
  }
  return typeof request.headers['x-admin-key'] === 'string' && adminKeys.has(request.headers['x-admin-key']);
}

function serializeSubmission(submission) {
  return {
    id: submission.id,
    creationName: submission.creationName,
    authorName: submission.authorName,
    status: submission.status,
    createdAt: submission.createdAt,
    reviewedAt: submission.reviewedAt ?? null,
    snapshot: submission.snapshot,
  };
}

const server = createServer(async (request, response) => {
  if (!request.url || !request.method) {
    json(response, 400, { error: 'Invalid request.' });
    return;
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);

  try {
    if (request.method === 'GET' && url.pathname === '/api/community/creations') {
      const db = await readDb();
      const approved = db.submissions
        .filter((submission) => submission.status === 'approved')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(serializeSubmission);

      json(response, 200, { creations: approved });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/community/submissions') {
      const body = await readJsonBody(request);
      const submission = {
        id: randomUUID(),
        creationName: normalizeName(body.creationName, 'Creation name', 64),
        authorName: normalizeName(body.authorName, 'Your name', 48),
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        snapshot: normalizeSnapshot(body.snapshot),
      };

      const db = await readDb();
      db.submissions.push(submission);
      await writeDb(db);

      json(response, 201, { submission: serializeSubmission(submission) });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/community/review') {
      if (!isAuthorized(request)) {
        json(response, 401, {
          error: adminKeys.size > 0 ? 'Unauthorized.' : 'TREEVOXEL_ADMIN_KEYS is not configured.',
        });
        return;
      }

      const db = await readDb();
      const statusFilter = url.searchParams.get('status') ?? 'pending';
      const filtered = db.submissions
        .filter((submission) => statusFilter === 'all' || submission.status === statusFilter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(serializeSubmission);

      json(response, 200, { submissions: filtered });
      return;
    }

    const reviewMatch = url.pathname.match(/^\/api\/community\/review\/([^/]+)\/(approve|reject)$/);
    if (request.method === 'POST' && reviewMatch) {
      if (!isAuthorized(request)) {
        json(response, 401, {
          error: adminKeys.size > 0 ? 'Unauthorized.' : 'TREEVOXEL_ADMIN_KEYS is not configured.',
        });
        return;
      }

      const [, id, action] = reviewMatch;
      const db = await readDb();
      const target = db.submissions.find((submission) => submission.id === id);

      if (!target) {
        json(response, 404, { error: 'Submission not found.' });
        return;
      }

      target.status = action === 'approve' ? 'approved' : 'rejected';
      target.reviewedAt = new Date().toISOString();
      await writeDb(db);

      json(response, 200, { submission: serializeSubmission(target) });
      return;
    }

    json(response, 404, { error: 'Not found.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    json(response, 400, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Community server listening on http://localhost:${port}`);
});
