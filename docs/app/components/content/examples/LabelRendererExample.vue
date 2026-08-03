<script setup lang="ts">
import Graph from 'graphology'
import { computed, shallowRef } from 'vue'
import type { Settings } from 'sigma/settings'

/**
 * 关掉避让即 sigma 内置绘制：标签一律画在节点右侧、不截断，密集处直接糊成一片。
 * 打开后每个标签在落笔前登记占位矩形，冲突就换方位。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 28, extraEdges: 1 }))

const labels = createLabelRenderer({ maxChars: 6 })
const avoid = shallowRef(true)

const settings = computed<Partial<Settings>>(() => ({
  labelSize: 12,
  labelColor: { color: '#1e293b' },
  renderEdgeLabels: false,
  ...(avoid.value
    ? {
        defaultDrawNodeLabel: labels.drawNodeLabel,
        defaultDrawNodeHover: labels.drawNodeHover
      }
    : {})
}))

function toggle(next: boolean) {
  avoid.value = next
  // 换绘制函数等于换布局策略，旧的位置记忆不再适用
  labels.clear()
}
</script>

<template>
  <SigmaGraph :graph="graph" :settings="settings" @before-render="labels.resetFrame()">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">标签</span>
        <button type="button" :aria-pressed="avoid" @click="toggle(true)">
          帧内避让
        </button>
        <button type="button" :aria-pressed="!avoid" @click="toggle(false)">
          sigma 内置
        </button>
      </div>
      <span class="demo-tag">避让开启时超过 6 字截断，四个方位都被占的标签直接跳过</span>
    </div>
  </SigmaGraph>
</template>
