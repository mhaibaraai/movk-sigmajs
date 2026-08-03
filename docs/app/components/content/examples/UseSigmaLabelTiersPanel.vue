<script setup lang="ts">
import { computed } from 'vue'

const { tier } = useSigmaLabelTiers({ breakpoints: [[2.6, 0], [1.3, 1]] })
const { zoomIn, zoomOut, reset } = useSigmaCamera()

const label = computed(() =>
  Number.isFinite(tier.value) ? `只显示 ${tier.value} 档及以上` : '不限制，全部标签可见'
)
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">缩放</span>
      <button type="button" @click="zoomOut()">
        拉远
      </button>
      <button type="button" @click="zoomIn()">
        拉近
      </button>
      <button type="button" @click="reset()">
        复位
      </button>
    </div>
    <span class="demo-tag">{{ label }} —— 拉远两级依次掉最低档与中间档</span>
  </div>
</template>
