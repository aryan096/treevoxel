# Fence Texturing

> Implementation plan for adding Minecraft-style fence texturing to the 3D viewport. Steps use checkbox syntax for tracking.

**Depends on:** `docs/plans/2026-04-03-block-textures.md`

**Goal:** Render fence branches in Minecraft texture mode using vanilla-style fence geometry and UV behavior. Standard wood fences should inherit the matching plank texture; bamboo fence should use its dedicated fence texture. As part of the same texture expansion, plank blocks should also become normal selectable Minecraft palette options for `log` and `branch`.

**Scope:** Fence atlas/source updates, plank atlas/palette expansion for `log` and `branch`, fence-specific texture metadata, authored UV geometry for posts and rails, new textured fence material wiring in `VoxelMesh`, and verification. No general block-model loader.

**Tech Stack:** Three.js, React Three Fiber, TypeScript, Zustand, static atlas PNG under `public/textures/minecraft/`

---

## Decisions

- Do not treat fences as textured cubes. The current cube shader in `src/render/texturedVoxelMaterial.ts` is correct for full voxels but not for Minecraft fence posts and rails.
- Keep the current logical fence representation: one post plus up to four connected sides derived from `fenceConnectivity`.
- Replace scaled `BoxGeometry(1, 1, 1)` fence parts with authored fence post and fence rail geometries that have fixed proportions and authored UVs.
- Standard wood fences should map to their corresponding plank texture cells, matching vanilla Minecraft behavior.
- `bamboo_fence` should use a dedicated bamboo fence texture cell, matching vanilla Minecraft behavior.
- In Minecraft texture mode, fence instance colors should be neutralized to white, the same way logs and branches already are. Flat-color mode keeps the current color variation.
- This plan extends the existing atlas workflow rather than introducing per-file runtime texture loads.

---

## Task 0: Confirm Texture Sources and Fold Planks Into Shared Texture Work

The original version of this plan assumed these textures still needed to be pulled in. They are already present in `scripts/source-textures/`, so this task is now about treating them as canonical inputs for both fence rendering and general plank block selection.

### Confirmed Source Textures

These files are already available locally and should be treated as required atlas inputs:

| File | Used for |
|------|----------|
| `oak_planks.png` | `oak_fence`, `oak_planks` |
| `spruce_planks.png` | `spruce_fence`, `spruce_planks` |
| `birch_planks.png` | `birch_fence`, `birch_planks` |
| `jungle_planks.png` | `jungle_fence`, `jungle_planks` |
| `acacia_planks.png` | `acacia_fence`, `acacia_planks` |
| `dark_oak_planks.png` | `dark_oak_fence`, `dark_oak_planks` |
| `mangrove_planks.png` | `mangrove_fence`, `mangrove_planks` |
| `cherry_planks.png` | `cherry_fence`, `cherry_planks` |
| `bamboo_planks.png` | selectable `bamboo_planks` block for `log` and `branch` |
| `bamboo_fence.png` | `bamboo_fence` |

### Notes

- Do not look for dedicated oak/spruce/birch/etc fence textures. In vanilla Minecraft those fences inherit plank textures through the block model.
- `bamboo_fence.png` is the one real dedicated fence texture and must be added explicitly.
- The plank PNGs are no longer fence-only dependencies. They also support user-selectable plank blocks in the `log` and `branch` Minecraft palette rows.
- If the project later adds more fence palette IDs or general plank palette options, add their plank texture or dedicated fence texture here.

- [x] Update plan text and atlas assumptions so these source files are treated as already available inputs rather than future acquisition work.
- [x] Update `docs/plans/2026-04-03-block-textures.md` so its texture acquisition section includes the plank textures and no longer implies fences/planks are still deferred.

---

## Task 1: Update Atlas Mapping for Fence and Plank Texture Cells

Fence entries already exist in `src/textures/minecraftAtlas.ts`, but they are currently placeholders and are not consumed by the renderer. The plank textures should also become first-class atlas entries for general block selection, not only indirect fence sources.

