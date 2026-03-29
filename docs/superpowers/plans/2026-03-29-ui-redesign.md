# Treevoxel UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the entire Treevoxel sidebar UI with the Woodland Blend color palette, Fraunces typography, a branded header, and vertical tab navigation — without changing any component logic or state management.

**Architecture:** This is a pure visual redesign. Every change is CSS or static markup. No component hierarchy, state management, or 3D rendering logic changes. The work progresses bottom-up: foundation (fonts, colors, globals) first, then layout (header, tabs), then individual components.

**Tech Stack:** CSS Modules, Google Fonts (Fraunces), HTML

**Design Spec:** `docs/superpowers/specs/2026-03-29-ui-redesign-design.md`

---

### Task 1: Foundation — Font Loading, HTML Title, Global Styles

**Files:**
- Modify: `index.html:1-13`
- Modify: `src/index.css:1-16`

- [ ] **Step 1: Update `index.html` — add Fraunces font and fix title**

Replace the entire contents of `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700&display=swap"
      rel="stylesheet"
    />
    <title>Treevoxel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Changes: added Google Fonts preconnect + Fraunces stylesheet link (weights 400–700 with `opsz` axis), changed `<title>` from "vite-temp" to "Treevoxel".

- [ ] **Step 2: Update `src/index.css` — global font, background, text color**

Replace the entire contents of `src/index.css` with:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  overflow: hidden;
  font-family: 'Fraunces', Georgia, serif;
  background: #15130f;
  color: #c8b89a;
  -webkit-font-smoothing: antialiased;
  line-height: 1.4;
}
```

Changes: font family from Inter/system-ui to `'Fraunces', Georgia, serif`. Background from `#0f0f1a` to `#15130f`. Text from `#e0e0e0` to `#c8b89a`. Added `line-height: 1.4`.

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

Open the app. Confirm:
- Page title in browser tab reads "Treevoxel"
- All text renders in Fraunces serif font (visible difference from the previous sans-serif)
- Background is dark warm brown instead of dark blue
- Text is warm tan `#c8b89a` instead of cool gray

- [ ] **Step 4: Commit**

```bash
git add index.html src/index.css
git commit -m "style: add Fraunces font, update title and global colors"
```

---

### Task 2: Sidebar Layout, Header/Branding, and Tab Navigation

**Files:**
- Modify: `src/App.tsx:36-103`
- Modify: `src/App.module.css:1-121`

- [ ] **Step 1: Update `src/App.tsx` — add header and restructure tabs with icons**

Replace lines 37–97 (the `<aside>` element and its contents) with:

```tsx
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <div className={styles.branding}>
            <img src="/logo.svg" alt="Treevoxel" className={styles.logo} />
            <div className={styles.brandText}>
              <span className={styles.appTitle}>Treevoxel</span>
              <span className={styles.subtitle}>Voxel tree authoring tool</span>
            </div>
          </div>
        </header>

        <div className={styles.separator} />

        <nav className={styles.tabBar} role="tablist" aria-label="Tool panels">
          {([
            { id: 'settings' as const, icon: '\u2699', label: 'Settings' },
            { id: 'layers' as const, icon: '\u25eb', label: 'Layers' },
            { id: 'community' as const, icon: '\u2666', label: 'Community' },
            { id: 'about' as const, icon: '\u2139', label: 'About' },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.separator} />

        <div className={styles.panelBody}>
          {activeTab === 'settings' ? (
            <div className={styles.settingsPanel} role="tabpanel" aria-label="Settings">
              <ParameterPanel />
            </div>
          ) : activeTab === 'layers' ? (
            <div className={styles.layersPanel} role="tabpanel" aria-label="Layers">
              <LayerBrowser />
            </div>
          ) : activeTab === 'community' ? (
            <div className={styles.communityPanel} role="tabpanel" aria-label="Community">
              <CommunityPanel />
            </div>
          ) : (
            <div className={styles.aboutPanel} role="tabpanel" aria-label="About">
              <AboutPanel />
            </div>
          )}
        </div>
      </aside>
```

Changes: added `<header>` block with logo image, title, and subtitle. Wrapped tabs in a `<nav>`. Each tab now renders an icon + label. Added separator `<div>`s between header/tabs/panel.

- [ ] **Step 2: Rewrite `src/App.module.css`**

Replace the entire contents of `src/App.module.css` with:

