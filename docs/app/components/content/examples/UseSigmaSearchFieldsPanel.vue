<script setup lang="ts">
const props = defineProps<{ fields: string[], edges: boolean }>()

// fields 按顺序取第一个命中的字段作展示，结果里的 label 与 field 都来自它
const { query, results } = useSigmaSearch({
  fields: props.fields,
  edges: props.edges,
  limit: 8
})
</script>

<template>
  <SigmaControls>
    <UInput v-model="query" size="xs" placeholder="试试 network，或开边检索后搜「同类」" />

    <div class="bg-accented p-2 text-muted text-xs">
      <ul class="list-none font-mono">
        <li v-for="item in results" :key="`${item.type}-${item.id}`">
          {{ item.type }} · {{ item.label }} · 命中 {{ item.field }}
        </li>
        <li v-if="query && results.length === 0">
          无匹配
        </li>
      </ul>
    </div>
  </SigmaControls>
</template>
