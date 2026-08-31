<script setup lang="ts">
// fields 与 edges 只在 setup 时读一次，切换时用 key 强制重挂载面板
const props = defineProps<{ fields: string, edges: boolean }>()

const fieldList = computed(() => props.fields.split('+'))

const data = demoGraph({ nodes: 16, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaSearchFieldsPanel :key="`${fields}-${edges}`" :fields="fieldList" :edges="edges" />
  </SigmaGraph>
</template>
