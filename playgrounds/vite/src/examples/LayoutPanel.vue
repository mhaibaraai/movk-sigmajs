<script setup lang="ts">
// useSigmaLayout / useSigmaExport / useSigmaCamera 均由自动导入提供
const { isRunning, start, stop } = useSigmaLayout('forceatlas2', { settings: { gravity: 1, scalingRatio: 20, adjustSizes: true } })
const { isExporting, download } = useSigmaExport()
const { reset } = useSigmaCamera()
</script>

<template>
  <div class="panel">
    <button
      type="button"
      @click="isRunning ? stop() : start()"
    >
      {{ isRunning ? '停止布局' : '运行 ForceAtlas2' }}
    </button>
    <button
      type="button"
      :disabled="isExporting"
      @click="download('sigma-vite')"
    >
      {{ isExporting ? '导出中' : '导出 PNG' }}
    </button>
    <button
      type="button"
      @click="reset()"
    >
      复位视角
    </button>
  </div>
</template>
