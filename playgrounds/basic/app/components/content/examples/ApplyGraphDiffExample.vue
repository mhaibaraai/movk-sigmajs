<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'
import type { SerializedGraph } from 'graphology-types'

/**
 * 增量同步 SerializedGraph，替代 clear() 加 import()。
 *
 * 节点属性按新数据整体替换，唯一例外是坐标：新数据显式给出 x / y 时以新值为准
 * （服务端重算布局的场景），未给出则沿用图上现有坐标——这正是「跑完布局后拉一次
 * 增量数据，画面不该跳」要的语义。关掉 preservePositions 则布局结果丢失。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 6, extraEdges: 0 }))

const prune = shallowRef(true)
const log = shallowRef<string[]>([])

function snapshot(prefix: string) {
  const n0 = graph.getNodeAttributes('n0')
  log.value = [`${prefix} · n0 (${n0.x.toFixed(1)}, ${n0.y.toFixed(1)}) · 节点 ${graph.order} · 边 ${graph.size}`, ...log.value].slice(0, 3)
}

/** 先把坐标打乱，模拟「跑过布局」的状态 */
function shuffle() {
  graph.forEachNode((node) => {
    graph.mergeNodeAttributes(node, { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 })
  })
  snapshot('已打乱坐标')
}

/** 服务端只回业务字段、不回坐标，是增量接口的常见形态 */
function syncWithoutPositions() {
  const next: SerializedGraph = {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: true },
    nodes: [
      { key: 'n0', attributes: { label: '改了标签的 n0', size: 16, color: '#f43f5e' } },
      { key: 'n1', attributes: { label: '改了颜色的 n1', size: 11, color: '#f59e0b' } },
      { key: 'fresh', attributes: { label: '新增节点', x: 0, y: 20, size: 11, color: '#a855f7' } }
    ],
    edges: [
      { source: 'n0', target: 'n1' },
      { source: 'n0', target: 'fresh' },
      // 端点不在图中，会被跳过并在开发环境告警。「概览 + 按需扩展」下这是正常情况
      { source: 'n0', target: '尚未加载的节点' }
    ]
  }

  applyGraphDiff(graph, next, { prune: prune.value })
  snapshot(prune.value ? '已同步（prune 开，其余节点被剪除）' : '已同步（prune 关，其余节点保留）')
}

function restore() {
  applyGraphDiff(graph, demoGraph({ nodes: 6, extraEdges: 0 }))
  snapshot('已还原')
}
</script>

<template>
  <SigmaGraph :graph="graph">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <button type="button" @click="shuffle">
          打乱坐标
        </button>
        <button type="button" @click="syncWithoutPositions">
          同步不带坐标的数据
        </button>
        <button type="button" @click="restore">
          还原
        </button>
      </div>
      <div class="demo-row">
        <button type="button" :aria-pressed="prune" @click="prune = !prune">
          prune {{ prune ? '开' : '关' }}
        </button>
        <span class="demo-tag">增量合入局部数据时应关掉</span>
      </div>
      <ul class="demo-log">
        <li v-for="(line, index) in log" :key="`${line}-${index}`">
          {{ line }}
        </li>
      </ul>
    </div>
  </SigmaGraph>
</template>