**Files:**
- Modify: `src/textures/minecraftAtlas.ts`
- Modify: `scripts/build-atlas.ts`
- Modify: `src/core/minecraftBlocks.ts`
- Modify: any texture-source README/comments created by the atlas workflow

- [ ] Add the fence plank source files to `MINECRAFT_ATLAS_SOURCE_FILES` at the currently-reserved cell indices 44–52, replacing the reserved sentinel entries:
  - cell 44: `oak_planks`
  - cell 45: `spruce_planks`
  - cell 46: `birch_planks`
  - cell 47: `jungle_planks`
  - cell 48: `acacia_planks`
  - cell 49: `dark_oak_planks`
  - cell 50: `mangrove_planks`
  - cell 51: `cherry_planks`
  - cell 52: `bamboo_fence`
- [ ] Remove cells 44–52 from `MINECRAFT_ATLAS_RESERVED_CELLS` in `src/textures/minecraftAtlas.ts`. Once those cells are populated from source files they are no longer reserved placeholders; keeping them in the array causes the atlas builder to paint them gray unnecessarily.
- [ ] Add atlas cells and `blockTextures` entries for selectable plank blocks at new cell indices 53–61:
  - `oak_planks`
  - `spruce_planks`
  - `birch_planks`
  - `jungle_planks`
  - `acacia_planks`
  - `dark_oak_planks`
  - `mangrove_planks`
  - `cherry_planks`
  - `bamboo_planks`
- [ ] Remove the fence entries (`oak_fence` through `bamboo_fence`) from `blockTextures` in `src/textures/minecraftAtlas.ts`. After Task 2 introduces the parallel `fenceTextures` lookup and Task 5 wires the fence material to it, these cube-oriented entries are unreachable dead code and keeping them creates confusion about how fences are resolved.
- [ ] Add corresponding selectable preset entries in `src/core/minecraftBlocks.ts` so planks appear under both `log` and `branch`. `bamboo_planks` is a distinct block ID from `bamboo_block` (the existing bamboo log option at cells 16–17); both should be present with their own labels.
- [ ] Regenerate `public/textures/minecraft/atlas.png` after the builder changes.

### Notes

- Cells 44–52 are the former reserved fence cells. Assigning them source file entries in `MINECRAFT_ATLAS_SOURCE_FILES` is sufficient to populate them; the `blitCell` call overwrites any placeholder paint.
- It is fine for `oak_fence` to resolve to the `oak_planks` tile. That is the intended Minecraft rendering behavior.
- For selectable plank blocks, use cube-style `{ top, bottom, side }` mapping where all three faces point to the same plank cell.
- The 8x8 atlas has 64 cells. Using cells 0–61 leaves 2 free slots (62–63); no atlas expansion is needed.
- If the atlas builder currently emits placeholders when files are missing, keep that behavior for these fence cells too.
- Three extra plank PNGs exist in `scripts/source-textures/` that are out of scope: `warped_planks.png`, `crimson_planks.png`, `pale_oak_planks.png`. There are no corresponding fence IDs for these types; do not add them.

---

## Task 2: Add Fence Texture Metadata

The current texture metadata model is cube-oriented: `{ top, bottom, side }`. Fence materials need a tile reference, not cube-face routing.

**Files:**
- Modify: `src/textures/textureSet.ts`
- Modify: `src/textures/minecraftAtlas.ts`

- [ ] Introduce a fence-specific texture metadata type, for example:
  - `type FenceTexture = { texture: number }`
- [ ] Add a `fenceTextures` field to `TextureSetDefinition` in `src/textures/textureSet.ts`, keyed by `MinecraftBlockId`, for example:
  - `fenceTextures: Record<MinecraftBlockId, FenceTexture>`
