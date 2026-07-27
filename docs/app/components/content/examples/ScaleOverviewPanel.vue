<script setup lang="ts">
import { shallowRef } from 'vue'
import type Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'

const props = defineProps<{
  /** 完整的大图，充当「服务端」 */
  full: Graph
}>()

/**
 * 「概览 + 按需扩展」的完整链路。
 *
 * 首屏只渲染 sampleGraph 抽出的枢纽，点击节点再从完整图里取它的一度邻域
 * 增量合入。这条路径下 applyGraphDiff 的坐标保留才真正被用到——
 * 已在屏上的节点不该因为一次扩展而跳位。
 */
const { expand, expanded, isExpanding } = useSigmaNeighborhood()
const { selected } = useSigmaSelection()
const { order, size } = useSigmaGraph()

const lastMs = shallowRef(0)

/** 模拟服务端的邻域接口：从完整图里取一度邻域 */
async function loadNeighbors(key: string): Promise<SerializedGraph> {
  const t0 = performance.now()
  await new Promise(resolve => setTimeout(resolve, 120))

  const keys = new Set<string>([key, ...props.full.neighbors(key)])
  const exported = props.full.export()

  const result: SerializedGraph = {
    ...exported,
    nodes: exported.nodes.filter(node => keys.has(String(node.key))),
    edges: exported.edges.filter(edge => keys.has(String(edge.source)) && keys.has(String(edge.target)))
  }

  lastMs.value = performance.now() - t0
  return result
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <button type="button" :disabled="!selected || isExpanding" @click="expand(selected!, loadNeighbors)">
        {{ isExpanding ? '拉取中…' : `展开 ${selected ?? '（先点一个节点）'}` }}
      </button>
    </div>
    <span class="demo-tag">屏上 {{ order }} 节点 / {{ size }} 边 · 已展开 {{ expanded.size }} 个 · 上次 {{ lastMs.toFixed(0) }} ms</span>
    <span class="demo-tag">扩展只增不动：已有节点的坐标不受影响</span>
  </div>
</template>
