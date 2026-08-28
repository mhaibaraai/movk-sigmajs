<script setup lang="ts">
// 显示需要 open 为真且 node 非空。node 绑选中项、open 绑用户的关闭动作，
// 换节点时把 open 置回 true，否则上一次的关闭会一直生效
const node = shallowRef<string | null>('a')
const open = ref(true)

watch(node, (key) => {
  if (key) {
    open.value = true
  }
})

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
  <SigmaGraph
    :data="data"
    @click-node="({ node: key }) => (node = key)"
    @click-stage="() => (node = null)"
  >
    <SigmaPopover v-model:open="open" :node="node">
      <template #default="{ attributes, close }">
        <strong>{{ attributes.label }}</strong>
        <UButton size="xs" variant="ghost" label="关闭" @click="close" />
      </template>
    </SigmaPopover>

    <SigmaControls>
      <UButton :label="open ? '关闭浮层' : '打开浮层'" @click="open = !open" />
      <div class="bg-accented p-2 text-muted text-xs">
        open = {{ open }} · node = {{ node ?? 'null' }} · 可见 = {{ open && Boolean(node) }}
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