- [ ] Add an empty `fenceTextures: {}` to `FLAT_COLOR_DEFINITION` in `src/textures/textureSet.ts` to satisfy TypeScript strict mode.
- [ ] Populate `fenceTextures` entries in `src/textures/minecraftAtlas.ts` for all nine fence IDs, pointing each to its atlas cell (e.g., `oak_fence → { texture: 44 }`, `bamboo_fence → { texture: 52 }`).
- [ ] Keep the cube-oriented `BlockFaceTextures` type for logs, branches, leaves, and the new selectable plank blocks.
- [ ] Avoid over-generalizing this into a full block-model system. A small parallel fence lookup is enough for the current scope.

### Notes

- The key architectural point is to avoid pretending fences are cubes in the type system. The fence entries in `blockTextures` were removed in Task 1; the new `fenceTextures` lookup is the sole source of fence texture data.
- `minecraftPalette.fence` should resolve against this new `fenceTextures` lookup.
- `minecraftPalette.log` and `minecraftPalette.branch` should continue resolving through `blockTextures`, now including plank IDs.

---

## Task 3: Replace Fence Geometry With Authored UV Geometry

The current fence rendering path in `src/render/VoxelMesh.tsx` uses scaled box geometry. That makes it hard to reproduce Minecraft-style UV mapping because every instance stretches the same default UVs differently.

**Files:**
- Modify: `src/render/VoxelMesh.tsx`
- Create: `src/render/fenceGeometry.ts` or similar helper module

- [ ] Create a dedicated fence post geometry with authored UVs.
- [ ] Create a dedicated fence rail geometry with authored UVs.
- [ ] Use Minecraft-like proportions for the authored geometries:
  - post width: `4/16`
  - post height: `16/16`
  - rail thickness: `2/16`
  - rail span from post center toward the connected edge using vanilla-like proportions
- [ ] Author UVs against a single 16x16 source tile so the post and rails read like Minecraft fence elements rather than stretched cubes.
- [ ] Confirm the UV layout works for both plank-derived fences and bamboo fence.

### Notes

- This does not require importing Minecraft JSON models at runtime. Hardcoded geometry/UVs are sufficient and much simpler.
- The exact rail offsets can be tuned visually, but the first pass should stay close to vanilla fence proportions.

---

## Task 4: Change Fence Instance Data to Pose Instances, Not Stretch Them

Fence posts and rails should use authored geometry at the correct size, so the instance transform should mostly place and orient them, not scale them into shape.

**Files:**
- Modify: `src/core/renderBuffer.ts`
- Modify: `src/core/types.ts`

- [ ] Update fence post instances so their matrices encode translation only (no scaling — the authored geometry already has correct proportions).
- [ ] Update fence rail instances so their matrices encode translation plus orientation. **Choose one approach and commit to it before writing any code:**
  - **Option A — two geometries:** `northSouthRailGeometry` and `eastWestRailGeometry`, each authored for its own axis. Instance matrices encode translation only; no rotation needed. This is simpler to implement.
  - **Option B — one geometry with rotation:** A single rail geometry authored along one axis. Instance matrices encode translation + a 90° Y-rotation for the perpendicular direction. Requires adding rotation support to `writeMatrix` (or a new `writeRotatedMatrix` helper), since the current helper at `renderBuffer.ts:313` only encodes scale + translation (diagonal matrix, no rotation terms).
- [ ] Keep the existing connectivity-driven logic for determining which rails are present.
- [ ] Preserve current fence post/arm counts and attachment behavior.

### Notes

- Two geometries (Option A) is recommended: it avoids touching the matrix encoding utility and keeps `renderBuffer.ts` changes minimal.
- If Option B is chosen, the rotation matrix for a 90° Y-rotation is `[[0,0,1],[0,1,0],[-1,0,0]]` in column-major layout. Add a dedicated helper rather than extending `writeMatrix` with an optional rotation argument.
- Do not change the generation semantics. This task is only about render representation.

---

## Task 5: Add a Dedicated Textured Fence Material

Fence materials should sample a single atlas tile using authored UVs. They do not need the cube face-selection logic used by logs and branches.

**Files:**
- Create: `src/render/texturedFenceMaterial.ts`
- Modify: `src/render/VoxelMesh.tsx`

