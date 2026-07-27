<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'

/**
 * 给平行边与自环分配互不相同的曲率。
 *
 * @sigma/edge-curve 的 indexParallelEdgesIndex 只写 parallelIndex 系列属性，
 * 不写 curvature，而渲染程序读的是后者——只调它边不会弯。curveParallelEdges
 * 补上第二步，按官方示例的指数衰减公式把索引换算成曲率并设置边 type。
 */
const programs = {
  edge: {
    curved: defineSigmaProgram(() => import('@sigma/edge-curve').then(m => m.default)),
    straight: defineSigmaProgram(() => import('sigma/rendering').then(m => m.EdgeRectangleProgram))
  }
}

// multi: true 必不可少，否则三条 a→b 会被压成一条
const graph = new Graph({ type: 'mixed', multi: true, allowSelfLoops: true })
graph.addNode('a', { label: '制度 A', x: 0, y: 0, size: 16, color: '#f43f5e' })
graph.addNode('b', { label: '制度 B', x: 18, y: 0, size: 14, color: '#3b82f6' })
graph.addNode('c', { label: '制度 C', x: 9, y: -14, size: 14, color: '#22c55e' })

for (const label of ['引用', '废止', '替代', '依据']) {
  graph.addEdge('a', 'b', { label })
}
graph.addEdge('b', 'c', { label: '引用' })
graph.addEdge('a', 'a', { label: '自环' })

const curved = shallowRef(false)
const error = shallowRef('')

async function separate() {
  error.value = ''
  try {
    await curveParallelEdges(graph)
    curved.value = true
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <SigmaGraph
    :graph="graph"
    :programs="programs"
    :settings="{ renderEdgeLabels: true, defaultEdgeType: 'straight' }"
  >
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <button type="button" :disabled="curved" @click="separate">
          {{ curved ? '已分开' : '分配曲率' }}
        </button>
        <span class="demo-tag">a → b 有四条平行边，外加一个自环</span>
      </div>
      <span class="demo-tag">{{ error || '曲率有渐近上界 3.5 × DEFAULT_EDGE_CURVATURE，平行边再多也不会失控' }}</span>
    </div>
  </SigmaGraph>
</template>
