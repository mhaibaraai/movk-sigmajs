<script setup lang="ts">
import { shallowRef } from 'vue'
import type { SerializedGraph } from 'graphology-types'

/**
 * 三档规模，确定性生成，同一档每次结果一致便于对比读数。
 *
 * 不自动加载：20k 节点 / 60k 边这一档建图要数百毫秒，开发时反复 HMR 会很难受。
 */
const TIERS = [1000, 5000, 20000] as const

const tier = shallowRef<number | null>(null)
const data = shallowRef<SerializedGraph | null>(null)
const buildMs = shallowRef(0)
const startedAt = shallowRef(0)

function load(count: number) {
  startedAt.value = performance.now()
  tier.value = count
  data.value = null

  const t0 = performance.now()
  const next = createScaleGraph(count)
  buildMs.value = performance.now() - t0

  data.value = next
}
</script>

<template>
  <div class="wrap">
    <SigmaGraph
      v-if="data"
      :key="tier ?? 0"
      :data="data"
      :settings="{ hideEdgesOnMove: true, labelRenderedSizeThreshold: 8, defaultEdgeColor: '#e2e8f0' }"
    >
      <ScaleStatsPanel
        :build-ms="buildMs"
        :started-at="startedAt"
        note="按住画布拖动几秒，FPS 读数才有意义"
      />
    </SigmaGraph>

    <p v-else class="idle">
      选择一个规模开始
    </p>

    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">规模</span>
        <button
          v-for="value in TIERS"
          :key="value"
          type="button"
          :aria-pressed="tier === value"
          @click="load(value)"
        >
          {{ value >= 1000 ? `${value / 1000}k` : value }}
        </button>
      </div>
      <span class="demo-tag">边数约为节点数的 3 倍，度数按幂律分布</span>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  height: 100%;
}

.idle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  color: var(--sigma-color-muted);
  font-size: 13px;
}
</style>
