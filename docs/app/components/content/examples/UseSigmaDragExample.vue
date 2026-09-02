<script setup lang="ts">
defineProps<{ enabled: boolean }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data" :settings="{ itemSizesReference: 'screen' }">
    <UseSigmaDragPanel :enabled="enabled" />
  </SigmaGraph>
</template>
