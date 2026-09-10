<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'
import type { StylesDeclaration } from 'sigma/types'

/** 唯一使用内联测试数据的示例：演示 data prop 接受的 SerializedGraph 形态 */
const data = ref<SerializedGraph>({
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: 'A', x: 0, y: 0, size: 20, kind: '核心' } },
    { key: 'b', attributes: { label: 'B', x: 100, y: -100, size: 40, kind: '核心' } },
    { key: 'c', attributes: { label: 'C', x: 300, y: -200, size: 20, kind: '次要' } },
    { key: 'd', attributes: { label: 'D', x: 100, y: -300, size: 20, kind: '次要' } },
    { key: 'e', attributes: { label: 'E', x: 300, y: -400, size: 40, kind: '边缘' } },
    { key: 'f', attributes: { label: 'F', x: 400, y: -500, size: 20, kind: '边缘' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { size: 10 } },
    { source: 'b', target: 'c', attributes: { size: 10 } },
    { source: 'b', target: 'd', attributes: { size: 10 } },
    { source: 'c', target: 'e', attributes: { size: 10 } },
    { source: 'd', target: 'e', attributes: { size: 10 } },
    { source: 'f', target: 'e', attributes: { size: 10 } }
  ]
})

// 颜色不落进图数据，由 styles 按 kind 属性在渲染期绑定
const styles: StylesDeclaration = {
  nodes: {
    label: { attribute: 'label' },
    color: { attribute: 'kind', dict: { 核心: '#f43f5e', 次要: '#3b82f6', 边缘: '#22c55e' }, defaultValue: '#64748b' }
  },
  edges: { color: '#cbd5e1' }
}

const seq = shallowRef(0)
const log = shallowRef<string[]>([])

function push(line: string) {
  log.value = [line, ...log.value].slice(0, 4)
}

function add() {
  const n = ++seq.value
  const angle = n * 1.2
  const key = `n${n}`

  data.value = {
    ...data.value,
    nodes: [...data.value.nodes, {
      key,
      attributes: { label: `新增 ${n}`, x: Math.cos(angle) * 180, y: Math.sin(angle) * 180, size: 12, kind: '边缘' }
    }],
    edges: [...data.value.edges, { source: 'a', target: key }]
  }
}

function remove() {
  const key = `n${seq.value--}`

  data.value = {
    ...data.value,
    nodes: data.value.nodes.filter(node => node.key !== key),
    edges: data.value.edges.filter(edge => edge.target !== key)
  }
}
</script>

<template>
  <SigmaGraph
    :data="data"
    :styles="styles"
    :settings="{ renderEdgeLabels: true }"
    @click-node="({ node }) => push(`clickNode ${node}`)"
    @click-stage="() => push('clickStage')"
    @ready="() => push('ready')"
  >
    <SigmaControls>
      <div class="flex gap-1">
        <UButton size="xs" color="neutral" label="新增节点" @click="add" />
        <UButton size="xs" color="neutral" :disabled="seq === 0" label="移除最后一个" @click="remove" />
      </div>

      <div class="bg-accented text-muted p-2 text-xs">
        <p>节点 {{ data.nodes.length }} · 边 {{ data.edges.length }}</p>
        <ul class="list-none font-mono">
          <li v-for="(line, index) in log" :key="`${line}-${index}`">
            {{ line }}
          </li>
        </ul>
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
