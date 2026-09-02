<script setup lang="ts">
const { data } = await useFetch('/api/small.json')

const anchor = computed(() => data.value!.nodes.find(item => item.key === 'd')!.attributes)
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay :position="{ x: anchor.x, y: anchor.y }">
      <UBadge size="sm" color="warning" class="-translate-x-full -translate-y-1/2">
        position
      </UBadge>
    </SigmaOverlay>

    <SigmaOverlay node="d">
      <UBadge size="sm" class="-translate-y-1/2">
        node
      </UBadge>
    </SigmaOverlay>
  </SigmaGraph>
</template>
