---
name: movk-sigma
description: |
  Build knowledge graph / network visualizations declaratively with @movk/sigma (movk-sigma), a Vue 3 / Nuxt 4
  wrapper around sigma.js v4 and graphology. Use this when the user wants to: build or scaffold a graph with
  @movk/sigma or movk-sigma; render nodes/edges with custom colors, sizes or shapes; add zoom/fullscreen/search
  controls, a legend or a minimap; add tooltips, popovers or a context menu; highlight selection or neighborhood
  on click/hover; run a force-directed (ForceAtlas2) or other layout, possibly in a worker; run community
  detection or centrality metrics; export the graph to a PNG image; or use declarative sigma components inside
  a Nuxt project.
---

# movk-sigma

`@movk/sigma` is a declarative sigma.js v4 wrapper, shipped as a **Nuxt 4 module** (components and composables auto-imported). You compose a graph from components instead of writing imperative `sigma.setSetting()` / `graph.addNode()` calls by hand.

**Encapsulation is additive, not a wall.** What the library doesn't cover, you must still be able to reach:

- `useSigma()` returns the **native** `Sigma` and `Graph` instances, no Proxy, no wrapping.
- `settings` passes through to sigma whole — no field whitelist, no filtering of unknown keys.
- `sigma` and `graphology` stay peer dependencies; import their types directly, never through `@movk/sigma`.

When you need exact, current props or APIs, query the docs MCP at `https://sigma.mhaibaraai.cn/mcp` (tools `list-sigma-capabilities`, `get-component`, `get-sigma-styles-schema`) or read `https://sigma.mhaibaraai.cn/llms.txt`. Do not invent prop names.

## Install and configure

```bash
pnpm add @movk/sigma sigma graphology
```

`sigma` and `graphology` are required peers you install yourself, so the whole app shares one sigma instance and isn't version-locked by this module.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@movk/sigma'],

  sigma: {
    prefix: 'Sigma',
    settings: { hideEdgesOnMove: true },
    css: true
  }
})
```

## Core pattern

A graph is `SigmaGraph` with declarative children. The component itself is unstyled beyond `height: 100%` — **the parent must give an explicit height**, otherwise the canvas is invisible.

```vue
<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data: SerializedGraph = {
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [{ key: '1', attributes: { label: 'A', x: 0, y: 0, size: 6, color: '#e11d48' } }],
  edges: []
}
</script>

<template>
  <SigmaGraph :data="data" style="height: 70vh">
    <SigmaControls position="bottom-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>
```

Key ideas:

- **Two data channels**: pass `data` (a `SerializedGraph`) for library-managed incremental diffing that preserves layout coordinates, or pass `graph` (a live `graphology` instance) when you drive the graph yourself — the library only renders and manages lifecycle.
- **`useSigma()` is inject** — every composable must be called inside a child component mounted under `<SigmaGraph>`, never in the same component that renders `SigmaGraph` itself. This is why real usage always splits into a parent that owns `SigmaGraph` and a child that reads the context.
- **`styles`** is the declarative visual layer, separate from `settings` (behavior/performance only). Pass rules straight through the `styles` prop — `SigmaGraph` automatically composes them with a base preset (`stylesBase`) and its own library rules via `composeStyles()` internally, so built-in label binding and hover feedback stay intact.
- **SSR**: every sigma subpath (`sigma`, `sigma/rendering`, `sigma/primitives`, `sigma/types`) reads `WebGL2RenderingContext` at module top level. Never static-import them for their runtime values; wrap factory calls in `defineSigmaPrimitives(async () => {...})`.

## Must-follow conventions

Read [references/conventions.md](references/conventions.md) before writing code. The critical ones: explicit container height; `useSigma()` injection scope; SSR-safe dynamic imports; `styles`/`primitives`/reducers are construction-time only.

## References

- [references/components.md](references/components.md) — component catalog with minimal usage for SigmaGraph, overlays (Tooltip/Popover/ContextMenu/Overlay), and controls.
- [references/composables.md](references/composables.md) — the 16 composables, one line each, grouped by base/interaction/analysis.
- [references/conventions.md](references/conventions.md) — SSR, injection scope, lifecycle and other hard constraints; kept in sync with `resource://docs/sigma-conventions`.
- [references/recipes.md](references/recipes.md) — task recipes: neighborhood highlight, search-to-focus, ForceAtlas2 in a worker, community-colored styles, PNG export.
