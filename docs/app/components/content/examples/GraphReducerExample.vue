<script setup lang="ts">
import type { EdgeReducer, NodeReducer } from 'sigma/types'

const { data } = await useFetch('/api/data.json')
const graphRef = useTemplateRef('graph')

const DIM_OPACITY = 0.12

const query = shallowRef('')
const hoveredNode = shallowRef<string>()

const keyword = computed(() => query.value.trim().toLowerCase())

function matches(label: unknown): boolean {
  return String(label ?? '').toLowerCase().includes(keyword.value)
}

// 悬停优先，没有悬停时才看搜索词；两个条件都不成立就原样返回，省掉每帧的无谓拷贝
const nodeReducer: NodeReducer = (key, displayData, attributes, _state, _graphState, graph) => {
  const hovered = hoveredNode.value

  if (hovered) {
    return key === hovered || graph.areNeighbors(key, hovered)
      ? displayData
      : { ...displayData, opacity: DIM_OPACITY, labelVisibility: 'hidden' }
  }

  if (!keyword.value) {
    return displayData
  }

  return matches(attributes.label)
    ? { ...displayData, labelVisibility: 'visible' }
    : { ...displayData, opacity: DIM_OPACITY, labelVisibility: 'hidden' }
}

// 边跟着两端走：一端还在焦点里就保留，否则一起淡出
const edgeReducer: EdgeReducer = (key, displayData, _attributes, _state, _graphState, graph) => {
  const [source, target] = graph.extremities(key)
  const hovered = hoveredNode.value

  if (hovered) {
    return source === hovered || target === hovered ? displayData : { ...displayData, opacity: DIM_OPACITY }
  }

  if (!keyword.value) {
    return displayData
  }

  const hit = matches(graph.getNodeAttribute(source, 'label')) || matches(graph.getNodeAttribute(target, 'label'))
  return hit ? displayData : { ...displayData, opacity: DIM_OPACITY }
}

watch([keyword, hoveredNode], () => graphRef.value?.sigma?.refresh())
</script>

<template>
  <SigmaGraph
    ref="graph"
    :data="data"
    :node-reducer="nodeReducer"
    :edge-reducer="edgeReducer"
    @enter-node="({ node }) => (hoveredNode = node)"
    @leave-node="() => (hoveredNode = undefined)"
  >
    <SigmaControls>
      <UInput v-model="query" placeholder="搜索节点标签，如 Jean" />
    </SigmaControls>
  </SigmaGraph>
</template>
