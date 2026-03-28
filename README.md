# treevoxel

## Community Creations

This repo now includes a small file-backed community backend plus a frontend panel for submissions and approved creations.

### Run locally

Start the API server in one terminal:

```bash
TREEVOXEL_ADMIN_KEYS=key-one,key-two,key-three npm run dev:server
```

Start the Vite frontend in another terminal:

```bash
npm run dev
```

The frontend proxies `/api/*` requests to `http://localhost:8787`.

### Review flow

- Users open the `Community` tab and submit their current tree settings with a creation name and author name.
- Submissions are stored in [data/community-creations.json](/home/arysriv/Desktop/projects/treevoxel/data/community-creations.json) with `pending` status.
- In the same `Community` tab, enter any valid admin key in the admin section to load the pending queue.
- Approved entries become visible in the public community list and can be loaded back into the editor.

### Admin keys

The server accepts a comma-separated list of keys via `TREEVOXEL_ADMIN_KEYS`.

```bash
TREEVOXEL_ADMIN_KEYS=alice-review,bob-review,carol-review npm run dev:server
```

For backward compatibility, `TREEVOXEL_ADMIN_KEY` still works as a single-key fallback.
