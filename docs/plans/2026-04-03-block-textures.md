# Block Textures

> Implementation plan for adding per-face Minecraft block textures to the 3D viewport. Steps use checkbox syntax for tracking.

**Spec:** `docs/specs/2026-04-03-block-textures.md`

**Goal:** Replace flat-colored cubes with Minecraft-style 16x16 pixel textures on block faces, with per-face variation (logs show bark on sides, end grain on top/bottom). Introduce a "texture set" abstraction so users can toggle between flat color (current) and Minecraft textures.

**Scope:** Texture atlas creation, shader modification via `onBeforeCompile`, axis data propagation through RenderBuffer, store/UI toggle, and general selectable plank blocks for `log` and `branch`. Fence-specific geometry/material work remains in `docs/plans/2026-04-03-fence-texturing.md`. No PBR, no normal maps.

**Tech Stack:** Three.js (MeshStandardMaterial + onBeforeCompile), React Three Fiber, Zustand, Vite (static asset serving)

---

## Decisions

- Use a single texture atlas PNG (128x128, 8x8 grid of 16x16 cells) rather than individual texture files per block.
- Extend `MeshStandardMaterial` via `onBeforeCompile` rather than writing a custom `ShaderMaterial`, preserving lighting/shadow/roughness for free.
- Existing per-instance colors (`setColorAt`) become tint multipliers on top of textures, preserving `colorRandomness`.
- Axis data (already in `VoxelStore.axis`) is propagated to the shader as a per-instance `Uint8Array` attribute.
- `flat_color` mode must be pixel-identical to current behavior (no regression).
- Texture source: **[Faithful 16x](https://faithfulpack.net/faithful16x/latest)** (CC BY-NC-SA 4.0). Raw PNGs and the generated atlas are gitignored; the atlas builder script is committed. Developers download the pack and run the build script locally.

---

## Task 0: Obtain Minecraft Textures

Minecraft's texture assets are copyrighted by Mojang/Microsoft and cannot be redistributed. We source textures from [Faithful](https://faithfulpack.net/), an open-source resource pack licensed CC BY-NC-SA 4.0. These textures can be committed to the repo and shipped in production under that license.

**Chosen source: [Faithful 16x](https://faithfulpack.net/faithful16x/latest)** — the classic 16x16 resolution pack maintained by the Faithful team. Use the 16x pack (not 32x or 64x) since our atlas cells are 16x16.

### Download Steps

1. Go to [https://faithfulpack.net/faithful16x/latest](https://faithfulpack.net/faithful16x/latest) and download the latest Java Edition release (`.zip` file, e.g. `Faithful 16x - Java - 1.21.zip`).
2. Unzip the file. Textures live at `assets/minecraft/textures/block/` inside the zip.
3. Copy only the needed block face PNGs from that directory into `scripts/source-textures/`. The required files are listed in the atlas script (see below). You do not need the full pack.
4. Run `npx tsx scripts/build-atlas.ts` to composite them into `public/textures/minecraft/atlas.png`.

### Required Source Textures

Copy these files from `assets/minecraft/textures/block/` in the Faithful zip into `scripts/source-textures/`:

| File | Used for |
|------|----------|
| `oak_log.png` | Oak log side |
| `oak_log_top.png` | Oak log top/bottom |
| `birch_log.png` | Birch log side |
| `birch_log_top.png` | Birch log top/bottom |
| `spruce_log.png` | Spruce log side |
| `spruce_log_top.png` | Spruce log top/bottom |
| `jungle_log.png` | Jungle log side |
| `jungle_log_top.png` | Jungle log top/bottom |
| `acacia_log.png` | Acacia log side |
| `acacia_log_top.png` | Acacia log top/bottom |
| `dark_oak_log.png` | Dark Oak log side |
| `dark_oak_log_top.png` | Dark Oak log top/bottom |
| `mangrove_log.png` | Mangrove log side |
| `mangrove_log_top.png` | Mangrove log top/bottom |
| `cherry_log.png` | Cherry log side |
| `cherry_log_top.png` | Cherry log top/bottom |
| `oak_planks.png` | Oak planks selectable block, oak fence source |
| `spruce_planks.png` | Spruce planks selectable block, spruce fence source |
| `birch_planks.png` | Birch planks selectable block, birch fence source |
| `jungle_planks.png` | Jungle planks selectable block, jungle fence source |
| `acacia_planks.png` | Acacia planks selectable block, acacia fence source |
| `dark_oak_planks.png` | Dark Oak planks selectable block, dark oak fence source |
| `mangrove_planks.png` | Mangrove planks selectable block, mangrove fence source |
| `cherry_planks.png` | Cherry planks selectable block, cherry fence source |
| `bamboo_planks.png` | Bamboo planks selectable block |
| `oak_leaves.png` | Oak leaves |
| `birch_leaves.png` | Birch leaves |
| `spruce_leaves.png` | Spruce leaves |
| `jungle_leaves.png` | Jungle leaves |
| `acacia_leaves.png` | Acacia leaves |
| `dark_oak_leaves.png` | Dark Oak leaves |
| `mangrove_leaves.png` | Mangrove leaves |
| `cherry_leaves.png` | Cherry leaves |
| `azalea_leaves.png` | Azalea leaves |
| `flowering_azalea_leaves.png` | Flowering Azalea leaves |
| `bamboo_fence.png` | Bamboo fence texture used by the fence texturing plan |

### Storage Layout

```
scripts/
  source-textures/       ← Faithful PNGs go here (gitignored)
    oak_log.png
    oak_log_top.png
    ... (all files from table above)
  build-atlas.ts         ← composites source-textures/ → atlas.png
public/
  textures/
    minecraft/
      atlas.png          ← generated output (gitignored)
```

**Files:**
- Create: `scripts/build-atlas.ts`
- Create: `scripts/source-textures/` (gitignored directory)

- [ ] Add `scripts/source-textures/` and `public/textures/minecraft/atlas.png` to `.gitignore`.
- [ ] Write a Node script that reads named PNGs from `scripts/source-textures/` and composites them into a 128x128 atlas PNG according to the cell layout defined in `src/textures/minecraftAtlas.ts`.
- [ ] Output to `public/textures/minecraft/atlas.png`.
- [ ] Add a comment at the top of `scripts/build-atlas.ts` with usage instructions and a link to faithfulpack.net/faithful16x/latest.
- [ ] For initial development, generate a placeholder atlas (solid-color cells with 1px borders) when `scripts/source-textures/` is empty or missing files, so the rendering pipeline can be built and tested without sourcing real textures first.

**Notes:**
- `scripts/source-textures/` is gitignored because Faithful is CC BY-NC-SA 4.0 — we do not redistribute the raw individual texture files. The atlas builder is in the repo; developers run it locally after downloading the pack.
- `public/textures/minecraft/atlas.png` is also gitignored for the same reason; it is generated at build time.
- The placeholder atlas (solid colors in a grid) is sufficient for Tasks 1-6. Real textures are only needed for Task 7 (visual verification).
- Plank textures are now shared inputs for both general full-cube block selection and fence rendering.
- Faithful 16x is chosen over 32x/64x because our atlas cell size is 16x16. Using a higher-res pack would require downscaling.

---

## Task 1: Define Texture Set Data Model

Establish the type system and atlas cell mappings that all subsequent tasks depend on.

**Files:**
- Create: `src/textures/textureSet.ts`
- Create: `src/textures/minecraftAtlas.ts`
- Modify: `src/core/types.ts`

- [ ] Add `TextureSetId`, `BlockFaceTextures`, and `TextureSetDefinition` types to `src/textures/textureSet.ts` as specified in the spec.
- [ ] Create `src/textures/minecraftAtlas.ts` exporting:
  - `MINECRAFT_ATLAS_DEFINITION: TextureSetDefinition` with `id: 'minecraft'`, `atlasUrl: '/textures/minecraft/atlas.png'`, `atlasGridSize: 8`.
  - `blockTextures` record mapping Minecraft block IDs (e.g., `'oak_log'`, `'birch_leaves'`) to `{ top, bottom, side }` cell indices.
- [ ] Create a `FLAT_COLOR_DEFINITION: TextureSetDefinition` with `atlasUrl: null` in `textureSet.ts`.
- [ ] Add `textureSet?: TextureSetId` as an optional field on `TreeSnapshot` in `src/core/types.ts`.

**Notes:**
- Cell index layout should match the atlas grid in the spec (logs: 34 cells, leaves: 10, fences: 9 reserved, totaling 53/64).
- Include selectable plank block IDs in `blockTextures` as this plan evolves.
- Fence-specific rendering remains separate because fences need authored geometry and non-cube UV handling.

---

## Task 2: Propagate Axis Data Through RenderBuffer

The shader needs per-instance axis orientation to rotate UV coordinates. Currently `VoxelStore.axis` exists but is not carried into RenderBuffer.

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/renderBuffer.ts`

- [ ] Add `axes: Uint8Array` to the `RenderBuffer` type (one byte per instance: 0=y, 1=x, 2=z).
- [ ] In `buildRenderBuffer()`, read from `voxels.axis` for each voxel and write the encoded axis to the `axes` array. Default to 0 (y-axis) for leaves and any block missing axis data.
- [ ] Verify existing tests still pass: `npm run test`.

**Notes:**
- The axis encoding (0/1/2) must match what the shader expects. Use the same mapping consistently.
- Fence blocks don't need axis data (they have no directional texture yet).

---

## Task 3: Atlas Loader

Load the atlas texture and make it available to materials.

**Files:**
- Create: `src/textures/loadAtlas.ts`

- [ ] Export `loadAtlas(url: string): THREE.Texture` that uses `THREE.TextureLoader`, sets `minFilter = NearestFilter`, `magFilter = NearestFilter` (pixelated look), `colorSpace = SRGBColorSpace`, and `flipY = false`.
- [ ] Cache the loaded texture so repeated calls with the same URL return the same `THREE.Texture` instance.
- [ ] Handle the `null` atlas URL case (flat_color) by returning `null`.

**Notes:**
- `NearestFilter` is critical for the pixel-art look. Without it, textures will appear blurry.
- `flipY = false` because Three.js flips by default but our atlas is laid out top-to-bottom.

---

## Task 4: Textured Voxel Material

The core rendering change: extend `MeshStandardMaterial` via `onBeforeCompile` to sample from the atlas based on face normal and block axis.

**Files:**
- Create: `src/render/texturedVoxelMaterial.ts`

- [ ] Export a factory function `createTexturedVoxelMaterial(atlas: THREE.Texture, gridSize: number, blockFaces: BlockFaceTextures): THREE.MeshStandardMaterial`.
- [ ] Set base material properties to match current materials (white base, roughness ~0.92-0.95 depending on block type).
- [ ] Use `onBeforeCompile` to inject custom shader code:
  - **Vertex shader:** Pass the per-instance axis attribute and the world-space position to the fragment shader via varyings.
  - **Fragment shader:**
    1. Determine face from world-space normal (±X, ±Y, ±Z).
    2. Determine local UV from the two non-normal axes of the fragment position (fractional part).
    3. Rotate UV based on the block's axis attribute (e.g., if axis=x, the "top" face is the +X face instead of +Y).
    4. Select the atlas cell index (top/bottom/side) based on the rotated face.
    5. Compute atlas UV: `(cellX + localU) / gridSize, (cellY + localV) / gridSize`.
    6. Sample the atlas and multiply with the existing diffuse color (tint).
- [ ] Ensure `instanceColor` (the tint from `setColorAt`) still multiplies with the sampled texture color.
- [ ] Add the per-instance axis as a custom `InstancedBufferAttribute` on the geometry.

**Notes:**
- The face detection uses `abs(normal)` comparisons. For a box, normals are axis-aligned so this is exact.
- The axis rotation logic: for axis=y (default), top=+Y, side=±X/±Z. For axis=x, top=+X, side=±Y/±Z. For axis=z, top=+Z, side=±X/±Y.
- The `onBeforeCompile` approach is fragile across Three.js versions — pin the Three.js version or add a comment noting this coupling.

---

## Task 5: Wire Materials Into VoxelMesh

Connect the new material system to the existing InstancedMesh rendering.

**Files:**
- Modify: `src/render/VoxelMesh.tsx`

- [ ] Import `loadAtlas`, `createTexturedVoxelMaterial`, atlas definitions, and the store's `textureSet` state.
- [ ] When `textureSet === 'minecraft'`:
  - Load the atlas texture (once, via `useMemo` or `useEffect`).
  - Create textured materials for log, branch, and leaf meshes using `createTexturedVoxelMaterial()`, each with their respective `BlockFaceTextures` looked up from the Minecraft palette's current block ID.
  - Attach the `axes` data from RenderBuffer as an `InstancedBufferAttribute` on each InstancedMesh's geometry.
- [ ] When `textureSet === 'flat_color'`:
  - Use the existing `MeshStandardMaterial` instances (current behavior, no change).
- [ ] Ensure material swap happens reactively when the store's `textureSet` changes.
- [ ] Ensure palette changes (user picks a different log type) update the `BlockFaceTextures` and recreate/update the material.
- [ ] Fence meshes remain unchanged (flat color only for now).

**Notes:**
- The `InstancedBufferAttribute` for axes must be updated whenever the buffer regenerates (param change, preset change).
- Dispose old textures/materials on cleanup to prevent GPU memory leaks.

---

## Task 6: Store and UI

Add the texture set toggle to state management and the UI.

**Files:**
- Modify: `src/store/treeStore.ts`
- Modify: `src/ui/ParameterPanel.tsx`

- [ ] Add `textureSet: TextureSetId` to the store state, default `'flat_color'`.
- [ ] Add `setTextureSet(id: TextureSetId)` action. This should NOT trigger tree regeneration (voxels/buffer stay the same) — it only affects rendering.
- [ ] Include `textureSet` in `TreeSnapshot` serialization/deserialization so it persists across save/load.
- [ ] Add a toggle in `ParameterPanel` inside the Block Colors section:
  ```
  Rendering Style:  [Flat Color] [Minecraft]
  ```
  Use a segmented control or two radio-style buttons consistent with existing UI patterns (Radix primitives).
- [ ] The toggle should be near the top of the Block Colors section, before individual block type selectors.

**Notes:**
- The toggle does not rebuild the tree — it only swaps materials in VoxelMesh. This should feel instant.
- Snapshot compatibility: old snapshots without `textureSet` should default to `'flat_color'`.

---

## Task 7: Placeholder Atlas and Visual Verification

Create a usable placeholder atlas and verify the full pipeline end-to-end.

**Files:**
- Create: `public/textures/minecraft/atlas.png`

- [ ] Generate a placeholder 128x128 atlas where each cell is a distinct solid color with a 1px border, making it easy to verify cell selection and UV mapping.
- [ ] Verify flat color mode is pixel-identical to current behavior (no visual regression).
- [ ] Verify Minecraft mode shows the placeholder cells on correct faces.
- [ ] Verify log axis rotation: place a horizontal branch and confirm side faces show the "side" cell, not the "top" cell.
- [ ] Verify palette swap updates textures immediately (change oak_log to birch_log, textures should change).
- [ ] Verify `colorRandomness` tinting works on top of textures.
- [ ] Run `npm run build` — confirm no build errors.
- [ ] Run `npm run test` — confirm existing tests pass.

---

## Task 8: Production Textures

Replace placeholder atlas with final Faithful textures. This task can be done in parallel with or after Tasks 1-7.

- [ ] Download Faithful 16x from [https://faithfulpack.net/faithful16x/latest](https://faithfulpack.net/faithful16x/latest) (Java Edition zip).
- [ ] Extract the required face PNGs listed in Task 0 into `scripts/source-textures/`.
- [ ] Run `npx tsx scripts/build-atlas.ts` to generate `public/textures/minecraft/atlas.png`.
- [ ] Visual verification: every tree preset in Minecraft mode should look recognizably like its Minecraft counterpart.
- [ ] Verify atlas file size is reasonable (~10-20KB PNG).
- [ ] Confirm `scripts/source-textures/` and `public/textures/minecraft/atlas.png` are listed in `.gitignore` and not staged.

---

## Acceptance Criteria

- `flat_color` mode is visually identical to current production behavior.
- `minecraft` mode shows pixelated 16x16 textures with correct per-face mapping.
- Log/branch axis rotation works (horizontal branches show bark on sides).
- Palette swap updates textures immediately without tree regeneration.
- `colorRandomness` tinting overlays on top of textures.
- `npm run build` passes, `npm run test` passes.
- No performance regression for large trees (single draw call per block type maintained).
- Snapshots with `textureSet` round-trip correctly; old snapshots default to `flat_color`.

---

## Implementation Order

1. **Task 0** — Atlas build script + placeholder atlas (unblocks all rendering work)
2. **Task 1** — Type definitions and atlas cell mappings
3. **Task 2** — RenderBuffer axis propagation
4. **Task 3** — Atlas loader utility
5. **Task 4** — Textured material with `onBeforeCompile` shader (heaviest task)
6. **Task 5** — Wire into VoxelMesh
7. **Task 6** — Store toggle + UI
8. **Task 7** — End-to-end visual verification
9. **Task 8** — Production textures (can be parallel with 4-7)

Tasks 1-3 are parallelizable. Task 4 depends on 1+3. Task 5 depends on 2+4. Task 6 is independent of 3-5.

---

## Out of Scope

- Fence textures (non-cube geometry requires separate UV approach)
- Normal maps, PBR, or roughness maps
- Runtime texture editing or custom user texture uploads
- Per-voxel texture variety within a block type (e.g., random bark variants)
- Web Worker changes