```css
/* ── Layout ── */

.layout {
  display: grid;
  grid-template-areas:
    'viewport'
    'sidebar';
  grid-template-rows: minmax(0, 1fr) minmax(320px, 50dvh);
  height: 100dvh;
  overflow: hidden;
  background: #15130f;
}

.viewport {
  grid-area: viewport;
  position: relative;
  min-height: 0;
  background: #1c1a14;
}

.sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: rgba(21, 19, 15, 0.96);
  border-top: 1px solid rgba(138, 125, 106, 0.2);
  box-shadow: 0 -20px 48px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(18px);
  padding: 0 20px;
}

/* ── Header / Branding ── */

.header {
  padding: 20px 0 16px;
}

.branding {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  height: 32px;
  width: auto;
}

.brandText {
  display: flex;
  flex-direction: column;
}

.appTitle {
  font-size: 20px;
  font-weight: 700;
  color: #c8b89a;
  line-height: 1.2;
}

.subtitle {
  font-size: 13px;
  font-weight: 400;
  color: #8a7d6a;
}

/* ── Separator ── */

.separator {
  height: 1px;
  background: #261f16;
  flex-shrink: 0;
}

/* ── Tab Navigation ── */

.tabBar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 12px 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #5c4a32;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
}

.tab:hover {
  background: #3a3025;
}

.tabActive {
  background: #261f16;
  color: #c8b89a;
}

.tabIcon {
  font-size: 14px;
  line-height: 1;
}

.tab:focus-visible {
  outline: 2px solid #7a8a5a;
  outline-offset: -2px;
}

/* ── Panel Body ── */

.panelBody {
  flex: 1 1 auto;
  min-height: 0;
}

.settingsPanel,
.layersPanel,
.communityPanel,
.aboutPanel {
  height: 100%;
  min-height: 0;
}

.settingsPanel {
  display: flex;
  flex-direction: column;
}

.communityPanel,
.aboutPanel {
  padding: 12px 0 14px;
}

/* ── Desktop ── */

@media (min-width: 960px) {
  .layout {
    grid-template-areas: 'sidebar viewport';
    grid-template-columns: 520px minmax(0, 1fr);
    grid-template-rows: 100dvh;
  }

  .sidebar {
    border-top: none;
    border-right: 1px solid rgba(138, 125, 106, 0.2);
    box-shadow: 20px 0 48px rgba(0, 0, 0, 0.28);
  }

  .tabBar {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 0;
  }

  .tab {
    width: 100%;
    min-height: 40px;
  }
}
```

Changes: warm brown color palette throughout. Sidebar width 520px on desktop (up from 420px). Header/branding styles. Tabs are vertical stack on desktop, 2x2 grid on mobile. Removed all blue accent colors and gradients.

- [ ] **Step 3: Add a placeholder logo**

The spec says the user will provide `/logo.svg`. For now, create a minimal placeholder so the `<img>` tag doesn't break:

```bash
# Check if logo.svg already exists in public/
ls public/logo.svg 2>/dev/null || echo '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#7a8a5a"/><text x="16" y="22" text-anchor="middle" fill="#15130f" font-size="18" font-weight="bold">T</text></svg>' > public/logo.svg
```

- [ ] **Step 4: Verify in browser**

Confirm:
- Header shows logo + "Treevoxel" title + subtitle
- Separator line between header and tabs
- Desktop: tabs are vertical full-width stack
- Mobile (resize below 960px): tabs become 2x2 grid
- Active tab has `#261f16` background, inactive tabs are dim `#5c4a32`
- Hovering inactive tab shows `#3a3025` background
- Sidebar is 520px wide on desktop

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.module.css public/logo.svg
git commit -m "style: add branded header and vertical tab navigation"
```

---

### Task 3: Parameter Slider Restyling

**Files:**
- Modify: `src/ui/ParameterSlider.module.css:1-102`

- [ ] **Step 1: Rewrite `src/ui/ParameterSlider.module.css`**

Replace the entire contents with:

```css
.container {
  margin-bottom: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.label {
  font-size: 12.5px;
  font-weight: 400;
  color: #c8b89a;
  cursor: help;
  border-bottom: 1px dotted #5c4a32;
}

.value {
  font-size: 12.5px;
  font-weight: 600;
  color: #8a7d6a;
  font-variant-numeric: tabular-nums;
}

.slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 16px;
  touch-action: none;
}

.track {
  position: relative;
  flex-grow: 1;
  height: 3px;
  background: #261f16;
  border-radius: 2px;
}

