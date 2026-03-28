# TreeVoxel Research

Date: 2026-03-28

## Project Intent

`treevoxel` is now a research and product-design project for interactive voxel tree authoring.

The core loop is:

1. choose a species preset or start from a blank tree archetype,
2. adjust morphology parameters that define the tree,
3. see the tree update immediately in a 3D voxel viewport,
4. inspect the same result as stacked 2D build layers from ground to canopy,
5. export a build-ready Minecraft-style tree.

The project is no longer centered on image-to-3D reconstruction. The main problem is:

"How do we expose biologically meaningful tree parameters in a way that stays understandable to a user, produces believable species-specific trees, and remains practical for voxel building?"

## Executive Summary

The most practical first version is:

- frontend: `TypeScript + Vite + React + @react-three/fiber + three.js`
- UI/state: `zustand` plus a custom parameter inspector, with `leva` used only if it accelerates prototyping
- generation model: parameter-driven procedural skeleton plus voxelization
- presets: species families and growth forms grounded in plant architecture and allometry
- rendering: `InstancedMesh` cubes for the 3D viewport
- secondary visualization: a layer browser that shows one 2D slice at a time, from trunk base to crown top
- interaction model: any parameter change updates both views in real time

The strongest direction is a dual representation:

- a procedural tree skeleton and canopy model that responds to parameters,
- a derived voxel structure used for rendering, layer inspection, and export.

This keeps the model editable and explainable. It also lets the product teach the user what each parameter does instead of acting like a black-box generator.

## 1. Product Direction After The Pivot

### What the tool should be

TreeVoxel should be a browser-based tree morphology sandbox for voxel builders.

Key characteristics:

- every visible result comes from editable parameters
- presets start from real tree categories rather than arbitrary fantasy shapes
- the interface explains each parameter in plain language
- the output is optimized for block-based construction, not only visual realism

### What the tool should not be, for now

Do not treat these as the core product:

- single-image to 3D tree reconstruction
- photogrammetry workflows
- AI inference from reference photos
- black-box generation with hidden controls

Those may remain later research branches, but they should not drive the initial architecture or the document's main thesis.

## 2. User Experience Requirements

The app should revolve around two synchronized views.

### A. 3D voxel view

The 3D view should support:

- orbit, pan, and zoom
- toggling trunk, branches, and leaf blocks
- optional grid and axis helpers
- block palette preview
- fast updates while parameters change

This is the main design and inspection surface.

### B. Layer view

The layer view should show discrete horizontal slices from the ground to the top of the tree.

It should support:

- stepping through `y` levels one by one
- scrubbing through all layers with a slider
- seeing each layer as a 2D block map
- optionally showing the current layer highlight inside the 3D viewport
- quickly identifying build order and canopy density

This view is essential for Minecraft usability because it converts a complex 3D object into buildable instructions.

### C. Parameter explanation as a first-class feature

Every adjustable parameter should have:

- a readable label
- a short explanation of what it controls
- a note about the visible effect of increasing or decreasing it
- a sensible numeric range or categorical set
- a default value inherited from the selected preset

The UI should help users learn tree structure, not just expose raw variables.

## 3. Web App Stack Possibilities

### Recommended baseline: React + Three.js via React Three Fiber

Why this is the best starting point:

- `three.js` is the most established low-level web 3D library for custom voxel rendering and camera controls.
- `@react-three/fiber` gives a practical way to combine 3D scenes with a complex parameter-editing UI.
- React is well suited for inspector panels, preset management, explanation copy, saved configurations, and synchronized secondary views.
- The layer view is essentially another representation of the same state, which fits React's data flow well.

Suggested stack:

- `Vite`
- `TypeScript`
- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `zustand`
- lightweight CSS system or component primitives, rather than a heavy design framework

Important performance notes:

- use `frameloop="demand"` when nothing is changing
- render voxels with `InstancedMesh`
- keep generation logic separate from rendering logic
- debounce only expensive exports, not the core viewport updates

### Alternative: Babylon.js

`Babylon.js` is viable if the app evolves into a more engine-like editor, but it is probably not the fastest path for early iteration on morphology controls and layered inspection panels.

### Alternative: PlayCanvas

`PlayCanvas` is attractive for runtime performance, but the current problem is tool design, parameter UX, and research iteration. React remains the more pragmatic starting point.

