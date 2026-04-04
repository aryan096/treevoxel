import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const __dirname = path.dirname(currentFilePath);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = process.env.TREEVOXEL_DATA_DIR
  ? path.resolve(process.env.TREEVOXEL_DATA_DIR)
  : path.join(projectRoot, 'data');
const dataFile = path.join(dataDir, 'community-creations.json');
const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.PORT ?? 8787);
const adminKeys = new Set(
  (process.env.TREEVOXEL_ADMIN_KEYS ?? process.env.TREEVOXEL_ADMIN_KEY ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const presetBlockColors = {
  oak: {
    log: '#70492f',
    branch: '#7f5d37',
    leaf: '#5e8744',
    fence: '#7f5d37',
  },
  dark_oak: {
    log: '#3e2912',
    branch: '#5a4428',
    leaf: '#456b32',
    fence: '#5a4428',
  },
  spruce: {
    log: '#5a3925',
    branch: '#66462f',
    leaf: '#2f5632',
    fence: '#66462f',
  },
  birch: {
    log: '#d5cdb4',
    branch: '#c8b77d',
    leaf: '#6d9e47',
    fence: '#c8b77d',
  },
  acacia: {
    log: '#676157',
    branch: '#b05d3b',
    leaf: '#5c7f37',
    fence: '#b05d3b',
  },
  jungle: {
    log: '#564419',
    branch: '#ac8850',
    leaf: '#30801a',
    fence: '#ac8850',
  },
  cherry_blossom: {
    log: '#3b1e1a',
    branch: '#d9a1a1',
    leaf: '#e8b4c8',
    fence: '#d9a1a1',
  },
  baobab: {
    log: '#8a6a42',
    branch: '#b9814d',
    leaf: '#6f8a3a',
    fence: '#b9814d',
  },
  crazy: {
    log: '#5f3d23',
    branch: '#915f2f',
    leaf: '#7aac4f',
    fence: '#915f2f',
  },
};
const defaultBlockColors = {
  log: '#6b4226',
  branch: '#8b6914',
  leaf: '#4d9a45',
  fence: '#8b6914',
};
const defaultMinecraftPalette = {
  log: 'oak_log',
  branch: 'stripped_oak_log',
  fence: 'oak_fence',
  leaf: 'oak_leaves',
};
const presetMinecraftPalette = {
  oak: {
    log: 'oak_log',
    branch: 'stripped_oak_log',
    fence: 'oak_fence',
    leaf: 'oak_leaves',
  },
  dark_oak: {
    log: 'dark_oak_log',
    branch: 'stripped_dark_oak_log',
    fence: 'dark_oak_fence',
    leaf: 'dark_oak_leaves',
  },
  spruce: {
    log: 'spruce_log',
    branch: 'stripped_spruce_log',
    fence: 'spruce_fence',
    leaf: 'spruce_leaves',
  },
  birch: {
    log: 'birch_log',
    branch: 'stripped_birch_log',
    fence: 'birch_fence',
    leaf: 'birch_leaves',
  },
  acacia: {
    log: 'acacia_log',
    branch: 'stripped_acacia_log',
    fence: 'acacia_fence',
    leaf: 'acacia_leaves',
  },
  jungle: {
    log: 'jungle_log',
    branch: 'stripped_jungle_log',
    fence: 'jungle_fence',
    leaf: 'jungle_leaves',
  },
  cherry_blossom: {
    log: 'cherry_log',
    branch: 'stripped_cherry_log',
    fence: 'cherry_fence',
    leaf: 'cherry_leaves',
  },
  baobab: {
    log: 'acacia_log',
    branch: 'stripped_acacia_log',
    fence: 'acacia_fence',
    leaf: 'acacia_leaves',
  },
  crazy: {
    log: 'oak_log',
    branch: 'stripped_acacia_log',
    fence: 'acacia_fence',
    leaf: 'oak_leaves',
  },
};
const allowedPresets = new Set(Object.keys(presetBlockColors));
const allowedCrownShapes = new Set(['conical', 'spherical', 'ovoid', 'columnar', 'vase', 'weeping', 'irregular']);
const allowedBlockTypes = new Set(['log', 'branch', 'leaf', 'fence']);
// Defaults for params added after initial launch — used as fallbacks when loading
// old submissions that predate these fields.
const legacyParamDefaults = {
  leafCleanup: 0.5,
  symmetryAssist: 0.3,
  buildabilityBias: 0.5,
};
const requiredNumericParams = [
  'randomSeed',
  'colorRandomness',
  'height',
  'crownWidth',
  'crownDepth',
  'trunkBaseRadius',
  'trunkTaper',
  'trunkLean',
  'trunkLeanDirection',
  'clearTrunkHeight',
  'trunkCurvature',
  'trunkNoise',
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
  'minBranchThickness',
  'leafCleanup',
  'symmetryAssist',
  'buildabilityBias',
];
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

function getPresetBlockColors(presetId) {
  return presetBlockColors[presetId] ?? defaultBlockColors;
}

function getPresetMinecraftPalette(presetId) {
  return presetMinecraftPalette[presetId] ?? defaultMinecraftPalette;
}

function normalizeParams(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Submission params are invalid.');
  }

  const params = {};
  for (const key of requiredNumericParams) {
    const raw = value[key] ?? legacyParamDefaults[key];
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

function normalizeBlockColors(value, presetId, { allowMissing = false } = {}) {
  const fallback = getPresetBlockColors(presetId);
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : null;

  if (!raw && !allowMissing) {
    throw new Error('Submission block colors are invalid.');
  }

  const blockColors = {};
  for (const type of allowedBlockTypes) {
    const color = raw?.[type];
    blockColors[type] = color == null
      ? fallback[type]
      : normalizeHexColor(color, `${type} color`);
  }
  return blockColors;
}

function normalizeMinecraftPalette(value, presetId) {
  const fallback = getPresetMinecraftPalette(presetId);
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : null;

  if (!raw) {
    throw new Error('Submission Minecraft palette is invalid.');
  }

  const minecraftPalette = {};
  for (const type of allowedBlockTypes) {
    const blockId = raw[type];
    if (typeof blockId !== 'string' || !blockId.trim()) {
      throw new Error(`Minecraft palette "${type}" is invalid.`);
    }
    minecraftPalette[type] = blockId.trim() || fallback[type];
  }
  return minecraftPalette;
}

export function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('Submission snapshot is invalid.');
  }

  if (typeof snapshot.presetId !== 'string' || !allowedPresets.has(snapshot.presetId)) {
    throw new Error('Submission preset is invalid.');
  }

  return {
    presetId: snapshot.presetId,
    params: normalizeParams(snapshot.params),
    blockColors: normalizeBlockColors(snapshot.blockColors, snapshot.presetId),
    minecraftPalette: normalizeMinecraftPalette(snapshot.minecraftPalette, snapshot.presetId),
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

function getStaticContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.ico':
      return 'image/x-icon';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.txt':
      return 'text/plain; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

async function tryServeStaticAsset(response, pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const requestedPath = path.resolve(distDir, `.${normalizedPath}`);

  if (!requestedPath.startsWith(distDir)) {
    return false;
  }

  try {
    const fileInfo = await stat(requestedPath);
    if (!fileInfo.isFile()) {
      return false;
    }

    const fileContents = await readFile(requestedPath);
    response.writeHead(200, {
      'Content-Type': getStaticContentType(requestedPath),
      'Cache-Control': normalizedPath === '/index.html'
        ? 'no-cache'
        : 'public, max-age=31536000, immutable',
    });
    response.end(fileContents);
    return true;
  } catch {
    return false;
  }
}

async function hasFrontendBuild() {
  try {
    const fileInfo = await stat(path.join(distDir, 'index.html'));
    return fileInfo.isFile();
  } catch {
    return false;
  }
}

async function serveFrontendApp(response) {
  try {
    const indexHtml = await readFile(path.join(distDir, 'index.html'));
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    response.end(indexHtml);
  } catch {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Treevoxel</title>
  </head>
  <body>
    <h1>Treevoxel server is running</h1>
    <p>Frontend build is unavailable. Run <code>npm run build</code> before starting the production server.</p>
  </body>
</html>`);
  }
}

function serializeSubmission(submission) {
  return {
    id: submission.id,
    creationName: submission.creationName,
    authorName: submission.authorName,
    status: submission.status,
    createdAt: submission.createdAt,
    reviewedAt: submission.reviewedAt ?? null,
    snapshot: normalizeSnapshot(submission.snapshot),
  };
}

export { serializeSubmission };

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
    if (request.method === 'GET' && url.pathname === '/api/health') {
      json(response, 200, {
        ok: true,
        frontendBuilt: await hasFrontendBuild(),
      });
      return;
    }

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

    if (request.method === 'GET' || request.method === 'HEAD') {
      const servedAsset = await tryServeStaticAsset(response, url.pathname);
      if (servedAsset) {
        return;
      }

      if (!path.extname(url.pathname)) {
        await serveFrontendApp(response);
        return;
      }
    }

    json(response, 404, { error: 'Not found.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    json(response, 400, { error: message });
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  server.on('error', (error) => {
    console.error('Community server failed to start.', error);
    process.exitCode = 1;
  });

  server.listen(port, () => {
    console.log(`Community server listening on http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}; shutting down community server.`);
    server.close((error) => {
      if (error) {
        console.error('Error while shutting down community server.', error);
        process.exit(1);
        return;
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
