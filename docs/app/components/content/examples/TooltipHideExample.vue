<script setup lang="ts">
// 作用域里没有 close：提示层跟着指针走，没有「用户主动关掉」这回事。
// 需要程序化关闭时经模板 ref 调 hide()
const tooltip = useTemplateRef('tooltip')

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 320, y: 140, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '制度 C', x: 160, y: -220, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip ref="tooltip" trigger="click" />

    <SigmaControls>
      <UButton label="hide()" @click="tooltip?.hide()" />
      <div class="bg-accented p-2 text-muted text-xs">
        点节点打开提示层，再点这个按钮关掉；点画布空白处同样会关闭
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
