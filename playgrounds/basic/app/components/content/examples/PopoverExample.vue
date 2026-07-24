<script setup lang="ts">
import { ref, watch } from 'vue'

const { selected } = useSigmaSelection()

// 详情按需加载，不随图数据一起下发：图上只带渲染必需的字段
const details = ref<Record<string, string[]>>({})
const open = ref(true)

async function loadDetail(key: string) {
  if (details.value[key]) {
    return
  }
  await new Promise(resolve => setTimeout(resolve, 200))
  details.value = { ...details.value, [key]: [`${key} 第一条`, `${key} 第二条`, `${key} 第三条`] }
}

watch(selected, (key) => {
  if (key) {
    open.value = true
    loadDetail(key)
  }
})

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 15, y: 6, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '制度 C', x: 7, y: -10, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaPopover v-model:open="open" :node="selected">
      <template #default="{ node, attributes, close }">
        <div class="detail">
          <header>
            <strong>{{ attributes.label ?? node }}</strong>
            <button type="button" @click="close">
              ×
            </button>
          </header>
          <ul v-if="details[node]">
            <li v-for="line in details[node]" :key="line">
              {{ line }}
            </li>
          </ul>
          <p v-else>
            加载中…
          </p>
        </div>
      </template>
    </SigmaPopover>

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">点击节点打开常驻浮层，详情在打开后才请求</span>
    </div>
  </SigmaGraph>
</template>

<style scoped>
.detail {
  min-width: 160px;
}

.detail header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail header button {
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  font-size: 15px;
}

.detail ul {
  margin: 6px 0 0;
  padding-left: 18px;
}

.detail p {
  margin: 6px 0 0;
  opacity: 0.6;
}
</style>
