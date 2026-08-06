<script setup lang="ts">
/**
 * 只接管条目内容的最小粒度。
 *
 * option 作用域给的 segments 是已经切好的命中片段，高亮逻辑不必自己重写，
 * 容器的绝对定位、滚动、role="listbox" 与键盘高亮全部白拿。
 */
const categories = ['管理制度', '技术标准', '操作规程', '应急预案']
const colors = ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7']

const nodes = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * Math.PI * 2
  return {
    key: `n${index}`,
    attributes: {
      label: `${categories[index % 4]} ${index + 1}`,
      category: categories[index % 4],
      x: Math.cos(angle) * 180,
      y: Math.sin(angle) * 180,
      size: 9,
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
      <SigmaSearchControl :fields="['label', 'category']" placeholder="试试「技术」">
        <template #option="{ result, segments }">
          <span class="flex w-full items-center gap-2">
            <UIcon name="i-lucide-file-text" class="size-3.5 shrink-0 opacity-60" />
            <span class="truncate">
              <span
                v-for="(segment, index) in segments"
                :key="index"
                :class="segment.match ? 'text-primary font-medium' : undefined"
              >{{ segment.text }}</span>
            </span>
            <UBadge size="sm" variant="subtle" color="neutral" class="ml-auto shrink-0">
              {{ result.field }}
            </UBadge>
          </span>
        </template>

        <template #empty>
          <span class="inline-flex items-center gap-1.5 text-muted">
            <UIcon name="i-lucide-search-x" class="size-3.5" />
            没有匹配的文件
          </span>
        </template>
      </SigmaSearchControl>
    </SigmaControls>
  </SigmaGraph>
</template>
