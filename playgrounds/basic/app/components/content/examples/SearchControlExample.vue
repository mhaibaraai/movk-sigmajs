<script setup lang="ts">
import { shallowRef } from 'vue'

const picked = shallowRef('')

const categories = ['管理制度', '技术标准', '操作规程']
const colors = ['#f43f5e', '#3b82f6', '#22c55e']

const nodes = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2
  return {
    key: `n${index}`,
    attributes: {
      label: `${categories[index % 3]} ${index + 1}`,
      category: categories[index % 3],
      x: Math.cos(angle) * 15,
      y: Math.sin(angle) * 15,
      size: 8 + (index % 4) * 2,
      color: colors[index % 3]
    }
  }
})

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes,
  edges: nodes.slice(1).map((node, index) => ({ source: nodes[index]!.key, target: node.key }))
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <!-- 输入即时回显、检索按 debounce 触发，命中片段自带高亮，选中后相机聚焦 -->
      <SigmaSearchControl
        :fields="['label', 'category']"
        :limit="6"
        :debounce="150"
        placeholder="试试「技术」"
        @select="result => picked = result.id"
      />
    </SigmaControls>

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">检索 label 与 category 两个字段</span>
      <span class="demo-tag">最近选中：{{ picked || '—' }}</span>
    </div>
  </SigmaGraph>
</template>
