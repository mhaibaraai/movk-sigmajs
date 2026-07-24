<script setup lang="ts">
// 演示响应式桥接：graphology 是可变对象，靠 useSigmaGraph 递增的 version 驱动重算
const { order, size, version } = useSigmaGraph()
const { zoomIn, zoomOut, reset } = useSigmaCamera()

useSigmaEvents({
  doubleClickStage: () => reset()
})
</script>

<template>
  <div class="stats">
    <span>节点 {{ order }} · 边 {{ size }} · v{{ version }}</span>
    <span class="controls">
      <button
        type="button"
        @click="zoomIn()"
      >+</button>
      <button
        type="button"
        @click="zoomOut()"
      >−</button>
      <button
        type="button"
        @click="reset()"
      >复位</button>
    </span>
  </div>
</template>

<style scoped>
.stats {
  position: absolute;
  inset: 8px 8px auto 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgb(255 255 255 / 88%);
  font-size: 13px;
  pointer-events: none;
}

.controls {
  display: flex;
  gap: 4px;
  pointer-events: auto;
}

button {
  min-width: 28px;
  height: 24px;
  cursor: pointer;
}
</style>
