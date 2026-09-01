<script setup lang="ts">
import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/euroSIS.json', { server: false })

/** 充当服务端持有的完整图：1285 节点 / 7524 边，屏上只放抽出来的枢纽 */
const full = computed(() => {
  const payload = data.value as unknown as SerializedGraph | null
  // euroSIS 是多重无向图，图级 options 必须带上，否则平行边导入即抛错
  const graph = new Graph(payload?.options)
  if (payload) {
    graph.import(payload)
  }
  return graph
})

const size = shallowRef(120)
const sampled = computed(() => (data.value ? sampleGraph(full.value, size.value) : null))

const styles: SigmaStyles = {
  nodes: {
    color: '#3b82f6',
    size: { attribute: 'nansi-degree', min: 3, max: 18, minValue: 1, maxValue: 125 }
  },
  edges: { color: '#e2e8f0' }
}
</script>

<template>
  <SigmaGraph
    v-if="sampled"
    :data="sampled"
    :styles="styles"
    :settings="{ hideEdgesOnMove: true, labelRenderedSizeThreshold: 12 }"
  >
    <SampleGraphPanel v-model="size" :total="full.order" :total-edges="full.size" />
  </SigmaGraph>
</template>
