<script setup lang="ts">
/**
 * 按分类字段聚合图例，点击切换显隐（落到 reducer 的 hidden）。
 *
 * field 默认取 `type`，但 sigma 里 `type` 是渲染程序名，领域分类必须显式传业务字段，
 * 这里传的是 `category`。
 */
const categories = ['管理制度', '技术标准', '操作规程']
const colors = ['#f43f5e', '#3b82f6', '#22c55e']

const nodes = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2
  return {
    key: `n${index}`,
    attributes: {
      label: `文件 ${index + 1}`,
      category: categories[index % 3],
      x: Math.cos(angle) * 15,
      y: Math.sin(angle) * 15,
      size: 10,
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
      <SigmaLegend field="category" />
    </SigmaControls>

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">点击图例项切换该分类的显隐，被隐藏的节点仍在图里</span>
    </div>
  </SigmaGraph>
</template>
