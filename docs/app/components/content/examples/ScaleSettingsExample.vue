<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { SerializedGraph } from 'graphology-types'

/**
 * 大图上三个渲染侧开关的实际代价。
 *
 * 架构方案第九节给出的推荐值原本没有实测支撑，这个示例就是那份支撑：
 * 同一份 5k 数据下逐项开关，看首帧与平移 FPS 的变化。
 */
const data = shallowRef<SerializedGraph | null>(null)
const buildMs = shallowRef(0)
const startedAt = shallowRef(0)

const hideEdgesOnMove = shallowRef(true)
const labelThreshold = shallowRef(8)
const labelDensity = shallowRef(1)

const settings = computed(() => ({
  hideEdgesOnMove: hideEdgesOnMove.value,
  labelRenderedSizeThreshold: labelThreshold.value,
  labelDensity: labelDensity.value,
  defaultEdgeColor: '#e2e8f0'
}))

function load() {
  startedAt.value = performance.now()
  const t0 = performance.now()
  const next = createScaleGraph(5000)
  buildMs.value = performance.now() - t0
  data.value = next
}
</script>

<template>
  <div class="wrap">
    <SigmaGraph v-if="data" :data="data" :settings="settings">
      <ScaleStatsPanel
        :build-ms="buildMs"
        :started-at="startedAt"
        note="拖动画布观察差异：关掉 hideEdgesOnMove 后平移会明显变重"
      />
    </SigmaGraph>

    <p v-else class="idle">
      <button type="button" @click="load">
        加载 5k 节点
      </button>
    </p>

    <div v-if="data" class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <button type="button" :aria-pressed="hideEdgesOnMove" @click="hideEdgesOnMove = !hideEdgesOnMove">
          hideEdgesOnMove {{ hideEdgesOnMove ? '开' : '关' }}
        </button>
      </div>
      <div class="demo-row">
        <span class="demo-label">标签阈值</span>
        <input v-model.number="labelThreshold" type="range" min="0" max="20" step="1">
        <span class="demo-tag">{{ labelThreshold }}（0 表示全部渲染标签）</span>
      </div>
      <div class="demo-row">
        <span class="demo-label">标签密度</span>
        <input v-model.number="labelDensity" type="range" min="0.1" max="3" step="0.1">
        <span class="demo-tag">{{ labelDensity }}</span>
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
