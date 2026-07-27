<script setup lang="ts">
import { shallowRef } from 'vue'

// 锚到节点：SigmaOverlay 内部走 framedGraphToViewport，因为
// getNodeDisplayData 返回的是 sigma 归一化后的 framed 坐标
const anchor = shallowRef('a')

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '节点 B', x: 14, y: 6, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '节点 C', x: 7, y: -9, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay :node="anchor" :offset="[0, -24]">
      <div class="badge">
        锚定在 {{ anchor }}
      </div>
    </SigmaOverlay>

    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">锚点</span>
        <button v-for="key in ['a', 'b', 'c']" :key="key" type="button" :aria-pressed="anchor === key" @click="anchor = key">
          {{ key }}
        </button>
      </div>
      <span class="demo-tag">缩放平移时覆盖层跟随，节点被隐藏则自动隐藏</span>
    </div>
  </SigmaGraph>
</template>

<style scoped>
.badge {
  translate: -50% -100%;
  padding: 4px 8px;
  border-radius: 6px;
  background: #1f2328;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
}
</style>
