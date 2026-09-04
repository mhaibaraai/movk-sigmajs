# Composable catalog

All composables are auto-imported and must be called inside a child component mounted under `<SigmaGraph>` — they read a Vue `inject()` context that only exists in its subtree. Full docs: `https://sigma.mhaibaraai.cn/docs/composables/*`.

## Base

- **`useSigma()`** — inject the current `SigmaGraph` context, returns the native `Sigma` and `graphology` instances.
- **`useSigmaById(id)`** / **`useSigmaIds()`** — reach an instance by id from outside the component tree or across routes; `useSigmaIds()` lists every registered id.
- **`useSigmaGraph(source?)`** — bridges `graphology` mutations into Vue reactivity: `version`, `order`, `size` and change callbacks.
- **`useSigmaEvents(handlers)`** — declaratively bind sigma events, auto-unbound on scope dispose; accepts any event name not covered by the root component's `emits`.
- **`useSigmaSettings(source)`** — sync a reactive settings object to sigma; calls `setSettings()` on change, whole-object passthrough with no key filtering.
- **`useSigmaState()`** — read/write sigma's interaction state (hover, highlight, hidden) without polluting graph data.

## Interaction

- **`useSigmaCamera()`** — zoom, reset, focus on a node, fit nodes while avoiding overlay occlusion, and graph↔screen coordinate conversion.
- **`useSigmaSelection(options?)`** — hover/selection state machine; writes the focused node and its neighbors into `isHighlighted`, everything else dims via the library's built-in rule.
- **`useSigmaNeighborhood(options?)`** — layered BFS neighborhood expansion from a node, plus incremental "click to expand" merging of remote data.
- **`useSigmaDrag(options?)`** — wires sigma's `enableNodeDrag` into Vue reactivity; toggled via `enabled`, exposes `dragged` and `isDragging`.
- **`useSigmaSearch(options?)`** — search nodes/edges by attribute, results recompute as the graph changes, can focus the camera on a hit.
- **`useSigmaFilter(options?)`** — declarative filtering that lands on sigma's `isHidden` state, never mutates graph data.
- **`useSigmaLabelTiers(options?)`** — tiered label visibility keyed to camera ratio; the wider the view, the fewer (higher-importance) labels remain.

## Analysis

- **`useSigmaLayout(...)`** — unified entry point for five layout algorithms, supports per-connected-component layout, and manages the ForceAtlas2/Noverlap worker lifecycle.
- **`useSigmaMetrics()`** — degree, centrality and community detection over the graph, cached by graph version to avoid recomputation.
- **`useSigmaExport()`** — export the current canvas to PNG; get a `Blob` to handle yourself, or trigger a browser download directly.
