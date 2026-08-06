<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'
import type { LabelPosition, StylesDeclaration } from 'sigma/types'

/**
 * 方位由邻居方向反推：邻居单位向量之和指向连线最密处，取反即最空的一侧。
 * 全部固定在下方作为对照——中心那圈节点的标签会连着压到边上。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 18, extraEdges: 1 }))

const derived = shallowRef(false)

const styles: StylesDeclaration = {
  nodes: {
    labelPosition: { attribute: 'labelPlacement', defaultValue: 'below' },
    labelSize: 12,
    labelColor: '#1e293b'
  }
}

function apply(next: boolean) {
  derived.value = next

  const placements: Record<string, LabelPosition> = next
    ? labelPlacements(graph)
    : Object.fromEntries(graph.nodes().map(node => [node, 'below' as LabelPosition]))

  for (const [node, placement] of Object.entries(placements)) {
    graph.setNodeAttribute(node, 'labelPlacement', placement)
  }
}

apply(false)
</script>

<template>
  <SigmaGraph :graph="graph" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">标签方位</span>
        <button type="button" :aria-pressed="!derived" @click="apply(false)">
          一律朝下
        </button>
        <button type="button" :aria-pressed="derived" @click="apply(true)">
          背离邻居
        </button>
      </div>
      <span class="demo-tag">方位写进属性，由 styles 的 labelPosition 读取</span>
    </div>
  </SigmaGraph>
</template>
