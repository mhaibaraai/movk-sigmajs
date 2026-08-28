<script setup lang="ts">
// target 决定右键哪里会弹菜单。stage 命中没有节点可锚，组件把视口坐标
// 转成图坐标交给 SigmaOverlay 的 position 通道
withDefaults(defineProps<{ target?: Array<'node' | 'edge' | 'stage'> }>(), {
  target: () => ['node']
})

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 340, y: 300, size: 12, color: '#3b82f6' } }
  ],
  edges: [{ source: 'a', target: 'b', attributes: { label: '引用' } }]
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaContextMenu :target="target">
      <template #default="{ type, id }">
        <span class="item">{{ type }} {{ id ?? '（空白处）' }}</span>
      </template>
    </SigmaContextMenu>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        当前接管 {{ target.join(' / ') }}；未接管的目标上右键仍弹浏览器自己的菜单
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

<style scoped>
.item {
  font-size: 12px;
}
</style>