- [ ] Create a material factory for fences that:
  - accepts the atlas texture
  - accepts the fence tile index
  - samples authored UVs directly
  - preserves the nearest-neighbor pixel-art look
- [ ] Keep lighting/shadows consistent with the rest of the scene by extending a standard Three.js lit material rather than using an unlit material.
- [ ] In `VoxelMesh`, create `texturedFenceMaterial` when `textureSet === 'minecraft'`.
- [ ] Resolve the fence texture using `minecraftPalette.fence`.
- [ ] Set `activeFenceMaterial` to the textured version in Minecraft mode and to the current flat-color material in flat-color mode.
- [ ] Dispose fence materials correctly on cleanup and when palette/texture mode changes.

### Notes

- This material should be much simpler than `createTexturedVoxelMaterial()` because it does not need axis-based face routing.
- The UVs live on the geometry; the material only needs atlas-cell remapping.

---

## Task 6: Neutralize Fence Instance Colors in Minecraft Mode

Fence color variation is appropriate for flat-color rendering but causes visible drift from Minecraft style once textures are enabled.

**Files:**
- Modify: `src/render/VoxelMesh.tsx`

- [ ] When `textureSet === 'minecraft'`, set fence post and fence rail instance colors to white instead of the varied `blockColors.fence` tint.
- [ ] Keep the current varied colors in flat-color mode.
- [ ] Verify this behavior matches how logs and branches already behave in Minecraft mode.

### Notes

- If a later feature intentionally adds tinting on top of texture packs, it should be a separate user-facing option. Do not mix that into the base fence texturing pass.

---

## Task 7: Verification

Fence rendering now depends on atlas contents, geometry UVs, and connectivity-driven placement. Verification needs to cover all three.

**Files:**
- Modify: `tests/core/renderBuffer.test.ts`
- Add tests where useful for atlas lookups or material input selection

- [ ] Add or extend tests that verify fence connectivity still produces the expected number of posts and rails after the render-buffer changes.
- [ ] Add a test around fence texture lookup so `minecraftPalette.fence` resolves the expected atlas cell.
- [ ] Add tests around Minecraft block preset/category lists so plank blocks are selectable for `log` and `branch`.
- [ ] Add a test around cube texture lookup so selectable plank IDs resolve to the expected atlas cell for all faces.
- [ ] Manual-check these cases in the app with `textureSet = 'minecraft'`:
  - isolated fence post
  - straight run
  - corner
  - T-junction
  - four-way connection
  - bamboo preset or a forced bamboo fence palette selection
- [ ] Compare oak fence and bamboo fence side-by-side to verify:
  - oak uses the plank texture
  - bamboo uses the dedicated bamboo fence texture
  - rails/posts are not visibly stretched or blurred
- [ ] Manual-check the palette UI:
  - planks are available in the `log` selector
  - planks are available in the `branch` selector
  - selecting a plank updates full-cube logs/branches with the plank texture, while fence rendering still follows `minecraftPalette.fence`

---

## Suggested Implementation Order

1. Update the shared texture plans to reflect that plank and bamboo fence source files already exist locally.
2. Expand the atlas and selectable block mappings so plank blocks work for `log` and `branch`, while fence IDs still map correctly.
3. Add fence texture metadata lookup in `src/textures/`.
4. Implement authored fence geometries with fixed UVs.
5. Update render-buffer transforms so fences place/orient authored geometry correctly.
6. Add the textured fence material and wire it into `VoxelMesh`.
7. Neutralize fence instance colors in Minecraft mode.
8. Regenerate the atlas and do manual visual verification.

---

## Expected Outcome

After this plan is complete:

- Fence branches render with Minecraft-style textures in Minecraft texture mode.
- Plank blocks are selectable in the `log` and `branch` Minecraft palette rows and render as textured full cubes.
- Oak/spruce/birch/jungle/acacia/dark_oak/mangrove/cherry fences inherit their plank textures.
- Bamboo fence uses its own dedicated texture.
- Fence posts and rails look like authored Minecraft geometry rather than textured stretched cubes.
- Flat-color mode continues to behave exactly as it does now.