.range {
  position: absolute;
  height: 100%;
  background: #7a8a5a;
  border-radius: 2px;
}

.thumb {
  display: block;
  width: 12px;
  height: 12px;
  background: #8fa06a;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: grab;
  transition: transform 100ms ease;
}

.thumb:hover {
  background: #8fa06a;
  transform: scale(1.25);
}

.thumb:focus-visible {
  box-shadow: 0 0 0 3px rgba(122, 138, 90, 0.4);
}

.tooltip {
  background: #1e1b14;
  border: 1px solid #3a3025;
  border-radius: 6px;
  padding: 10px 12px;
  max-width: 260px;
  font-size: 12px;
  color: #c8b89a;
  z-index: 100;
}

.tooltipDesc {
  margin-bottom: 6px;
  line-height: 1.4;
}

.tooltipEffect {
  font-size: 11px;
  color: #8a7d6a;
  margin-top: 2px;
}

.up {
  color: #7a8a5a;
  font-weight: bold;
}

.down {
  color: #c4956a;
  font-weight: bold;
}

.tooltipArrow {
  fill: #3a3025;
}
```

Changes: all blues replaced with woodland palette. Track `#261f16`, fill `#7a8a5a`, thumb `#8fa06a`. Tooltip uses `bg-surface` colors. Up/down indicators use accent-primary/accent-warm.

- [ ] **Step 2: Verify in browser**

Open Settings tab. Confirm:
- Slider tracks are dark brown `#261f16`
- Filled range is muted green `#7a8a5a`
- Thumb is lighter green, grows on hover
- Tooltips have warm brown background
- Labels are warm tan, values are secondary brown

- [ ] **Step 3: Commit**

```bash
git add src/ui/ParameterSlider.module.css
git commit -m "style: restyle parameter sliders with woodland palette"
```

---

### Task 4: Parameter Group Restyling

**Files:**
- Modify: `src/ui/ParameterGroup.module.css:1-42`

- [ ] **Step 1: Rewrite `src/ui/ParameterGroup.module.css`**

Replace the entire contents with:

```css
.container {
  margin-bottom: 4px;
}

.header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  background: none;
  border: none;
  border-bottom: 1px solid #261f16;
  color: #7a8a5a;
  cursor: pointer;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}

.header:hover {
  color: #8fa06a;
}

.chevron {
  font-size: 10px;
  width: 16px;
  color: #7a8a5a;
}

.title {
  flex: 1;
}

.count {
  font-size: 11px;
  color: #5c4a32;
  font-weight: 400;
}

.body {
  padding: 8px 0 4px 4px;
}
```

Changes: header text uses accent-primary `#7a8a5a`. Chevron matches accent. Divider uses `#261f16`. Count uses disabled text color. Hover uses accent-hover.

- [ ] **Step 2: Verify in browser**

