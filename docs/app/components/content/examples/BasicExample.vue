<script setup lang="ts">
import type { WikipediaDataset } from '#corpus/wikipedia'
import type { Settings } from 'sigma/settings'
import type { StylesDeclaration } from 'sigma/types'

// 原始数据集不是 SerializedGraph，先转成 graphology 实例再交给 SigmaGraph
const { data } = await useAsyncData(
  'wikipedia-graph',
  async () => toWikipediaGraph(await $fetch<WikipediaDataset>('/api/wikipedia.json')),
  { server: false }
)

// 视觉映射写在 styles 里，图数据只存语义属性
const styles = computed<StylesDeclaration>(() => ({
  nodes: {
    label: { attribute: 'label' },
    color: { attribute: 'cluster', dict: data.value?.clusterColors ?? {}, defaultValue: '#94a3b8' },
    size: {
      attribute: 'score',
      min: 3,
      max: 18,
      minValue: data.value?.scoreExtent[0],
      maxValue: data.value?.scoreExtent[1]
    }
  }
}))

// 坐标跨度由上游布局决定，size 切到像素语义才不受它影响
const settings: Partial<Settings> = { itemSizesReference: 'screen', hideEdgesOnMove: true }
</script>

<template>
  <SigmaGraph
    v-if="data"
    :graph="data.graph"
    :styles="styles"
    :settings="settings"
  >
    <SigmaControls position="bottom-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>
