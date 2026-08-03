<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'

/**
 * 档位是排名而非取值：一张图该出多少标签由屏幕空间决定，与度数的绝对大小无关。
 * 这里把档位同时用在字号（renderer 的 tiers）与强制显示（sigma 的 forceLabel）上。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 24, extraEdges: 1 }))

const labels = createLabelRenderer({
  maxChars: 6,
  forceTier: 0,
  tiers: {
    0: { size: 14, weight: '600', color: '#0f172a' },
    1: { size: 12, weight: '500', color: '#1e293b' },
    2: { size: 11, weight: '400', color: '#64748b' }
  }
})

const ratios = shallowRef<number[]>([0.15, 0.5])

const settings = {
  labelSize: 12,
  labelColor: { color: '#1e293b' },
  renderEdgeLabels: false,
  defaultDrawNodeLabel: labels.drawNodeLabel,
  defaultDrawNodeHover: labels.drawNodeHover
}

function apply(next: number[]) {
  ratios.value = next

  const tiers = degreeToTier(graph, { ratios: next })
  for (const [node, tier] of Object.entries(tiers)) {
    graph.mergeNodeAttributes(node, { labelTier: tier, forceLabel: tier === 0 })
  }
  labels.clear()
}

apply(ratios.value)
</script>

<template>
  <SigmaGraph :graph="graph" :settings="settings" @before-render="labels.resetFrame()">
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
      <span class="demo-tag">0 档加粗加深并置 forceLabel，避无可避时仍会强行绘制</span>
    </div>
  </SigmaGraph>
</template>
