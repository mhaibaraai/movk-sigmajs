<script setup lang="ts">
import { shallowRef } from 'vue'

const props = defineProps<{
  /** 生成数据加建图的耗时 */
  buildMs?: number
  /** 触发加载的时刻，用来量到首帧为止的总耗时 */
  startedAt?: number
  /** 附在读数后面的一句说明 */
  note?: string
}>()

const firstFrameMs = shallowRef(0)
const fps = shallowRef(0)

let last = 0
let frames = 0
let elapsed = 0

/**
 * 读数只求可比，不求精确：sigma 只在有变化时才渲染，
 * 因此 FPS 要在持续平移或缩放的过程中才有意义。
 */
useSigmaEvents({
  afterRender: () => {
    const now = performance.now()

    if (firstFrameMs.value === 0 && props.startedAt) {
      firstFrameMs.value = now - props.startedAt
    }

    if (last > 0) {
      elapsed += now - last
      frames += 1
      if (frames >= 20) {
        fps.value = Math.round(1000 / (elapsed / frames))
        frames = 0
        elapsed = 0
      }
    }
    last = now
  }
})
</script>

<template>
  <div class="demo-panel demo-hud" data-at="bottom-right">
    <span class="demo-tag">建图 {{ props.buildMs?.toFixed(0) ?? '—' }} ms · 首帧 {{ firstFrameMs ? `${firstFrameMs.toFixed(0)} ms` : '—' }} · 平移 {{ fps || '—' }} FPS</span>
    <span v-if="props.note" class="demo-tag">{{ props.note }}</span>
  </div>
</template>
