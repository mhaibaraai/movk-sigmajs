<script setup lang="ts">
import { shallowRef } from 'vue'
import type { SerializedGraph } from 'graphology-types'

/**
 * 「概览 + 按需扩展」：expand 拉取远端邻域并增量合入当前图。
 *
 * 底层走 applyGraphDiff(graph, next, { prune: false })，已有节点的坐标不受影响，
 * 视觉上不会整张图跳一次。
 */
const { expand, expanded, isExpanding } = useSigmaNeighborhood()
const { selected } = useSigmaSelection()
const { order, size } = useSigmaGraph()

const rounds = shallowRef(0)

/** 模拟服务端的邻域接口 */
async function loadNeighbors(key: string): Promise<SerializedGraph> {
  await new Promise(resolve => setTimeout(resolve, 250))
  rounds.value += 1

  const added = Array.from({ length: 3 }, (_, index) => `${key}-${rounds.value}${index}`)

  return {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: true },
    nodes: added.map((child, index) => ({
      key: child,
      attributes: {
        label: child,
        x: Math.cos(index * 2 + rounds.value) * 260,
        y: Math.sin(index * 2 + rounds.value) * 260,
        size: 7,
        color: '#94a3b8'
      }
    })),
    edges: added.map(child => ({ source: key, target: child, attributes: { label: '扩展' } }))
  }
}
</script>

<template>
  <SigmaControls>
    <UButton
      size="xs"
      color="neutral"
      :disabled="!selected || isExpanding"
      :label="isExpanding ? '拉取中…' : `展开 ${selected ?? '（先点一个节点）'}`"
      @click="expand(selected!, loadNeighbors)"
    />

    <div class="bg-accented p-2 text-muted text-xs">
      <p>节点 {{ order }} · 边 {{ size }} · 已展开 {{ expanded.size }} 个</p>
      <p>已有节点的坐标不变，只有新节点需要摆位</p>
    </div>
  </SigmaControls>
</template>
