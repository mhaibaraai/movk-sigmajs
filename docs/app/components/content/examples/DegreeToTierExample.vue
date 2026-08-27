<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'
import type { StylesDeclaration } from 'sigma/types'

/**
 * 档位是排名而非取值：一张图该出多少标签由屏幕空间决定，与度数的绝对大小无关。
 * 档位同时驱动字号与显示优先级——0 档强制显示，其余交给标签网格竞争。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 24, extraEdges: 1 }))

const ratios = shallowRef<number[]>([0.15, 0.5])

const styles: StylesDeclaration = {
  nodes: [demoNodeStyle, {
    labelSize: { attribute: 'labelTier', dict: { 0: 14, 1: 12, 2: 11 }, defaultValue: 12 },
    labelColor: { attribute: 'labelTier', dict: { 0: '#0f172a', 1: '#1e293b', 2: '#64748b' }, defaultValue: '#1e293b' },
    // 0 档避无可避时仍强行绘制，其余让标签网格决定
    labelVisibility: { whenData: { labelTier: 0 }, then: 'visible', else: 'auto' }
  }]
}

function apply(next: number[]) {
  ratios.value = next

  const tiers = degreeToTier(graph, { ratios: next })
  for (const [node, tier] of Object.entries(tiers)) {
    graph.setNodeAttribute(node, 'labelTier', tier)
  }
}

apply(ratios.value)
</script>

<template>
  <SigmaGraph :graph="graph" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">累计占比</span>
        <button type="button" :aria-pressed="ratios[1] === 0.5" @click="apply([0.15, 0.5])">
          15% / 50%
        </button>
        <button type="button" :aria-pressed="ratios[1] === 0.9" @click="apply([0.5, 0.9])">
          50% / 90%
        </button>
        <button type="button" :aria-pressed="ratios.length === 1" @click="apply([0.2])">
          只分两档
        </button>
      </div>
      <span class="demo-tag">档位经 dict 绑定映射到字号与配色</span>
    </div>
  </SigmaGraph>
</template>
