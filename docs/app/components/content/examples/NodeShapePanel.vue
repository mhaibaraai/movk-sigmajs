<script setup lang="ts">
import { shallowRef } from 'vue'

const { goto } = useSigmaCamera()
const rotated = shallowRef(false)

// 相机转起来，形状仍然正立：距离函数在求值前把方向反向旋转了 u_cameraAngle
function toggle() {
  rotated.value = !rotated.value
  goto({ angle: rotated.value ? Math.PI / 5 : 0 }, { duration: 300 })
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">形状</span>
      <span class="demo-tag">按节点下标循环取 circle / square / diamond / hexagon / triangle</span>
    </div>
    <div class="demo-row">
      <button type="button" :aria-pressed="rotated" @click="toggle">
        {{ rotated ? '转回正视' : '旋转相机' }}
      </button>
      <span class="demo-tag">相机转动时形状保持正立，size 是外接圆半径</span>
    </div>
  </div>
</template>
