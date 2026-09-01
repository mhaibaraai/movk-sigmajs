<script setup lang="ts">
import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'

const { data } = await useFetch('/api/data.json')

const payload = data.value as unknown as SerializedGraph
const graph = new Graph(payload.options)
graph.import(payload)

const prune = shallowRef(true)
const log = shallowRef<string[]>([])

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
    { source: '11.0', target: '尚未加载的节点' }
  ]
}

function record(prefix: string) {
  const { x, y } = graph.getNodeAttributes('11.0')
  log.value = [
    `${prefix} · Valjean (${(x as number).toFixed(1)}, ${(y as number).toFixed(1)}) · 节点 ${graph.order} · 边 ${graph.size}`,
    ...log.value
  ].slice(0, 3)
}

function shuffle() {
  graph.forEachNode((node) => {
    graph.mergeNodeAttributes(node, { x: (Math.random() - 0.5) * 700, y: (Math.random() - 0.5) * 700 })
  })
  record('已打乱坐标')
}

function sync() {
  applyGraphDiff(graph, patch, { prune: prune.value })
  record(prune.value ? '已同步（prune 开）' : '已同步（prune 关）')
}

async function restore() {
  applyGraphDiff(graph, await $fetch('/api/data.json') as unknown as SerializedGraph)
  record('已还原')
}
</script>

<template>
  <SigmaGraph :graph="graph">
    <SigmaControls>
      <div class="flex gap-1">
        <UButton size="xs" color="neutral" label="打乱坐标" @click="shuffle" />
        <UButton size="xs" color="neutral" label="同步不带坐标的数据" @click="sync" />
        <UButton size="xs" color="neutral" variant="ghost" label="还原" @click="restore" />
      </div>

      <UButton
        size="xs"
        :color="prune ? 'primary' : 'neutral'"
        :label="`prune ${prune ? '开' : '关'}`"
        class="self-start"
        @click="prune = !prune"
      />

      <div v-if="log.length" class="bg-accented p-2 text-muted text-xs font-mono">
        <p v-for="(line, index) in log" :key="`${line}-${index}`">
          {{ line }}
        </p>
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
