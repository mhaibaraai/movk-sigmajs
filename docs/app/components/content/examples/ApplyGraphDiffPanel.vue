<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const { graph, order, size } = useSigmaGraph()

const prune = shallowRef(true)
const log = shallowRef<string[]>([])

/** 服务端只回业务字段、不回坐标，是增量接口的常见形态 */
const patch: SerializedGraph = {
  attributes: {},
  options: {},
  nodes: [
    { key: '11.0', attributes: { label: 'Valjean（已改名）', size: 45, color: '#e11d48' } },
    { key: '48.0', attributes: { label: 'Gavroche（已改色）', size: 30, color: '#f59e0b' } },
    { key: 'newcomer', attributes: { label: '新增节点', x: 0, y: 260, size: 24, color: '#a855f7' } }
  ],
  edges: [
    { source: '11.0', target: '48.0' },
    { source: '11.0', target: 'newcomer' },
    // 端点不在图中，会被跳过并在开发环境告警。「概览 + 按需扩展」下这是正常情况
    { source: '11.0', target: '尚未加载的节点' }
  ]
}

function record(prefix: string) {
  const { x, y } = graph.value.getNodeAttributes('11.0')
  log.value = [`${prefix} · Valjean (${(x as number).toFixed(1)}, ${(y as number).toFixed(1)})`, ...log.value].slice(0, 3)
}

/** 先把坐标打乱，模拟「跑过一轮布局」的状态 */
function shuffle() {
  graph.value.forEachNode((node) => {
    graph.value.mergeNodeAttributes(node, { x: (Math.random() - 0.5) * 700, y: (Math.random() - 0.5) * 700 })
  })
  record('已打乱坐标')
}

function sync() {
  applyGraphDiff(graph.value, patch, { prune: prune.value })
  record(prune.value ? '已同步（prune 开）' : '已同步（prune 关）')
}

async function restore() {
  applyGraphDiff(graph.value, await $fetch('/api/data.json') as unknown as SerializedGraph)
  record('已还原')
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="打乱坐标" @click="shuffle" />
      <UButton size="xs" color="neutral" label="同步不带坐标的数据" @click="sync" />
      <UButton size="xs" color="neutral" variant="ghost" label="还原" @click="restore" />
    </div>

    <div class="flex gap-1">
      <UButton size="xs" :color="prune ? 'primary' : 'neutral'" :label="`prune ${prune ? '开' : '关'}`" @click="prune = !prune" />
      <UBadge size="sm" color="neutral" variant="subtle" label="增量合入局部数据时应关掉" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      <p>节点 {{ order }} · 边 {{ size }}</p>
      <p v-for="(line, index) in log" :key="`${line}-${index}`" class="font-mono">
        {{ line }}
      </p>
    </div>
  </SigmaControls>
</template>