## 4. Recommended Data Model

### A. Sparse voxel set

Store only occupied cells.

Recommended shape:

- chunked sparse coordinates
- explicit block types such as `log`, `leaf`, and optional markers

Why:

- trees are sparse structures
- the layer view can cheaply query one height band at a time
- export to Minecraft-like formats remains straightforward

### B. Skeleton plus derived voxels

This is the core architectural choice.

Store:

1. a skeleton and canopy description,
2. a voxelized result derived from that model.

Suggested skeleton fields:

- node position
- parent node
- branch order
- segment length
- segment radius
- growth direction
- branch role such as trunk, scaffold, secondary, twig

Suggested preset and parameter fields:

- species or growth-form id
- total height
- trunk height ratio
- trunk taper
- branch density by height
- branch angle ranges
- branch length decay by order
- crown width
- crown depth
- crown envelope shape
- droop or upward tropism
- asymmetry
- leaf cluster size
- leaf density
- pruning or self-shading strength
- randomness seed

Why this representation matters:

- parameters map naturally onto a branching model
- explanations can refer to understandable structures
- the same tree can be re-voxelized at different resolutions or palettes
- the layer view stays a projection of the same underlying state, not a separate artifact

## 5. Parameter Taxonomy For The First Version

The app should not expose an arbitrary list of sliders. It should group controls by meaning.

### A. Global dimensions

- `height`: total tree height in blocks
- `crownWidth`: maximum lateral spread
- `crownDepth`: how much of the height is occupied by canopy
- `resolutionScale`: optional multiplier if the same morphology is generated at different voxel densities

### B. Trunk structure

- `trunkBaseRadius`: trunk thickness near the ground
- `trunkTaper`: how quickly the trunk narrows with height
- `trunkLean`: overall tilt of the trunk axis
- `clearTrunkHeight`: height before major scaffold branches emerge
- `trunkCurvature`: whether the trunk stays straight or bends gradually

### C. Branching structure

- `primaryBranchCount`: number of major scaffold branches
- `branchStartHeight`: normalized height where branches begin
- `branchAngle`: average emergence angle from the parent axis
- `branchAngleVariance`: how much that angle varies
- `branchLengthRatio`: branch length relative to parent or trunk scale
- `branchOrderDepth`: how many branching levels are generated
- `branchDensity`: how many branches appear within active regions
- `branchDroop`: tendency for branches to curve downward
- `apicalDominance`: how strongly the central leader suppresses lateral growth

### D. Crown and canopy

- `crownShape`: conical, spherical, ovoid, columnar, vase, weeping, irregular
- `crownFullness`: how densely the crown volume is occupied
- `canopyBiasTopBottom`: whether foliage concentrates near the top or fills the full crown
- `leafClusterRadius`: typical leaf blob size around fine branches
- `leafDensity`: amount of foliage produced per terminal region
- `interiorLeafPruning`: how aggressively shaded interior leaves are removed

### E. Environmental and style modifiers

- `phototropism`: tendency to grow upward or toward open space
- `windBias`: asymmetry or persistent bend in one direction
- `competitionBias`: how narrow and vertical the tree becomes under crowding
- `age`: young, mature, old growth bias
- `randomSeed`: deterministic variation

### F. Minecraft readability modifiers

- `minBranchThickness`: prevent branches that collapse into noisy one-block artifacts
- `leafCleanup`: remove floating or isolated leaves
- `symmetryAssist`: optional reduction of awkward random noise
- `buildabilityBias`: prioritize clearer silhouettes over botanical detail

## 6. How To Explain Parameters In The Product

Each control should be documented in a consistent format.

Recommended schema:

- parameter name
- short definition
- what increasing it does
- what decreasing it does
- typical range
- species presets where it matters most

Example explanations:

- `Apical Dominance`: controls how strongly the main trunk remains visually dominant over side branches. Higher values produce a clearer central leader. Lower values produce broader, more decurrent crowns.
- `Branch Droop`: controls how much branches bend downward as they extend. Higher values create weeping or heavy-limbed forms. Lower values keep branches level or ascending.
- `Interior Leaf Pruning`: controls how much foliage is removed from shaded inner crown regions. Higher values produce a more open crown shell. Lower values keep the canopy dense throughout.

