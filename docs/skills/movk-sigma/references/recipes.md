# Task recipes

Self-contained snippets for common tasks. Each `<SigmaGraph>` needs a parent with explicit height, and every composable below runs in a child component mounted under it — never in the same component that renders `SigmaGraph`.

## Neighborhood highlight on hover/click

```ts
const { hovered, selected, highlighted, clear } = useSigmaSelection()
```

`useSigmaSelection()` is a self-contained state machine — it binds sigma's pointer events internally, writes the focused node and its direct neighbors into `isHighlighted`, and (with the default `dim: true`) dims everything else automatically. No manual event wiring or `styles` work needed for the fade; set `dim: false` and write a `whenState: 'isHighlighted'` rule in `styles` only if you need custom appearance.

## Search box that focuses the camera

```vue
<script setup lang="ts">
const { query, results, focus } = useSigmaSearch({ fields: ['label'], limit: 10 })
</script>

<template>
  <input v-model="query" placeholder="Search nodes...">
  <ul>
    <li v-for="result in results" :key="result.id" @click="focus(result)">
      {{ result.label }}
    </li>
  </ul>
</template>
```

`focus()` moves the camera to the matched node/edge itself — no separate `useSigmaCamera()` call needed. Or use the pre-built `<SigmaSearchControl>` component, which wires this exact pattern up and exposes the same behavior through slots.

## ForceAtlas2 layout in a worker

```ts
const { start, stop, isRunning } = useSigmaLayout('forceatlas2', {
  worker: true,
  settings: { gravity: 1, scalingRatio: 10 }
})

await start()
// stop() only pauses iteration; the worker is killed automatically on scope dispose
```

Pass `itemSizesReference: 'screen'` in `SigmaGraph`'s `primitives`/rendering options to keep node `size` in pixel semantics — ForceAtlas2 spreads coordinates across dozens of graph units, and `size` is a graph-coordinate value that would otherwise balloon as the layout converges.

## Color nodes by detected community

```ts
const { communities } = useSigmaMetrics()

const partition = await communities()
for (const [node, community] of Object.entries(partition)) {
  graph.setNodeAttribute(node, 'community', community)
}

const styles = {
  nodes: {
    color: { attribute: 'community', dict: { 0: '#f43f5e', 1: '#3b82f6' }, defaultValue: '#666' }
  }
}
```

Pass `styles` straight to `<SigmaGraph :styles="styles">` — `SigmaGraph` composes it with the base preset and its own rules automatically, no manual `composeStyles()` call needed. `communities()` needs the optional `graphology-communities-louvain` peer; results are cached per graph version.

## Export the current view to PNG

```ts
const { toBlob, download } = useSigmaExport()

// trigger a browser download directly (.png suffix on filename is optional)
await download('graph.png')

// or handle the Blob yourself (e.g. upload it)
const blob = await toBlob()
```

Needs the optional `@sigma/export-image` peer.
