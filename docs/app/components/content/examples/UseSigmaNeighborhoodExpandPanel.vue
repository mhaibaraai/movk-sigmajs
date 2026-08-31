<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const { expand, expanded, isExpanding } = useSigmaNeighborhood()
const { selected } = useSigmaSelection()
const { order, size } = useSigmaGraph()

const rounds = shallowRef(0)

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
        x: 200 + Math.cos(index * 2 + rounds.value) * 260,
        y: -250 + Math.sin(index * 2 + rounds.value) * 260,
        size: 14,
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