This documentation should live in the codebase as structured metadata, not only in prose.

## 7. Species Presets And Biological Grounding

### Architectural traits that matter

Plant architecture research describes species through growth and branching structure rather than just silhouette. Useful dimensions include:

- growth pattern: determinate vs indeterminate, rhythmic vs continuous
- branching pattern: monopodial vs sympodial, terminal vs lateral
- axis differentiation: orthotropic vs plagiotropic
- reiteration: repetition of architectural units
- apical control and crown differentiation

These concepts are directly useful for presets and parameter defaults.

### Quantitative grounding

The `Tallo` database is still useful even after the pivot because it can anchor:

- plausible height ranges
- crown diameter ranges
- crown depth ratios
- diameter-to-height relationships

It does not define branch topology directly, but it helps keep presets within real-world scale envelopes.

### Preset strategy

Use a layered preset system:

1. growth form preset
2. species-family preset
3. optional site condition modifier

This is better than pretending that one species name corresponds to one fixed tree.

Examples:

- growth forms: excurrent conifer, rounded decurrent broadleaf, columnar, weeping, open-grown savanna, forest-grown tall canopy
- species-family presets: spruce-like, pine-like, oak-like, maple-like, birch-like, willow-like
- site modifiers: open field, dense forest, wind-exposed, young ornamental

## 8. Procedural Generation Methods

### A. Rule-based scaffold generator

This should be the first implementation.

Use explicit rules for:

- trunk growth
- scaffold branch placement
- branch order decay
- taper
- crown envelope occupancy

Why start here:

- easier to connect parameters to visible outcomes
- easier to explain in the UI
- easier to debug than more emergent methods

### B. Space colonization

This remains highly relevant, especially for broadleaf canopies and competition within a crown envelope.

Why it fits:

- produces more organic crown filling
- parameters are visually meaningful
- works well as a second-stage branch refinement method

Best role in v1 or v2:

- use a rule-based scaffold for the trunk and major limbs
- optionally use space colonization to populate secondary branching inside the envelope

### C. L-systems

Still useful for research, especially for conifer-like or stylized trees, but less ideal as the first user-facing generator if the goal is intuitive parameter explanation.

### Recommended algorithmic thesis

Start with a hybrid:

- deterministic scaffold from interpretable morphology rules
- controlled randomness for variation
- optional space-colonization pass for finer structure
- voxelization and cleanup tuned for buildability

## 9. Rendering And View Synchronization

### 3D rendering

First implementation:

- one cube geometry
- one material per block category or a small material palette
- `InstancedMesh` transforms for all voxels

This is the correct starting point because it matches the final artifact and keeps debugging simple.

### Layer rendering

The layer view should not be an afterthought.

Implementation ideas:

- compute a `Map<y, 2D occupancy grid>` from the same voxel output
- render a single selected layer plus optional ghosted adjacent layers
- allow keyboard stepping and slider scrubbing
- highlight the selected layer in the 3D viewport

### Synchronization requirement

Any parameter edit should update:

- the procedural tree state
- the voxel result
- the 3D view
- the active layer slice
- the derived metadata such as total block counts and height

This should feel immediate. If generation cost grows, optimize the generator before introducing disconnected "apply" workflows.

## 10. Recommended Research Methodology

The project needs a research method that is defensible and practical.

### A. Build a parameter inventory first

Before adding many sliders, define:

- which parameters represent real morphology
- which are purely Minecraft-readability adjustments
- which are derived from presets and usually hidden

This prevents a messy control surface.

### B. Calibrate presets from three evidence sources

Use:

- plant architecture literature for structural categories
- tree allometry datasets for scale relationships
- visual inspection of real species forms for qualitative tuning

### C. Evaluate by output quality, not only biological accuracy

The generated tree should be judged on:

- species recognizability
- parameter clarity
- controllability
- Minecraft buildability
- frame rate during interaction
- readability in the layer view

### D. Treat explanatory UX as part of the research

An important question is not only "can we generate realistic trees?" It is also:

"Can a user understand why this tree looks the way it does, and predict what a parameter change will do?"

That should be part of the product thesis.

## 11. Out-Of-Scope Or Deferred Research

These are explicitly de-prioritized by the pivot:

