# Component catalog

All components carry the `Sigma` prefix by default (configurable via the module's `prefix` option). Full docs: `https://sigma.mhaibaraai.cn/docs/components/*`.

## Core

- **`SigmaGraph`** — root component. Owns the `Sigma` instance and `graphology` graph, provides context to the subtree, passes `settings` through, forwards every sigma event. Props: `data` / `graph` (mutually exclusive data channels), `diffOptions`, `settings`, `styles`, `stylesBase` (`'default' | 'depthless' | 'none'`), `primitives`, `customNodeState` / `customEdgeState` / `customGraphState`, `labelAtlas`, `nodeReducer` / `edgeReducer`.

  ```vue
  <SigmaGraph :data="data" :settings="{ hideEdgesOnMove: true }" style="height: 70vh" />
  ```

- **`SigmaOverlay`** — DOM overlay pinned to a node or a stage position, following camera pan/zoom. `target` accepts a node key or `{ x, y }` in graph space; `position`/`offset` control placement.

- **`SigmaTooltip`** — hover tooltip over nodes/edges. `target` scopes it to `'node' | 'edge' | 'both'`; slot receives the hovered item's attributes.

- **`SigmaPopover`** — click-triggered popover over a node, with `open`/`onOpenChange` for controlled mode.

- **`SigmaContextMenu`** — right-click context menu over a node/edge/stage, `target` scopes which; slot receives the clicked item and closes on outside click.

## Controls

- **`SigmaControls`** — layout container for control buttons, `position` (`top-left`/`top-right`/`bottom-left`/`bottom-right`) and `direction` (row/column).
- **`SigmaZoomControl`** — zoom in/out/reset buttons, `duration`/`factor` tune the camera animation.
- **`SigmaFullscreenControl`** — toggles fullscreen on the graph container.
- **`SigmaSearchControl`** — text search across node attributes, `fields`/`limit`/`debounce`, emits a select event to focus a result.
- **`SigmaLegend`** — renders a static legend from a `field`/`items` mapping; slot for custom item rendering.
- **`SigmaMiniMap`** — small overview map with click-to-navigate and a viewport rectangle synced to the main camera.

Every control's appearance is fully overridable via slots — the library ships zero third-party UI dependencies, and slot scope exposes both the rendered markup and its underlying behavior/state.
