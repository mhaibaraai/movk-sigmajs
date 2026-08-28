<script setup lang="ts">
const props = withDefaults(defineProps<{ node?: string }>(), { node: '11.0' })

const { data } = await useFetch('/api/small.json')

const label = computed(() => data.value?.nodes.find(item => item.key === props.node)?.attributes.label)
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay :node="node" :offset="[0, -24]">
      <UBadge color="neutral" variant="solid" class="-translate-x-1/2 -translate-y-full whitespace-nowrap">
        锚定在 {{ label }}
      </UBadge>
    </SigmaOverlay>
  </SigmaGraph>
</template>
