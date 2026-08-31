<script setup lang="ts">
const props = defineProps<{ fields: string, edges: boolean }>()

const fieldList = computed(() => props.fields.split('+'))

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaSearchFieldsPanel :key="`${fields}-${edges}`" :fields="fieldList" :edges="edges" />
  </SigmaGraph>
</template>
