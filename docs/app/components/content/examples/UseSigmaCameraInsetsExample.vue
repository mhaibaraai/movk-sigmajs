<script setup lang="ts">
const data = demoGraph({ nodes: 40, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data" :settings="{ itemSizesReference: 'screen' }">
    <!-- 模拟真实应用的侧栏：浮在舞台上、不挤压画布，正是 fit 看不见的那部分遮挡 -->
    <div class="demo-inset-panel">
      侧栏 240px
    </div>
    <UseSigmaCameraInsetsPanel />
  </SigmaGraph>
</template>

<style scoped>
.demo-inset-panel {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240px;
  border-right: 1px solid var(--sigma-color-border);
  background: color-mix(in srgb, var(--sigma-color-bg) 88%, transparent);
  color: var(--sigma-color-muted);
  font-size: 13px;
}
</style>
