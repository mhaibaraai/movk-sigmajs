<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'

/**
 * 方位由邻居方向反推：邻居单位向量之和指向连线最密处，取反即最空的一侧。
 * 全部固定在下方作为对照——中心那圈节点的标签会连着压到边上。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 18, extraEdges: 1 }))

const labels = createLabelRenderer({ maxChars: 6 })
const derived = shallowRef(false)

const settings = {
  labelSize: 12,
  labelColor: { color: '#1e293b' },
  renderEdgeLabels: false,
  defaultDrawNodeLabel: labels.drawNodeLabel,
  defaultDrawNodeHover: labels.drawNodeHover
}

function apply(next: boolean) {
  derived.value = next

  if (next) {
    const placements = labelPlacements(graph)
    for (const [node, placement] of Object.entries(placements)) {
      graph.setNodeAttribute(node, 'labelPlacement', placement)
    }
  }
  else {
    graph.forEachNode(node => graph.setNodeAttribute(node, 'labelPlacement', 'bottom'))
  }

  // 首选方位变了，跨帧记忆里的旧位置要一并作废
  labels.clear()
}

apply(false)
</script>

<template>
  <SigmaGraph :graph="graph" :settings="settings" @before-render="labels.resetFrame()">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">首选方位</span>
        <button type="button" :aria-pressed="!derived" @click="apply(false)">
          一律朝下
        </button>
        <button type="button" :aria-pressed="derived" @click="apply(true)">
          背离邻居
        </button>
      </div>
      <span class="demo-tag">派生结果只是首选位，真正落哪一侧仍由帧内避让决定</span>
    </div>
  </SigmaGraph>
</template>
