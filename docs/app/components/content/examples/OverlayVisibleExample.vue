<script setup lang="ts">
import { defineComponent, h } from 'vue'

// 挂载时刻记在组件内部：时间不变说明这一次「显示」没有重新挂载，
// 即隐藏期间插槽内容一直活着
const Badge = defineComponent({
  props: { label: { type: String, required: true } },
  setup(props) {
    const since = new Date().toLocaleTimeString()
    return () => h('div', { class: 'badge' }, `${props.label} · 挂载于 ${since}`)
  }
})

const visible = shallowRef(true)

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '节点 B', x: 320, y: 140, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '节点 C', x: 160, y: -220, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay node="b" :offset="[0, -24]" :visible="visible">
      <Badge label="没有 v-if" />
    </SigmaOverlay>

    <SigmaOverlay node="c" :offset="[0, -24]" :visible="visible">
      <Badge v-if="visible" label="加了 v-if" />
    </SigmaOverlay>

    <SigmaControls>
      <UButton :label="visible ? '隐藏' : '显示'" @click="visible = !visible" />
      <div class="bg-accented p-2 text-muted text-xs">
        再次显示后，左侧时间不变（一直挂着），右侧刷新（真的重建过）
      </div>
    </SigmaControls>
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
