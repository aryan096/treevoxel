# Expose Hidden Generation Parameters

> Implementation plan for exposing currently hidden user-facing parameters in the Treevoxel UI. Steps use checkbox syntax for tracking.

**Goal:** Expose the live hidden parameters `minBranchThickness`, `leafCleanup`, and `symmetryAssist` in the settings UI so users can control them directly. Keep `buildabilityBias` defined in types/presets/params, but do not wire it into generation yet.

**Scope:** UI exposure only. No change to generation behavior beyond making the existing parameters adjustable from the interface. No attempt to implement `buildabilityBias` semantics in this work.

**Architecture:** The parameter definitions already exist in `src/core/parameters.ts`, and the store already carries these fields through generation. The missing piece is the UI surface in `src/ui/ParameterPanel.tsx`, which currently omits the `minecraft` parameter group entirely. This plan adds a visible group for those controls, re-categorizes `symmetryAssist` into a more intuitive UI section, and adds tests so hidden parameters do not silently disappear again.

**Tech Stack:** React 19, TypeScript, Zustand, Radix UI, Vitest

---

## Decisions

- Expose `minBranchThickness` under `minecraft`.
- Expose `leafCleanup` under `minecraft`.
- Expose `symmetryAssist` in the UI under `branching`, because it changes skeleton layout rather than post-voxel cleanup.
- Keep `buildabilityBias` hidden and documented as intentionally inactive for now.
- Do not change preset values in this task unless UI review reveals discoverability or wording issues.

---

## File Map

| File | Responsibility |
|---|---|
| `src/core/parameters.ts` | Adjust `symmetryAssist` group assignment and optionally annotate `buildabilityBias` as reserved/no-op |
| `src/ui/ParameterPanel.tsx` | Render the `minecraft` group and keep ordering sensible |
| `src/ui/ParameterGroup.tsx` | No expected logic change, but verify the group heading/count behavior still reads correctly |
| `tests/core/parameters.test.ts` | Add assertions that live hidden params are represented and grouped as intended |
| `tests/ui/` or component tests if present later | Optional regression coverage for rendered parameter groups |
| `docs/plans/2026-04-03-expose-hidden-params.md` | This plan |

---

## Task 1: Reclassify `symmetryAssist` for the UI

`symmetryAssist` is currently defined in the `minecraft` group, but the implementation affects scaffold azimuth jitter in skeleton generation. Users will look for it in branching controls, not buildability cleanup controls.

**Files:**
- Modify: `src/core/parameters.ts`
- Modify: `tests/core/parameters.test.ts`

- [ ] Change `symmetryAssist` from group `minecraft` to group `branching` in `PARAMETER_DEFS`.
- [ ] Keep the label, range, and description unless quick wording cleanup is needed during implementation.
- [ ] Add or update a test asserting that `symmetryAssist` is grouped under `branching`.
- [ ] Run `npx vitest run tests/core/parameters.test.ts`.

**Notes:**
- This is a UI categorization change only. It does not alter generation logic.

---

## Task 2: Render the `minecraft` group in the settings panel

The root UI bug is that `ParameterPanel` omits the `minecraft` group from `GROUP_ORDER`, so the group never renders even though the parameter definitions exist.

**Files:**
- Modify: `src/ui/ParameterPanel.tsx`

- [ ] Add `minecraft` to `GROUP_ORDER`.
- [ ] Place it after `crown` and before `environment`, or after `environment` if the visual review reads better. Preferred order: `dimensions`, `trunk`, `branching`, `crown`, `minecraft`, `environment`.
- [ ] Verify that `minBranchThickness` and `leafCleanup` render automatically through the existing `ParameterGroup` pipeline.
- [ ] Confirm that `randomSeed` and `colorRandomness` remain featured controls and do not duplicate inside the environment group.

**Notes:**
- No new component is needed unless visual review shows the section needs custom explanatory copy.

---

## Task 3: Preserve `buildabilityBias` as a visible non-goal

`buildabilityBias` is defined, has defaults and preset values, but is not read anywhere in runtime generation/rendering. It should not be exposed yet because that would present a control that does nothing.

**Files:**
- Modify: `src/core/parameters.ts` if adding code comment or wording tweak
- Modify: this plan only if no code annotation is desired

- [ ] Leave `buildabilityBias` out of the rendered UI.
- [ ] Optionally add a short code comment near its definition noting that it is reserved for future generator simplification/buildability work.
- [ ] Do not rename or remove it in this task, since snapshots/presets already carry the field.

**Notes:**
- If future work implements it, it should remain in the `minecraft` category.

---

## Task 4: Add regression coverage for exposed vs hidden params

The current setup allowed an entire parameter group to exist without being rendered. Add tests that make this drift harder to reintroduce.

**Files:**
- Modify: `tests/core/parameters.test.ts`
- Optional: add a lightweight UI test if the repo already has or wants component-test infrastructure

- [ ] Add a test asserting that the live generator/rendering-facing params intended for user control are present in `PARAMETER_DEFS`.
- [ ] Add a test asserting the intended group mapping:
  `minBranchThickness -> minecraft`
  `leafCleanup -> minecraft`
  `symmetryAssist -> branching`
  `buildabilityBias -> minecraft`
- [ ] If practical without adding new test infrastructure, add a narrow component test for `ParameterPanel` that verifies a Minecraft section renders and contains the two live controls.
- [ ] Run the relevant test subset, then `npm run test`.

**Notes:**
- Do not add a broad snapshot test for the whole panel. The regression we care about is presence and grouping, not markup churn.

---

## Task 5: Visual review and UX cleanup

Once the controls are visible, do a quick manual pass to ensure the grouping reads naturally and the wording does not mislead users.

**Files:**
- Modify as needed: `src/core/parameters.ts`, `src/ui/ParameterPanel.tsx`

- [ ] Verify the labels and descriptions make sense in-context:
  `Min Branch Thickness` should read like branch-vs-fence readability.
  `Leaf Cleanup` should read like floating leaf cleanup.
  `Symmetry Assist` should read like branch distribution symmetry.
- [ ] Check desktop and mobile panel layout for overflow or crowding.
- [ ] Confirm that presets still load these values correctly and changing them updates the model immediately.

---

## Acceptance Criteria

- `minBranchThickness` is visible and adjustable in the UI.
- `leafCleanup` is visible and adjustable in the UI.
- `symmetryAssist` is visible and adjustable in the UI.
- `buildabilityBias` remains hidden.
- No duplicate sliders appear.
- Presets and snapshots continue to round-trip without schema changes.
- Tests cover the intended grouping so hidden live params are less likely to regress.

---

## Implementation Order

1. Reclassify `symmetryAssist` to `branching`.
2. Add the `minecraft` group to `ParameterPanel`.
3. Add parameter/grouping regression tests.
4. Perform manual UI verification and run the full test suite.

---

## Out of Scope

- Implementing behavior for `buildabilityBias`
- Retuning presets for the newly exposed controls
- Adding new generation parameters
- Redesigning the settings panel layout beyond minimal grouping changes
