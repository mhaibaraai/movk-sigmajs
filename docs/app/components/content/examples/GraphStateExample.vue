<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')
const graphRef = useTemplateRef('graph')

const customNodeState = { isActive: false }
const customEdgeState = { isActive: false }
const customGraphState = { hasActiveSubgraph: false }

// 布尔标志位用 whenState 直接消费；跨状态的组合判断走 when，后两个参数分别是元素自身的
const styles: SigmaStyles<typeof customNodeState, typeof customEdgeState, typeof customGraphState> = {
  nodes: [
    {
      whenState: 'isActive',
      then: { depth: 'topNodes', labelVisibility: 'visible' }
    },
    {
      when: (_attributes, state, graphState) => graphState.hasActiveSubgraph && !state.isActive,
      then: { color: '#f6f6f6', label: '' }
    }
  ],
  edges: [
    {
      whenState: 'isActive',
      then: { depth: 'topEdges' }
    },
    {
      when: (_attributes, state, graphState) => graphState.hasActiveSubgraph && !state.isActive,
      then: { color: '#f6f6f6' }
    }
  ]
}

/** 悬停节点把它与邻居标为活跃，图级标志位告诉规则此刻有活跃子图，外观全部交给 styles */
function setActiveSubgraph(node?: string) {
  const sigma = graphRef.value?.sigma
  const graph = graphRef.value?.graph
  if (!sigma || !graph) {
    return
  }

  const subgraph = node ? new Set([node, ...graph.neighbors(node)]) : undefined
  const isActive = (key: string) => subgraph?.has(key) ?? false

  sigma.setNodesState(graph.filterNodes(key => isActive(key)), { isActive: true })
  sigma.setNodesState(graph.filterNodes(key => !isActive(key)), { isActive: false })

  // 两端都在子图里才算活跃的边，否则边界上会挂出半截高亮的连线
  sigma.setEdgesState(graph.filterEdges((_key, _attributes, source, target) => isActive(source) && isActive(target)), { isActive: true })
  sigma.setEdgesState(graph.filterEdges((_key, _attributes, source, target) => !isActive(source) || !isActive(target)), { isActive: false })

  sigma.setGraphState({ hasActiveSubgraph: subgraph !== undefined })
}
</script>

<template>
  <SigmaGraph
    ref="graph"
    :data="data"
    :styles="styles"
    :custom-node-state="customNodeState"
    :custom-edge-state="customEdgeState"
    :custom-graph-state="customGraphState"
    @enter-node="({ node }) => setActiveSubgraph(node)"
    @leave-node="() => setActiveSubgraph()"
  />
</template>