Confirm parameter group headings are muted green, dividers are warm brown, chevrons match accent color.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ParameterGroup.module.css
git commit -m "style: restyle parameter groups with woodland palette"
```

---

### Task 5: Parameter Panel and Scrollbar Restyling

**Files:**
- Modify: `src/ui/ParameterPanel.module.css:1-234`

- [ ] **Step 1: Rewrite `src/ui/ParameterPanel.module.css`**

Replace the entire contents with:

```css
.root {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.viewport {
  height: 100%;
  width: 100%;
}

.inner {
  padding: 8px 0 16px;
}

.featuredSection {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.seedButton {
  width: 100%;
  min-height: 42px;
  padding: 8px 14px;
  margin-bottom: 16px;
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  color: #c8b89a;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease;
}

.seedButton:hover {
  background: #3a3025;
}

.colorSection {
  margin-bottom: 18px;
  padding: 12px;
  background: #1e1b14;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
}

.colorSectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.colorSectionTitle {
  font-size: 12px;
  font-weight: 600;
  color: #7a8a5a;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.colorSectionCount {
  font-size: 11px;
  color: #5c4a32;
}

.colorGrid {
  display: grid;
  gap: 10px;
}

.colorField {
  display: grid;
  gap: 6px;
}

.colorLabel {
  font-size: 12px;
  color: #8a7d6a;
}

.colorControl {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.colorInput {
  width: 36px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 6px;
  cursor: pointer;
}

.colorInput::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.colorInput::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}

.colorValue {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 6px;
  color: #c8b89a;
  font-size: 12px;
  letter-spacing: 0.06em;
}

.stats {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 11px;
  color: #8a7d6a;
  border-top: 1px solid #261f16;
  margin-top: 8px;
}

.exportSection {
  display: grid;
  gap: 12px;
  margin-top: 8px;
  padding: 14px;
  background: #1e1b14;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
}

.exportTitle {
  font-size: 11px;
  color: #7a8a5a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.exportButtons {
  display: grid;
  gap: 6px;
}

.exportButton {
  min-height: 42px;
  padding: 6px 10px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 12px;
  font-weight: 500;
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  color: #c8b89a;
  cursor: pointer;
  transition: background 140ms ease;
}

.exportButton:hover {
  background: #3a3025;
}

.scrollbar {
  display: flex;
  width: 6px;
  padding: 2px;
  background: transparent;
  touch-action: none;
}

.thumb {
  flex: 1;
  background: #3a3025;
  border-radius: 3px;
}

.thumb:hover {
  background: #5c4a32;
}

.categoricalParam {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-left: 4px;
}

.categoricalLabel {
  font-size: 12px;
  color: #8a7d6a;
}

.categoricalTrigger {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 5px 10px;
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  color: #c8b89a;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 12px;
  cursor: pointer;
}

.categoricalContent {
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  padding: 4px;
  z-index: 100;
}

.categoricalItem {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  font-size: 12px;
  color: #c8b89a;
  text-transform: capitalize;
}

.categoricalItem:hover,
.categoricalItem[data-highlighted] {
  background: #3a3025;
  color: #c8b89a;
}
```

Changes: all surfaces use `bg-surface` / `button-bg`. Borders use `border-primary` token. Text colors follow the warm palette. Border-radius standardized to `8px`. Scrollbar thumb uses `#3a3025` with `#5c4a32` on hover.

- [ ] **Step 2: Verify in browser**

Confirm:
- Scrollbar thumb is warm brown
- Seed button, export buttons use `#261f16` background
- Color section uses `bg-surface` background
- Categorical dropdowns match woodland palette
- Stats text is secondary warm tone

- [ ] **Step 3: Commit**

```bash
git add src/ui/ParameterPanel.module.css
git commit -m "style: restyle parameter panel, scrollbar, and dropdowns"
```

---

### Task 6: Preset Selector Restyling

**Files:**
- Modify: `src/ui/PresetSelector.module.css:1-104`

- [ ] **Step 1: Rewrite `src/ui/PresetSelector.module.css`**

Replace the entire contents with:

```css
.container {
  width: 100%;
  min-width: 0;
  margin-bottom: 16px;
}

.label {
  display: block;
  font-size: 11px;
  color: #8a7d6a;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 8px 12px;
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  color: #c8b89a;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 140ms ease;
}

.trigger > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger:hover {
  border-color: rgba(138, 125, 106, 0.4);
}

.icon {
  font-size: 10px;
  color: #5c4a32;
}

.content {
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  padding: 4px;
  z-index: 100;
  min-width: var(--radix-select-trigger-width);
}

.item {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  font-size: 13px;
  color: #c8b89a;
}

.item:hover,
.item[data-highlighted] {
  background: #3a3025;
}

.item[data-state='checked'] {
  color: #7a8a5a;
}

.itemDesc {
  font-size: 11px;
  color: #5c4a32;
  margin-top: 2px;
}

@media (max-width: 380px) {
  .container {
    margin-bottom: 14px;
  }

  .label {
    font-size: 10px;
    margin-bottom: 5px;
  }

  .trigger {
    padding: 7px 10px;
    font-size: 12px;
  }

  .icon {
    font-size: 9px;
  }

  .item {
    padding: 7px 10px;
    font-size: 12px;
  }

  .itemDesc {
    font-size: 10px;
  }
}
```

Changes: dropdown background uses `button-bg`. Selected item highlighted with accent color. All colors follow woodland palette.

- [ ] **Step 2: Verify in browser**

Open the preset dropdown. Confirm warm brown background, green accent on selected item, hover states work.

- [ ] **Step 3: Commit**

```bash
git add src/ui/PresetSelector.module.css
git commit -m "style: restyle preset selector dropdown"
```

---

### Task 7: Toolbar Restyling

**Files:**
- Modify: `src/ui/Toolbar.module.css:1-36`

- [ ] **Step 1: Rewrite `src/ui/Toolbar.module.css`**

Replace the entire contents with:

```css
.toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  z-index: 10;
  pointer-events: none;
}

.toggle {
  min-height: 34px;
  padding: 6px 10px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 11px;
  font-weight: 500;
  background: rgba(21, 19, 15, 0.85);
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  color: #5c4a32;
  cursor: pointer;
  backdrop-filter: blur(4px);
  pointer-events: auto;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}

.toggle:hover {
  border-color: rgba(138, 125, 106, 0.4);
  color: #8a7d6a;
}

.active {
  color: #c8b89a;
  background: rgba(38, 31, 22, 0.92);
  border-color: #7a8a5a;
}
```

Changes: toolbar buttons use sidebar surface colors. Active state uses accent-primary border. Inactive text is `text-disabled`. Border-radius `8px`.

- [ ] **Step 2: Verify in browser**

Confirm toolbar toggles in the viewport use warm palette, active toggles have green border.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Toolbar.module.css
git commit -m "style: restyle viewport toolbar"
```

---

### Task 8: Layer Browser Restyling

**Files:**
- Modify: `src/ui/LayerBrowser.module.css:1-148`

- [ ] **Step 1: Rewrite `src/ui/LayerBrowser.module.css`**

Replace the entire contents with:

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px 0 14px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: #c8b89a;
}

.layerInfo {
  font-size: 12px;
  color: #8a7d6a;
  font-variant-numeric: tabular-nums;
}

.slider {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 16px;
  margin-bottom: 12px;
  touch-action: none;
}

.track {
  position: relative;
  flex-grow: 1;
  height: 4px;
  background: #261f16;
  border-radius: 2px;
}

.range {
  position: absolute;
  height: 100%;
  background: #7a8a5a;
  border-radius: 2px;
}

.thumb {
  display: block;
  width: 18px;
  height: 18px;
  background: #8fa06a;
  border-radius: 50%;
  border: 3px solid #7a8a5a;
  outline: none;
  cursor: grab;
  box-shadow: 0 0 0 4px rgba(122, 138, 90, 0.16);
}

.gridContainer {
  flex: 1 1 auto;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 10px;
  background: #1e1b14;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
}

.axisFrame {
  display: grid;
  gap: 0;
  align-items: start;
  justify-items: start;
}

.corner,
.axisCell {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a7d6a;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.corner {
  width: 100%;
  height: 100%;
  color: #7a8a5a;
  font-size: 9px;
  letter-spacing: 0.08em;
}

.grid {
  display: grid;
  gap: 0;
  border: 1px solid #261f16;
}

.cell {
  width: 100%;
  height: 100%;
}

.empty {
  color: #5c4a32;
  font-size: 12px;
}

.controls {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.navBtn {
  flex: 1;
  min-height: 42px;
  padding: 6px 12px;
  background: #261f16;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  color: #c8b89a;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease;
}

.navBtn:hover:not(:disabled) {
  background: #3a3025;
}

.navBtn:disabled {
  opacity: 0.3;
  cursor: default;
}
```

Changes: layer slider uses green fill/thumb. Grid container uses `bg-surface`. Navigation buttons follow standard button styling. All colors woodland palette.

- [ ] **Step 2: Verify in browser**

Switch to Layers tab. Confirm slider, grid, and nav buttons all use the warm palette.

- [ ] **Step 3: Commit**

```bash
git add src/ui/LayerBrowser.module.css
git commit -m "style: restyle layer browser"
```

---

### Task 9: About Panel Restyling

**Files:**
- Modify: `src/ui/AboutPanel.module.css:1-83`

- [ ] **Step 1: Rewrite `src/ui/AboutPanel.module.css`**

Replace the entire contents with:

```css
.container {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: auto;
}

.header {
  display: grid;
  gap: 8px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #c8b89a;
}

.copy {
  margin: 0;
  color: #8a7d6a;
  font-size: 13px;
  line-height: 1.6;
}

.copy code {
  color: #c8b89a;
  font-family: inherit;
}

.inlineLink {
  color: #7a8a5a;
  text-decoration: none;
}

.inlineLink:hover {
  color: #8fa06a;
  text-decoration: underline;
}

.section {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
  background: #1e1b14;
}

.sectionTitle {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7a8a5a;
}

.referenceList {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
}

.referenceItem {
  color: #8a7d6a;
  font-size: 13px;
  line-height: 1.5;
}

.referenceLink {
  color: #7a8a5a;
  text-decoration: none;
}

.referenceLink:hover {
  color: #8fa06a;
  text-decoration: underline;
}
```

Changes: links use accent-primary green. Section backgrounds use `bg-surface`. All text colors follow woodland palette.

- [ ] **Step 2: Commit**

```bash
git add src/ui/AboutPanel.module.css
git commit -m "style: restyle about panel"
```

---

### Task 10: Community Panel Restyling

**Files:**
- Modify: `src/ui/CommunityPanel.module.css:1-221`

- [ ] **Step 1: Rewrite `src/ui/CommunityPanel.module.css`**

Replace the entire contents with:

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  overflow: auto;
  padding-right: 2px;
}

.card,
.browser {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: #1e1b14;
  border: 1px solid rgba(138, 125, 106, 0.2);
  border-radius: 8px;
}

.sectionHeader,
.browserHeader {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7a8a5a;
}

.title {
  font-size: 20px;
  color: #c8b89a;
}

.copy {
  color: #8a7d6a;
  font-size: 13px;
  line-height: 1.5;
}

.form,
.reviewList {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: #c8b89a;
}

.input {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(138, 125, 106, 0.2);
  background: #15130f;
  color: #c8b89a;
  font-family: 'Fraunces', Georgia, serif;
}

.primaryButton,
.secondaryButton {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(138, 125, 106, 0.2);
  font-family: 'Fraunces', Georgia, serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 140ms ease;
}

.primaryButton {
  background: #7a8a5a;
  color: #15130f;
  border-color: #7a8a5a;
}

.primaryButton:hover {
  background: #8fa06a;
}

.secondaryButton {
  background: #261f16;
  color: #c8b89a;
}

.secondaryButton:hover {
  background: #3a3025;
}

.primaryButton:disabled,
.secondaryButton:disabled {
  opacity: 0.6;
  cursor: default;
}

.status,
.empty,
.creationMeta,
.previewMeta {
  font-size: 12px;
  color: #8a7d6a;
}

.browserBody {
  display: grid;
  gap: 12px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.creationCard,
.reviewCard,
.preview {
  border-radius: 8px;
  border: 1px solid rgba(138, 125, 106, 0.2);
  background: #15130f;
}

.creationCard {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.creationCardActive {
  border-color: #7a8a5a;
  background: #261f16;
}

.creationName,
.previewName {
  color: #c8b89a;
  font-size: 14px;
  font-weight: 700;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

.previewHeader,
.reviewSummary,
.adminBar,
.reviewActions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.snapshotMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.snapshotMeta span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #261f16;
  color: #c8b89a;
  font-size: 11px;
}

.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.paletteItem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #15130f;
  border: 1px solid rgba(138, 125, 106, 0.2);
  color: #c8b89a;
  font-size: 11px;
}

.paletteSwatch {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 0 0 1px rgba(21, 19, 15, 0.42);
}

.reviewCard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

@media (min-width: 960px) {
  .browserBody {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    align-items: start;
  }
}
```

Changes: primary button uses accent green with dark text. Cards/surfaces use warm palette. All blues replaced with earthy tones. Active card uses accent border.

- [ ] **Step 2: Verify in browser**

Switch to Community tab. Confirm cards, buttons, inputs, and metadata pills all use the woodland palette.

- [ ] **Step 3: Commit**

```bash
git add src/ui/CommunityPanel.module.css
git commit -m "style: restyle community panel"
```

---

### Task 11: Final Verification and Viewport Background

**Files:**
- Modify: `src/App.module.css` (viewport background — already done in Task 2, just verify)

- [ ] **Step 1: Full visual walkthrough**

With the dev server running, check every tab and interactive element:

1. **Settings tab**: sliders, color pickers, preset dropdown, seed button, parameter groups, export buttons, scrollbar
2. **Layers tab**: layer slider, 2D grid, nav buttons
3. **Community tab**: form inputs, submit button, creation cards, preview cards
4. **About tab**: headings, links, reference sections
5. **Toolbar**: all toggle states (active/inactive/hover)
6. **Responsive**: resize below 960px — tabs should become 2x2 grid, sidebar becomes bottom sheet

- [ ] **Step 2: Check focus states**

Tab through the UI with keyboard. Confirm:
- Focus-visible ring is `#7a8a5a` on tabs
- Slider thumb shows green ring on focus
- All interactive elements are reachable

- [ ] **Step 3: Final commit if any touch-ups were needed**

```bash
git add -A
git commit -m "style: final UI redesign touch-ups"
```
