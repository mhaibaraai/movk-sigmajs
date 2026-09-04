interface Convention {
  topic: string
  rule: string
  why: string
}

// Hard constraints for writing correct declarative @movk/sigma code.
// Kept in sync with the Skill's references/conventions.md.
const conventions: Convention[] = [
  {
    topic: 'SSR safety',
    rule: 'sigma\'s subpaths (sigma, sigma/rendering, sigma/primitives, sigma/types) all read WebGL2RenderingContext at module top level. Never static-import them; `import type` is compile-time only and safe.',
    why: 'The server has no WebGL2RenderingContext global, so a static import throws ReferenceError during SSR.'
  },
  {
    topic: 'Injection scope',
    rule: 'useSigma() and every other composable (useSigmaCamera, useSigmaSelection, useSigmaEvents, ...) must be called inside a child component mounted under <SigmaGraph>, never in the same component that renders SigmaGraph itself.',
    why: 'They read a Vue inject() context that SigmaGraph provides to its subtree; calling them outside it returns null/throws.'
  },
  {
    topic: 'Container height',
    rule: 'SigmaGraph fills width:100%;height:100%, so the parent needs an explicit height (e.g. style="height: 70vh" or a CSS class), otherwise the canvas collapses to 0.',
    why: 'With no height the container has zero size and nothing renders, even though the graph loaded correctly.'
  },
  {
    topic: 'data vs graph channel',
    rule: 'Pass `data` (a SerializedGraph) when you want the library to diff and incrementally update, preserving existing layout coordinates; pass `graph` (a live graphology instance) when you manage the graph yourself and only want rendering/lifecycle.',
    why: 'Mixing intents causes either lost user edits (data channel) or unexpected re-diffing (graph channel).'
  },
  {
    topic: 'settings passthrough',
    rule: 'The `settings` prop is deep-merged then passed to sigma whole, with no key whitelist.',
    why: 'Upstream sigma settings work immediately without waiting for a library release; do not look for a settings type export to enumerate keys from — read sigma\'s own Settings type.'
  },
  {
    topic: 'styles composition',
    rule: 'sigma itself reads styles.nodes/styles.edges as a full replacement, not a merge — but SigmaGraph shields you from this by auto-composing your `styles` prop with a base preset (`stylesBase`, default \'default\') and its own library rules via composeStyles() internally. Only call composeStyles() yourself when merging multiple style sources before assignment, or when stylesBase is \'none\'.',
    why: 'Without this shielding, a bare custom styles object would silently drop label rendering and hover/hidden state handling; SigmaGraph\'s default composition is what keeps them intact, so most consumers never need to think about it.'
  },
  {
    topic: 'styles/primitives/reducer are construction-time',
    rule: 'styles, primitives, stylesBase, nodeReducer and edgeReducer are only read when the sigma instance is constructed. Changing them after mount forces SigmaGraph to rebuild the whole instance (with a dev warning) — keep these references stable at setup top level instead of creating them inline in the template.',
    why: 'sigma has no runtime setStyles()/setReducer() API; the only way to apply a new declaration is a full teardown and rebuild.'
  },
  {
    topic: 'Rendering primitives',
    rule: 'Custom shapes/layers passed via the `primitives` prop that call sigma factory functions (sdfCircle, layerFill, ...) must be wrapped in defineSigmaPrimitives(async () => { const { sdfCircle } = await import(\'sigma/rendering\'); return {...} }). Pure-data helpers like sdfPolygon()/sdfStar() from @movk/sigma do not need wrapping.',
    why: 'Same SSR constraint as sigma\'s subpaths — the factories internally touch WebGL types at import time.'
  },
  {
    topic: 'No re-export of upstream',
    rule: '`sigma` and `graphology` stay peer dependencies; import their types directly from those packages, not through @movk/sigma.',
    why: 'Re-exporting would risk a duplicate sigma/graphology instance and lock the app to whatever version the library bundled.'
  },
  {
    topic: 'Optional peers fail loud',
    rule: 'Layout (graphology-layout*), analysis (graphology-metrics, graphology-communities-louvain) and rendering-program peers (@sigma/node-border, @sigma/node-image, @sigma/edge-curve, ...) are optional. Calling a composable/util that needs one without it installed throws a specific "install X" error rather than silently no-op-ing.',
    why: 'Lets the base package stay small while giving an actionable error instead of a cryptic undefined at call time.'
  }
]

export default defineMcpResource({
  uri: 'resource://docs/sigma-conventions',
  description: 'Hard constraints for writing correct declarative @movk/sigma code: SSR-safe dynamic imports, injection scope, container height, data/graph channels, settings passthrough, styles composition and more.',
  cache: '1h',
  async handler(uri: URL) {
    return {
      contents: [{
        uri: uri.toString(),
        mimeType: 'application/json',
        text: JSON.stringify({ conventions }, null, 2)
      }]
    }
  }
})
