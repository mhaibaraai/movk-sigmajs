<script setup lang="ts">
const props = defineProps<{ dim: boolean }>()

/**
 * hover / selected / focused 状态机，内建高亮与淡出。
 *
 * 焦点节点及其直接邻居保持原样，其余由库内 styles 规则淡出且隐藏标签。
 * dim 关掉后只写 isHighlighted 状态，外观完全交给使用方的 styles。
 */
const { hovered, selected, focused, highlighted, select, clear } = useSigmaSelection({
  dim: props.dim,
  dimColor: '#cbd5e1'
})
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="选中 n0" @click="select('n0')" />
      <UButton size="xs" color="neutral" label="清空" @click="clear" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      <p>悬浮 {{ hovered ?? '—' }} · 选中 {{ selected ?? '—' }} · 焦点 {{ focused ?? '—' }}</p>
      <p>高亮 {{ highlighted.size }} 个（焦点及其直接邻居）</p>
    </div>
  </SigmaControls>
</template>
