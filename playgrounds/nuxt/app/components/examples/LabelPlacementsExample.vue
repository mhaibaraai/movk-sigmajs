<script setup lang="ts">
import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'
import type { LabelPosition } from 'sigma/types'
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')

const payload = data.value as unknown as SerializedGraph
const graph = new Graph(payload.options)
graph.import(payload)

const styles: SigmaStyles = {
  nodes: {
    labelPosition: { attribute: 'labelPlacement', defaultValue: 'below' },
    labelSize: 12
  }
}

const derived = shallowRef(false)

function apply(next: boolean) {
  derived.value = next

  const placements: Record<string, LabelPosition> = next
    ? labelPlacements(graph)
    : Object.fromEntries(graph.nodes().map(node => [node, 'below' as LabelPosition]))

  for (const [node, placement] of Object.entries(placements)) {
    graph.setNodeAttribute(node, 'labelPlacement', placement)
  }
}

apply(false)
</script>

<template>
  <SigmaGraph :graph="graph" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <SigmaControls>
      <div class="flex gap-1">
        <UButton size="xs" label="一律朝下" :color="derived ? 'neutral' : 'primary'" @click="apply(false)" />
        <UButton size="xs" label="背离邻居" :color="derived ? 'primary' : 'neutral'" @click="apply(true)" />
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