- single-image tree reconstruction
- photogrammetry ingestion
- mesh-to-voxel conversion from captured trees
- AI estimation of species from photos

They can remain in a backlog section, but they should not affect the initial architecture or the main document narrative.

## 12. Recommended First Technical Architecture

### Frontend

- `React`
- `TypeScript`
- `Vite`
- `@react-three/fiber`
- `@react-three/drei`
- `zustand`

### Core modules

- `src/core/parameters.ts`
  - parameter definitions, ranges, defaults, explanations
- `src/core/presets.ts`
  - growth forms, species-family presets, site modifiers
- `src/core/treeModel.ts`
  - skeleton and canopy data structures
- `src/core/generators/`
  - scaffold generator
  - optional space colonization refinement
- `src/core/voxelize.ts`
  - model to voxel blocks
- `src/core/layers.ts`
  - voxel blocks to per-height 2D layers
- `src/core/export.ts`
  - JSON or Minecraft-oriented export formats
- `src/render/`
  - 3D instanced voxel renderer
- `src/ui/`
  - parameter panels, explanations, preset selector, layer browser

### State shape

At minimum:

- active preset id
- parameter values
- generation seed
- derived tree model
- derived voxel set
- active layer index
- viewport display toggles

## 13. Hard Problems To Expect

- mapping real morphology concepts to a slider set that non-experts can use
- keeping presets recognizably species-like without overfitting to a single exemplar
- avoiding noisy voxel artifacts in thin branches
- balancing real-time updates with more advanced generation methods
- making the layer view genuinely useful rather than just technically correct
- deciding which controls should stay visible versus advanced
- reconciling biological realism with Minecraft readability

The main tradeoff is:

- realism wants irregular thin structure and dense crown complexity
- buildability wants legible silhouettes, cleaner layers, and chunkier branch logic

The product should bias toward legibility, then add realism where it does not damage usability.

## 14. Concrete Next Step Recommendation

If implementation started immediately, the first vertical slice should be:

1. React + R3F app with orbit controls and an instanced cube renderer.
2. Sparse voxel storage with `log` and `leaf` block types.
3. A rule-based tree generator with one editable archetype.
4. A parameter panel with explanations for:
   - height
   - trunk base radius
   - clear trunk height
   - branch angle
   - branch density
   - crown width
   - crown shape
   - leaf density
   - branch droop
   - randomness seed
5. A layer viewer with a vertical slider for `y` level selection.
6. Three starter presets:
   - spruce-like excurrent
   - oak-like rounded broadleaf
   - willow-like drooping crown
7. Export of block coordinates and layer data.

This is enough to validate the core thesis:

- users can control meaningful tree parameters,
- the result updates in real time,
- the same data supports both artistic inspection and practical Minecraft building.

## References

1. three.js docs, `InstancedMesh`: https://threejs.org/docs/
2. three.js docs, `WebGPURenderer`: https://threejs.org/docs/pages/WebGPURenderer.html
3. React Three Fiber introduction: https://r3f.docs.pmnd.rs/getting-started/introduction
4. React Three Fiber performance guidance: https://r3f.docs.pmnd.rs/advanced/scaling-performance
5. Babylon.js engine specifications: https://www.babylonjs.com/specifications/
6. PlayCanvas graphics docs: https://developer.playcanvas.com/user-manual/graphics/
7. PlayCanvas hardware instancing docs: https://developer.playcanvas.com/user-manual/graphics/advanced-rendering/hardware-instancing/
8. Barthélémy and Caraglio, *Plant Architecture: A Dynamic, Multilevel and Comprehensive Approach to Plant Form, Structure and Ontogeny* (2007): https://pmc.ncbi.nlm.nih.gov/articles/PMC2802949/
9. Jucker et al., *Tallo: A global tree allometry and crown architecture database* (2022): https://pmc.ncbi.nlm.nih.gov/articles/PMC9542605/
10. Prusinkiewicz and Lindenmayer, *The Algorithmic Beauty of Plants*: https://algorithmicbotany.org/papers/
11. Runions, Lane, Prusinkiewicz, *Modeling Trees with a Space Colonization Algorithm* (2007): https://algorithmicbotany.org/papers/colonization.egwnp2007.html
12. OpenVDB documentation, for sparse volumetric data and voxelization-related tooling: https://www.openvdb.org/documentation/
