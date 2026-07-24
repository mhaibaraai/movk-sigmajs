<script setup lang="ts">
// 一个页面可以有任意多个实例，各自独立。给了 id 就会登记进全局注册表，
// 供组件树之外的代码经 useSigmaById(id) 取用
function makeData(color: string, label: string) {
  return {
    attributes: {},
    options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
    nodes: [
      { key: 'a', attributes: { label: `${label} A`, x: 0, y: 0, size: 14, color } },
      { key: 'b', attributes: { label: `${label} B`, x: 12, y: 5, size: 11, color } },
      { key: 'c', attributes: { label: `${label} C`, x: 6, y: -8, size: 11, color } }
    ],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'a', target: 'c' }
    ]
  }
}

const left = makeData('#f43f5e', '左')
const right = makeData('#3b82f6', '右')
</script>

<template>
  <div class="pair">
    <SigmaGraph id="multi-left" :data="left">
      <SigmaControls position="top-right">
        <SigmaZoomControl />
      </SigmaControls>
    </SigmaGraph>

    <SigmaGraph id="multi-right" :data="right">
      <SigmaControls position="top-right">
        <SigmaZoomControl />
      </SigmaControls>
    </SigmaGraph>
  </div>
</template>

<style scoped>
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  height: 100%;
  background: var(--sigma-color-border);
}
</style>
