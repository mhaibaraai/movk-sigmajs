<script setup lang="ts">
/**
 * 输入框与下拉的完全接管。
 *
 * input 作用域的 onKeydown 一次绑完上下键、回车与 Esc；
 * results 作用域接管容器后要自行绝对定位，库内的 .sigma-search-results 已不参与。
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
        <template #input="{ modelValue, placeholder, open, onUpdate, onKeydown }">
          <UInput
            :model-value="modelValue"
            :placeholder="placeholder"
            :aria-expanded="open"
            icon="i-lucide-search"
            size="sm"
            role="combobox"
            aria-autocomplete="list"
            @update:model-value="value => onUpdate(String(value))"
            @keydown="onKeydown"
          />
        </template>

        <template #results="{ results, activeIndex, highlight, choose }">
          <div
            class="absolute inset-x-0 top-full z-10 mt-1 flex max-h-52 flex-col gap-1 overflow-y-auto rounded-lg border border-default bg-default p-1"
            role="listbox"
          >
            <UButton
              v-for="(result, index) in results"
              :key="result.id"
              color="neutral"
              :variant="index === activeIndex ? 'soft' : 'ghost'"
              size="xs"
              block
              class="justify-start"
              role="option"
              :aria-selected="index === activeIndex"
              @click="choose(result)"
            >
              <UIcon name="i-lucide-file-text" class="size-3.5 shrink-0 opacity-60" />
              <span class="truncate">
                <span
                  v-for="(segment, i) in highlight(result)"
                  :key="i"
                  :class="segment.match ? 'text-primary font-medium' : undefined"
                >{{ segment.text }}</span>
              </span>
              <UBadge size="sm" variant="subtle" color="neutral" class="ml-auto shrink-0">
                {{ result.field }}
              </UBadge>
            </UButton>

            <p v-if="results.length === 0" class="px-2 py-1.5 text-sm text-muted">
              没有匹配的文件
            </p>
          </div>
        </template>
      </SigmaSearchControl>
    </SigmaControls>
  </SigmaGraph>
</template>
