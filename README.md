# Treevoxel

Treevoxel is a browser-based voxel tree authoring tool for building, tuning, previewing, and exporting stylized 3D trees. The app includes a small community backend so users can submit creations for moderation and load approved community presets back into the editor.

## Stack

- React 19 + Vite for the frontend
- Three.js / React Three Fiber for 3D rendering
- Zustand for editor state
- A small Node HTTP server for community submissions, moderation, and production static hosting

## Features

- Interactive voxel tree editor with preset-driven generation controls
- 3D viewport plus layer inspection tools
- Community submission flow backed by a JSON file
- Admin review queue with approve / reject actions
- Production deployment shape that can run as a single Railway service

## Local Development

Install dependencies:

```bash
npm install
```

Run the API server in one terminal:

```bash
TREEVOXEL_ADMIN_KEYS=key-one,key-two npm run dev:server
```

Run the Vite frontend in another terminal:

```bash
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Community API: `http://localhost:8787`

In development, Vite proxies `/api/*` requests to the local community server.

## Production Runtime

For production, the same Node server also serves the built frontend from `dist`, so Railway only needs one service.

Build:

```bash
npm run build
```

Start the production server:

```bash
PORT=8787 TREEVOXEL_ADMIN_KEYS=your-admin-key npm run start
```

The production server:

- serves the built app from `dist`
- exposes the community API at `/api/community/*`
- stores community submissions in `data/community-creations.json`

## Environment Variables

- `PORT`: runtime port provided by Railway; defaults to `8787` locally
- `TREEVOXEL_ADMIN_KEYS`: comma-separated admin keys for the moderation queue
- `TREEVOXEL_ADMIN_KEY`: legacy single-key fallback, still supported

Example:

```bash
TREEVOXEL_ADMIN_KEYS=alice-review,bob-review
```

## Data Persistence

Community submissions are stored in:

- [data/community-creations.json](/home/arysriv/Desktop/projects/treevoxel/data/community-creations.json)

For production, attach a Railway volume and mount it to:

- `/app/data`

That preserves approved and pending submissions across deploys and restarts.

## Railway Deployment

This repo is set up to be deployed through the Railway UI. Do not add Railway config files to the repo.

### 1. Create the service

1. In Railway, create a new project.
2. Choose **Deploy from GitHub repo** and select this repository.
3. Open the generated service and set:
   - Build Command: `npm run build`
   - Start Command: `npm run start`
4. Confirm Railway detects the app as a Node service.

### 2. Add environment variables

In the Railway service Variables tab, add:

- `TREEVOXEL_ADMIN_KEYS`

Use a long random value or a small comma-separated set of review keys.

You do not need to set `PORT` manually on Railway unless you are overriding defaults; Railway injects it automatically.

### 3. Attach persistent storage

1. Add a volume in Railway.
2. Mount it at `/app/data`.
3. Redeploy once the mount is attached.

Without a mounted volume, `community-creations.json` will reset on redeploy.

### 4. Deploy

1. Trigger a deploy from the Railway UI.
2. Once the deploy succeeds, open the generated Railway domain.
3. Verify:
   - the homepage loads
   - the 3D editor renders
   - community submissions can be created
   - admin review works with a valid `TREEVOXEL_ADMIN_KEYS` value

## Connecting `treevoxel.arysriv.com`

Use Railway's custom domain flow plus a DNS record in the provider that manages `arysriv.com`.

### 1. Add the custom domain in Railway

1. Open the deployed service in Railway.
2. Go to **Settings** or **Domains**.
3. Add the custom domain:

```text
treevoxel.arysriv.com
```

Railway will show the DNS target you need to create. Follow the exact value Railway gives you.

### 2. Create the DNS record

In your DNS provider for `arysriv.com`, create the record Railway asks for. In most cases this will be one of:

- `CNAME` record
  - Host/Name: `treevoxel`
  - Target/Value: the Railway hostname shown in the custom domain UI
- `A` record
  - Host/Name: `treevoxel`
  - Value: the IP address Railway shows, if Railway asks for an A record instead

Do not guess the target. Use the exact hostname or IP Railway displays for your project.

### 3. Wait for validation

After DNS propagates, Railway should mark the domain as verified and provision TLS automatically.

Once active, the app should be available at:

```text
https://treevoxel.arysriv.com
```

## Moderation Flow

1. Users submit creations from the `Community` tab.
2. Submissions are written to the JSON datastore with `pending` status.
3. A reviewer enters a valid admin key in the Community admin UI.
4. Approved creations become visible in the public community browser.

## Useful Commands

```bash
npm run dev
npm run dev:server
npm run build
npm run start
npm run test
npm run lint
```

## Notes

- The repo intentionally does not include Railway config files.
- If you change the persistence path in the future, update the Railway volume mount to match.
- If you want a staging environment later, duplicate the service in Railway and give it a separate volume and subdomain.
