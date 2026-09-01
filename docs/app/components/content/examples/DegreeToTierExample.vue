<script setup lang="ts">
import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')

const payload = data.value as unknown as SerializedGraph
const graph = new Graph(payload.options)
graph.import(payload)

const styles: SigmaStyles = {
  nodes: {
    labelSize: { attribute: 'labelTier', dict: { 0: 16, 1: 13, 2: 11 }, defaultValue: 12 },
    labelColor: { attribute: 'labelTier', dict: { 0: '#0f172a', 1: '#334155', 2: '#94a3b8' }, defaultValue: '#334155' },
    labelVisibility: { whenData: { labelTier: 0 }, then: 'visible', else: 'auto' }
  }
}

const presets = [
  { label: '15% / 50%', ratios: [0.15, 0.5] },
  { label: '50% / 90%', ratios: [0.5, 0.9] },
  { label: '只分两档', ratios: [0.2] }
]

const current = shallowRef(presets[0]!.label)
const counts = shallowRef<number[]>([])

function apply(preset: typeof presets[number]) {
  current.value = preset.label

  const tiers = degreeToTier(graph, { ratios: preset.ratios })
  const tally = Array.from({ length: preset.ratios.length + 1 }, () => 0)

  for (const [node, tier] of Object.entries(tiers)) {
    graph.setNodeAttribute(node, 'labelTier', tier)
    tally[tier] = (tally[tier] ?? 0) + 1
  }

  counts.value = tally
}

apply(presets[0]!)
</script>

<template>
  <SigmaGraph :graph="graph" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <SigmaControls>
      <div class="flex gap-1">
        <UButton
          v-for="preset in presets"
          :key="preset.label"
          size="xs"
          :label="preset.label"
          :color="current === preset.label ? 'primary' : 'neutral'"
          @click="apply(preset)"
        />
      </div>

      <div class="bg-accented p-2 text-muted text-xs">
        <span v-for="(count, tier) in counts" :key="tier">{{ tier }} 档 {{ count }} 个 </span>
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
