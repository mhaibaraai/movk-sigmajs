<script setup lang="ts">
/**
 * 图例的默认插槽以 groups / toggle / reset 作用域暴露聚合结果与行为，
 * 显隐切换仍由库负责，这里只换渲染。
 */
const categories = ['管理制度', '技术标准', '操作规程', '应急预案']
const colors = ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7']

const nodes = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2
  return {
    key: `n${index}`,
    attributes: {
      label: `文件 ${index + 1}`,
      category: categories[index % 4],
      x: Math.cos(angle) * 160,
      y: Math.sin(angle) * 160,
      size: 10,
      color: colors[index % 4]
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
      <SigmaLegend field="category">
        <template #default="{ groups, toggle, reset }">
          <div class="flex w-44 flex-col gap-1 rounded-lg border border-default bg-default p-2">
            <UButton
              v-for="group in groups"
              :key="group.value"
              :color="group.visible ? 'primary' : 'neutral'"
              :variant="group.visible ? 'soft' : 'ghost'"
              size="xs"
              block
              class="justify-between"
              :aria-pressed="group.visible"
              @click="toggle(group.value)"
            >
              <span class="inline-flex items-center gap-1.5">
                <span class="size-2 rounded-full" :style="{ background: group.color }" />
                {{ group.value }}
              </span>
              <span class="tabular-nums opacity-70">{{ group.count }}</span>
            </UButton>

            <UButton variant="ghost" color="neutral" size="xs" block @click="reset">
              全部显示
            </UButton>
          </div>
        </template>
      </SigmaLegend>
    </SigmaControls>
  </SigmaGraph>
</template>
