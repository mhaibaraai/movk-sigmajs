<script setup lang="ts">
import { shallowRef } from 'vue'

const settings = { gravity: 1, scalingRatio: 20, adjustSizes: true, strongGravityMode: false }

// 同一套 ForceAtlas2 参数，只差 byComponent 一项
const whole = useSigmaLayout('forceatlas2', { worker: false, iterations: 200, settings })
const packed = useSigmaLayout('forceatlas2', { worker: false, iterations: 200, byComponent: true, settings })

const { fitTo } = useSigmaCamera()

const current = shallowRef('')
const error = shallowRef('')

async function run(mode: 'whole' | 'packed') {
  error.value = ''
  try {
    await (mode === 'whole' ? whole : packed).assign()
    current.value = mode
    await fitTo()
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">布局</span>
      <button type="button" :aria-pressed="current === 'whole'" @click="run('whole')">
        整图一次
      </button>
      <button type="button" :aria-pressed="current === 'packed'" @click="run('packed')">
        按分量
      </button>
    </div>
    <span class="demo-tag">{{ error || '整图一次会把互不相连的分量推满整个平面，按分量则各自成团' }}</span>
  </div>
</template>
