<script setup lang="ts">
import { shallowRef } from 'vue'

const { goto } = useSigmaCamera()
const rotated = shallowRef(false)

function toggle() {
  rotated.value = !rotated.value
  goto({ angle: rotated.value ? Math.PI / 5 : 0 }, { duration: 300 })
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">形状</span>
      <span class="demo-tag">按节点下标循环取 circle / square / diamond / hexagon / star</span>
    </div>
    <div class="demo-row">
      <button type="button" :aria-pressed="rotated" @click="toggle">
        {{ rotated ? '转回正视' : '旋转相机' }}
      </button>
      <span class="demo-tag">size 是外接圆半径，inradiusFactor 决定标签让位的距离</span>
    </div>
  </div>
</template>
