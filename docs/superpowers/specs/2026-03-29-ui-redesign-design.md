# Treevoxel UI Redesign — Design Spec

## Overview

Comprehensive visual redesign of the Treevoxel sidebar UI. The app is functional but needs stronger visual identity. The redesign covers: color palette, typography, header/branding, tab navigation, and general component styling. The 3D viewport and core layout structure remain unchanged.

## Color Palette — Woodland Blend

Earthy, dark theme with warm browns, muted greens, and stone highlights.

### Backgrounds

| Token              | Value                          | Usage                        |
| ------------------ | ------------------------------ | ---------------------------- |
| `bg-main`          | `#15130f`                      | Root background              |
| `bg-sidebar`       | `rgba(21, 19, 15, 0.96)`      | Sidebar with backdrop blur   |
| `bg-viewport`      | `#1c1a14`                      | 3D viewport background       |
| `bg-surface`       | `#1e1b14`                      | Cards, tooltips, dropdowns   |

### Borders & Dividers

| Token              | Value                          | Usage                        |
| ------------------ | ------------------------------ | ---------------------------- |
| `border-primary`   | `rgba(138, 125, 106, 0.2)`    | Component borders            |
| `border-divider`   | `#261f16`                      | Section separators           |

### Text

| Token              | Value      | Usage                             |
| ------------------ | ---------- | --------------------------------- |
| `text-primary`     | `#c8b89a`  | Main text, active labels          |
| `text-secondary`   | `#8a7d6a`  | Descriptions, secondary labels    |
| `text-disabled`    | `#5c4a32`  | Inactive tabs, disabled controls  |

### Accents

| Token              | Value      | Usage                                   |
| ------------------ | ---------- | --------------------------------------- |
| `accent-primary`   | `#7a8a5a`  | Headings, active states, slider fills   |
| `accent-hover`     | `#8fa06a`  | Hover state for accent elements         |
| `accent-warm`      | `#c4956a`  | Sparingly — highlights, notifications   |

### Interactive Elements

| Token              | Value      | Usage                        |
| ------------------ | ---------- | ---------------------------- |
| `button-bg`        | `#261f16`  | Button backgrounds           |
| `button-hover`     | `#3a3025`  | Button hover state           |
| `slider-track`     | `#261f16`  | Slider track background      |
| `slider-fill`      | `#7a8a5a`  | Slider filled portion        |
| `slider-thumb`     | `#8fa06a`  | Slider thumb                 |

### 3D Viewport (Dark Mode)

| Token              | Value      | Usage                        |
| ------------------ | ---------- | ---------------------------- |
| `viewport-bg`      | `#12100c`  | Scene background             |
| `grid-cell`        | `#4a4030`  | Grid cell lines              |
| `grid-section`     | `#6a5d4a`  | Grid section lines           |
| `layer-highlight`  | `#7a8a5a`  | Active layer highlight       |

## Typography — Fraunces

Single font family across the entire UI. Loaded from Google Fonts.

### Font Stack

```
font-family: 'Fraunces', Georgia, serif;
```

Weights loaded: 400, 500, 600, 700. Fraunces supports the `opsz` (optical size) variable axis for better rendering at small sizes.

### Size Scale

| Element                  | Size     | Weight | Notes                    |
| ------------------------ | -------- | ------ | ------------------------ |
| Logo / app title         | `20px`   | 700    |                          |
| Subtitle                 | `13px`   | 400    | Secondary text color     |
| Panel section headings   | `14px`   | 600    | Accent color             |
| Tab labels               | `13px`   | 500    |                          |
| Parameter labels         | `12.5px` | 400    |                          |
| Parameter values         | `12.5px` | 600    | `font-variant-numeric: tabular-nums` |
| Small / secondary labels | `11px`   | 400    |                          |
| Tiny labels (axes, etc.) | `10px`   | 400    |                          |

### Spacing

- Letter-spacing: minimal by default, `0.06em` for uppercase sections
- Line height: `1.4` for body text, `1.2` for headings

## Header & Branding

Located at the top of the sidebar, above tabs.

### Layout

```
┌──────────────────────────────┐
│  [logo img]  Treevoxel       │  ← 32px logo height, 20px title
│              subtitle text   │  ← 13px, secondary color
│──────────────────────────────│  ← #261f16 separator
│  Tab navigation below...     │
```

- Logo: `<img>` tag pointing to `/logo.svg` (user will provide the asset)
- Title: "Treevoxel", `20px`, weight 700, `#c8b89a`
- Subtitle: user-defined text, `13px`, weight 400, `#8a7d6a`
- Padding: `20px` all around, `16px` bottom margin before separator
- HTML `<title>`: updated from "vite-temp" to "Treevoxel"

## Tab Navigation — Vertical Stack

### Desktop (≥960px)

Tabs stacked vertically below the header, full sidebar width minus padding.

```
┌──────────────────────────────┐
│  ⚙  Settings                 │  ← active: bg #261f16, text #c8b89a
│  ◫  Layers                   │  ← inactive: transparent, text #5c4a32
│  ♦  Community                │
│  ℹ  About                    │
│──────────────────────────────│  ← separator before panel content
```

- Each tab: `padding: 10px 14px`, `border-radius: 8px`, `font-size: 13px`, weight 500
- Icon (unicode) + label per tab
- Active: `background: #261f16`, text `#c8b89a`
- Inactive: transparent, text `#5c4a32`
- Hover (inactive): `background: #3a3025`
- Gap between tabs: `2px`
- Transition: `140ms ease` on background and color

### Mobile (<960px)

- 2×2 grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 6px`
- Same per-tab styling, just in grid arrangement
- Sits above the panel body in the bottom sheet

### Accessibility

- Preserves `role="tablist"`, `aria-selected`, keyboard navigation
- Focus-visible ring: `#7a8a5a`

## General Component Styling

### Sidebar

- Width: `520px` on desktop (up from 420px)
- Background: `rgba(21, 19, 15, 0.96)` with `backdrop-filter: blur(18px)`
- Horizontal padding: `20px`

### Buttons

- Background: `#261f16`
- Border: `1px solid rgba(138, 125, 106, 0.2)`
- Hover: `#3a3025`
- Text: `#c8b89a`, weight 500
- Border-radius: `8px`

### Sliders

- Track: `#261f16`
- Fill: `#7a8a5a`
- Thumb: `#8fa06a`, slightly larger on hover
- Focus ring: `#7a8a5a` at 40% opacity

### Collapsible Parameter Groups

- Header text: `#7a8a5a`, weight 600, `14px`
- Chevron/toggle: accent color
- Divider between groups: `#261f16`

### Color Pickers

- Border: matches `border-primary` token
- Label: secondary text color

### Tooltips

- Background: `#1e1b14`
- Border: `#3a3025`
- Text: `#c8b89a`

### Toolbar (Viewport Overlay)

- Background updated to match sidebar surface colors
- Toggle buttons follow standard button styling

### Scrollbar (Radix ScrollArea)

- Thumb: `#3a3025`, hover `#5c4a32`

### PresetSelector Dropdown

- Background: `#261f16`
- Text: warm palette
- Selected item highlight: accent color

## What Does NOT Change

- Overall layout structure (sidebar + viewport grid)
- Responsive breakpoint at 960px
- 3D scene logic, voxel rendering, orbit controls
- Component hierarchy and state management (Zustand store)
- Radix UI component usage (just restyled)
- Parameter definitions and groupings
- Export functionality
- Community/About panel structure
- Keyboard shortcuts and accessibility patterns (preserved, restyled)
