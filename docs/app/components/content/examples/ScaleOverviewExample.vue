<script setup lang="ts">
import Graph from 'graphology'
import { computed, shallowRef } from 'vue'

/**
 * 20k 节点一次性渲染既慢又看不清，推荐的路径是先给概览再按需扩展。
 *
 * 这里的 full 充当服务端持有的完整图，屏上只放 sampleGraph 抽出的枢纽。
 */
const full = new Graph()
const ready = shallowRef(false)
const overviewSize = shallowRef(150)
const buildMs = shallowRef(0)

const overview = computed(() => (ready.value ? sampleGraph(full, overviewSize.value) : null))

function load() {
  const t0 = performance.now()
  full.clear()
  full.import(createScaleGraph(20000))
  buildMs.value = performance.now() - t0
  ready.value = true
}
</script>

<template>
  <div class="wrap">
    <SigmaGraph v-if="overview" :data="overview" :settings="{ hideEdgesOnMove: true, labelRenderedSizeThreshold: 4 }">
      <ScaleOverviewPanel :full="full" />
      <SigmaTooltip />
    </SigmaGraph>

    <p v-else class="idle">
      <button type="button" @click="load">
        加载 20k 节点的完整图
      </button>
    </p>

    <div v-if="overview" class="demo-panel" data-at="bottom-right">
      <span class="demo-tag">完整图 {{ full.order }} / {{ full.size }}（建图 {{ buildMs.toFixed(0) }} ms）</span>
      <div class="demo-row">
        <span class="demo-label">概览</span>
        <button v-for="value in [80, 150, 400]" :key="value" type="button" :aria-pressed="overviewSize === value" @click="overviewSize = value">
          {{ value }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  /* .example-stage 是 flex 行容器，不给宽度会缩成内容宽 */
  width: 100%;
  height: 100%;
}

.idle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
}

.idle button {
  padding: 6px 14px;
  border: 1px solid var(--sigma-color-border);
  border-radius: 6px;
  background: var(--sigma-color-bg);
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}
</style>
