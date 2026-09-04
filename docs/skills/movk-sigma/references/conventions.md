# Conventions and constraints

Hard rules for writing correct declarative @movk/sigma code. The same set is exposed at runtime via the MCP resource `resource://docs/sigma-conventions` — keep the two in sync.

## SSR and rendering

- **Dynamic import only.** sigma's subpaths (`sigma`, `sigma/rendering`, `sigma/primitives`, `sigma/types`) all read `WebGL2RenderingContext` at module top level. A static import throws `ReferenceError` during SSR since the server has no such global. `import type` is compile-time only and always safe.
- **Container needs explicit height.** `SigmaGraph` fills `width:100%;height:100%`; the parent must set a height (e.g. `style="height: 70vh"`) or the canvas collapses to 0 and is invisible even though the graph loaded correctly.

## Injection scope

- **`useSigma()` is inject.** Every composable (`useSigmaCamera`, `useSigmaSelection`, `useSigmaEvents`, ...) must be called inside a child component mounted under `<SigmaGraph>`, never in the same component that renders `SigmaGraph` itself. Real usage therefore always splits into a parent owning `SigmaGraph` and a child consuming the context — this is not incidental structure, it's required.

## Data

- **`data` vs `graph` channel.** Pass `data` (a `SerializedGraph`) for library-managed incremental diffing that preserves layout coordinates; pass `graph` (a live `graphology` instance) when you drive the graph yourself, in which case the library only renders and manages lifecycle. Passing both together warns in dev.

## Reactivity

- **`settings` passthrough.** Deep-merged then handed to sigma whole, no key whitelist — new upstream settings work immediately without a library release. Hot-updates via `setSettings()`, no instance rebuild.
- **`styles`/`primitives`/reducers are construction-time.** sigma has no runtime `setStyles()`/`setReducer()`; changing these props after mount forces `SigmaGraph` to tear down and rebuild the whole instance (with a dev warning). Keep them stable references at `setup` top level — never write object literals inline in the template.

## styles composition

- **sigma itself replaces, doesn't merge — `SigmaGraph` shields you from this.** sigma reads `styles.nodes`/`styles.edges` as a complete replacement of its defaults. `SigmaGraph` handles this automatically: it composes your `styles` prop on top of a base preset plus its own library rules via `composeStyles()` internally, so passing a custom `styles` object through the prop does **not** drop label binding, `isHidden` visibility or hover feedback in normal usage.
- **`stylesBase`** controls what base preset gets composed in: `'default'` (with depth layers), `'depthless'` (no depth layers, for custom `primitives.depthLayers`), `'none'` (no base preset — your `styles` and the library's own rules are still composed together, but you own the visual ruleset otherwise provided by the preset).
- **Call `composeStyles()` yourself** only when merging multiple style sources before handing them to the `styles` prop (e.g. combining a shared base with a page-specific override), not as a routine step for every `styles` prop.

## Rendering primitives

- **Factory functions need `defineSigmaPrimitives()`.** Custom shapes/layers that call sigma's own factories (`sdfCircle`, `layerFill`, ...) must be resolved inside `defineSigmaPrimitives(async () => { const { sdfCircle } = await import('sigma/rendering'); return {...} })` — same SSR constraint as above. The library's own `sdfPolygon()`/`sdfStar()` return pure data and can be called at module top level, no wrapping needed.

## Dependencies

- **No re-export of upstream.** `sigma` and `graphology` stay peer dependencies; import their types directly from those packages, never through `@movk/sigma` — this avoids a duplicate instance and a version lock.
- **Optional peers fail loud.** Layout (`graphology-layout*`), analysis (`graphology-metrics`, `graphology-communities-louvain`) and render-program peers (`@sigma/node-border`, `@sigma/node-image`, `@sigma/edge-curve`, ...) are optional; calling something that needs one without it installed throws a specific "install X" error instead of silently doing nothing.
