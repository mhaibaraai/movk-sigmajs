<script setup lang="ts">
import { shallowRef } from 'vue'
import type { SerializedGraph } from 'graphology-types'

const data = shallowRef<SerializedGraph | null>(null)
const buildMs = shallowRef(0)
const startedAt = shallowRef(0)

function load() {
  startedAt.value = performance.now()
  const t0 = performance.now()
  const next = createScaleGraph(2000)
  buildMs.value = performance.now() - t0
  data.value = next
}
</script>

<template>
  <div class="wrap">
    <!-- 面板里能打乱坐标、能跑 ForceAtlas2，跨度会在 1000 与几十之间来回变。
         v4 默认 size 是图坐标单位，不切到 screen 语义节点尺寸会跟着乱跳 -->
    <SigmaGraph
      v-if="data"
      :data="data"
      :settings="{ hideEdgesOnMove: true, labelRenderedSizeThreshold: 10, itemSizesReference: 'screen' }"
    >
      <ScaleLayoutPanel />
      <ScaleStatsPanel :build-ms="buildMs" :started-at="startedAt" />
    </SigmaGraph>

    <p v-else class="idle">
      <button type="button" @click="load">
        加载 2k 节点
      </button>
    </p>
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
