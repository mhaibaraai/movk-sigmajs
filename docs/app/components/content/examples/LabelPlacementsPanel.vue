<script setup lang="ts">
import type { LabelPosition } from 'sigma/types'

const { graph } = useSigmaGraph()

const derived = shallowRef(false)

function apply(next: boolean) {
  derived.value = next

  const placements: Record<string, LabelPosition> = next
    ? labelPlacements(graph.value)
    : Object.fromEntries(graph.value.nodes().map(node => [node, 'below' as LabelPosition]))

  for (const [node, placement] of Object.entries(placements)) {
    graph.value.setNodeAttribute(node, 'labelPlacement', placement)
  }
}

apply(false)
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" label="一律朝下" :color="derived ? 'neutral' : 'primary'" @click="apply(false)" />
      <UButton size="xs" label="背离邻居" :color="derived ? 'primary' : 'neutral'" @click="apply(true)" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      方位写进 labelPlacement 属性，由 styles 的 labelPosition 读取
    </div>
  </SigmaControls>
</template>
