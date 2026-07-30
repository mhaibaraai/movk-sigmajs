<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'

/**
 * 把节点度数按 sqrt 曲线映射到尺寸区间，返回「节点 key → size」的映射表。
 *
 * 只返回映射表而不直接写图：是否落到 size 属性、还是交给 reducer 只影响显示，
 * 由调用方决定。这里演示直接写回属性的做法。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 24, extraEdges: 1 }))

const range = shallowRef<[number, number]>([4, 20])
const applied = shallowRef(false)

function apply(next: [number, number]) {
  range.value = next
  const sizes = degreeToSize(graph, next)
  for (const [node, size] of Object.entries(sizes)) {
    graph.setNodeAttribute(node, 'size', size)
  }
  applied.value = true
}
</script>

<template>
  <SigmaGraph :graph="graph">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">区间</span>
        <button type="button" :aria-pressed="applied && range[1] === 20" @click="apply([4, 20])">
          [4, 20]
        </button>
        <button type="button" :aria-pressed="applied && range[1] === 32" @click="apply([2, 32])">
          [2, 32]
        </button>
        <button type="button" :aria-pressed="applied && range[1] === 10" @click="apply([10, 10])">
          [10, 10]
        </button>
      </div>
      <span class="demo-tag">内核是 @movk/core 的 mapRange(..., { clamp: true })，全图度数相同时取区间下界</span>
    </div>
  </SigmaGraph>
</template>
