<script setup lang="ts">
import Graph from 'graphology'

const NODES = [
  { key: 'a', x: 0, y: 0, size: 20, label: 'A', color: '#e22653' },
  { key: 'b', x: 100, y: -100, size: 40, label: 'B', color: '#e28b53' },
  { key: 'c', x: 300, y: -200, size: 20, label: 'C', color: '#9be225' },
  { key: 'd', x: 100, y: -300, size: 20, label: 'D', color: '#53a4e2' },
  { key: 'e', x: 300, y: -400, size: 40, label: 'E', color: '#7553e2' },
  { key: 'f', x: 400, y: -500, size: 20, label: 'F', color: '#e253d5' }
]

const EDGES: [string, string][] = [
  ['a', 'b'],
  ['b', 'c'],
  ['b', 'd'],
  ['c', 'b'],
  ['c', 'e'],
  ['d', 'c'],
  ['d', 'e'],
  ['e', 'd'],
  ['f', 'e']
]

const graph = new Graph()

for (const { key, ...attributes } of NODES) {
  graph.addNode(key, attributes)
}
for (const [source, target] of EDGES) {
  graph.addEdge(source, target, { size: 10 })
}

const seq = shallowRef(0)

// 直接调 graphology 的 API：组件不参与，sigma 订阅了图事件自己重绘
function add() {
  const n = ++seq.value
  const angle = n * 1.2
  const key = `n${n}`

  graph.addNode(key, { label: `新增 ${n}`, x: Math.cos(angle) * 180, y: Math.sin(angle) * 180 - 250, size: 12, color: '#a855f7' })
  graph.addEdge('a', key, { size: 10 })
}

function remove() {
  graph.dropNode(`n${seq.value--}`)
}
</script>

<template>
  <SigmaGraph :graph="graph">
    <SigmaControls>
      <UButton label="graph.addNode()" @click="add" />
      <UButton :disabled="seq === 0" label="graph.dropNode()" @click="remove" />
    </SigmaControls>
  </SigmaGraph>
</template>
