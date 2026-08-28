<script setup lang="ts">
/**
 * 两套坐标不能混用。
 *
 * 锚到 `position` 走 graphToViewport，吃的是原始图坐标；锚到 `node` 走
 * framedGraphToViewport，吃的是 sigma 归一化后的 framed 坐标。此处把两者
 * 指向同一个点：贴合说明换算正确，错开说明用错了函数。
 */
const origin = { x: 0, y: 0 }

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'origin', attributes: { label: '原点', x: 0, y: 0, size: 16, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '节点 B', x: 300, y: 160, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '节点 C', x: -240, y: -140, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'origin', target: 'b' },
    { source: 'origin', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay :position="origin">
      <div class="mark mark-position">
        position
      </div>
    </SigmaOverlay>

    <SigmaOverlay node="origin">
      <div class="mark mark-node">
        node
      </div>
    </SigmaOverlay>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        两个标记锚在同一个点，缩放平移后应始终重合
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

<style scoped>
.mark {
  position: absolute;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.mark-position {
  translate: -100% -50%;
  background: #f59e0b;
  color: #1f2328;
}

.mark-node {
  translate: 0 -50%;
  background: #0ea5e9;
  color: #fff;
}
</style>
