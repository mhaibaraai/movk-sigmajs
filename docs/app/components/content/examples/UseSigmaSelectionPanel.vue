<script setup lang="ts">
const props = defineProps<{ dim: boolean }>()

const { hovered, selected, focused, highlighted, select, clear } = useSigmaSelection({
  dim: props.dim,
  dimColor: '#cbd5e1'
})
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="选中 Valjean" @click="select('11.0')" />
      <UButton size="xs" color="neutral" label="清空" @click="clear" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      <p>悬浮 {{ hovered ?? '—' }} · 选中 {{ selected ?? '—' }} · 焦点 {{ focused ?? '—' }}</p>
      <p>高亮 {{ highlighted.size }} 个（焦点及其直接邻居）</p>
    </div>
  </SigmaControls>
</template>
